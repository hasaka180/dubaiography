import Link from 'next/link'
import HeroScene from '@/components/HeroArt'
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

        {/* ── what this is ── */}
        <section className={s.about} aria-labelledby="about-journal">
          <h2 className={s.aboutTitle} id="about-journal">
            An editorial journal of Dubai
          </h2>
          <div className={s.aboutText}>
            <p>
              Dubaiography is an independent journal about Dubai and the wider Emirates. It exists
              because most writing about this city falls into one of two piles: property brochures,
              or lists of brunches. Neither tells you how the place actually works — how a tower
              gets consented and built in thirty months, why the free-zone map produced the density
              it did, what the wind towers of Al Fahidi were doing before air conditioning, or which
              beach is worth the drive in November.
            </p>
            <p>
              We publish long-form reporting across four sections. Architecture &amp; Urbanism
              covers how the city was drawn — the towers, the masterplans, the metro and the space
              between them. Culture &amp; Guides covers neighbourhoods, kitchens, galleries and the
              customs a visitor gets wrong. Business &amp; Property handles free zones, freehold,
              tax and the mechanics of setting something up here. Travel &amp; Experience is the
              desert, the coast and the trips that repay the effort.
            </p>
            <p>
              Every piece is reported first-hand and dated. When the facts change — and in the
              Emirates regulations move quickly — the article is updated in place rather than
              quietly patched, because a guide that has gone stale without saying so is worse than
              no guide at all.
            </p>
          </div>
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
