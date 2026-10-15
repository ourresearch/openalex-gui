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
//
// Cache-Tag (#1689 edge cache): every record answer Cloudflare may keep (this page,
// and the record middleware's 301s and 404s) carries the tag record-html, so a new
// release purges them all in one call (server/plugins/purge-record-cache.ts): the
// HTML names this build's hashed /_nuxt/ files, which the next deploy removes.
// build-<id> lets a person purge one build's pages by hand. Cloudflare strips
// Cache-Tag before the response reaches the client.
//
// Link and Content-Signal ride along on the 200: Cloudflare's Markdown for Agents
// keeps origin headers on the Markdown it converts from this HTML, but drops <head>,
// so the canonical and the API pointer travel as a Link header too. Content-Signal
// matches robots.txt (training crawlers are asked off record paths); without it
// Cloudflare stamps ai-train=yes on converted responses.
import { createHash } from 'node:crypto';
import { canonicalUrl, apiUrl } from '../src/seo/recordHead.mjs';
import { RECORD_CACHE_TAG } from './lib/purgeRecordCache.mjs';

export const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400';
export const CDN_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=86400';
export { RECORD_CACHE_TAG };
export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=no';

// "record-html" or "record-html,build-<id>". Tags are case-insensitive at Cloudflare
// and may not contain spaces or commas; anything else in the build id is dropped.
export function recordCacheTags(buildId) {
  const id = String(buildId ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return id ? `${RECORD_CACHE_TAG},build-${id}` : RECORD_CACHE_TAG;
}

// Link header for a record page: its canonical URL and the same record in the API.
export function recordLinkHeader(recordId) {
  const canonical = canonicalUrl(recordId);
  if (!canonical) return null;
  return `<${canonical}>; rel="canonical", <${apiUrl(recordId)}>; rel="alternate"; type="application/json"`;
}

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

// Mutates a Nitro render response: { body, statusCode, headers }. recordId is the
// rendered record's own id (event.context.oxRecord.data.id); the request path
// stands in when it is missing (a 200 is only ever rendered at the canonical path).
export function applyRecordHttpCache(response, { method, path, ifNoneMatch, recordId, buildId }) {
  if (!response || typeof response.body !== 'string') return response;
  if (method !== 'GET' && method !== 'HEAD') return response;
  if (response.statusCode && response.statusCode !== 200) return response;
  if (!isRecordPath(path) || !isServerRendered(response.body)) return response;
  const etag = etagFor(response.body);
  const link = recordLinkHeader(recordId || String(path).split('?')[0].slice(1));
  response.headers = {
    ...(response.headers || {}),
    etag,
    'cache-control': CACHE_CONTROL,
    'cdn-cache-control': CDN_CACHE_CONTROL,
    'cache-tag': recordCacheTags(buildId),
    'content-signal': CONTENT_SIGNAL,
    ...(link ? { link } : {}),
  };
  if (ifNoneMatchHits(ifNoneMatch, etag)) {
    response.statusCode = 304;
    response.body = '';
    delete response.headers['content-type'];
  }
  return response;
}
