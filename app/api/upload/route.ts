import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Accept a few common env var names so it works with the values copied
// straight off Cloudflare's R2 "S3 API" token screen.
const ENDPOINT =
  process.env.R2_S3_API_ENDPOINT ||
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined)
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL

const FOLDERS = new Set(['covers', 'articles', 'misc'])

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 12)

const keyFor = (folderReq: unknown, filename: unknown) => {
  const folder = FOLDERS.has(String(folderReq)) ? String(folderReq) : 'misc'
  const ext = (String(filename || 'bin').split('.').pop() || 'bin')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return `${folder}/${uid()}.${ext}`
}

const s3 = () =>
  new S3Client({
    region: 'auto',
    endpoint: ENDPOINT,
    credentials: { accessKeyId: ACCESS_KEY!, secretAccessKey: SECRET_KEY! },
  })

const isConfigured = () => ENDPOINT && ACCESS_KEY && SECRET_KEY && BUCKET && PUBLIC_BASE

const configError = () => {
  const missing = [
    !ENDPOINT && 'R2_ACCOUNT_ID (or R2_S3_API_ENDPOINT)',
    !ACCESS_KEY && 'R2_ACCESS_KEY_ID',
    !SECRET_KEY && 'R2_SECRET_ACCESS_KEY',
    !BUCKET && 'R2_BUCKET',
    !PUBLIC_BASE && 'R2_PUBLIC_BASE_URL',
  ]
    .filter(Boolean)
    .join(', ')
  return NextResponse.json({ error: `Uploads not configured. Missing: ${missing}` }, { status: 503 })
}

/**
 * Presign mode (JSON body): returns a short-lived PUT URL so the browser
 * uploads straight to R2, bypassing Vercel's ~4.5 MB function body limit.
 * Requires a CORS policy on the R2 bucket allowing PUT from your origin.
 */
async function presign(req: Request) {
  if (!isConfigured()) return configError()
  try {
    const { filename, folder, contentType } = (await req.json()) as {
      filename?: string
      folder?: string
      contentType?: string
    }
    const key = keyFor(folder, filename)
    const uploadUrl = await getSignedUrl(
      s3(),
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      }),
      { expiresIn: 600 },
    )
    return NextResponse.json({ uploadUrl, url: `${PUBLIC_BASE!.replace(/\/$/, '')}/${key}`, key })
  } catch (e) {
    console.error('R2 presign failed:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Presign failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  // JSON body → presigned-URL flow (large files, direct browser→R2)
  if ((req.headers.get('content-type') || '').includes('application/json')) {
    return presign(req)
  }

  if (!isConfigured()) return configError()

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const key = keyFor(form.get('folder'), file.name)
    await s3().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || 'application/octet-stream',
      }),
    )

    return NextResponse.json({ url: `${PUBLIC_BASE!.replace(/\/$/, '')}/${key}`, key })
  } catch (e) {
    console.error('R2 upload failed:', e)
    // surfaced for debugging — this route is password-gated
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 })
  }
}
