// ETag / 304 / Cache-Control / Vary / Link / Content-Signal for server-rendered
// record pages (oxjob #1689).
import { describe, it, expect } from 'vitest';
import {
  applyRecordHttpCache, etagFor, ifNoneMatchHits, isRecordPath, CACHE_CONTROL, CONTENT_SIGNAL, recordLinkHeader,
} from '../../server/recordHttpCache.mjs';

const SSR_HTML = '<!DOCTYPE html><html><body><h1>The state of OA</h1><script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">[]</script></body></html>';
const SHELL_HTML = SSR_HTML.replace('data-ssr="true"', 'data-ssr="false"');
const res = (body = SSR_HTML, extra = {}) => ({ body, statusCode: 200, headers: { 'content-type': 'text/html;charset=utf-8' }, ...extra });
const req = (extra = {}) => ({ method: 'GET', path: '/works/W2741809807', ifNoneMatch: undefined, ...extra });

describe('isRecordPath', () => {
  it('record pages only', () => {
    for (const p of ['/works/W2741809807', '/works/w2741809807?utm_source=chatgpt.com', '/authors/A5023888391', '/keywords/open-access', '/subfields/1802']) {
      expect(isRecordPath(p), p).toBe(true);
    }
    for (const p of ['/works', '/works?filter=x', '/', '/about', '/works/W1/extra', '/settings/profile']) {
      expect(isRecordPath(p), p).toBe(false);
    }
  });
});

describe('applyRecordHttpCache', () => {
  it('sets a weak ETag and the cache headers on a server-rendered record page', () => {
    const r = applyRecordHttpCache(res(), req());
    expect(r.statusCode).toBe(200);
    expect(r.body).toBe(SSR_HTML);
    expect(r.headers.etag).toBe(etagFor(SSR_HTML));
    expect(r.headers.etag).toMatch(/^W\/"[A-Za-z0-9_-]{27}"$/);
    expect(r.headers['cache-control']).toBe('no-cache');
    expect(CACHE_CONTROL).toBe('no-cache');
    expect(r.headers.vary).toBe('User-Agent');
    expect(r.headers['content-type']).toBe('text/html;charset=utf-8');
  });
  it('no shared-cache headers: no s-maxage, no CDN-Cache-Control, no Cache-Tag (no edge cache, #1701)', () => {
    for (const agentNotice of [false, true]) {
      const r = applyRecordHttpCache(res(), req({ agentNotice }));
      expect(r.headers['cache-control']).not.toMatch(/s-maxage|public/);
      expect(r.headers['cdn-cache-control']).toBeUndefined();
      expect(r.headers['cache-tag']).toBeUndefined();
    }
  });
  it('the same HTML gets the same ETag; different HTML a different one', () => {
    expect(etagFor(SSR_HTML)).toBe(etagFor(String(SSR_HTML)));
    expect(etagFor(SSR_HTML)).not.toBe(etagFor(SSR_HTML.replace('OA', 'OA!')));
  });
  it('answers 304 with no body when If-None-Match matches (weak or strong form, in a list)', () => {
    const etag = etagFor(SSR_HTML);
    for (const header of [etag, etag.replace('W/', ''), `"nope", ${etag}`, '*']) {
      const r = applyRecordHttpCache(res(), req({ ifNoneMatch: header }));
      expect(r.statusCode, header).toBe(304);
      expect(r.body, header).toBe('');
      expect(r.headers.etag, header).toBe(etag);
      expect(r.headers['content-type'], header).toBeUndefined();
    }
  });
  it('a stale If-None-Match gets the full page', () => {
    const r = applyRecordHttpCache(res(), req({ ifNoneMatch: 'W/"old"' }));
    expect(r.statusCode).toBe(200);
    expect(r.body).toBe(SSR_HTML);
  });
  it('leaves alone: other paths, the SPA shell fallback, errors and redirects, non-GET', () => {
    const untouched = [
      [res(), req({ path: '/works?filter=x' })],
      [res(), req({ path: '/about' })],
      [res(SHELL_HTML), req()],
      [res(SSR_HTML, { statusCode: 404 }), req()],
      [res(SSR_HTML, { statusCode: 301 }), req()],
      [res(), req({ method: 'POST' })],
    ];
    for (const [r, q] of untouched) {
      const out = applyRecordHttpCache(r, q);
      expect(out.headers.etag).toBeUndefined();
      expect(out.headers['cache-control']).toBeUndefined();
    }
  });
});

describe('agent and non-agent variants (#1689 agent notice)', () => {
  it('the ETag names the variant, so the same HTML gets two different ETags', () => {
    const page = applyRecordHttpCache(res(), req());
    const agent = applyRecordHttpCache(res(), req({ agentNotice: true }));
    expect(page.headers.etag).toBe(etagFor(SSR_HTML));
    expect(agent.headers.etag).toBe(etagFor(SSR_HTML, { agent: true }));
    expect(agent.headers.etag).toMatch(/^W\/"[A-Za-z0-9_-]{27}-agent"$/);
    expect(agent.headers.etag).not.toBe(page.headers.etag);
    expect(agent.headers.vary).toBe('User-Agent');
  });
  it('a 304 only confirms its own variant', () => {
    const pageTag = etagFor(SSR_HTML);
    const agentTag = etagFor(SSR_HTML, { agent: true });
    expect(applyRecordHttpCache(res(), req({ ifNoneMatch: pageTag })).statusCode).toBe(304);
    expect(applyRecordHttpCache(res(), req({ ifNoneMatch: agentTag, agentNotice: true })).statusCode).toBe(304);
    // An agent revalidating a browser's copy, or a browser an agent's: full page.
    const a = applyRecordHttpCache(res(), req({ ifNoneMatch: pageTag, agentNotice: true }));
    expect(a.statusCode).toBe(200);
    expect(a.body).toBe(SSR_HTML);
    expect(applyRecordHttpCache(res(), req({ ifNoneMatch: agentTag })).statusCode).toBe(200);
  });
  it('Vary adds to one already set', () => {
    const r = applyRecordHttpCache(res(SSR_HTML, { headers: { vary: 'Accept-Encoding' } }), req());
    expect(r.headers.vary).toBe('Accept-Encoding, User-Agent');
  });
});

describe('Link and Content-Signal (#1689)', () => {
  const WORK_LINK = '<https://openalex.org/works/W2741809807>; rel="canonical", <https://api.openalex.org/works/W2741809807>; rel="alternate"; type="application/json"';
  it('Link names the canonical page and the same record in the API, from the record id', () => {
    expect(applyRecordHttpCache(res(), req({ recordId: 'https://openalex.org/W2741809807' })).headers.link).toBe(WORK_LINK);
    // Without the record in context, the path (a 200 is only rendered at the canonical path).
    expect(applyRecordHttpCache(res(), req({ path: '/works/W2741809807?utm_source=x' })).headers.link).toBe(WORK_LINK);
    expect(recordLinkHeader('https://openalex.org/keywords/open-access')).toBe(
      '<https://openalex.org/keywords/open-access>; rel="canonical", <https://api.openalex.org/keywords/open-access>; rel="alternate"; type="application/json"',
    );
    expect(recordLinkHeader('https://openalex.org/A5023888391')).toMatch(/^<https:\/\/openalex\.org\/authors\/A5023888391>; rel="canonical", <https:\/\/api\.openalex\.org\/authors\/A5023888391>;/);
    expect(recordLinkHeader(null)).toBe(null);
  });
  it('Content-Signal matches robots.txt: search and AI input yes, training no', () => {
    expect(CONTENT_SIGNAL).toBe('search=yes, ai-input=yes, ai-train=no');
    expect(applyRecordHttpCache(res(), req()).headers['content-signal']).toBe(CONTENT_SIGNAL);
  });
  it('a 304 keeps them (and Vary)', () => {
    const r = applyRecordHttpCache(res(), req({ ifNoneMatch: etagFor(SSR_HTML) }));
    expect(r.statusCode).toBe(304);
    expect(r.headers.link).toBe(WORK_LINK);
    expect(r.headers['content-signal']).toBe(CONTENT_SIGNAL);
    expect(r.headers.vary).toBe('User-Agent');
    expect(r.headers['cache-control']).toBe('no-cache');
  });
  it('none of them on the SPA shell, other paths, errors or non-GET', () => {
    for (const [r, q] of [[res(SHELL_HTML), req()], [res(), req({ path: '/about' })], [res(SSR_HTML, { statusCode: 404 }), req()], [res(), req({ method: 'POST' })]]) {
      const out = applyRecordHttpCache(r, q);
      expect(out.headers.link).toBeUndefined();
      expect(out.headers['content-signal']).toBeUndefined();
      expect(out.headers.vary).toBeUndefined();
    }
  });
});

describe('ifNoneMatchHits', () => {
  it('compares weakly and handles empty headers', () => {
    expect(ifNoneMatchHits('W/"a"', '"a"')).toBe(true);
    expect(ifNoneMatchHits('"a"', 'W/"a"')).toBe(true);
    expect(ifNoneMatchHits('"b"', 'W/"a"')).toBe(false);
    expect(ifNoneMatchHits('', 'W/"a"')).toBe(false);
    expect(ifNoneMatchHits(undefined, 'W/"a"')).toBe(false);
  });
});
