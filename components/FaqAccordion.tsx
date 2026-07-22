import s from './FaqAccordion.module.css'

/** Native <details> — keyboard-accessible, and the answers stay in the
    DOM for crawlers even while collapsed. */
export default function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (!faqs.length) return null

  return (
    <section className={s.faq} aria-labelledby="faq-head">
      <span className="eyebrow">Frequently asked</span>
      <h2 className={s.title} id="faq-head">
        Questions
      </h2>

      <div className={s.list}>
        {faqs.map((f, i) => (
          <details key={i} className={s.item}>
            <summary>
              <span>{f.q}</span>
              <i aria-hidden="true" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
