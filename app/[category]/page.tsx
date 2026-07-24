import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleGrid from '@/components/ArticleGrid'
import { getArticles, isCategory, CATEGORIES, CATEGORY_META } from '@/lib/articles'
import s from '../pages.module.css'

export const revalidate = 3600

/* Section URLs are the top of the SEO funnel — pre-render all four. */
export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }))
}

type Props = { params: Promise<{ category: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  if (!isCategory(category)) return {}
  const meta = CATEGORY_META[category]
  return {
    title: `${meta.label} in Dubai`,
    description: meta.blurb,
    alternates: { canonical: `/${category}` },
    openGraph: {
      title: `${meta.label} — Dubaiography`,
      description: meta.blurb,
      url: `/${category}`,
      type: 'website',
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  if (!isCategory(category)) notFound()

  const meta = CATEGORY_META[category]
  const articles = await getArticles({ category })

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Dubaiography', item: '/' },
      { '@type': 'ListItem', position: 2, name: meta.label, item: `/${category}` },
    ],
  }

  return (
    <div className="shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className={s.pageHead}>
        <div>
          <span className="eyebrow">Section · {articles.length} pieces</span>
          <h1 className={s.pageTitle}>{meta.label}</h1>
        </div>
        <p className={s.pageBlurb}>{meta.blurb}</p>
      </div>

      <nav className={s.switcher} aria-label="Other sections">
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/${c}`} className={c === category ? s.on : undefined}>
            {CATEGORY_META[c].label}
          </Link>
        ))}
        <Link href="/archive">All articles</Link>
      </nav>

      <ArticleGrid articles={articles} />

      {/* Section essay — gives the listing real standing with readers and
          search engines rather than being a bare grid of cards. */}
      <section className={s.sectionIntro} aria-labelledby="about-section">
        <h2 className={s.sectionIntroTitle} id="about-section">
          About {meta.label}
        </h2>
        {meta.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
    </div>
  )
}
