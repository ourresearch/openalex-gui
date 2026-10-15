// ETag / 304 / Cache-Control for server-rendered record pages (oxjob #1689).
import { describe, it, expect } from 'vitest';
import {
  applyRecordHttpCache, etagFor, ifNoneMatchHits, isRecordPath, CACHE_CONTROL, CDN_CACHE_CONTROL,
  CONTENT_SIGNAL, recordCacheTags, recordLinkHeader,
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
    expect(r.headers['cache-control']).toBe(CACHE_CONTROL);
    expect(r.headers['cdn-cache-control']).toBe(CDN_CACHE_CONTROL);
    expect(r.headers['content-type']).toBe('text/html;charset=utf-8');
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

describe('edge cache headers (#1689)', () => {
  const WORK_LINK = '<https://openalex.org/works/W2741809807>; rel="canonical", <https://api.openalex.org/works/W2741809807>; rel="alternate"; type="application/json"';
  it('a server-rendered record page carries Cache-Tag record-html and its build tag', () => {
    const r = applyRecordHttpCache(res(), req({ buildId: '6c1e2f0a-3b4d-4e5f-8a9b-0c1d2e3f4a5b' }));
    expect(r.headers['cache-tag']).toBe('record-html,build-6c1e2f0a-3b4d-4e5f-8a9b-0c1d2e3f4a5b');
    expect(applyRecordHttpCache(res(), req()).headers['cache-tag']).toBe('record-html');
  });
  it('build tags never carry spaces or commas (they would split the tag list)', () => {
    expect(recordCacheTags('A b,c')).toBe('record-html,build-abc');
    expect(recordCacheTags(undefined)).toBe('record-html');
  });
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
  it('a 304 keeps the edge headers', () => {
    const r = applyRecordHttpCache(res(), req({ ifNoneMatch: etagFor(SSR_HTML) }));
    expect(r.statusCode).toBe(304);
    expect(r.headers['cache-tag']).toBe('record-html');
    expect(r.headers.link).toBe(WORK_LINK);
  });
  it('none of them on the SPA shell, other paths, errors or non-GET', () => {
    for (const [r, q] of [[res(SHELL_HTML), req()], [res(), req({ path: '/about' })], [res(SSR_HTML, { statusCode: 404 }), req()], [res(), req({ method: 'POST' })]]) {
      const out = applyRecordHttpCache(r, q);
      expect(out.headers['cache-tag']).toBeUndefined();
      expect(out.headers.link).toBeUndefined();
      expect(out.headers['content-signal']).toBeUndefined();
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
