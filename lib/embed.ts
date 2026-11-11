/* Social posts and videos in article HTML. The rule (WordPress's): a
   paragraph that is nothing but a link to a post or video shows the post.
   URL rules match lib/embed.ts on thedarwin.co and Blog Studio's embed.js. */

export type Embed = { kind: 'x' | 'instagram' | 'video'; src: string; label: string }

const yt = (id: string | null) => (id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null)

export function embedFor(href: string): Embed | null {
  let u: URL
  try { u = new URL(href) } catch { return null }
  if (!/^https?:$/.test(u.protocol)) return null
  if (/^((www|mobile)\.)?(x|twitter)\.com$/.test(u.hostname)) {
    const m = /^\/(?:\w+|i(?:\/web)?)\/status(?:es)?\/(\d+)/.exec(u.pathname)
    return m ? { kind: 'x', label: 'Post on X', src: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}&dnt=true` } : null
  }
  if (/^(www\.)?(instagram\.com|instagr\.am)$/.test(u.hostname)) {
    const m = /^\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]+)/.exec(u.pathname)
    if (!m) return null
    const kind = m[1] === 'reels' ? 'reel' : m[1]
    return { kind: 'instagram', label: 'Instagram post', src: `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/?cr=1&v=14` }
  }
  const host = u.hostname.replace(/^www\.|^m\./, '')
  let v: string | null = null
  if (host === 'youtu.be') v = yt(u.pathname.slice(1))
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    v = u.pathname === '/watch' ? yt(u.searchParams.get('v')) : yt(/^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname)?.[1] ?? null)
  } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /\/(\d+)/.exec(u.pathname)
    if (m) v = `https://player.vimeo.com/video/${m[1]}`
  }
  return v ? { kind: 'video', label: 'Video', src: v } : null
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const HEIGHT: Record<string, number> = { x: 560, instagram: 640 }

export function embedHtml(e: Embed): string {
  const h = HEIGHT[e.kind] ? ` height="${HEIGHT[e.kind]}"` : ''
  return (
    `<figure class="embed embed-${e.kind}"><iframe src="${attr(e.src)}" title="${attr(e.label)}"${h}` +
    ` loading="lazy" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></figure>`
  )
}

const unescape = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

/** Swap each paragraph that is only a post/video link (or a bare URL) for the embed. */
export function embedLinkParagraphs(html: string): string {
  return html.replace(
    /<p>\s*(?:<a\b[^>]*\bhref="([^"]+)"[^>]*>[\s\S]*?<\/a>|(https?:\/\/[^\s<]+))\s*<\/p>/gi,
    (whole, href?: string, bare?: string) => {
      const e = embedFor(unescape(href ?? bare ?? ''))
      return e ? embedHtml(e) : whole
    },
  )
}
