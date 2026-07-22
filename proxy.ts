import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Password-gate the article studio.
 * - /studio (the editor UI) always requires the password.
 * - /api/articles write requests (POST/DELETE) require it too.
 * - GET /api/articles stays public so the site can read content.
 *
 * Set STUDIO_PASSWORD in your environment (e.g. Vercel → Project → Settings →
 * Environment Variables). Locally, if it's unset the gate is skipped.
 */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isStudio = pathname.startsWith('/studio')
  const isWrite = pathname.startsWith('/api/articles') && req.method !== 'GET'
  const isUpload = pathname.startsWith('/api/upload')
  if (!isStudio && !isWrite && !isUpload) return NextResponse.next()

  const password = process.env.STUDIO_PASSWORD
  if (!password) {
    // Fail closed in production, open in local dev for convenience.
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Studio disabled: STUDIO_PASSWORD is not set.', { status: 503 })
    }
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    try {
      const [, pwd] = atob(auth.slice(6)).split(':')
      if (pwd === password) return NextResponse.next()
    } catch {
      /* fall through to challenge */
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Dubaiography Studio"' },
  })
}

export const config = {
  matcher: ['/studio/:path*', '/api/articles', '/api/articles/:path*', '/api/upload'],
}
