import 'server-only'
import fs from 'fs/promises'
import path from 'path'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { unstable_cache, revalidateTag } from 'next/cache'
import { R2, r2 } from './r2'
import { byDateDesc, type Article, type Category } from './content'

/* Re-exported so server components can pull the model and the storage
   from one place. Client components import from './content' directly. */
export * from './content'

type Store = { articles: Article[] }

const FILE = path.join(process.cwd(), 'data', 'articles.json')

/* ── Storage: one JSON object in Cloudflare R2 when configured, else local JSON file ──
   The whole issue is a single object, in the same { articles: [...] } shape as
   data/articles.json: one GET serves every listing, and a save rewrites it.
   That suits a small journal with one editor. There is no locking, so two
   saves landing at the same instant would race (last write wins). */
const KEY = 'content/articles.json'
const TAG = 'articles'

const useR2 = Boolean(R2.endpoint && R2.accessKey && R2.secretKey && R2.contentBucket)

/* House style: no em-dash. Normalising the serialized store once here strips
   it from every field at once (title, standfirst, blocks, faqs, meta…) for both
   stored and already-saved content, without touching JSON structure — the
   em-dash only ever appears inside string values. */
const stripEmDash = (s: string) => s.replace(/ — /g, ' - ').replace(/—/g, '-')

/* ── file fallback (local dev / R2 outage) ── */
async function readFileStore(): Promise<Store> {
  try {
    return JSON.parse(stripEmDash(await fs.readFile(FILE, 'utf-8'))) as Store
  } catch {
    return { articles: [] }
  }
}

async function writeFileStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), 'utf-8')
}

/* ── R2 ── */

/** The stored issue, or null if nothing has been saved to R2 yet. Any other
    failure throws, so callers can tell "empty" from "unreachable". */
async function readR2Store(): Promise<Store | null> {
  try {
    const res = await r2().send(new GetObjectCommand({ Bucket: R2.contentBucket, Key: KEY }))
    return JSON.parse(stripEmDash(await res.Body!.transformToString())) as Store
  } catch (e) {
    if ((e as Error).name === 'NoSuchKey') return null
    throw e
  }
}

async function writeR2Store(store: Store): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: R2.contentBucket,
      Key: KEY,
      Body: stripEmDash(JSON.stringify(store)),
      ContentType: 'application/json; charset=utf-8',
    }),
  )
}

/* Every page, the sitemap and the API read through this one cache entry, so R2
   sees about one GET an hour however much traffic - or bot probing of made-up
   slugs - the site gets. Saves expire it immediately. A failed read throws out
   of the cached function, so an outage is never cached, only real answers.
   Next won't cache an entry over 2MB (it logs a warning); the site still works
   then, it just reads R2 on every render. */
const readR2Cached = unstable_cache(readR2Store, ['articles-r2'], { revalidate: 3600, tags: [TAG] })

async function readAll(): Promise<Article[]> {
  if (!useR2) return (await readFileStore()).articles
  try {
    // Nothing saved to R2 yet - serve the bundled issue until the first save writes one.
    return ((await readR2Cached()) ?? (await readFileStore())).articles
  } catch (e) {
    // R2 unreachable/misconfigured - don't crash the build or the API;
    // fall back to the bundled seed file so the site stays readable.
    console.error('R2 read failed, falling back to data/articles.json:', e)
    return (await readFileStore()).articles
  }
}

/** Read-modify-write. `change` returns the new list, or null to leave the
    store untouched. Reads the live object, never the cache - and never falls
    back to the seed file on error, which would overwrite the stored issue. */
async function mutate(change: (articles: Article[]) => Article[] | null): Promise<boolean> {
  if (useR2) {
    const next = change(((await readR2Store()) ?? (await readFileStore())).articles)
    if (!next) return false
    await writeR2Store({ articles: next })
    revalidateTag(TAG, { expire: 0 })
    return true
  }
  const next = change((await readFileStore()).articles)
  if (!next) return false
  await writeFileStore({ articles: next })
  return true
}

/* ── public API ── */

/** All articles, newest first. Drafts are excluded unless `includeDrafts`. */
export async function getArticles(
  opts: { category?: Category; includeDrafts?: boolean } = {},
): Promise<Article[]> {
  let all = await readAll()
  if (!opts.includeDrafts) all = all.filter((a) => a.published !== false)
  if (opts.category) all = all.filter((a) => a.category === opts.category)
  return [...all].sort(byDateDesc)
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await readAll()).find((a) => a.slug === slug) ?? null
}

/** Up to `limit` other published articles, preferring the same category. */
export async function getRelated(slug: string, category: Category, limit = 3): Promise<Article[]> {
  const all = (await getArticles()).filter((a) => a.slug !== slug)
  const same = all.filter((a) => a.category === category)
  return [...same, ...all.filter((a) => a.category !== category)].slice(0, limit)
}

export async function upsertArticle(article: Article): Promise<Article> {
  const item = { ...article, updated: new Date().toISOString() }
  await mutate((all) => {
    const idx = all.findIndex((a) => a.slug === item.slug)
    return idx >= 0 ? all.map((a, i) => (i === idx ? item : a)) : [...all, item]
  })
  return item
}

export async function deleteArticle(slug: string): Promise<boolean> {
  return mutate((all) => {
    const rest = all.filter((a) => a.slug !== slug)
    return rest.length < all.length ? rest : null
  })
}
