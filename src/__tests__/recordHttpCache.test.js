// ETag / 304 / Cache-Control for server-rendered record pages (oxjob #1689).
import { describe, it, expect } from 'vitest';
import {
  applyRecordHttpCache, etagFor, ifNoneMatchHits, isRecordPath, CACHE_CONTROL, CDN_CACHE_CONTROL,
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

describe('ifNoneMatchHits', () => {
  it('compares weakly and handles empty headers', () => {
    expect(ifNoneMatchHits('W/"a"', '"a"')).toBe(true);
    expect(ifNoneMatchHits('"a"', 'W/"a"')).toBe(true);
    expect(ifNoneMatchHits('"b"', 'W/"a"')).toBe(false);
    expect(ifNoneMatchHits('', 'W/"a"')).toBe(false);
    expect(ifNoneMatchHits(undefined, 'W/"a"')).toBe(false);
  });
});
