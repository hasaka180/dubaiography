import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleView from '@/components/ArticleView'
import { getArticle, getArticles, getRelated, CATEGORY_META } from '@/lib/articles'

export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dubaiography.com'

export async function generateStaticParams() {
  try {
    return (await getArticles()).map((a) => ({ slug: a.slug }))
  } catch {
    // CMS unreachable at build time - pages still render on demand.
    return []
  }
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Not found' }

  const title = article.metaTitle || article.title
  const description = article.metaDescription || article.standfirst || ''
  const url = `/articles/${article.slug}`

  /* The root layout appends " - Dubaiography" to every title. On a long
     headline that pushes the tag past the ~70 chars search engines show, so
     drop the suffix rather than have the masthead be what gets truncated. */
  const SUFFIX = ' - Dubaiography'
  const titleTag =
    title.length + SUFFIX.length > 70 ? { absolute: title } : title

  return {
    title: titleTag,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: article.date,
      modifiedTime: article.updated || article.date,
      authors: article.author ? [article.author] : undefined,
      images: article.cover ? [{ url: article.cover }] : undefined,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.cover ? [article.cover] : undefined,
    },
    robots: article.published === false ? { index: false, follow: false } : undefined,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const related = await getRelated(article.slug, article.category)
  const url = `${SITE_URL}/articles/${article.slug}`

  /* Article + breadcrumb + (optional) FAQ schema, emitted as one graph. */
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: article.metaTitle || article.title,
      description: article.metaDescription || article.standfirst,
      image: article.cover ? [article.cover] : undefined,
      datePublished: article.date,
      dateModified: article.updated || article.date,
      author: article.author ? { '@type': 'Person', name: article.author } : undefined,
      publisher: { '@type': 'Organization', name: 'Dubaiography', url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: CATEGORY_META[article.category]?.label,
      keywords: article.tags?.join(', '),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Dubaiography', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: CATEGORY_META[article.category]?.label,
          item: `${SITE_URL}/${article.category}`,
        },
        { '@type': 'ListItem', position: 3, name: article.title, item: url },
      ],
    },
  ]

  /* Event structured data for pieces filed under Events. */
  const ev = article.category === 'events' ? article.event : undefined
  if (ev?.startDate) {
    const ATTEND = {
      offline: 'https://schema.org/OfflineEventAttendanceMode',
      online: 'https://schema.org/OnlineEventAttendanceMode',
      mixed: 'https://schema.org/MixedEventAttendanceMode',
    } as const
    const STATUS = {
      scheduled: 'https://schema.org/EventScheduled',
      cancelled: 'https://schema.org/EventCancelled',
      postponed: 'https://schema.org/EventPostponed',
      rescheduled: 'https://schema.org/EventRescheduled',
    } as const
    graph.push({
      '@type': 'Event',
      name: article.title,
      description: article.metaDescription || article.standfirst,
      image: article.cover ? [article.cover] : undefined,
      startDate: ev.startDate,
      endDate: ev.endDate || ev.startDate,
      eventAttendanceMode: ATTEND[ev.attendanceMode ?? 'offline'],
      eventStatus: STATUS[ev.status ?? 'scheduled'],
      url,
      location: ev.venue
        ? {
            '@type': 'Place',
            name: ev.venue,
            address: ev.address
              ? { '@type': 'PostalAddress', name: ev.address }
              : undefined,
            geo:
              ev.lat != null && ev.lng != null
                ? { '@type': 'GeoCoordinates', latitude: ev.lat, longitude: ev.lng }
                : undefined,
          }
        : undefined,
      organizer: ev.organizer ? { '@type': 'Organization', name: ev.organizer } : undefined,
      performer: ev.performer ? { '@type': 'PerformingGroup', name: ev.performer } : undefined,
      offers: ev.ticketUrl
        ? {
            '@type': 'Offer',
            url: ev.ticketUrl,
            price: ev.price,
            availability: 'https://schema.org/InStock',
          }
        : undefined,
    })
  }

  if (article.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: article.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  /* Custom schema pasted in the studio. Re-serialised from the parsed value so
     malformed JSON is dropped rather than emitted into the page. */
  let customLd: string | null = null
  if (article.jsonLd?.trim()) {
    try {
      customLd = JSON.stringify(JSON.parse(article.jsonLd))
    } catch {
      console.warn(`Ignoring invalid jsonLd on article "${article.slug}"`)
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
        }}
      />
      {customLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customLd }} />
      )}
      <ArticleView article={article} related={related} url={url} />
    </>
  )
}
