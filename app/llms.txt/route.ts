import { getArticles, CATEGORIES, CATEGORY_META } from '@/lib/articles'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dubaiography.com'

/**
 * /llms.txt — a plain-text map of the publication for AI search engines.
 * Generated from the live content so it never drifts from the sitemap.
 * See llmstxt.org.
 */
export async function GET() {
  const articles = await getArticles()

  const sections = CATEGORIES.map((c) => {
    const inSection = articles.filter((a) => a.category === c)
    const links = inSection
      .map((a) => `- [${a.title}](${SITE_URL}/articles/${a.slug})${a.standfirst ? `: ${a.standfirst}` : ''}`)
      .join('\n')
    return `## ${CATEGORY_META[c].label}\n\n${CATEGORY_META[c].blurb}\n\n${
      links || '- No articles published in this section yet.'
    }`
  }).join('\n\n')

  const body = `# Dubaiography

> An independent editorial journal covering Dubai and the wider Emirates —
> architecture and urbanism, culture and neighbourhood guides, business and
> property, travel and desert experience. Every piece is reported first-hand
> and published in long form.

Dubaiography exists because most writing about Dubai falls into one of two
piles: property brochures, or lists of brunches. This journal explains how the
city actually works. Articles are dated and updated in place when facts change.

Published in Dubai, United Arab Emirates. Language: English (en-AE).

${sections}

## Reference

- [Full archive](${SITE_URL}/archive): every article, newest first.
- [About & editorial policy](${SITE_URL}/about): who publishes this and how corrections are handled.
- [Sitemap](${SITE_URL}/sitemap.xml)
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
