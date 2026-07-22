import 'server-only'
import fs from 'fs/promises'
import path from 'path'
import { Client, TablesDB, Query } from 'node-appwrite'
import { byDateDesc, type Article, type Category } from './content'

/* Re-exported so server components can pull the model and the storage
   from one place. Client components import from './content' directly. */
export * from './content'

type Store = { articles: Article[] }

const FILE = path.join(process.cwd(), 'data', 'articles.json')

/* ── Storage: Appwrite TablesDB (rows) when configured, else local JSON file ── */
const AW = {
  endpoint: process.env.APPWRITE_ENDPOINT,
  project: process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  db: process.env.APPWRITE_DATABASE_ID,
  col: process.env.APPWRITE_COLLECTION_ID,
}

const tables =
  AW.endpoint && AW.project && AW.apiKey && AW.db && AW.col
    ? new TablesDB(new Client().setEndpoint(AW.endpoint).setProject(AW.project).setKey(AW.apiKey))
    : null

const parseRow = (row: Record<string, unknown>): Article =>
  JSON.parse((row.data as string) ?? '{}') as Article

const toRow = (a: Article) => ({ slug: a.slug, title: a.title, data: JSON.stringify(a) })

/* ── file fallback (local dev / CMS outage) ── */
async function readFileStore(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf-8')) as Store
  } catch {
    return { articles: [] }
  }
}

async function writeFileStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), 'utf-8')
}

async function readAll(): Promise<Article[]> {
  if (tables) {
    try {
      const res = await tables.listRows({
        databaseId: AW.db!,
        tableId: AW.col!,
        queries: [Query.limit(500)],
      })
      return res.rows.map((r) => parseRow(r as Record<string, unknown>))
    } catch (e) {
      // Appwrite unreachable/misconfigured — don't crash the build or the API;
      // fall back to the bundled seed file so the site stays readable.
      console.error('Appwrite read failed, falling back to data/articles.json:', e)
      return (await readFileStore()).articles
    }
  }
  return (await readFileStore()).articles
}

/* Seed from data/articles.json the first time the store is empty, so a fresh
   Appwrite project comes up with the demo issue already in place. */
let seedPromise: Promise<void> | null = null

/** Why the last seed attempt failed, if it did. Surfaced by ping() — a silent
    seed failure used to present as an inexplicably empty site. */
let lastSeedError: string | null = null

async function ensureSeeded(): Promise<void> {
  if (!tables) return
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        if ((await readAll()).length) return
        for (const a of (await readFileStore()).articles) {
          await tables.upsertRow({ databaseId: AW.db!, tableId: AW.col!, rowId: a.slug, data: toRow(a) })
        }
        lastSeedError = null
      } catch (e) {
        lastSeedError = e instanceof Error ? e.message : String(e)
        console.error('Appwrite seed failed:', lastSeedError)
        seedPromise = null // allow retry next request
      }
    })()
  }
  return seedPromise
}

/* ── public API ── */

/** All articles, newest first. Drafts are excluded unless `includeDrafts`. */
export async function getArticles(
  opts: { category?: Category; includeDrafts?: boolean } = {},
): Promise<Article[]> {
  await ensureSeeded()
  let all = await readAll()

  /* Appwrite answered, but with nothing — and seeding it failed. Without this
     the listings go blank while individual articles still resolve from the
     bundled file, which reads as a broken site rather than a misconfigured
     one. Fall back to the same file the rest of the app falls back to. */
  if (!all.length && lastSeedError) all = (await readFileStore()).articles

  if (!opts.includeDrafts) all = all.filter((a) => a.published !== false)
  if (opts.category) all = all.filter((a) => a.category === opts.category)
  return all.sort(byDateDesc)
}

export async function getArticle(slug: string): Promise<Article | null> {
  if (tables) {
    await ensureSeeded()
    try {
      return parseRow(
        (await tables.getRow({ databaseId: AW.db!, tableId: AW.col!, rowId: slug })) as Record<
          string,
          unknown
        >,
      )
    } catch {
      // row missing, or Appwrite down — fall back to the seed file before giving up
      return (await readFileStore()).articles.find((a) => a.slug === slug) ?? null
    }
  }
  return (await readFileStore()).articles.find((a) => a.slug === slug) ?? null
}

/** Up to `limit` other published articles, preferring the same category. */
export async function getRelated(slug: string, category: Category, limit = 3): Promise<Article[]> {
  const all = (await getArticles()).filter((a) => a.slug !== slug)
  const same = all.filter((a) => a.category === category)
  return [...same, ...all.filter((a) => a.category !== category)].slice(0, limit)
}

export async function upsertArticle(article: Article): Promise<Article> {
  const item = { ...article, updated: new Date().toISOString() }
  if (tables) {
    await tables.upsertRow({ databaseId: AW.db!, tableId: AW.col!, rowId: item.slug, data: toRow(item) })
    return item
  }
  const store = await readFileStore()
  const idx = store.articles.findIndex((a) => a.slug === item.slug)
  if (idx >= 0) store.articles[idx] = item
  else store.articles.push(item)
  await writeFileStore(store)
  return item
}

export async function deleteArticle(slug: string): Promise<boolean> {
  if (tables) {
    try {
      await tables.deleteRow({ databaseId: AW.db!, tableId: AW.col!, rowId: slug })
      return true
    } catch {
      return false
    }
  }
  const store = await readFileStore()
  const before = store.articles.length
  store.articles = store.articles.filter((a) => a.slug !== slug)
  if (store.articles.length === before) return false
  await writeFileStore(store)
  return true
}

/** Lightweight liveness read — used by the keep-alive cron so Appwrite's
    free tier doesn't auto-pause the project for inactivity. */
export async function ping(): Promise<{
  ok: boolean
  total?: number
  storage?: 'appwrite' | 'file'
  seedError?: string
  error?: string
}> {
  if (!tables) {
    return { ok: true, storage: 'file', total: (await readFileStore()).articles.length }
  }
  try {
    const res = await tables.listRows({
      databaseId: AW.db!,
      tableId: AW.col!,
      queries: [Query.limit(1)],
    })
    // An empty table is only healthy if seeding actually succeeded; report the
    // seed failure alongside it so "ok, 0 rows" can't be mistaken for fine.
    if (!res.total) await ensureSeeded()
    return {
      ok: true,
      storage: 'appwrite',
      total: res.total,
      ...(lastSeedError ? { seedError: lastSeedError } : {}),
    }
  } catch (e) {
    return { ok: false, storage: 'appwrite', error: e instanceof Error ? e.message : String(e) }
  }
}
