import Link from 'next/link'
import ArticleGrid from '@/components/ArticleGrid'
import { getArticles, CATEGORIES, CATEGORY_META } from '@/lib/articles'
import s from '../pages.module.css'

export const revalidate = 3600

export const metadata = {
  title: 'Archive — every article',
  description:
    'The complete Dubaiography archive: every piece on Dubai architecture, culture, business and travel, newest first.',
  alternates: { canonical: '/archive' },
}

export default async function ArchivePage() {
  const articles = await getArticles()

  return (
    <div className="shell">
      <div className={s.pageHead}>
        <div>
          <span className="eyebrow">{articles.length} pieces, newest first</span>
          <h1 className={s.pageTitle}>Archive</h1>
        </div>
        <p className={s.pageBlurb}>
          Everything published to date, across all four sections of the journal.
        </p>
      </div>

      <nav className={s.switcher} aria-label="Sections">
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/${c}`}>
            {CATEGORY_META[c].label}
          </Link>
        ))}
      </nav>

      <ArticleGrid articles={articles} />
    </div>
  )
}
