import Link from 'next/link'
import CoverPlaceholder from './CoverPlaceholder'
import { CATEGORY_META, formatDate, type Article } from '@/lib/content'
import s from './ArticleGrid.module.css'

/* ── one card ── */
export function ArticleCard({ article, index = 0 }: { article: Article; index?: number }) {
  const size = article.size ?? 'md'

  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`${s.card} ${s[size]}`}
      data-reveal
      data-reveal-delay={(index % 3) * 90}
    >
      <div className={s.thumb}>
        {article.cover ? (
          // Plain <img>: covers come from R2 at arbitrary sizes, and the grid
          // already constrains them with aspect-ratio + object-fit.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover} alt={article.coverAlt || ''} loading="lazy" />
        ) : (
          <CoverPlaceholder
            slug={article.slug}
            title={article.title}
            category={article.category}
          />
        )}
      </div>

      <div className={s.kicker}>
        <span className={s.dot} />
        <span className="eyebrow">{CATEGORY_META[article.category]?.label ?? article.category}</span>
      </div>

      <h3 className={s.title}>{article.title}</h3>
      {article.standfirst && <p className={s.standfirst}>{article.standfirst}</p>}

      <div className={s.meta}>
        {article.date && <span className="eyebrow">{formatDate(article.date)}</span>}
        {article.readingTime && <span className="eyebrow">{article.readingTime} min read</span>}
      </div>
    </Link>
  )
}

/* ── the lead story ── */
export function LeadArticle({ article }: { article: Article }) {
  return (
    <Link href={`/articles/${article.slug}`} className={s.lead} data-reveal>
      <div className={s.leadArt}>
        {article.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.cover} alt={article.coverAlt || ''} />
        ) : (
          <CoverPlaceholder
            slug={article.slug}
            title={article.title}
            category={article.category}
          />
        )}
      </div>

      <div>
        <div className={s.kicker}>
          <span className={s.dot} />
          <span className="eyebrow">
            The lead — {CATEGORY_META[article.category]?.label ?? article.category}
          </span>
        </div>

        <h2 className={s.leadTitle}>{article.title}</h2>
        {article.standfirst && <p className={s.leadStandfirst}>{article.standfirst}</p>}

        <div className={s.meta}>
          {article.author && <span className="eyebrow">By {article.author}</span>}
          {article.date && <span className="eyebrow">{formatDate(article.date)}</span>}
          {article.readingTime && <span className="eyebrow">{article.readingTime} min read</span>}
        </div>
      </div>
    </Link>
  )
}

/* ── the wall ── */
export default function ArticleGrid({ articles }: { articles: Article[] }) {
  if (!articles.length) {
    return (
      <p className="eyebrow" style={{ padding: '4rem 0', borderTop: '1px solid var(--rule)' }}>
        No articles here yet.
      </p>
    )
  }

  return (
    <div className={s.grid}>
      {articles.map((a, i) => (
        <ArticleCard key={a.slug} article={a} index={i} />
      ))}
    </div>
  )
}
