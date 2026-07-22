'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { CATEGORIES, CATEGORY_META } from '@/lib/content'
import s from './SiteHeader.module.css'

export default function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // The studio is a tool, not part of the publication — no chrome.
  if (pathname?.startsWith('/studio')) return null

  const close = () => setOpen(false)

  return (
    <header className={s.header}>
      <div className={`shell ${s.bar}`}>
        <Link href="/" className={s.wordmark} onClick={close}>
          Dubaiography
        </Link>

        <nav className={`${s.nav} ${open ? s.open : ''}`} aria-label="Sections">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/${c}`}
              onClick={close}
              className={pathname === `/${c}` ? s.active : undefined}
            >
              {CATEGORY_META[c].label.split(' ')[0]}
            </Link>
          ))}
          <Link href="/archive" onClick={close} className={pathname === '/archive' ? s.active : undefined}>
            Archive
          </Link>
          <Link href="/about" onClick={close} className={pathname === '/about' ? s.active : undefined}>
            About
          </Link>
        </nav>

        <div className={s.actions}>
          <ThemeToggle />
          <button
            className={s.toggle}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
    </header>
  )
}
