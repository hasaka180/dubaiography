import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getArticle, deleteArticle } from '@/lib/articles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { slug } = await params
  const article = await getArticle(slug)
  const ok = await deleteArticle(slug)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  revalidatePath('/')
  revalidatePath('/archive')
  if (article) revalidatePath(`/${article.category}`)

  return NextResponse.json({ ok: true })
}
