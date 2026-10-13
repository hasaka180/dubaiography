import 'server-only'
import { S3Client } from '@aws-sdk/client-s3'

/* Cloudflare R2 config, shared by media uploads and article storage.
   Accepts a few common env var names so it works with the values copied
   straight off Cloudflare's R2 "S3 API" token screen. */
export const R2 = {
  endpoint:
    process.env.R2_S3_API_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
  accessKey: process.env.R2_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
  secretKey: process.env.R2_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
  /** Public media bucket (covers, inline images). */
  bucket: process.env.R2_BUCKET,
  publicBase: process.env.R2_PUBLIC_BASE_URL,
  /** Where the article JSON lives. Point this at a private bucket: anything in
      the public media bucket - drafts included - is readable at its r2.dev URL. */
  contentBucket: process.env.R2_CONTENT_BUCKET || process.env.R2_BUCKET,
}

let client: S3Client | null = null

export function r2(): S3Client {
  return (client ??= new S3Client({
    region: 'auto',
    endpoint: R2.endpoint,
    credentials: { accessKeyId: R2.accessKey!, secretAccessKey: R2.secretKey! },
  }))
}
