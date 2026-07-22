import { NextResponse } from 'next/server'
import { ping } from '@/lib/articles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Hit daily by the Vercel cron (see vercel.json) so Appwrite's free tier
    doesn't auto-pause the project for inactivity. */
export async function GET() {
  const result = await ping()
  return NextResponse.json({ ...result, at: new Date().toISOString() }, {
    status: result.ok ? 200 : 500,
  })
}
