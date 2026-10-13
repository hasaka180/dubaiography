/* One-off: copy every article out of Appwrite into the R2 object the site reads.

     node --env-file=.env.local scripts/migrate-appwrite-to-r2.mjs            # export + upload
     node --env-file=.env.local scripts/migrate-appwrite-to-r2.mjs --dry-run  # export only

   Needs the old APPWRITE_* variables plus the R2 ones (see .env.example).
   Always writes a local backup to appwrite-export.json before touching R2.

   If the R2 object already exists - the studio saved something after the
   switch - the two are merged by slug, keeping whichever copy was updated
   last, so nothing written since the switch is lost. */
import fs from 'node:fs/promises'
import { Client, TablesDB, Query } from 'node-appwrite'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

const KEY = 'content/articles.json' // keep in step with lib/articles.ts
const BACKUP = 'appwrite-export.json'
const dryRun = process.argv.includes('--dry-run')

const env = process.env
const aw = {
  endpoint: env.APPWRITE_ENDPOINT,
  project: env.APPWRITE_PROJECT_ID,
  apiKey: env.APPWRITE_API_KEY,
  db: env.APPWRITE_DATABASE_ID,
  table: env.APPWRITE_COLLECTION_ID,
}
// Same fallbacks as lib/r2.ts.
const r2 = {
  endpoint:
    env.R2_S3_API_ENDPOINT ||
    env.R2_ENDPOINT ||
    (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
  accessKey: env.R2_ACCESS_KEY_ID || env.ACCESS_KEY_ID,
  secretKey: env.R2_SECRET_ACCESS_KEY || env.SECRET_ACCESS_KEY,
  bucket: env.R2_CONTENT_BUCKET || env.R2_BUCKET,
}

const missing = [
  ...Object.entries(aw).filter(([, v]) => !v).map(([k]) => `appwrite.${k}`),
  ...(dryRun ? [] : Object.entries(r2).filter(([, v]) => !v).map(([k]) => `r2.${k}`)),
]
if (missing.length) {
  console.error(`Missing config: ${missing.join(', ')}. Run with --env-file=.env.local?`)
  process.exit(1)
}

const stripEmDash = (s) => s.replace(/ — /g, ' - ').replace(/—/g, '-')

/* ── 1. Export from Appwrite ── */
const tables = new TablesDB(new Client().setEndpoint(aw.endpoint).setProject(aw.project).setKey(aw.apiKey))
const rows = []
for (let cursor; ; ) {
  const res = await tables.listRows({
    databaseId: aw.db,
    tableId: aw.table,
    queries: [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
  })
  rows.push(...res.rows)
  if (res.rows.length < 100) break
  cursor = res.rows.at(-1).$id
}

const fromAppwrite = rows.map((row) => {
  try {
    return JSON.parse(row.data ?? '')
  } catch {
    throw new Error(`Row ${row.$id} has unreadable data - fix or delete it in Appwrite and re-run.`)
  }
})

await fs.writeFile(BACKUP, JSON.stringify({ articles: fromAppwrite }, null, 2), 'utf-8')
console.log(`Exported ${fromAppwrite.length} articles from Appwrite → ${BACKUP}`)
if (dryRun) process.exit(0)

/* ── 2. Merge with anything already in R2 ── */
const s3 = new S3Client({
  region: 'auto',
  endpoint: r2.endpoint,
  credentials: { accessKeyId: r2.accessKey, secretAccessKey: r2.secretKey },
})

let existing = []
try {
  const res = await s3.send(new GetObjectCommand({ Bucket: r2.bucket, Key: KEY }))
  existing = JSON.parse(await res.Body.transformToString()).articles ?? []
} catch (e) {
  if (e.name !== 'NoSuchKey') throw e
}

const updatedAt = (a) => Date.parse(a.updated ?? '') || 0
const bySlug = new Map(fromAppwrite.map((a) => [a.slug, a]))
for (const a of existing) {
  const prev = bySlug.get(a.slug)
  if (!prev || updatedAt(a) >= updatedAt(prev)) bySlug.set(a.slug, a)
}
const articles = [...bySlug.values()]

/* ── 3. Upload ── */
await s3.send(
  new PutObjectCommand({
    Bucket: r2.bucket,
    Key: KEY,
    Body: stripEmDash(JSON.stringify({ articles })),
    ContentType: 'application/json; charset=utf-8',
  }),
)
console.log(
  `Wrote ${articles.length} articles to r2://${r2.bucket}/${KEY}` +
    (existing.length ? ` (merged with ${existing.length} already there)` : ''),
)
console.log('The site picks this up within the hour - or save any article in the studio to refresh it now.')
