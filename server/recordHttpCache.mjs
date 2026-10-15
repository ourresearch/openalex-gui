// HTTP caching for server-rendered record pages (oxjob #1689).
//
// Google asks large, slow-changing sites for ETag and 304 Not Modified ("only 0.017%
// of fetches are cacheable", Google Search Central blog, 2024-12-09); a 304 costs
// the crawler and us no body. The ETag is a hash of the HTML we would send, so it
// changes exactly when the page does (record data, related data, or a new build).
//
// Cache-Control: browsers revalidate on every visit (a cheap 304); shared caches may
// keep the page a day. Stale-while-revalidate goes only in CDN-Cache-Control (RFC
// 9213; Cloudflare honors it, browsers ignore it), so no browser keeps showing day-old
// HTML whose /_nuxt/ file names a deploy has removed. Cloudflare caches HTML only
// under a Cache Rule; until one exists these headers change nothing there.
import { createHash } from 'node:crypto';

export const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400';
export const CDN_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=86400';

// Record pages: /<entity type>/<id>, not the list pages (/works) or anything deeper.
const RECORD_PATH = /^\/(works|authors|sources|institutions|topics|keywords|publishers|funders|awards|concepts|subfields|fields|domains|sdgs|countries|continents|languages|types|source-types|institution-types|licenses|oa-statuses|indexes|source-lists|study-designs|locations)\/[^/]+\/?$/;

export const isRecordPath = (path) => RECORD_PATH.test(String(path || '').split('?')[0]);

// Weak: Cloudflare weakens strong ETags whenever it compresses, and If-None-Match
// compares weakly anyway.
export function etagFor(body) {
  return `W/"${createHash('sha1').update(body).digest('base64url')}"`;
}

const opaque = (tag) => tag.trim().replace(/^W\//, '');

// RFC 9110 If-None-Match: "*" or a list of entity tags, compared weakly.
export function ifNoneMatchHits(header, etag) {
  if (!header || !etag) return false;
  if (header.trim() === '*') return true;
  const want = opaque(etag);
  return header.split(',').some((t) => opaque(t) === want);
}

// Server-rendered, not the SPA shell a record route falls back to (Nuxt marks the
// payload data-ssr="true" only when the page was rendered on the server).
const isServerRendered = (body) => body.includes('data-ssr="true"');

// Mutates a Nitro render response: { body, statusCode, headers }.
export function applyRecordHttpCache(response, { method, path, ifNoneMatch }) {
  if (!response || typeof response.body !== 'string') return response;
  if (method !== 'GET' && method !== 'HEAD') return response;
  if (response.statusCode && response.statusCode !== 200) return response;
  if (!isRecordPath(path) || !isServerRendered(response.body)) return response;
  const etag = etagFor(response.body);
  response.headers = { ...(response.headers || {}), etag, 'cache-control': CACHE_CONTROL, 'cdn-cache-control': CDN_CACHE_CONTROL };
  if (ifNoneMatchHits(ifNoneMatch, etag)) {
    response.statusCode = 304;
    response.body = '';
    delete response.headers['content-type'];
  }
  return response;
}
