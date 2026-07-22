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
async function ensureSeeded(): Promise<void> {
  if (!tables) return
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        if ((await readAll()).length) return
        for (const a of (await readFileStore()).articles) {
          await tables.upsertRow({ databaseId: AW.db!, tableId: AW.col!, rowId: a.slug, data: toRow(a) })
        }
      } catch {
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
export async function ping(): Promise<{ ok: boolean; total?: number; error?: string }> {
  if (!tables) return { ok: true, total: (await readFileStore()).articles.length }
  try {
    const res = await tables.listRows({
      databaseId: AW.db!,
      tableId: AW.col!,
      queries: [Query.limit(1)],
    })
    return { ok: true, total: res.total }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
