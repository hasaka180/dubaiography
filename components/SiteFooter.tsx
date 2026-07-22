'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CATEGORIES, CATEGORY_META } from '@/lib/content'
import s from './SiteFooter.module.css'

export default function SiteFooter() {
  const pathname = usePathname()

  // The studio is a tool, not part of the publication — no chrome.
  if (pathname?.startsWith('/studio')) return null

  return (
    <footer className={s.footer}>
      <div className="shell">
        <div className={s.top}>
          <div className={s.brand}>
            <p className={s.mark}>Dubaiography</p>
            <p className={s.blurb}>
              An independent editorial journal covering the architecture, culture, business and
              landscape of Dubai and the wider Emirates.
            </p>
          </div>

          <div className={s.col}>
            <h3>Sections</h3>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={`/${c}`} className="link-underline">
                    {CATEGORY_META[c].label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={s.col}>
            <h3>The journal</h3>
            <ul>
              <li>
                <Link href="/archive" className="link-underline">
                  Full archive
                </Link>
              </li>
              <li>
                <Link href="/about" className="link-underline">
                  About &amp; editorial policy
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="link-underline">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={s.bottom}>
          <span>© {new Date().getFullYear()} Dubaiography</span>
          <span>Dubai, United Arab Emirates</span>
        </div>
      </div>
    </footer>
  )
}
