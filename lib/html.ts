import 'server-only'
import sanitizeHtml from 'sanitize-html'
import { slugify } from './content'

/* Rendering pasted HTML is the security boundary: strip anything that could
   execute, keep the editorial tags the article styles already cover. */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup', 'small',
    'a', 'ul', 'ol', 'li',
    'blockquote', 'cite',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'figure', 'figcaption', 'img',
    'code', 'pre', 'span',
    // Embedded posts and videos from Blog Studio, limited to the hosts below.
    'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    iframe: ['src', 'title', 'height', 'loading', 'allow', 'allowfullscreen'],
    figure: ['class'],
    '*': ['id'],
  },
  allowedClasses: { figure: ['embed', 'embed-x', 'embed-instagram', 'embed-video'] },
  // Only the embed pages of these services may be framed: an X post, an
  // Instagram post, a YouTube (privacy mode) or Vimeo player.
  allowedIframeHostnames: ['platform.twitter.com', 'www.instagram.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
  allowIframeRelativeUrls: false,
  allowedSchemesByTag: { iframe: ['https'] },
  // A frame whose source was refused above is dropped, not left as a blank box.
  exclusiveFilter: (frame) => frame.tag === 'iframe' && !frame.attribs.src,
  allowedSchemes: ['http', 'https', 'mailto'],
  // Drop pasted colours/fonts/sizes so content inherits the site's styles.
  allowedStyles: {},
  transformTags: {
    // Demote any pasted h1 so it never competes with the article headline.
    h1: 'h2',
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
}

const stripTags = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

export type HtmlHeading = { id: string; label: string; level: number }

/** Sanitize a pasted-HTML block and give its h2/h3 headings stable ids so the
    table of contents can link to them. Returns the cleaned html and its
    headings, both derived from the same slug. */
export function renderHtmlBlock(raw: string): { html: string; headings: HtmlHeading[] } {
  const clean = sanitizeHtml(raw, OPTIONS)
  const headings: HtmlHeading[] = []
  const html = clean.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag, attrs, inner) => {
    const label = stripTags(inner)
    if (!label) return `<${tag}${attrs}>${inner}</${tag}>`
    const id = slugify(label)
    headings.push({ id, label, level: tag === 'h2' ? 2 : 3 })
    // Don't duplicate an id the paste already carried.
    const withId = /\bid=/.test(attrs) ? attrs : `${attrs} id="${id}"`
    return `<${tag}${withId}>${inner}</${tag}>`
  })
  return { html, headings }
}
