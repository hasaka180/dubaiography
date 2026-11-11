'use client'

import { useEffect } from 'react'

function parse(data: unknown): Record<string, unknown> | undefined {
  if (typeof data === 'string') { try { return JSON.parse(data) } catch { return undefined } }
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined
}

/* Embedded X and Instagram posts (iframes in an article's HTML) report their
   height to the parent window in the formats X's widgets.js and Instagram's
   embed.js listen for. Grow each frame to fit, without loading either script.
   Same logic as PostEmbed.tsx on thedarwin.co. */
function heightFrom(origin: string, data: unknown): number {
  if (/^https:\/\/([\w-]+\.)*instagram\.com$/.test(origin)) {
    const m = parse(data) as { type?: string; details?: { height?: unknown } } | undefined
    return m?.type === 'MEASURE' ? Number(m.details?.height) || 0 : 0
  }
  if (origin === 'https://platform.twitter.com') {
    const m = parse(parse(data)?.['twttr.embed']) as { method?: string; params?: { height?: unknown }[] } | undefined
    return m?.method === 'twttr.private.resize' ? Number(m.params?.[0]?.height) || 0 : 0
  }
  return 0
}

export default function EmbedResize() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const h = heightFrom(e.origin, e.data)
      if (!h) return
      const frame = Array.from(document.querySelectorAll<HTMLIFrameElement>('figure.embed iframe')).find(
        (f) => f.contentWindow === e.source,
      )
      if (frame) frame.height = String(Math.ceil(h))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  return null
}
