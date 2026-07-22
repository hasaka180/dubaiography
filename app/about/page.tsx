import s from '../pages.module.css'

export const metadata = {
  title: 'About the journal',
  description:
    'Dubaiography is an independent editorial journal covering the architecture, culture, business and landscape of Dubai — reported first-hand, published in long form.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="shell">
      <div className={s.pageHead}>
        <div>
          <span className="eyebrow">Colophon</span>
          <h1 className={s.pageTitle}>About</h1>
        </div>
        <p className={s.pageBlurb}>
          A journal for readers who want the city explained, not advertised.
        </p>
      </div>

      <div className={s.prose}>
        <p>
          Dubaiography is an independent editorial journal about Dubai. It exists because most
          writing about this city falls into one of two piles: property brochures, or lists of
          brunches. Neither tells you how the place actually works.
        </p>

        <h2>What we cover</h2>
        <p>
          Four sections, deliberately broad. <strong>Architecture &amp; Urbanism</strong> looks at how
          the city was drawn — the towers, the wind towers, the masterplans and the space between
          them. <strong>Culture &amp; Guides</strong> covers neighbourhoods, galleries, kitchens and
          the people shaping daily life. <strong>Business &amp; Property</strong> handles free zones,
          freehold and the mechanics of building something here.{' '}
          <strong>Travel &amp; Experience</strong> is the desert, the coast, and everything worth the
          detour.
        </p>

        <h2>How we work</h2>
        <p>
          Every piece is reported first-hand and published in long form. Articles are dated and
          updated in place when facts change — regulations here move quickly, and a guide that is
          silently stale is worse than no guide at all.
        </p>

        <h2>Corrections</h2>
        <p>
          If something here is wrong, we want to know. Corrections are made to the article itself and
          noted with an updated date rather than quietly patched.
        </p>
      </div>
    </div>
  )
}
