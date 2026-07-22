import Link from 'next/link'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="shell" style={{ padding: 'clamp(5rem, 16vw, 12rem) 0' }}>
      <span className="eyebrow">Error 404</span>
      <h1 className="display" style={{ margin: '1rem 0 1.5rem' }}>
        Nothing
        <br />
        here
      </h1>
      <p className="measure" style={{ color: 'var(--ink-soft)', fontSize: '1.125rem' }}>
        This page has either moved or never existed. The archive is the best place to pick the thread
        back up.
      </p>
      <p style={{ marginTop: '2rem' }}>
        <Link href="/archive" className="eyebrow link-underline">
          Browse the archive →
        </Link>
      </p>
    </div>
  )
}
