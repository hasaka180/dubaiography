'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  CATEGORY_META,
  estimateReadingTime,
  slugify,
  type Article,
  type Block,
  type Category,
} from '@/lib/content'
import s from './ArticleBuilder.module.css'

/* ── helpers ── */

const uid = () => Math.random().toString(36).slice(2, 10)

/** Live feedback for the JSON-LD box — invalid JSON is dropped at render time,
    so say so here rather than letting it fail silently. */
const jsonLdStatus = (raw?: string) => {
  const v = raw?.trim()
  if (!v) return ''
  try {
    JSON.parse(v)
    return '✓ Valid JSON.'
  } catch {
    return '✗ Not valid JSON — it will be skipped until fixed.'
  }
}

const blankArticle = (): Article => ({
  slug: '',
  title: '',
  standfirst: '',
  category: 'culture',
  author: '',
  date: new Date().toISOString().slice(0, 10),
  cover: '',
  coverAlt: '',
  featured: false,
  size: 'md',
  tags: [],
  blocks: [{ id: uid(), type: 'text', body: '' }],
  faqs: [],
  published: true,
})

const newBlock = (type: Block['type']): Block => {
  switch (type) {
    case 'heading':
      return { id: uid(), type: 'heading', eyebrow: '', heading: '' }
    case 'image':
      return { id: uid(), type: 'image', src: '', caption: '', full: false }
    case 'quote':
      return { id: uid(), type: 'quote', body: '', attribution: '' }
    case 'gallery':
      return { id: uid(), type: 'gallery', columns: 2, items: [] }
    default:
      return { id: uid(), type: 'text', body: '' }
  }
}

/** Small files go through the API; anything larger is presigned and sent
    straight to R2, since serverless request bodies cap out around 4.5 MB. */
async function uploadFile(file: File, folder: string): Promise<string> {
  const DIRECT_LIMIT = 4 * 1024 * 1024

  if (file.size > DIRECT_LIMIT) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, folder, contentType: file.type }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Presign failed')

    const put = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!put.ok) throw new Error(`Direct upload failed (${put.status}) — check the bucket's CORS rules`)
    return data.url as string
  }

  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url as string
}

/* ── a file picker that returns the uploaded URL ── */
function UploadButton({
  folder,
  onDone,
  onError,
  label = 'Upload',
}: {
  folder: string
  onDone: (url: string) => void
  onError: (msg: string) => void
  label?: string
}) {
  const [busy, setBusy] = useState(false)

  return (
    <label className={`${s.btn} ${s.tiny}`} style={{ display: 'inline-block' }}>
      {busy ? 'Uploading…' : label}
      <input
        type="file"
        accept="image/*"
        hidden
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // let the same file be picked again after an error
          if (!file) return
          setBusy(true)
          try {
            onDone(await uploadFile(file, folder))
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Upload failed')
          } finally {
            setBusy(false)
          }
        }}
      />
    </label>
  )
}

/* ── the builder ── */

export default function ArticleBuilder() {
  const [list, setList] = useState<Article[]>([])
  const [draft, setDraft] = useState<Article>(blankArticle)
  const [status, setStatus] = useState<{ msg: string; kind?: 'ok' | 'err' }>({ msg: '' })
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)

  const say = (msg: string, kind?: 'ok' | 'err') => setStatus({ msg, kind })

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/articles?drafts=1', { cache: 'no-store' })
      const data = await res.json()
      setList(data.items ?? [])
    } catch {
      say('Could not load the article list.', 'err')
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const set = <K extends keyof Article>(key: K, value: Article[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // Slug follows the title until you edit it by hand.
  const setTitle = (title: string) =>
    setDraft((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }))

  const patchBlock = (id: string, patch: Partial<Block>) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    }))

  const moveBlock = (id: string, dir: -1 | 1) =>
    setDraft((d) => {
      const i = d.blocks.findIndex((b) => b.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= d.blocks.length) return d
      const blocks = [...d.blocks]
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      return { ...d, blocks }
    })

  const removeBlock = (id: string) =>
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }))

  const readingTime = useMemo(() => estimateReadingTime(draft.blocks), [draft.blocks])

  const edit = (a: Article) => {
    setDraft({ ...blankArticle(), ...a, blocks: a.blocks?.length ? a.blocks : [newBlock('text')] })
    setSlugTouched(true)
    say('')
    window.scrollTo({ top: 0 })
  }

  const startNew = () => {
    setDraft(blankArticle())
    setSlugTouched(false)
    say('')
  }

  const save = async () => {
    if (!draft.title.trim()) return say('A title is required.', 'err')
    if (!draft.slug.trim()) return say('A slug is required.', 'err')

    setSaving(true)
    say('Saving…')
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, readingTime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      say(`Saved — live at /articles/${draft.slug}`, 'ok')
      setSlugTouched(true)
      loadList()
    } catch (e) {
      say(e instanceof Error ? e.message : 'Save failed', 'err')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!draft.slug || !confirm(`Delete “${draft.title}”? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/articles/${draft.slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed')
      say('Deleted.', 'ok')
      startNew()
      loadList()
    } catch (e) {
      say(e instanceof Error ? e.message : 'Delete failed', 'err')
    }
  }

  return (
    <div className={s.studio}>
      {/* ── sidebar ── */}
      <aside className={s.side}>
        <div className={s.brand}>Dubaiography</div>
        <button className={`${s.btn} ${s.primary}`} onClick={startNew}>
          + New article
        </button>

        <div className={s.list}>
          {list.map((a) => (
            <button
              key={a.slug}
              className={`${s.listItem} ${a.slug === draft.slug ? s.on : ''}`}
              onClick={() => edit(a)}
            >
              {a.title || '(untitled)'}
              <small>
                {CATEGORY_META[a.category]?.label ?? a.category}
                {a.published === false && <span className={s.draft}> · draft</span>}
              </small>
            </button>
          ))}
          {!list.length && <p className={s.hint}>No articles yet.</p>}
        </div>
      </aside>

      {/* ── editor ── */}
      <div className={s.main}>
        <div className={s.bar}>
          <span className={`${s.status} ${status.kind === 'err' ? s.err : ''} ${status.kind === 'ok' ? s.ok : ''}`}>
            {status.msg}
          </span>
          {draft.slug && (
            <a className={s.btn} href={`/articles/${draft.slug}`} target="_blank" rel="noreferrer">
              Preview ↗
            </a>
          )}
          <button className={`${s.btn} ${s.danger}`} onClick={remove} disabled={!draft.slug}>
            Delete
          </button>
          <button className={`${s.btn} ${s.primary}`} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* ── the essentials ── */}
        <h2 className={s.groupTitle}>Article</h2>

        <label className={s.field}>
          <span>Title</span>
          <input type="text" value={draft.title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className={s.grid2}>
          <label className={s.field}>
            <span>Slug</span>
            <input
              type="text"
              value={draft.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
            />
            <span className={s.hint}>/articles/{draft.slug || '…'}</span>
          </label>

          <label className={s.field}>
            <span>Section</span>
            <select value={draft.category} onChange={(e) => set('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={s.field}>
          <span>Standfirst</span>
          <textarea
            value={draft.standfirst ?? ''}
            onChange={(e) => set('standfirst', e.target.value)}
            style={{ minHeight: 80 }}
          />
          <span className={s.hint}>
            The deck under the headline. Doubles as the meta description if you leave the SEO field
            blank — aim for 140–160 characters.
          </span>
        </label>

        <div className={s.grid2}>
          <label className={s.field}>
            <span>Author</span>
            <input type="text" value={draft.author ?? ''} onChange={(e) => set('author', e.target.value)} />
          </label>
          <label className={s.field}>
            <span>Date</span>
            <input type="date" value={draft.date ?? ''} onChange={(e) => set('date', e.target.value)} />
          </label>
        </div>

        <div className={s.grid2}>
          <label className={s.field}>
            <span>Card size</span>
            <select value={draft.size ?? 'md'} onChange={(e) => set('size', e.target.value as Article['size'])}>
              <option value="lg">Large (half width)</option>
              <option value="md">Medium (third)</option>
              <option value="sm">Small (quarter)</option>
            </select>
          </label>
          <label className={s.field}>
            <span>Tags</span>
            <input
              type="text"
              value={(draft.tags ?? []).join(', ')}
              onChange={(e) =>
                set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
              }
            />
            <span className={s.hint}>Comma separated.</span>
          </label>
        </div>

        <div className={s.checks}>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={!!draft.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            Feature as the homepage lead
          </label>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={draft.published !== false}
              onChange={(e) => set('published', e.target.checked)}
            />
            Published
          </label>
          <span className={s.hint}>~{readingTime} min read</span>
        </div>

        {/* ── cover ── */}
        <h2 className={s.groupTitle}>Cover</h2>
        <div className={s.media}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {draft.cover ? (
            <img className={s.preview} src={draft.cover} alt="" />
          ) : (
            <div className={s.preview} />
          )}
          <div className={s.mediaCol}>
            <label className={s.field}>
              <span>Image URL</span>
              <input type="text" value={draft.cover ?? ''} onChange={(e) => set('cover', e.target.value)} />
            </label>
            <label className={s.field}>
              <span>Alt text</span>
              <input
                type="text"
                value={draft.coverAlt ?? ''}
                onChange={(e) => set('coverAlt', e.target.value)}
              />
              <span className={s.hint}>Describe the image for screen readers and image search.</span>
            </label>
            <UploadButton
              folder="covers"
              label="Upload cover"
              onDone={(url) => set('cover', url)}
              onError={(m) => say(m, 'err')}
            />
          </div>
        </div>

        {/* ── body ── */}
        <h2 className={s.groupTitle}>Body</h2>

        {draft.blocks.map((b, i) => (
          <div className={s.block} key={b.id}>
            <div className={s.blockHead}>
              <span className={s.blockType}>{b.type}</span>
              <button className={`${s.btn} ${s.tiny}`} onClick={() => moveBlock(b.id, -1)} disabled={i === 0}>
                ↑
              </button>
              <button
                className={`${s.btn} ${s.tiny}`}
                onClick={() => moveBlock(b.id, 1)}
                disabled={i === draft.blocks.length - 1}
              >
                ↓
              </button>
              <button className={`${s.btn} ${s.tiny} ${s.danger}`} onClick={() => removeBlock(b.id)}>
                ✕
              </button>
            </div>

            {b.type === 'text' && (
              <label className={s.field}>
                <span>Markdown</span>
                <textarea value={b.body ?? ''} onChange={(e) => patchBlock(b.id, { body: e.target.value })} />
                <span className={s.hint}>
                  Supports **bold**, _italic_, [links](url), lists, tables and ## subheads.
                </span>
              </label>
            )}

            {b.type === 'heading' && (
              <div className={s.grid2}>
                <label className={s.field}>
                  <span>Eyebrow</span>
                  <input
                    type="text"
                    value={b.eyebrow ?? ''}
                    onChange={(e) => patchBlock(b.id, { eyebrow: e.target.value })}
                  />
                </label>
                <label className={s.field}>
                  <span>Heading</span>
                  <input
                    type="text"
                    value={b.heading ?? ''}
                    onChange={(e) => patchBlock(b.id, { heading: e.target.value })}
                  />
                </label>
              </div>
            )}

            {b.type === 'image' && (
              <div className={s.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.src ? <img className={s.preview} src={b.src} alt="" /> : <div className={s.preview} />}
                <div className={s.mediaCol}>
                  <label className={s.field}>
                    <span>Image URL</span>
                    <input
                      type="text"
                      value={b.src}
                      onChange={(e) => patchBlock(b.id, { src: e.target.value })}
                    />
                  </label>
                  <label className={s.field}>
                    <span>Caption</span>
                    <input
                      type="text"
                      value={b.caption ?? ''}
                      onChange={(e) => patchBlock(b.id, { caption: e.target.value })}
                    />
                  </label>
                  <div className={s.checks}>
                    <label className={s.check}>
                      <input
                        type="checkbox"
                        checked={!!b.full}
                        onChange={(e) => patchBlock(b.id, { full: e.target.checked })}
                      />
                      Full-bleed
                    </label>
                    <UploadButton
                      folder="articles"
                      onDone={(url) => patchBlock(b.id, { src: url })}
                      onError={(m) => say(m, 'err')}
                    />
                  </div>
                </div>
              </div>
            )}

            {b.type === 'quote' && (
              <>
                <label className={s.field}>
                  <span>Quote</span>
                  <textarea
                    value={b.body ?? ''}
                    onChange={(e) => patchBlock(b.id, { body: e.target.value })}
                    style={{ minHeight: 80 }}
                  />
                </label>
                <label className={s.field}>
                  <span>Attribution</span>
                  <input
                    type="text"
                    value={b.attribution ?? ''}
                    onChange={(e) => patchBlock(b.id, { attribution: e.target.value })}
                  />
                </label>
              </>
            )}

            {b.type === 'gallery' && (
              <>
                <label className={s.field}>
                  <span>Columns</span>
                  <input
                    type="number"
                    min={2}
                    max={4}
                    value={b.columns ?? 2}
                    onChange={(e) => patchBlock(b.id, { columns: Number(e.target.value) })}
                  />
                </label>

                <div className={s.rowItems}>
                  {b.items.map((it, idx) => (
                    <div className={s.row} key={idx}>
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={it.src}
                        onChange={(e) => {
                          const items = [...b.items]
                          items[idx] = { ...items[idx], src: e.target.value }
                          patchBlock(b.id, { items })
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Caption"
                        value={it.caption ?? ''}
                        onChange={(e) => {
                          const items = [...b.items]
                          items[idx] = { ...items[idx], caption: e.target.value }
                          patchBlock(b.id, { items })
                        }}
                      />
                      <button
                        className={`${s.btn} ${s.tiny} ${s.danger}`}
                        onClick={() =>
                          patchBlock(b.id, { items: b.items.filter((_, k) => k !== idx) })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className={s.adders}>
                  <button
                    className={`${s.btn} ${s.tiny}`}
                    onClick={() => patchBlock(b.id, { items: [...b.items, { src: '', caption: '' }] })}
                  >
                    + Row
                  </button>
                  <UploadButton
                    folder="articles"
                    label="Upload image"
                    onDone={(url) => patchBlock(b.id, { items: [...b.items, { src: url, caption: '' }] })}
                    onError={(m) => say(m, 'err')}
                  />
                </div>
              </>
            )}
          </div>
        ))}

        <div className={s.adders}>
          {(['text', 'heading', 'image', 'quote', 'gallery'] as const).map((t) => (
            <button
              key={t}
              className={s.btn}
              onClick={() => setDraft((d) => ({ ...d, blocks: [...d.blocks, newBlock(t)] }))}
            >
              + {t}
            </button>
          ))}
        </div>

        {/* ── Summary ── */}
        <h2 className={s.groupTitle}>Summary</h2>
        <p className={s.hint} style={{ marginBottom: '1rem' }}>
          Optional key-takeaway block shown above the body — good for readers who skim and for
          answer engines that lift a definition.
        </p>

        <label className={s.field}>
          <span>Summary heading</span>
          <input
            type="text"
            placeholder="Key takeaway or section title…"
            value={draft.summaryTitle ?? ''}
            onChange={(e) => set('summaryTitle', e.target.value)}
          />
        </label>

        <label className={s.field}>
          <span>Summary description</span>
          <textarea
            placeholder="A short intro paragraph that appears before the body…"
            value={draft.summaryDescription ?? ''}
            onChange={(e) => set('summaryDescription', e.target.value)}
            style={{ minHeight: 90 }}
          />
        </label>

        {/* ── FAQs ── */}
        <h2 className={s.groupTitle}>FAQs</h2>
        <p className={s.hint} style={{ marginBottom: '1rem' }}>
          Rendered as an accordion and as FAQPage structured data — this is what wins the
          question-shaped searches.
        </p>

        <div className={s.rowItems}>
          {(draft.faqs ?? []).map((f, idx) => (
            <div className={s.row} key={idx}>
              <input
                type="text"
                placeholder="Question"
                value={f.q}
                onChange={(e) => {
                  const faqs = [...(draft.faqs ?? [])]
                  faqs[idx] = { ...faqs[idx], q: e.target.value }
                  set('faqs', faqs)
                }}
              />
              <input
                type="text"
                placeholder="Answer"
                value={f.a}
                onChange={(e) => {
                  const faqs = [...(draft.faqs ?? [])]
                  faqs[idx] = { ...faqs[idx], a: e.target.value }
                  set('faqs', faqs)
                }}
              />
              <button
                className={`${s.btn} ${s.tiny} ${s.danger}`}
                onClick={() => set('faqs', (draft.faqs ?? []).filter((_, k) => k !== idx))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className={s.adders}>
          <button
            className={s.btn}
            onClick={() => set('faqs', [...(draft.faqs ?? []), { q: '', a: '' }])}
          >
            + Question
          </button>
        </div>

        {/* ── SEO ── */}
        <h2 className={s.groupTitle}>SEO overrides</h2>
        <label className={s.field}>
          <span>Meta title</span>
          <input
            type="text"
            value={draft.metaTitle ?? ''}
            onChange={(e) => set('metaTitle', e.target.value)}
          />
          <span className={s.hint}>
            {(draft.metaTitle || draft.title).length} characters
            {(draft.metaTitle || draft.title).length > 70
              ? ' — over 70, search engines will truncate this. Add a shorter meta title.'
              : ' — Google truncates around 60.'}{' '}
            Blank falls back to the headline.
          </span>
        </label>

        <label className={s.field}>
          <span>Meta description</span>
          <textarea
            value={draft.metaDescription ?? ''}
            onChange={(e) => set('metaDescription', e.target.value)}
            style={{ minHeight: 80 }}
          />
          <span className={s.hint}>
            {(draft.metaDescription || draft.standfirst || '').length} characters — aim for 140–160.
            Blank falls back to the standfirst.
          </span>
        </label>

        {/* ── custom JSON-LD ── */}
        <label className={s.field}>
          <span>JSON-LD schema</span>
          <textarea
            value={draft.jsonLd ?? ''}
            onChange={(e) => set('jsonLd', e.target.value)}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "HowTo",\n  "name": "…"\n}'}
            spellCheck={false}
            style={{ minHeight: 180, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
          />
          <span className={s.hint}>
            {jsonLdStatus(draft.jsonLd)} Emitted in addition to the Article, breadcrumb and FAQ
            schema this page already generates — paste a full {'{ … }'} object.
          </span>
        </label>
      </div>
    </div>
  )
}
