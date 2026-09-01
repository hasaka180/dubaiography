'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Article } from '@/lib/content'
import type { MapPoint } from './EventsMap'
import s from './EventsShowcase.module.css'

// Leaflet touches window on import, so keep the map client-only.
const EventsMap = dynamic(() => import('./EventsMap'), {
  ssr: false,
  loading: () => <div className={s.mapPending} />,
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "07 Sep", collapsing a same-day range and sharing the year. */
function dateRange(start?: string, end?: string): string {
  if (!start) return ''
  const s0 = new Date(start)
  const d = (x: Date) => `${String(x.getUTCDate()).padStart(2, '0')} ${MONTHS[x.getUTCMonth()]}`
  const year = s0.getUTCFullYear()
  if (!end || end === start) return `${d(s0)} ${year}`
  const e0 = new Date(end)
  if (s0.getUTCMonth() === e0.getUTCMonth()) {
    return `${String(s0.getUTCDate()).padStart(2, '0')} - ${d(e0)} ${year}`
  }
  return `${d(s0)} - ${d(e0)} ${year}`
}

export default function EventsShowcase({ events }: { events: Article[] }) {
  const [selected, setSelected] = useState<string | null>(events[0]?.slug ?? null)
  const onSelect = useCallback((slug: string) => setSelected(slug), [])

  const points = useMemo<MapPoint[]>(
    () =>
      events
        .filter((e) => e.event?.lat != null && e.event?.lng != null)
        .map((e) => ({ slug: e.slug, title: e.title, lat: e.event!.lat!, lng: e.event!.lng! })),
    [events],
  )

  if (!events.length) {
    return (
      <p className={s.empty}>
        No events listed yet. New listings appear here with their dates and place on the map.
      </p>
    )
  }

  return (
    <div className={s.wrap}>
      <ol className={s.list}>
        {events.map((e) => {
          const ev = e.event
          const active = e.slug === selected
          return (
            <li
              key={e.slug}
              className={`${s.item} ${active ? s.active : ''}`}
              onMouseEnter={() => setSelected(e.slug)}
              onFocus={() => setSelected(e.slug)}
            >
              <button type="button" className={s.itemHead} onClick={() => setSelected(e.slug)}>
                <span className={s.date}>{dateRange(ev?.startDate, ev?.endDate) || 'Dates TBC'}</span>
                <span className={s.name}>{e.title}</span>
                {ev?.venue && <span className={s.venue}>{ev.venue}</span>}
              </button>

              {active && (
                <div className={s.detail}>
                  {e.standfirst && <p className={s.blurb}>{e.standfirst}</p>}
                  <div className={s.actions}>
                    <Link href={`/articles/${e.slug}`} className={s.readMore}>
                      Read more
                    </Link>
                    {ev?.ticketUrl && (
                      <a
                        href={ev.ticketUrl}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className={s.tickets}
                      >
                        Tickets{ev.price ? ` · ${ev.price}` : ''}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className={s.mapCol}>
        <div className={s.mapBox}>
          <EventsMap points={points} selected={selected} onSelect={onSelect} />
        </div>
      </div>
    </div>
  )
}
