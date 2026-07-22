'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import s from './HeroScene.module.css'

/* ============================================================
   A hand-authored, layered SVG of the city at dusk.

   Every group carries a `data-depth` — the fraction of the
   scroll/pointer delta it moves by. Low numbers sit far away
   (the sky barely drifts), high numbers are underfoot (the
   near dune slides fast). That single number drives both the
   scroll parallax and the pointer sway.
   ============================================================ */

const MASTHEAD_LEFT = 'DUBAI'
const MASTHEAD_RIGHT = 'OGRAPHY'

export default function HeroScene() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<SVGGElement>('[data-depth]')
      const depth = (l: SVGGElement) => parseFloat(l.dataset.depth || '0')

      /* ── entrance: the scene settles, then the masthead lands ──
         Deliberately transform-only. Fading the artwork up from opacity 0
         would leave an empty navy box if GSAP were slow to boot or failed
         outright; this way the illustration is painted the moment the SVG
         lands and JS only adds the settle. */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from(layers, {
        yPercent: (i, t: SVGGElement) => 4 + depth(t) * 18,
        duration: 1.4,
        stagger: 0.07,
      })
        .from(
          `.${s.word} span`,
          { yPercent: 42, duration: 1.15, stagger: 0.035, ease: 'expo.out' },
          '-=1.0',
        )
        .from(
          [`.${s.byline}`, `.${s.standfirst}`, `.${s.scrollCue}`],
          { y: 16, duration: 1, stagger: 0.12 },
          '-=0.85',
        )

      /* ── ambient: the sun breathes, its ripples pulse outward ── */
      gsap.to('#sun', {
        scale: 1.045,
        transformOrigin: 'center',
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      gsap.to('#ripples > *', {
        scale: 1.07,
        opacity: 0.05,
        transformOrigin: 'center',
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.35,
      })
      gsap.to('#birds', {
        x: 60,
        y: -22,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      /* ── pointer sway — a slow lean, not a jitter ── */
      const swayX = layers.map((l) => gsap.quickTo(l, 'x', { duration: 1.1, ease: 'power3' }))
      const swayY = layers.map((l) => gsap.quickTo(l, 'y', { duration: 1.1, ease: 'power3' }))

      const onPointer = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2
        const ny = (e.clientY / window.innerHeight - 0.5) * 2
        layers.forEach((l, i) => {
          const d = depth(l)
          swayX[i](nx * d * -46)
          swayY[i](ny * d * -22)
        })
      }
      window.addEventListener('pointermove', onPointer, { passive: true })

      /* ── scroll parallax — far layers hang back, near ones race ── */
      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          const y = window.scrollY
          if (y > window.innerHeight * 1.2) return // hero is off-screen; stop working
          layers.forEach((l) => {
            gsap.set(l, { yPercent: -(y / window.innerHeight) * depth(l) * 26 })
          })
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
      <div className={s.canvas} aria-hidden="true">
        <svg
          className={s.art}
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMax slice"
          role="presentation"
          focusable="false"
        >
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#08131f" />
              <stop offset="34%" stopColor="#17384f" />
              <stop offset="62%" stopColor="#6b4553" />
              <stop offset="82%" stopColor="#c2703f" />
              <stop offset="100%" stopColor="#e9a95c" />
            </linearGradient>

            <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffdca1" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#f0b568" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e08a4a" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9a95c" stopOpacity="0" />
              <stop offset="100%" stopColor="#e9a95c" stopOpacity="0.5" />
            </linearGradient>

            {/* Paper grain — the print-litho texture that ties the
                illustration to the editorial pages below. */}
            <filter id="grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>

            {/* One palm, drawn once and placed twice. */}
            <g id="palm">
              <path
                d="M0 132 C -6 88 -10 54 -18 20"
                fill="none"
                stroke="#2e1512"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <g fill="none" stroke="#2e1512" strokeWidth="6.5" strokeLinecap="round">
                <path d="M-18 20 C -52 -8 -84 -8 -106 14" />
                <path d="M-18 20 C -46 -22 -70 -40 -100 -42" />
                <path d="M-18 20 C 14 -12 46 -16 70 2" />
                <path d="M-18 20 C 12 -24 38 -42 68 -46" />
                <path d="M-18 20 C -20 -18 -12 -44 2 -66" />
              </g>
            </g>
          </defs>

          {/* ── sky, sun, ripples ── */}
          <g data-depth="0.03" className={s.layer}>
            <rect width="1600" height="900" fill="url(#sky)" />
            <circle cx="800" cy="440" r="330" fill="url(#sunGlow)" />
            <g id="ripples" fill="none" stroke="#ffd79a" strokeOpacity="0.14" strokeWidth="2">
              <circle cx="800" cy="440" r="245" />
              <circle cx="800" cy="440" r="300" />
              <circle cx="800" cy="440" r="358" />
              <circle cx="800" cy="440" r="418" />
            </g>
            <circle id="sun" cx="800" cy="440" r="186" fill="#f7d290" />
            <g id="birds" fill="none" stroke="#12293a" strokeOpacity="0.55" strokeWidth="3.5" strokeLinecap="round">
              <path d="M596 262 q 11 -9 22 0" />
              <path d="M642 236 q 9 -8 18 0" />
              <path d="M620 306 q 8 -7 16 0" />
            </g>
          </g>

          {/* ── far skyline: the city as a rumour ── */}
          <g data-depth="0.08" className={s.layer} fill="#2b5065" fillOpacity="0.5">
            <rect x="34" y="505" width="54" height="155" />
            <rect x="98" y="548" width="38" height="112" />
            <rect x="146" y="468" width="62" height="192" />
            <rect x="218" y="527" width="44" height="133" />
            <rect x="272" y="494" width="70" height="166" />
            <rect x="352" y="556" width="40" height="104" />
            <rect x="402" y="512" width="56" height="148" />
            <rect x="468" y="540" width="48" height="120" />
            <rect x="1178" y="500" width="52" height="160" />
            <rect x="1240" y="546" width="38" height="114" />
            <rect x="1288" y="476" width="64" height="184" />
            <rect x="1362" y="530" width="44" height="130" />
            <rect x="1416" y="504" width="58" height="156" />
            <rect x="1484" y="548" width="40" height="112" />
            <rect x="1534" y="518" width="54" height="142" />
          </g>

          {/* ── mid city: towers, domes, wind-towers ── */}
          <g data-depth="0.14" className={s.layer} fill="#16323f">
            {/* twin tapered towers */}
            <path d="M296 662 L314 384 L336 362 L358 384 L376 662 Z" />
            <path d="M398 662 L412 436 L430 418 L448 436 L462 662 Z" />
            {/* blocks */}
            <rect x="120" y="512" width="72" height="150" />
            <rect x="198" y="556" width="46" height="106" />
            <rect x="1132" y="524" width="66" height="138" />
            <rect x="1208" y="566" width="42" height="96" />
            <rect x="1454" y="536" width="70" height="126" />
            {/* old-town domes + wind tower */}
            <path d="M40 662 L40 596 L136 596 L136 662 Z" />
            <path d="M52 596 a 22 24 0 0 1 44 0 Z" />
            <path d="M100 596 a 16 18 0 0 1 32 0 Z" />
            <rect x="150" y="586" width="26" height="76" />
            <path d="M146 586 L180 586 L172 566 L154 566 Z" />
          </g>

          {/* ── landmarks: the silhouettes that read as Dubai ── */}
          <g data-depth="0.2" className={s.layer} fill="#0e2531">
            {/* Burj Khalifa */}
            <path d="M726 662 L740 452 L764 452 L764 662 Z" />
            <path d="M812 662 L812 452 L836 452 L850 662 Z" />
            <path d="M762 662 L770 420 L776 320 L781 238 L785 158 L788 52 L791 158 L795 238 L800 320 L806 420 L814 662 Z" />
            {/* Burj Al Arab — mast and sail */}
            <path d="M1004 662 L1004 262 C 1040 302 1070 262 1096 204 L1096 662 Z" />
            {/* Museum of the Future — a leaning torus on its mound.
                The lean and the mound matter: upright and unsupported it
                just reads as a letter O sitting in the skyline. */}
            <g transform="rotate(-22 548 570)">
              <ellipse cx="548" cy="570" rx="60" ry="82" fill="none" stroke="#0e2531" strokeWidth="26" />
            </g>
            <path d="M488 662 C 500 634 596 634 608 662 Z" />
            {/* Dubai Frame */}
            <rect x="1250" y="356" width="24" height="306" />
            <rect x="1372" y="356" width="24" height="306" />
            <rect x="1250" y="356" width="146" height="24" />
          </g>

          {/* horizon haze — pushes the city back behind the sand */}
          <g data-depth="0.24" className={s.layer}>
            <rect x="0" y="470" width="1600" height="200" fill="url(#haze)" />
          </g>

          {/* ── dunes ── */}
          <g data-depth="0.3" className={s.layer}>
            <path
              d="M0 656 C 220 606 380 698 620 664 C 880 628 1080 704 1330 658 C 1450 636 1540 662 1600 650 L1600 900 L0 900 Z"
              fill="#b8532c"
            />
          </g>

          <g data-depth="0.42" className={s.layer}>
            <path
              d="M0 726 C 260 684 420 762 700 728 C 960 698 1180 770 1400 726 C 1490 708 1560 724 1600 718 L1600 900 L0 900 Z"
              fill="#8a3a22"
            />
            <use href="#palm" x="196" y="646" />
            <use href="#palm" x="1452" y="622" transform="translate(2904 0) scale(-1 1)" />
          </g>

          {/* near dune — the ground you're standing on */}
          <g data-depth="0.58" className={s.layer}>
            <path
              d="M0 808 C 300 764 520 840 820 812 C 1100 786 1320 848 1600 806 L1600 900 L0 900 Z"
              fill="#3a1b17"
            />
          </g>

          <rect
            width="1600"
            height="900"
            filter="url(#grain)"
            opacity="0.13"
            style={{ mixBlendMode: 'overlay' }}
          />
        </svg>
      </div>

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
            <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>
              Dubaiography
            </span>
            {[...MASTHEAD_LEFT].map((c, i) => (
              <span key={i} aria-hidden="true">
                {c}
              </span>
            ))}
          </h1>
          <div className={s.word} aria-hidden="true">
            {[...MASTHEAD_RIGHT].map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>

        <div className={s.scrollCue}>
          <i />
          Scroll to read
        </div>
      </div>
    </header>
  )
}
