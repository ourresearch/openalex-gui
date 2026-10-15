// oxjob #1689: the server's API client for record pages (server/lib/ssrApi.ts).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, clearCache, cacheStats, SSR_USER_AGENT } from '../../server/lib/ssrApi.ts';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('ssrApi.apiGet', () => {
    beforeEach(() => { clearCache(); process.env.NUXT_SSR_API_KEY = 'test-key'; });
    afterEach(() => { vi.unstubAllGlobals(); delete process.env.NUXT_SSR_API_KEY; });

    it('sends the service key and the SSR User-Agent, and caches by API path', async () => {
        const fetchMock = vi.fn(async () => json({ id: 'https://openalex.org/W1', display_name: 'x' }));
        vi.stubGlobal('fetch', fetchMock);
        const r = await apiGet('works/W1', 1000);
        expect(r).toMatchObject({ status: 'ok', data: { display_name: 'x' } });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.openalex.org/works/W1');
        expect(init.headers.Authorization).toBe('Bearer test-key');
        expect(init.headers['User-Agent']).toBe(SSR_USER_AGENT);
        const again = await apiGet('works/W1', 1000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        // Each caller gets its own object (no shared, mutable record between renders).
        again.data.display_name = 'mutated';
        expect((await apiGet('works/W1', 1000)).data.display_name).toBe('x');
    });

    it('maps 404 to notfound and server errors, bad JSON and API errors to unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
        expect(await apiGet('works/W2', 1000)).toEqual({ status: 'notfound' });
        vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 503 })));
        expect(await apiGet('works/W3', 1000)).toMatchObject({ status: 'unavailable', reason: 'http 503' });
        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 200 })));
        expect(await apiGet('works/W4', 1000)).toMatchObject({ status: 'unavailable', reason: 'not json' });
        vi.stubGlobal('fetch', vi.fn(async () => json({ error: 'Plan upgrade required' })));
        expect(await apiGet('works/W5', 1000)).toMatchObject({ status: 'unavailable' });
    });

    it('times out (SPA fallback) instead of waiting on a slow API', async () => {
        vi.stubGlobal('fetch', vi.fn((url, init) => new Promise((_, reject) => {
            init.signal.addEventListener('abort', () => reject(init.signal.reason));
        })));
        const t0 = Date.now();
        expect(await apiGet('works/W6', 50)).toEqual({ status: 'unavailable', reason: 'timeout' });
        expect(Date.now() - t0).toBeLessThan(1000);
    });

    it('applies the transform before caching (trimmed lists stay small)', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ results: [{ id: 1, big: 'x'.repeat(5000) }] })));
        const r = await apiGet('works?filter=a:1', 1000, (d) => ({ results: d.results.map(({ id }) => ({ id })) }));
        expect(r.data).toEqual({ results: [{ id: 1 }] });
        expect(cacheStats().bytes).toBeLessThan(100);
    });
});
