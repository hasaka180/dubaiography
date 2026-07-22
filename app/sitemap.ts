import type { MetadataRoute } from 'next'
import { getArticles, CATEGORIES } from '@/lib/articles'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dubaiography.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const base: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/archive`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/${c}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]

  try {
    const articles = await getArticles()
    return [
      ...base,
      ...articles.map((a) => ({
        url: `${SITE_URL}/articles/${a.slug}`,
        lastModified: a.updated ? new Date(a.updated) : a.date ? new Date(a.date) : now,
        changeFrequency: 'monthly' as const,
        priority: a.featured ? 0.9 : 0.7,
      })),
    ]
  } catch {
    // if the CMS is unreachable at build time, still emit the static routes
    return base
  }
}
