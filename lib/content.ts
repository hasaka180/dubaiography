/* ============================================================
   Shared content model — types, taxonomy and pure helpers.

   This module is deliberately free of `fs` and `node-appwrite`
   so client components (the studio, the header) can import it.
   Storage lives in lib/articles.ts, which is server-only.
   ============================================================ */

/* ── Editorial verticals ── */
export const CATEGORIES = ['culture', 'architecture', 'business', 'travel'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_META: Record<
  Category,
  { label: string; blurb: string; intro: string[] }
> = {
  culture: {
    label: 'Culture & Guides',
    blurb: 'Neighbourhoods, galleries, kitchens and the people shaping the city day to day.',
    intro: [
      'Dubai is often described as a city without a past, which is a convenient story for people who have not looked. The creek was a working harbour long before the towers arrived, the coral-and-gypsum houses of Al Fahidi still stand, and the pearling economy that funded them shaped families who are still here. This section covers the parts of the city that do not photograph as easily as the skyline.',
      'We write neighbourhood guides that assume you want to walk rather than be driven — Al Fahidi and Al Seef, Deira and the gold and spice souks, Satwa and Karama, Alserkal Avenue and the warehouse galleries of Al Quoz. We cover the food properly: Emirati staples built from dates, camel milk, rice and Gulf fish, and the two hundred nationalities who have since layered their own cooking on top, from a Michelin tasting menu to a two-dirham shawarma.',
      'Culture here also means the institutions — the museums, the biennials, the independent bookshops and the arts organisations that have grown up in the last two decades — and the ordinary customs that a visitor gets wrong: how Ramadan reshapes the day, how majlis hospitality works, when to use your right hand. Every guide is reported on foot and dated, because a listing that has quietly gone stale is worse than no listing at all.',
    ],
  },
  architecture: {
    label: 'Architecture & Urbanism',
    blurb: 'How Dubai was drawn — towers, wind towers, masterplans and the space between them.',
    intro: [
      'No other city has built this much, this fast, this recently. Almost everything you can see from Sheikh Zayed Road was constructed inside a single lifetime, and much of it inside a single generation. That makes Dubai an unusually legible case study: the decisions are recent enough to trace, and the people who made them are mostly still working.',
      'This section takes the buildings seriously as buildings. We look at how the Burj Khalifa\'s buttressed core solved a wind problem before it solved a height problem, why the Burj Al Arab sits on a man-made island, what the barjeel wind towers of the old quarters actually did before air conditioning, and how the palm and world islands were dredged. We also cover the work that never makes the postcards — district cooling, the metro, labour accommodation, the drainage that keeps a desert city from flooding when it does rain.',
      'Urbanism is the other half. We write about masterplans and what happens between the towers: whether a street is walkable in August, how superblocks and service roads shape who meets whom, why the free-zone map produced the density it did, and what the current push toward shade, transit and the twenty-minute city will actually change. The aim is to explain the mechanism, not to rank the skyline.',
    ],
  },
  business: {
    label: 'Business & Property',
    blurb: 'Free zones, freehold, funding and the mechanics of building something here.',
    intro: [
      'Setting up in Dubai is genuinely straightforward compared with most places, which is exactly why so much of the advice about it is bad — the process is simple enough that everyone has an opinion and few people update theirs. Regulations here move quickly. This section explains the mechanics as they currently stand, with dates on everything.',
      'The first structural decision is free zone or mainland, and it determines more than people expect: ownership, where you can invoice, which visas you can sponsor, whether you need a local service agent, and what your annual renewal actually costs. We explain the trade-off without the brochure language, and we cover the specific zones — DMCC, DIFC, IFZA, Meydan, JAFZA — on what they charge and who they suit.',
      'On property, we cover the freehold map and what ownership means in each area, service charges and the ones that surprise buyers, escrow and off-plan protections, mortgage rules for residents and non-residents, rental indices and the RERA calculator, and the transfer costs nobody quotes upfront. We also write about the wider economy — corporate tax and VAT, banking and the account-opening reality, funding and the venture scene, and the labour rules that govern hiring. Reported for people making an actual decision.',
    ],
  },
  travel: {
    label: 'Travel & Experience',
    blurb: 'Desert, coast and everything worth the detour, reported first-hand.',
    intro: [
      'Most Dubai travel writing is a list of superlatives — tallest, largest, first. This section is for the trip you would actually enjoy, which usually means understanding the seasons, going where the crowds are not, and leaving the city for at least a day.',
      'The desert is the real attraction and the most misrepresented. We cover the conservation reserves and what separates a genuine one from a dune-bashing operation, when to go for cool nights and clear skies, what an overnight camp is really like, and the wadis and mountain roads of the Hajar range once you cross into the eastern emirates. The coast gets the same treatment: the public beaches worth the drive, the mangroves, the diving, and the boat routes along the creek that cost a couple of dirhams.',
      'We also write practically, because timing decides everything here. The difference between November and July is the difference between a walkable city and one you experience through car windows. We cover the shoulder seasons, Ramadan travel, what is worth booking ahead, how to move around without a car, and the day trips — Abu Dhabi, Hatta, Sharjah, Ras Al Khaimah — that repay the effort. Everything is visited before it is written about.',
    ],
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
