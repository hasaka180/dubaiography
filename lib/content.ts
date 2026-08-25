/* ============================================================
   Shared content model - types, taxonomy and pure helpers.

   This module is deliberately free of `fs` and `node-appwrite`
   so client components (the studio, the header) can import it.
   Storage lives in lib/articles.ts, which is server-only.
   ============================================================ */

/* ── Editorial verticals ── */
export const CATEGORIES = ['breaking-news', 'international', 'culture', 'architecture', 'business', 'technology', 'travel', 'sport'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_META: Record<
  Category,
  { label: string; blurb: string; description: string; intro: string[] }
> = {
  'breaking-news': {
    label: 'Breaking News',
    blurb: 'The stories moving now - openings, rulings, launches and the decisions reshaping the city.',
    description:
      'Breaking news from Dubai and the Emirates - openings, regulations, launches and the developments reshaping the city, reported as they happen.',
    intro: [
      'Dubai changes on a timescale most cities reserve for decades. A district opens, a law is rewritten, a tower tops out, a route launches - and the version of the city you knew last month is already out of date. This section tracks the news as it lands, then explains what it actually means.',
      'We cover the developments that move the city: major openings and launches, changes to visa, property and business regulation, transport and infrastructure milestones, and the announcements that reshape neighbourhoods. The aim is not to be first with a headline but to be clear about what a change does - who it affects, what it costs, and what happens next.',
      'Every item is dated and updated in place as a story develops, because breaking news dates faster than anything else on the site. Where a story connects to a longer piece - a guide, an explainer, a piece of reporting - we link across, so the news sits in context rather than in isolation.',
    ],
  },
  international: {
    label: 'International',
    blurb: 'The world as it lands in Dubai - the global stories, markets and moves that shape the city.',
    description:
      'International news through a Dubai lens - the global politics, markets and moves that shape a city built on being the hub between everywhere else.',
    intro: [
      'Dubai sells itself as the point where everywhere else connects, which makes the world\'s news local news here. A sanction, a shipping route, a currency move, a conflict a thousand miles away - each reaches the city through its ports, its banks, its airlines and the two hundred nationalities who live here. This section covers the global stories that actually move Dubai.',
      'We report the international developments with a stake in the region: the geopolitics of the Gulf and the wider Middle East, the trade and energy flows the economy runs on, the migration and money that follow them, and the diplomacy a small state uses to stay useful to everyone at once. The aim is not a wire feed but an explanation of why a distant event matters here.',
      'We also cover Dubai\'s own reach outward - the airline that turned a stopover into an empire, the ports operator on four continents, the sovereign funds and the soft-power projects. Every piece is reported and dated, because the map it describes is redrawn constantly.',
    ],
  },
  culture: {
    label: 'Culture & Guides',
    blurb: 'Neighbourhoods, galleries, kitchens and the people shaping the city day to day.',
    description:
      'Neighbourhood guides, food, galleries and the customs visitors get wrong - culture in Dubai reported on foot, from Al Fahidi to Alserkal Avenue.',
    intro: [
      'Dubai is often described as a city without a past, which is a convenient story for people who have not looked. The creek was a working harbour long before the towers arrived, the coral-and-gypsum houses of Al Fahidi still stand, and the pearling economy that funded them shaped families who are still here. This section covers the parts of the city that do not photograph as easily as the skyline.',
      'We write neighbourhood guides that assume you want to walk rather than be driven - Al Fahidi and Al Seef, Deira and the gold and spice souks, Satwa and Karama, Alserkal Avenue and the warehouse galleries of Al Quoz. We cover the food properly: Emirati staples built from dates, camel milk, rice and Gulf fish, and the two hundred nationalities who have since layered their own cooking on top, from a Michelin tasting menu to a two-dirham shawarma.',
      'Culture here also means the institutions - the museums, the biennials, the independent bookshops and the arts organisations that have grown up in the last two decades - and the ordinary customs that a visitor gets wrong: how Ramadan reshapes the day, how majlis hospitality works, when to use your right hand. Every guide is reported on foot and dated, because a listing that has quietly gone stale is worse than no listing at all.',
    ],
  },
  architecture: {
    label: 'Architecture & Urbanism',
    blurb: 'How Dubai was drawn - towers, wind towers, masterplans and the space between them.',
    description:
      'How Dubai was built, explained: the Burj Khalifa, wind towers, the palm islands, the metro and the masterplans - reported by how they actually work.',
    intro: [
      'No other city has built this much, this fast, this recently. Almost everything you can see from Sheikh Zayed Road was constructed inside a single lifetime, and much of it inside a single generation. That makes Dubai an unusually legible case study: the decisions are recent enough to trace, and the people who made them are mostly still working.',
      'This section takes the buildings seriously as buildings. We look at how the Burj Khalifa\'s buttressed core solved a wind problem before it solved a height problem, why the Burj Al Arab sits on a man-made island, what the barjeel wind towers of the old quarters actually did before air conditioning, and how the palm and world islands were dredged. We also cover the work that never makes the postcards - district cooling, the metro, labour accommodation, the drainage that keeps a desert city from flooding when it does rain.',
      'Urbanism is the other half. We write about masterplans and what happens between the towers: whether a street is walkable in August, how superblocks and service roads shape who meets whom, why the free-zone map produced the density it did, and what the current push toward shade, transit and the twenty-minute city will actually change. The aim is to explain the mechanism, not to rank the skyline.',
    ],
  },
  business: {
    label: 'Business & Property',
    blurb: 'Free zones, freehold, funding and the mechanics of building something here.',
    description:
      'Free zone or mainland, freehold, corporate tax, visas and setup costs - the mechanics of doing business and buying property in Dubai, kept current.',
    intro: [
      'Setting up in Dubai is genuinely straightforward compared with most places, which is exactly why so much of the advice about it is bad - the process is simple enough that everyone has an opinion and few people update theirs. Regulations here move quickly. This section explains the mechanics as they currently stand, with dates on everything.',
      'The first structural decision is free zone or mainland, and it determines more than people expect: ownership, where you can invoice, which visas you can sponsor, whether you need a local service agent, and what your annual renewal actually costs. We explain the trade-off without the brochure language, and we cover the specific zones - DMCC, DIFC, IFZA, Meydan, JAFZA - on what they charge and who they suit.',
      'On property, we cover the freehold map and what ownership means in each area, service charges and the ones that surprise buyers, escrow and off-plan protections, mortgage rules for residents and non-residents, rental indices and the RERA calculator, and the transfer costs nobody quotes upfront. We also write about the wider economy - corporate tax and VAT, banking and the account-opening reality, funding and the venture scene, and the labour rules that govern hiring. Reported for people making an actual decision.',
    ],
  },
  travel: {
    label: 'Travel & Experience',
    blurb: 'Desert, coast and everything worth the detour, reported first-hand.',
    description:
      'Desert reserves, the coast, the mountains and the day trips worth the drive - Dubai travel reported first-hand, with the seasons and timing explained.',
    intro: [
      'Most Dubai travel writing is a list of superlatives - tallest, largest, first. This section is for the trip you would actually enjoy, which usually means understanding the seasons, going where the crowds are not, and leaving the city for at least a day.',
      'The desert is the real attraction and the most misrepresented. We cover the conservation reserves and what separates a genuine one from a dune-bashing operation, when to go for cool nights and clear skies, what an overnight camp is really like, and the wadis and mountain roads of the Hajar range once you cross into the eastern emirates. The coast gets the same treatment: the public beaches worth the drive, the mangroves, the diving, and the boat routes along the creek that cost a couple of dirhams.',
      'We also write practically, because timing decides everything here. The difference between November and July is the difference between a walkable city and one you experience through car windows. We cover the shoulder seasons, Ramadan travel, what is worth booking ahead, how to move around without a car, and the day trips - Abu Dhabi, Hatta, Sharjah, Ras Al Khaimah - that repay the effort. Everything is visited before it is written about.',
    ],
  },
  technology: {
    label: 'Technology',
    blurb: 'AI, fintech, mobility and the startups building the city that markets itself as future-first.',
    description:
      'Technology in Dubai and the Emirates - AI and fintech, startups and free-zone tech, smart-city projects and the policy shaping a self-styled future city.',
    intro: [
      'Dubai sells itself as a city of the future, and it has spent heavily to make the claim stick - a minister for artificial intelligence, blockchain strategies, autonomous-transport targets, and free zones built specifically to import founders. This section covers the technology behind the branding, and is honest about the gap between the two.',
      'We write about the companies actually being built here: the fintechs working under the DIFC and ADGM regimes, the logistics and mobility startups, the AI teams, the Web3 projects that treated the city as a regulatory haven, and the regional giants - Careem, Talabat and the rest - that proved the market. We cover funding as it happens, who is backing whom, and which "ecosystem" announcements have substance behind them.',
      'And we cover the state as a technology actor, because here it is one - smart-city infrastructure, the push to put government services on an app, the surveillance and data questions that come with it, and the regulation that decides what a startup can and cannot do. Every piece is reported first-hand and dated, because a funding round and a regulation both age quickly.',
    ],
  },
  sport: {
    label: 'Sport',
    blurb: 'The city as a stadium - the marquee events, the clubs and the business of hosting.',
    description:
      'Sport in Dubai and the Emirates - the marquee events, the clubs and academies, and the business of a city that buys its way onto the global calendar.',
    intro: [
      'Dubai has spent two decades buying its way onto the global sporting calendar, and it shows. In a single season the city hosts a tennis championship, a rugby sevens weekend, a golf desert classic, a Formula weekend up the road in Abu Dhabi, and a cricket schedule that has made the Emirates a neutral home for the sport. This section covers all of it - as events, and as a strategy.',
      'We write about the fixtures worth planning a trip around and how to actually attend them: when tickets go on sale, where to sit, what a session really costs once you add the extras. We cover the clubs and academies that have grown up around the imported stars, the padel courts that appeared on every rooftop, the running and cycling scene that comes alive the moment the heat breaks, and the grassroots leagues that outlast the headline events.',
      'And we treat sport as the business it is here - the sponsorships, the stadium economics, the tourism the calendar is built to drive, and the questions that come with a city hosting events faster than it grows the crowds to fill them. Every piece is reported first-hand and dated, because a fixture list and a ticket price both go stale fast.',
    ],
  },
}

export const isCategory = (v: unknown): v is Category =>
  typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)

/* ── Article body blocks (what the studio builder composes) ── */
export type Block =
  | { id: string; type: 'text'; body?: string; format?: 'markdown' | 'html' }
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
  /* SEO overrides - blank falls back to title / standfirst */
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
