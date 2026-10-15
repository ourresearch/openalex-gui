// AWS Signature Version 4 for one S3 GET/HEAD (oxjob #1689: reading the sitemap bucket, R2 or S3).
// ~40 lines with node:crypto instead of a dependency. Verified against AWS's published S3 GET Object
// example (server/utils/__tests__/sitemaps.test.ts).
import { createHash, createHmac } from 'node:crypto'

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data, 'utf8').digest()
const sha256hex = (data: string) => createHash('sha256').update(data, 'utf8').digest('hex')
// S3 canonical URI: each path segment URI-encoded once (RFC 3986 unreserved kept), slashes kept.
const encodePath = (p: string) => p.split('/').map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())).join('/')

export interface SignInput {
  method: 'GET' | 'HEAD'
  url: string
  accessKeyId: string
  secretAccessKey: string
  region: string // 'auto' for R2
  headers?: Record<string, string> // extra headers to sign (lower-case names)
  amzDate?: string // YYYYMMDDTHHMMSSZ; default now
  service?: string
}

/** Returns the headers to send: the signed extras plus host-independent x-amz-* and Authorization. */
export function signV4(input: SignInput): Record<string, string> {
  const u = new URL(input.url)
  const amzDate = input.amzDate ?? new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const date = amzDate.slice(0, 8)
  const service = input.service ?? 's3'
  const headers: Record<string, string> = { ...(input.headers ?? {}), 'x-amz-content-sha256': EMPTY_SHA256, 'x-amz-date': amzDate }
  const toSign: Record<string, string> = { host: u.host, ...headers }
  const names = Object.keys(toSign).map((n) => n.toLowerCase()).sort()
  const lower: Record<string, string> = Object.fromEntries(Object.entries(toSign).map(([k, v]) => [k.toLowerCase(), String(v).trim()]))
  const query = [...u.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
  const canonical = [input.method, encodePath(decodeURIComponent(u.pathname)), query,
    names.map((n) => `${n}:${lower[n]}\n`).join(''), names.join(';'), EMPTY_SHA256].join('\n')
  const scope = `${date}/${input.region}/${service}/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonical)].join('\n')
  const kDate = hmac('AWS4' + input.secretAccessKey, date)
  const kSigning = hmac(hmac(hmac(kDate, input.region), service), 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`,
  }
}
