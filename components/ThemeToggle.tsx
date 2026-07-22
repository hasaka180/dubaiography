'use client'

import { useEffect, useState } from 'react'
import s from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

/**
 * Light/dark switch.
 *
 * The initial theme is resolved by the inline script in app/layout.tsx —
 * before first paint, so there's no flash of the wrong palette. This
 * component only reads what that script decided and lets you change it.
 * An explicit choice is remembered; until you make one, the OS preference
 * wins and keeps winning if it changes.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) || 'light')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* private browsing — the choice just won't survive the session */
    }
    setTheme(next)
  }

  // Render the shell on the server so the header doesn't reflow on hydration;
  // the icon only appears once we know which theme is actually active.
  return (
    <button
      className={s.toggle}
      onClick={toggle}
      aria-label={theme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Switch theme'}
      title={theme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Switch theme'}
      type="button"
    >
      <span className={s.icon} data-theme={theme ?? 'light'} aria-hidden="true">
        {/* sun */}
        <svg viewBox="0 0 24 24" className={s.sun} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="4.4" />
          <g strokeLinecap="round">
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2" />
            <path d="M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
          </g>
        </svg>
        {/* moon */}
        <svg viewBox="0 0 24 24" className={s.moon} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path
            d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}
