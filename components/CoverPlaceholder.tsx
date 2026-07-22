import { CATEGORY_META, type Category } from '@/lib/content'

/* ============================================================
   Stand-in cover art for articles published without a photo.

   Rather than a bare initial on a colour block, it echoes the
   hero's sun-and-ripples motif in the section's own colour, so
   an image-less archive still reads as one designed system.
   The geometry is derived from the slug, so each article gets a
   stable composition that never shifts between renders.
   ============================================================ */

const PALETTE: Record<Category, { bg: string; ink: string }> = {
  culture: { bg: '#125c63', ink: '#f6efe2' },
  architecture: { bg: '#0d1b2a', ink: '#e0a44b' },
  business: { bg: '#3a1b17', ink: '#e8d7b8' },
  travel: { bg: '#c8552b', ink: '#f8e9bf' },
}

/** Small deterministic hash → the composition never changes between builds. */
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export default function CoverPlaceholder({
  slug,
  title,
  category,
}: {
  slug: string
  title: string
  category: Category
}) {
  const { bg, ink } = PALETTE[category] ?? PALETTE.culture
  const h = hash(slug)

  // Sun position drifts within the frame; ring count varies 3–5.
  const cx = 90 + (h % 120)
  const cy = 70 + ((h >> 4) % 70)
  const rings = 3 + ((h >> 8) % 3)

  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      role="img"
      aria-label={`${CATEGORY_META[category]?.label ?? category}: ${title}`}
      style={{ display: 'block', background: bg }}
    >
      <circle cx={cx} cy={cy} r="46" fill={ink} opacity="0.9" />

      <g fill="none" stroke={ink} strokeOpacity="0.28" strokeWidth="1.5">
        {Array.from({ length: rings }, (_, i) => (
          <circle key={i} cx={cx} cy={cy} r={60 + i * 22} />
        ))}
      </g>

      {/* dune bands, offset by the hash so no two covers sit alike */}
      <path
        d={`M0 ${170 + (h % 18)} C 80 ${150 + (h % 26)} 200 ${196 - (h % 22)} 320 ${168 + (h % 14)} L320 240 L0 240 Z`}
        fill={ink}
        opacity="0.16"
      />
      <path
        d={`M0 ${204 + (h % 12)} C 110 ${186 + (h % 18)} 220 ${222 - (h % 16)} 320 ${200 + (h % 10)} L320 240 L0 240 Z`}
        fill={ink}
        opacity="0.26"
      />
    </svg>
  )
}
