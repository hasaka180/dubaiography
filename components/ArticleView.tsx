import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import FaqAccordion from './FaqAccordion'
import ShareBar from './ShareBar'
import { ArticleCard } from './ArticleGrid'
import { CATEGORY_META, formatDate, type Article, type Block } from '@/lib/content'
import s from './ArticleView.module.css'

function BlockView({ block, isLede }: { block: Block; isLede: boolean }) {
  switch (block.type) {
    case 'text':
      return (
        <div className={`${s.block} ${isLede ? s.lede : ''}`} data-reveal>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.body ?? ''}</ReactMarkdown>
        </div>
      )

    case 'heading':
      return (
        <div className={s.heading} data-reveal>
          {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
          {block.heading && <h2>{block.heading}</h2>}
        </div>
      )

    case 'image':
      return (
        <figure className={`${s.figure} ${block.full ? s.full : ''}`} data-reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.caption || ''} loading="lazy" />
          {block.caption && <figcaption className={s.caption}>{block.caption}</figcaption>}
        </figure>
      )

    case 'quote':
      return (
        <blockquote className={s.quote} data-reveal>
          <p>{block.body}</p>
          {block.attribution && <cite>{block.attribution}</cite>}
        </blockquote>
      )

    case 'gallery':
      return (
        <div
          className={s.gallery}
          style={{ gridTemplateColumns: `repeat(${block.columns ?? 2}, 1fr)` }}
          data-reveal
        >
          {block.items.map((it, i) => (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.caption || ''} loading="lazy" />
              {it.caption && <figcaption className={s.caption}>{it.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )

    default:
      return null
  }
}

export default function ArticleView({
  article,
  related,
  url,
}: {
  article: Article
  related: Article[]
  url: string
}) {
  const firstTextIdx = article.blocks.findIndex((b) => b.type === 'text')

  return (
    <article className={s.article}>
      <div className="shell">
        <div className={s.head}>
          <span className="eyebrow">
            <Link href={`/${article.category}`} className="link-underline">
              {CATEGORY_META[article.category]?.label ?? article.category}
            </Link>
          </span>
          <h1 className={s.title}>{article.title}</h1>
        </div>

        {article.standfirst && <p className={s.standfirst}>{article.standfirst}</p>}

        <div className={s.byline}>
          {article.author && <span className="eyebrow">By {article.author}</span>}
          {article.date && (
            <time className="eyebrow" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          )}
          {article.readingTime && <span className="eyebrow">{article.readingTime} min read</span>}
        </div>

        <ShareBar url={url} title={article.title} />
      </div>

      {article.cover && (
        <figure className={s.cover} style={{ marginTop: 'clamp(2rem, 5vw, 3.5rem)' }}>
          {/* The cover is the LCP element — load it eagerly, never lazily. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover} alt={article.coverAlt || article.title} />
        </figure>
      )}

      <div className="shell">
        <div className={s.body}>
          {article.blocks.map((b, i) => (
            <BlockView key={b.id ?? i} block={b} isLede={i === firstTextIdx} />
          ))}
        </div>

        {!!article.tags?.length && (
          <div className={s.tags}>
            {article.tags.map((t) => (
              <span key={t} className={s.tag}>
                {t}
              </span>
            ))}
          </div>
        )}

        {!!article.faqs?.length && <FaqAccordion faqs={article.faqs} />}

        {!!related.length && (
          <section className={s.related} aria-labelledby="related-head">
            <div className={s.relatedHead}>
              <div>
                <span className="eyebrow">Keep reading</span>
                <h2 className={s.relatedTitle} id="related-head">
                  Related
                </h2>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', borderTop: '1px solid var(--rule)' }}>
              {related.map((a, i) => (
                <ArticleCard key={a.slug} article={{ ...a, size: 'md' }} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
