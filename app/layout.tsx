import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import SmoothScroll from '@/components/SmoothScroll'
import Reveal from '@/components/Reveal'
import './globals.css'

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dubaiography.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dubaiography — An editorial journal of Dubai',
    template: '%s — Dubaiography',
  },
  description:
    'Long-form reporting on Dubai: architecture and urbanism, culture and neighbourhood guides, business and property, travel and desert experience.',
  keywords: [
    'Dubai',
    'Dubai magazine',
    'Dubai guide',
    'Dubai architecture',
    'Dubai culture',
    'Dubai real estate',
    'Dubai travel',
    'UAE editorial',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Dubaiography',
    locale: 'en_AE',
    url: SITE_URL,
    title: 'Dubaiography — An editorial journal of Dubai',
    description:
      'Long-form reporting on the city that keeps rewriting itself — architecture, culture, business and travel.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dubaiography — An editorial journal of Dubai',
    description: 'Long-form reporting on the city that keeps rewriting itself.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
}

/* Publisher identity — lets Google tie every article back to one masthead. */
const publisherSchema = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Dubaiography',
  url: SITE_URL,
  description: 'An editorial journal of Dubai — architecture, culture, business and travel.',
  areaServed: { '@type': 'Place', name: 'Dubai, United Arab Emirates' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(publisherSchema) }}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SmoothScroll />
        <Reveal />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
