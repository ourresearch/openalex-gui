// HTTP caching for server-rendered record pages (oxjob #1689).
//
// Google asks large, slow-changing sites for ETag and 304 Not Modified ("only 0.017%
// of fetches are cacheable", Google Search Central blog, 2024-12-09); a 304 costs
// the crawler and us no body. The ETag is a hash of the HTML we would send, so it
// changes exactly when the page does (record data, related data, or a new build).
//
// Cache-Control: no-cache, as for all other HTML: every visit revalidates (a cheap
// 304). No shared cache may serve record HTML on its own (no edge caching for now,
// Jason 2026-10-15; that is #1701), because the page differs by visitor: agents get
// the "Notice to agents" (server/lib/agentNotice.mjs). Hence Vary: User-Agent, and
// an ETag that names the variant, so a 304 can never confirm the other one.
//
// Link and Content-Signal ride along: Cloudflare's Markdown for Agents keeps origin
// headers on the Markdown it converts from this HTML, but drops <head>, so the
// canonical and the API pointer travel as a Link header too. Content-Signal matches
// robots.txt (training crawlers are asked off record paths); without it Cloudflare
// stamps ai-train=yes on converted responses.
import { createHash } from 'node:crypto';
import { canonicalUrl, apiUrl } from '../src/seo/recordHead.mjs';

export const CACHE_CONTROL = 'no-cache';
export const VARY = 'User-Agent';
export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes';

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
// compares weakly anyway. The agent variant ends in "-agent" (the body already
// differs; the suffix keeps the two apart even if it didn't).
export function etagFor(body, { agent = false } = {}) {
  return `W/"${createHash('sha1').update(body).digest('base64url')}${agent ? '-agent' : ''}"`;
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
// agentNotice: whether this render carries the notice (event.context.oxRecord.agentNotice).
export function applyRecordHttpCache(response, { method, path, ifNoneMatch, recordId, agentNotice = false }) {
  if (!response || typeof response.body !== 'string') return response;
  if (method !== 'GET' && method !== 'HEAD') return response;
  if (response.statusCode && response.statusCode !== 200) return response;
  if (!isRecordPath(path) || !isServerRendered(response.body)) return response;
  const etag = etagFor(response.body, { agent: !!agentNotice });
  const link = recordLinkHeader(recordId || String(path).split('?')[0].slice(1));
  const headers = response.headers || {};
  const vary = headers.vary ? `${headers.vary}, ${VARY}` : VARY;
  response.headers = {
    ...headers,
    etag,
    'cache-control': CACHE_CONTROL,
    vary,
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
