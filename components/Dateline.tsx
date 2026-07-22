'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import s from './Dateline.module.css'

/* Dubai is UTC+4 year-round — no daylight saving — but the time is still
   derived from the reader's clock through the IANA zone rather than a fixed
   offset, so it stays correct wherever the page is opened from. */
const TZ = 'Asia/Dubai'

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

export default function Dateline() {
  const pathname = usePathname()

  // Null until mounted: the server has no business guessing the reader's
  // clock, and rendering one would mismatch on hydration.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // The studio is a tool, not part of the publication — no chrome.
  if (pathname?.startsWith('/studio')) return null

  return (
    <div className={s.dateline}>
      <div className={`shell ${s.inner}`}>
        <span className={s.place}>
          <i className={s.pin} aria-hidden="true" />
          Dubai, United Arab Emirates
        </span>

        <span className={s.coords} aria-hidden="true">
          25.2048° N · 55.2708° E
        </span>

        {/* min-width on the clock keeps the row from twitching as digits change */}
        <span className={s.clock}>
          {now ? (
            <>
              <span className={s.date}>{dateFmt.format(now)}</span>
              <time className={s.time} dateTime={now.toISOString()}>
                {timeFmt.format(now)}
              </time>
              <span className={s.zone}>GST</span>
            </>
          ) : (
            <span className={s.date}>Gulf Standard Time</span>
          )}
        </span>
      </div>
    </div>
  )
}
