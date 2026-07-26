'use client'

import { useEffect, useRef } from 'react'

/* Uncontrolled rich-text field. Pasting keeps the source formatting (the
   browser inserts HTML into a contentEditable), and we read innerHTML back on
   every edit. It's uncontrolled on purpose — re-writing innerHTML from state
   each render would fight the caret. Remount with `key` to load a new value. */
export default function HtmlEditor({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (html: string) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Seed the initial HTML once.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      spellCheck
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
    />
  )
}
