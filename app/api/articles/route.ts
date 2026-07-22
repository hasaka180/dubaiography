import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getArticles, upsertArticle, isCategory, type Article, type Category } from '@/lib/articles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Refresh the server-rendered pages a write could have changed. */
function revalidateContent(article?: Article) {
  revalidatePath('/')
  revalidatePath('/archive')
  if (article) {
    revalidatePath(`/${article.category}`)
    revalidatePath(`/articles/${article.slug}`)
  }
}

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams
    const category = params.get('category')
    const items = await getArticles({
      category: isCategory(category) ? (category as Category) : undefined,
      // The studio needs to see drafts; the public site never asks for them.
      includeDrafts: params.get('drafts') === '1',
    })
    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/articles failed:', e)
    return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Article>

  if (!body.slug || !body.title) {
    return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
  }
  if (!isCategory(body.category)) {
    return NextResponse.json({ error: 'a valid category is required' }, { status: 400 })
  }

  try {
    const saved = await upsertArticle({ blocks: [], ...body } as Article)
    revalidateContent(saved)
    return NextResponse.json(saved, { status: 201 })
  } catch (e) {
    console.error('POST /api/articles failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 500 })
  }
}
