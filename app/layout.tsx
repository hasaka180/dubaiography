import type { Metadata } from 'next'
import Script from 'next/script'
import { Instrument_Serif, Inter } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Dateline from '@/components/Dateline'
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

/* Google Analytics 4. Loaded only in production so local development and
   builds don't pollute the property's stats. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-5NN1P1DYV3'
const GA_ENABLED = process.env.NODE_ENV === 'production' && !!GA_ID

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
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION ||
      'fe-CtnPbnwrgXYytwqyyY0rYVoIowtnTEbiBp-Q89aA',
  },
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

/* Runs before first paint so the page never flashes the wrong palette.
   An explicit choice in localStorage wins; otherwise the OS decides, and
   keeps deciding until the reader picks a side. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');
if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
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
        <Dateline />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />

        {/* afterInteractive: analytics must never block first paint. GA4's
            enhanced measurement picks up client-side route changes via
            History events, so no manual page_view wiring is needed. */}
        {GA_ENABLED && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
