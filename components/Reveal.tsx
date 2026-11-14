'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fades in anything marked `data-reveal` as it enters the viewport.
 * Server components stay server components - they just add the
 * attribute, and this one observer handles the whole page.
 */
export default function Reveal() {
  const pathname = usePathname()

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'))
    if (!nodes.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          // Stagger siblings so a grid ripples in rather than popping.
          el.style.transitionDelay = `${Math.min(Number(el.dataset.revealDelay ?? 0), 400)}ms`
          el.classList.add('is-in')
          io.unobserve(el)
        })
      },
      // threshold 0: reveal as soon as any of it is on screen. A share of the
      // element (0.05 before) never arrives for a block taller than ~20
      // viewports, such as a long article body, which then stayed invisible.
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    )

    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [pathname])

  return null
}
