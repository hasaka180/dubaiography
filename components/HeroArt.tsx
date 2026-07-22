'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import s from './HeroArt.module.css'

/* ============================================================
   The hero is a looping skyline film. Depth comes from moving
   the whole plane — a slow push-in, scroll drift and a lean
   toward the pointer. The video carries a still poster so the
   frame paints instantly and stays complete if the clip or
   GSAP never load.
   ============================================================ */

const MASTHEAD = 'DUBAIOGRAPHY'

export default function HeroArt() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Hold the poster frame rather than looping motion at people who asked
      // the OS to stop it.
      el.querySelector('video')?.pause()
      return
    }

    const ctx = gsap.context(() => {
      const plate = el.querySelector<HTMLElement>(`.${s.plate}`)
      if (!plate) return

      /* ── entrance: the plate settles, then the masthead lands ── */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from(plate, { scale: 1.08, duration: 2.2 })
        .from(
          `.${s.word} span`,
          { yPercent: 42, duration: 1.15, stagger: 0.035, ease: 'expo.out' },
          '-=1.7',
        )
        .from(
          [`.${s.byline}`, `.${s.standfirst}`, `.${s.scrollCue}`],
          { y: 16, duration: 1, stagger: 0.12 },
          '-=1.3',
        )

      /* ── ambient: a push-in slow enough to read as stillness ── */
      gsap.to(plate, {
        scale: 1.06,
        duration: 24,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to(`.${s.birds}`, {
        x: 90,
        y: -30,
        duration: 16,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      /* ── pointer sway — a lean, not a jitter ── */
      const swayX = gsap.quickTo(plate, 'x', { duration: 1.2, ease: 'power3' })
      const swayY = gsap.quickTo(plate, 'y', { duration: 1.2, ease: 'power3' })

      const onPointer = (e: PointerEvent) => {
        swayX((e.clientX / window.innerWidth - 0.5) * -34)
        swayY((e.clientY / window.innerHeight - 0.5) * -18)
      }
      window.addEventListener('pointermove', onPointer, { passive: true })

      /* ── scroll drift — the plate lags the page ── */
      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          const y = window.scrollY
          if (y > window.innerHeight * 1.2) return
          gsap.set(plate, { yPercent: (y / window.innerHeight) * 12 })
        })
      }
      window.addEventListener('scroll', onScroll, { passive: true })

      return () => {
        window.removeEventListener('pointermove', onPointer)
        window.removeEventListener('scroll', onScroll)
        if (raf) cancelAnimationFrame(raf)
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <header className={s.hero} ref={root}>
      <div className={s.plate}>
        <video
          className={s.video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero/skyline.jpg"
          aria-hidden="true"
        >
          <source src="/hero/dubai-skyline-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* coded overlays — a few nodes, so they animate for free */}
      <div className={s.bloom} aria-hidden="true" />
      <div className={s.sweep} aria-hidden="true" />
      <div className={s.shimmer} aria-hidden="true" />
      <svg
        className={s.birds}
        viewBox="0 0 120 40"
        fill="none"
        stroke="#0d1b2a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
        aria-hidden="true"
      >
        <path d="M6 20 q 8 -7 16 0" />
        <path d="M40 9 q 7 -6 14 0" />
        <path d="M28 32 q 6 -5 12 0" />
      </svg>

      <div className={s.scrim} aria-hidden="true" />

      <div className={s.inner}>
        <div className={s.credits}>
          <div className={s.byline}>
            An editorial journal of the Emirates
            <br />
            <em>Founded in Dubai</em>
          </div>

          <p className={s.standfirst}>
            Long-form <mark>reporting on the city that keeps rewriting itself</mark> — its
            architecture, its neighbourhoods, its business of building, and the desert it was
            <mark> drawn on</mark>
          </p>
        </div>

        <div className={s.masthead}>
          <h1 className={s.word}>
            <span style={{ position: 'absolute', left: -9999 }}>Dubaiography</span>
            {[...MASTHEAD].map((c, i) => (
              <span key={i} aria-hidden="true">
                {c}
              </span>
            ))}
          </h1>
        </div>

        <div className={s.scrollCue}>
          <i />
          Scroll to read
        </div>
      </div>
    </header>
  )
}
