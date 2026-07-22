'use client'

import { useState } from 'react'
import s from './ShareBar.module.css'

/* Editorial share row. Social targets are plain links (no tracking script,
   nothing to consent to); the copy-link control is the only stateful bit. */

type Props = { url: string; title: string }

const ICONS = {
  x: 'M18.9 2h3.3l-7.2 8.3L23.7 22h-6.6l-5.2-6.8L5.9 22H2.6l7.7-8.8L2 2h6.8l4.7 6.2zm-1.2 18h1.8L7.4 3.8H5.5z',
  facebook:
    'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z',
  linkedin:
    'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z',
  whatsapp:
    'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.7h-.01a9.6 9.6 0 0 1-4.89-1.34l-.35-.21-3.63.95.97-3.54-.23-.36a9.58 9.58 0 0 1-1.47-5.11c0-5.29 4.31-9.6 9.61-9.6 2.56 0 4.97 1 6.78 2.81a9.55 9.55 0 0 1 2.81 6.8c-.01 5.29-4.31 9.6-9.6 9.6zm8.18-17.79A11.53 11.53 0 0 0 12.04 0C5.65 0 .44 5.2.44 11.6c0 2.04.53 4.03 1.54 5.79L.34 24l6.76-1.77a11.55 11.55 0 0 0 5.53 1.41h.01c6.38 0 11.59-5.2 11.6-11.6a11.53 11.53 0 0 0-3.4-8.22z',
} as const

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export default function ShareBar({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const targets = [
    { label: 'Share on X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: ICONS.x },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: ICONS.facebook },
    { label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: ICONS.linkedin },
    { label: 'Share on WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: ICONS.whatsapp },
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the social links still work */
    }
  }

  return (
    <div className={s.share}>
      <span className={s.label}>Share</span>
      <div className={s.links}>
        {targets.map((tg) => (
          <a
            key={tg.label}
            className={s.btn}
            href={tg.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tg.label}
            title={tg.label}
          >
            <Icon path={tg.icon} />
          </a>
        ))}
        <button
          type="button"
          className={`${s.btn} ${copied ? s.copied : ''}`}
          onClick={copy}
          aria-label={copied ? 'Link copied' : 'Copy link'}
          title={copied ? 'Link copied' : 'Copy link'}
        >
          {copied ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
