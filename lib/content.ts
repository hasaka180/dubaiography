/* ============================================================
   Shared content model — types, taxonomy and pure helpers.

   This module is deliberately free of `fs` and `node-appwrite`
   so client components (the studio, the header) can import it.
   Storage lives in lib/articles.ts, which is server-only.
   ============================================================ */

/* ── Editorial verticals ── */
export const CATEGORIES = ['culture', 'architecture', 'business', 'travel'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_META: Record<Category, { label: string; blurb: string }> = {
  culture: {
    label: 'Culture & Guides',
    blurb: 'Neighbourhoods, galleries, kitchens and the people shaping the city day to day.',
  },
  architecture: {
    label: 'Architecture & Urbanism',
    blurb: 'How Dubai was drawn — towers, wind towers, masterplans and the space between them.',
  },
  business: {
    label: 'Business & Property',
    blurb: 'Free zones, freehold, funding and the mechanics of building something here.',
  },
  travel: {
    label: 'Travel & Experience',
    blurb: 'Desert, coast and everything worth the detour, reported first-hand.',
  },
}

export const isCategory = (v: unknown): v is Category =>
  typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)

/* ── Article body blocks (what the studio builder composes) ── */
export type Block =
  | { id: string; type: 'text'; body?: string }
  | { id: string; type: 'heading'; heading?: string; eyebrow?: string }
  | { id: string; type: 'image'; src: string; caption?: string; full?: boolean }
  | { id: string; type: 'quote'; body?: string; attribution?: string }
  | { id: string; type: 'gallery'; columns?: number; items: { src: string; caption?: string }[] }

export interface Article {
  slug: string
  title: string
  /** Short deck shown under the headline and used as the meta description fallback. */
  standfirst?: string
  category: Category
  author?: string
  /** ISO date, e.g. 2026-07-22 */
  date?: string
  /** Estimated read time in minutes. */
  readingTime?: number
  cover?: string
  coverAlt?: string
  /** Feature in the homepage lead slot. */
  featured?: boolean
  /** Card weight in the editorial grid. */
  size?: 'lg' | 'md' | 'sm'
  tags?: string[]
  blocks: Block[]
  /* SEO overrides — blank falls back to title / standfirst */
  metaTitle?: string
  metaDescription?: string
  /** Optional key-takeaway block rendered above the body. */
  summaryTitle?: string
  summaryDescription?: string
  /** Raw JSON-LD pasted in the studio, emitted alongside the generated graph.
      Ignored if it isn't valid JSON, so a typo can't break the page. */
  jsonLd?: string
  /** Rendered as an FAQPage schema block + accordion. Strong for long-tail search. */
  faqs?: { q: string; a: string }[]
  /** Set false to keep an article out of listings, sitemap and search. */
  published?: boolean
  updated?: string
}

/* ── pure helpers, shared by the reader and the studio ── */

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)

export const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Rough read time from the article's prose blocks, at ~220 wpm. */
export const estimateReadingTime = (blocks: Block[]) => {
  const words = blocks.reduce((n, b) => {
    const text = 'body' in b ? b.body ?? '' : 'heading' in b ? b.heading ?? '' : ''
    return n + text.split(/\s+/).filter(Boolean).length
  }, 0)
  return Math.max(1, Math.round(words / 220))
}

/** Newest first; undated entries sink to the bottom. */
export const byDateDesc = (a: Article, b: Article) => (b.date ?? '').localeCompare(a.date ?? '')
