// Sitemaps for record pages (oxjob #1689): what openalex.org serves at /sitemap*.xml(.gz).
//
// The files are written nightly by openalex-walden notebooks/sitemaps/BuildSitemaps.py into a bucket
// (proposed: R2 `openalex-sitemaps`, prefix `live/`). They sit at the site root on purpose: Google says a
// sitemap "affects only descendants of the parent directory" unless submitted in Search Console, so a file
// under /sitemaps/ could not list /works/ URLs for every engine.
//   /sitemap.xml                      flat index of every sitemap file (Google rejects nested indexes)
//   /sitemap-<group>.xml              one index per group (works-abstract, authors-orcid, sources, changed, ...)
//   /sitemap-<group>-<NNNNN>.xml.gz   the URL files
//
// Config (all unset = the route is off and these paths 404, as today):
//   SITEMAPS_BUCKET_URL   e.g. https://<account>.r2.cloudflarestorage.com/openalex-sitemaps (path style)
//   SITEMAPS_PREFIX       default "live"
//   SITEMAPS_ACCESS_KEY_ID / SITEMAPS_SECRET_ACCESS_KEY   read-only token; omit for a public bucket URL
//   SITEMAPS_REGION       default "auto" (R2); "us-east-1" etc. for S3
import { signV4 } from './sigv4'

export const SITEMAP_PATH = /^\/(sitemap(?:-[a-z][a-z0-9]*)*(?:-\d{5}\.xml\.gz|\.xml))$/

/** The object name for a request path, or null when the path isn't a sitemap path. */
export function sitemapName(path: string): string | null {
  const m = SITEMAP_PATH.exec(path.split('?')[0])
  return m ? m[1] : null
}

export function contentType(name: string): string {
  // Served as the gzip file it is (no Content-Encoding), which every engine reads; compression
  // middleware skips application/gzip because it isn't compressible.
  return name.endsWith('.gz') ? 'application/gzip' : 'application/xml; charset=utf-8'
}

export interface SitemapConfig {
  bucketUrl: string
  prefix: string
  accessKeyId?: string
  secretAccessKey?: string
  region: string
}

export function sitemapConfig(env: Record<string, string | undefined> = process.env): SitemapConfig | null {
  const bucketUrl = env.SITEMAPS_BUCKET_URL?.replace(/\/+$/, '')
  if (!bucketUrl) return null
  return {
    bucketUrl,
    prefix: (env.SITEMAPS_PREFIX ?? 'live').replace(/^\/+|\/+$/g, ''),
    accessKeyId: env.SITEMAPS_ACCESS_KEY_ID,
    secretAccessKey: env.SITEMAPS_SECRET_ACCESS_KEY,
    region: env.SITEMAPS_REGION ?? 'auto',
  }
}

/** URL and headers for the origin request; conditional headers pass through so crawlers get 304s. */
export function originRequest(cfg: SitemapConfig, name: string, method: 'GET' | 'HEAD', conditional: Record<string, string | undefined>) {
  const url = `${cfg.bucketUrl}/${cfg.prefix ? cfg.prefix + '/' : ''}${name}`
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(conditional)) if (v) headers[k] = v
  if (cfg.accessKeyId && cfg.secretAccessKey) {
    Object.assign(headers, signV4({ method, url, accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey, region: cfg.region }))
  }
  return { url, headers }
}

// Files change once a night; an hour at the edge and in crawlers keeps the bucket quiet.
export const CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'

/** Response status and headers for an origin response. Origin 403/404 -> 404; other errors -> 503. */
export function responseFor(name: string, originStatus: number, originHeaders: Headers) {
  const pass = (k: string) => originHeaders.get(k) ?? undefined
  const base: Record<string, string | undefined> = {
    'cache-control': CACHE_CONTROL,
    'x-robots-tag': 'noindex',
    etag: pass('etag'),
    'last-modified': pass('last-modified'),
  }
  if (originStatus === 200) return { status: 200, headers: { ...base, 'content-type': contentType(name), 'content-length': pass('content-length') } }
  if (originStatus === 304) return { status: 304, headers: base }
  if (originStatus === 404 || originStatus === 403) return { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=300' } }
  return { status: 503, headers: { 'content-type': 'text/plain', 'retry-after': '3600', 'cache-control': 'no-store' } }
}
