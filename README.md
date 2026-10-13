# Dubaiography

An editorial journal about Dubai — architecture, culture, business and travel — built for organic search.

Next.js 16 (App Router) · React 19 · Cloudflare R2 (content and media) · Vercel.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no environment variables set, the site runs entirely off `data/articles.json`
and the studio is open locally. That is enough to develop against.

| Route | What it is |
| --- | --- |
| `/` | Hero + lead story + section index + latest |
| `/culture`, `/architecture`, `/business`, `/travel` | Section pages (pre-rendered) |
| `/articles/<slug>` | The reader |
| `/archive` | Everything, newest first |
| `/studio` | Password-gated article builder |

---

## The backend

Content lives in one JSON object in Cloudflare R2 (`content/articles.json`),
in the same `{ "articles": [...] }` shape as `data/articles.json`. Every page
reads it through a single Next.js data-cache entry, so R2 sees about one read
an hour; a save from the studio expires that cache immediately. If R2 is
unreachable - or simply not configured - every read falls back to
`data/articles.json`, so the site never hard-fails because storage is down.

### 1. Article storage

Create a **private** R2 bucket for content and set `R2_CONTENT_BUCKET`. (It
falls back to the media bucket, but that bucket is public, so drafts would be
readable at its r2.dev URL.) The API token below needs read/write on both
buckets.

Until the first save, the site serves `data/articles.json`; the first save from
the studio writes that issue plus the new article to R2.

Articles from the old Appwrite backend are copied over by a one-off,
password-gated route that runs on Vercel, where the `APPWRITE_*` secrets live:
open `/api/migrate` to preview (and save as a backup), then
`/api/migrate?run=1` to merge into R2, keeping the most recently updated copy
of each slug. Delete the route afterwards.

### 2. Media uploads

Create a second bucket, enable public access, and create an S3 API token. Fill in the
`R2_*` variables. Uploads are sorted into `covers/`, `articles/` and `misc/`.

Files under 4 MB go through the API route; larger ones are presigned and sent
straight from the browser to R2, which needs a CORS rule on the bucket allowing
`PUT` from your origin.

### 3. The password

`STUDIO_PASSWORD` gates `/studio`, all writes to `/api/articles`, and
`/api/upload` via HTTP Basic auth (see `proxy.ts`). `GET /api/articles` stays
public so the site can read content.

Unset locally, the gate is skipped. **Unset in production, the studio returns 503**
— it fails closed rather than open.

Copy `.env.example` to `.env.local` for the full list.

---

## Publishing an article

Open `/studio`. The builder composes an article out of blocks — text (Markdown),
heading, image, pull quote and gallery — and handles cover art, tags, FAQs and
SEO overrides. Save writes through the API, which then revalidates the home,
archive, section and article pages.

Uncheck **Published** to keep a piece out of listings, the sitemap and search
while still being able to preview it.

---

## What's wired for SEO

- Per-article canonical URLs, OpenGraph and Twitter cards.
- `Article`, `BreadcrumbList` and `FAQPage` JSON-LD, emitted as one `@graph`;
  `NewsMediaOrganization` sitewide.
- `sitemap.xml` generated from live content with real `lastModified` dates;
  `robots.txt` disallowing `/studio` and `/api/`.
- Section pages pre-rendered as the top of the funnel, revalidating hourly.
- Semantic headings, real `<time>` elements, alt text on every image path.
- Drafts carry `noindex` and are excluded from the sitemap.

The FAQ block is the highest-leverage field in the studio — it is what wins
question-shaped searches.

---

## Notes on the hero

`components/HeroScene.tsx` is a hand-authored layered SVG, not an image. Each
group carries a `data-depth` that drives both scroll parallax and pointer sway,
so one number controls how far back a layer sits.

Entrance animation is deliberately **transform-only**: nothing starts at
`opacity: 0`. If GSAP is slow to boot or fails outright, the hero still paints
complete and legible — it just doesn't move. Motion is skipped entirely under
`prefers-reduced-motion`.

---

## Deploying

Push to Vercel and set the same environment variables.
