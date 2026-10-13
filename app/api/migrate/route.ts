import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Client, TablesDB, Query } from 'node-appwrite'
import { importArticles, type Article } from '@/lib/articles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* One-off: copy the articles out of the old Appwrite table into R2. It runs on
   Vercel because that's where the Appwrite credentials live - they're stored
   as secrets and can't be read back out of the dashboard. Password-gated by
   proxy.ts.

     GET /api/migrate         preview what Appwrite holds (read-only; save it as a backup)
     GET /api/migrate?run=1   merge it into R2 - per slug, the newest copy wins

   Once it has run: delete this route, uninstall node-appwrite and remove the
   APPWRITE_* variables from Vercel. */

async function exportFromAppwrite(): Promise<Article[]> {
  const env = process.env
  const missing = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_COLLECTION_ID',
  ].filter((k) => !env[k])
  if (missing.length) throw new Error(`Not set on this deployment: ${missing.join(', ')}`)

  const tables = new TablesDB(
    new Client().setEndpoint(env.APPWRITE_ENDPOINT!).setProject(env.APPWRITE_PROJECT_ID!).setKey(env.APPWRITE_API_KEY!),
  )
  const rows: Record<string, unknown>[] = []
  for (let cursor: string | undefined; ; ) {
    const res = await tables.listRows({
      databaseId: env.APPWRITE_DATABASE_ID!,
      tableId: env.APPWRITE_COLLECTION_ID!,
      queries: [Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    })
    rows.push(...(res.rows as Record<string, unknown>[]))
    if (res.rows.length < 100) break
    cursor = res.rows[res.rows.length - 1].$id
  }

  return rows.map((row) => {
    try {
      return JSON.parse(row.data as string) as Article
    } catch {
      throw new Error(`Row ${row.$id} has unreadable data - fix or delete it in Appwrite and re-run.`)
    }
  })
}

export async function GET(req: Request) {
  try {
    const articles = await exportFromAppwrite()
    const summary = articles.map((a) => `${a.slug} (${a.published === false ? 'draft' : 'published'})`)

    if (new URL(req.url).searchParams.get('run') !== '1') {
      return NextResponse.json({ preview: true, count: articles.length, summary, articles })
    }

    const total = await importArticles(articles)
    revalidatePath('/', 'layout')
    return NextResponse.json({ imported: articles.length, totalNow: total, summary })
  } catch (e) {
    console.error('Appwrite migration failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 })
  }
}
