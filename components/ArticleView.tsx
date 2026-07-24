import type { ReactNode } from 'react'
import Link from 'next/link'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import FaqAccordion from './FaqAccordion'
import ShareBar from './ShareBar'
import { ArticleCard } from './ArticleGrid'
import { CATEGORY_META, formatDate, slugify, type Article, type Block } from '@/lib/content'
import s from './ArticleView.module.css'

/** Anchor id for a dedicated heading block — the table of contents links here. */
const sectionId = (i: number) => `sec-${i}`

/** Flatten a rendered node back to its plain text, so a markdown heading and
    its table-of-contents entry derive the same slug. */
function toText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return toText((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

/* Give markdown headings ids so they can be linked from the table of contents.
   slugify() strips markdown punctuation, so this matches the ToC slug built
   from the raw source. */
const mdComponents: Components = {
  h2: ({ children }) => <h2 id={slugify(toText(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={slugify(toText(children))}>{children}</h3>,
}

type TocItem = { id: string; label: string; level: number }

/** Build the table of contents from both dedicated heading blocks and
    markdown ## / ### headings inside text blocks. */
function buildToc(blocks: Block[]): TocItem[] {
  const items: TocItem[] = []
  blocks.forEach((b, i) => {
    if (b.type === 'heading' && b.heading) {
      items.push({ id: sectionId(i), label: b.heading, level: 2 })
    } else if (b.type === 'text' && b.body) {
      const re = /^(#{2,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm
      let m: RegExpExecArray | null
      while ((m = re.exec(b.body)) !== null) {
        const label = m[2].trim()
        items.push({ id: slugify(label), label, level: m[1].length })
      }
    }
  })
  return items
}

function BlockView({ block, index, isLede }: { block: Block; index: number; isLede: boolean }) {
  switch (block.type) {
    case 'text':
      return (
        <div className={`${s.block} ${isLede ? s.lede : ''}`} data-reveal>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {block.body ?? ''}
          </ReactMarkdown>
        </div>
      )

    case 'heading':
      return (
        <div
          className={s.heading}
          id={block.heading ? sectionId(index) : undefined}
          data-reveal
        >
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

  // Section headings, for the sticky "In this guide" table of contents.
  const toc = buildToc(article.blocks)

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

        {/* Mobile share — the desktop copy lives in the sticky rail. */}
        <div className={s.shareInline}>
          <ShareBar url={url} title={article.title} />
        </div>
      </div>

      {article.cover && (
        <figure className={s.cover} style={{ marginTop: 'clamp(2rem, 5vw, 3.5rem)' }}>
          {/* The cover is the LCP element — load it eagerly, never lazily. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover} alt={article.coverAlt || article.title} />
        </figure>
      )}

      <div className="shell">
        <div className={s.layout}>
          <div className={s.main}>
            {(article.summaryTitle || article.summaryDescription) && (
              <aside className={s.summary} data-reveal>
                {article.summaryTitle && <h2 className={s.summaryTitle}>{article.summaryTitle}</h2>}
                {article.summaryDescription && (
                  <p className={s.summaryDesc}>{article.summaryDescription}</p>
                )}
              </aside>
            )}

            <div className={s.body}>
              {article.blocks.map((b, i) => (
                <BlockView key={b.id ?? i} block={b} index={i} isLede={i === firstTextIdx} />
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
          </div>

          {/* Sticky rail — fills the space beside the reading column. Hidden
              on narrow screens, where share moves under the byline. */}
          <aside className={s.rail}>
            <div className={s.railInner}>
              {toc.length > 0 && (
                <nav className={s.toc} aria-label="In this guide">
                  <span className={s.tocHead}>In this guide</span>
                  <ol>
                    {toc.map((t) => (
                      <li key={t.id} data-sub={t.level > 2 ? '' : undefined}>
                        <a href={`#${t.id}`}>{t.label}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <ShareBar url={url} title={article.title} variant="stacked" />
            </div>
          </aside>
        </div>

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
