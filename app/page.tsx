import Link from 'next/link'
import HeroScene from '@/components/HeroScene'
import ArticleGrid, { LeadArticle } from '@/components/ArticleGrid'
import { getArticles, CATEGORIES, CATEGORY_META } from '@/lib/articles'
import s from './home.module.css'

// Content is edited live in /studio; re-render hourly so new pieces surface
// without a redeploy, while keeping pages static and fast for crawlers.
export const revalidate = 3600

export const metadata = {
  title: 'Dubaiography — An editorial journal of Dubai',
  description:
    'Long-form reporting on Dubai: architecture and urbanism, culture and neighbourhood guides, business and property, travel and desert experience.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const articles = await getArticles()
  const lead = articles.find((a) => a.featured) ?? articles[0]
  const rest = articles.filter((a) => a.slug !== lead?.slug)

  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c, articles.filter((a) => a.category === c).length]),
  ) as Record<string, number>

  return (
    <>
      <HeroScene />

      <div className="shell">
        {lead && <LeadArticle article={lead} />}

        {/* ── the four verticals ── */}
        <section className={s.section} aria-labelledby="sections-head">
          <div className={s.head}>
            <div>
              <span className="eyebrow">The journal</span>
              <h2 className={s.headTitle} id="sections-head">
                Four ways to read the city
              </h2>
            </div>
          </div>

          <div className={s.verticals}>
            {CATEGORIES.map((c, i) => (
              <Link key={c} href={`/${c}`} className={s.vertical} data-reveal>
                <span className={s.verticalNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={s.verticalName}>{CATEGORY_META[c].label}</h3>
                <p className={s.verticalBlurb}>{CATEGORY_META[c].blurb}</p>
                <span className={s.verticalCount}>
                  {counts[c] ?? 0} {counts[c] === 1 ? 'piece' : 'pieces'}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── latest ── */}
        <section className={s.section} aria-labelledby="latest-head">
          <div className={s.head}>
            <div>
              <span className="eyebrow">Latest</span>
              <h2 className={s.headTitle} id="latest-head">
                New from the desk
              </h2>
            </div>
            <Link href="/archive" className={`${s.more} link-underline`}>
              Full archive →
            </Link>
          </div>

          <ArticleGrid articles={rest.slice(0, 9)} />
        </section>
      </div>

      {/* ── statement ── */}
      <section className={s.statement}>
        <div className="shell">
          <p className={s.statementText} data-reveal>
            A city built in a single lifetime deserves <em>more than a listicle.</em>
          </p>
          <div className={`${s.statementFoot} eyebrow`}>
            <span>Reported in Dubai</span>
            <span>Published continuously</span>
            <span>Independent</span>
          </div>
        </div>
      </section>
    </>
  )
}
