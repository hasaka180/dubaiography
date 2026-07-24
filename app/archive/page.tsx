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

      <section className={s.sectionIntro} aria-labelledby="about-archive">
        <h2 className={s.sectionIntroTitle} id="about-archive">
          About the archive
        </h2>
        <p>
          This is everything Dubaiography has published, newest first, across all four sections of
          the journal. Nothing is removed when it ages. Articles are dated, and when the facts
          change — a regulation, a fee, an opening — the piece is updated in place and the date
          moves with it, rather than being quietly patched or deleted.
        </p>
        <p>
          The four sections divide the city roughly by the question you arrived with.{' '}
          <strong>Architecture &amp; Urbanism</strong> is for how the place was built and why it
          works the way it does. <strong>Culture &amp; Guides</strong> covers neighbourhoods,
          food, galleries and the customs that a visitor gets wrong.{' '}
          <strong>Business &amp; Property</strong> handles free zones, freehold, tax and the
          mechanics of setting something up. <strong>Travel &amp; Experience</strong> is the
          desert, the coast and the trips worth the drive.
        </p>
        <p>
          Every piece is reported first-hand and written long, on the view that a city built in a
          single lifetime deserves more than a listicle. If something here is wrong, corrections
          are made to the article itself and noted with an updated date.
        </p>
      </section>
    </div>
  )
}
