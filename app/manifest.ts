import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dubaiography — An editorial journal of Dubai',
    short_name: 'Dubaiography',
    description:
      'Long-form reporting on Dubai: architecture, culture, business and travel.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2efe8',
    theme_color: '#14110f',
    icons: [
      { src: '/assets/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
