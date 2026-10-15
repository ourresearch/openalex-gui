// oxjobs #1691/#1692: the website token survives page loads (localStorage) and is re-minted when the
// API answers `X-OpenAlex-UI-Token: refresh` (expired, minted on another network, or unknown).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const interceptors = [];
vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        interceptors: { response: { use: (ok, err) => interceptors.push({ ok, err }) } },
    },
}));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.test' }, UI_PROVENANCE_SITEKEY: 'sitekey' }));

import axios from 'axios';
import { getUiToken, handleUiTokenStatus, initUiProvenance, _resetForTests } from '@/uiProvenance';

function fakeBrowser() {
    const store = new Map();
    const widget = { callback: null, resets: 0 };
    vi.stubGlobal('localStorage', {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
    });
    vi.stubGlobal('document', {
        createElement: () => ({ style: {}, setAttribute: () => {} }),
        body: { appendChild: () => {} },
    });
    vi.stubGlobal('window', {
        turnstile: {
            render: (_el, opts) => { widget.callback = opts.callback; return 'w1'; },
            reset: () => { widget.resets += 1; },
        },
    });
    return { store, widget };
}

const refresh = (sentToken) => ({ headers: { 'x-openalex-ui-token': 'refresh' }, config: { headers: { 'X-OpenAlex-UI': sentToken } } });
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('website token (uiProvenance)', () => {
    beforeEach(() => { _resetForTests(); interceptors.length = 0; axios.post.mockReset(); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('mints on start and keeps the token in localStorage', async () => {
        const { store, widget } = fakeBrowser();
        axios.post.mockResolvedValue({ data: { token: 'tok-1', expiresIn: 1800 } });
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        expect(getUiToken()).toBe('tok-1');
        expect(JSON.parse(store.get('openalexUiToken')).token).toBe('tok-1');
    });

    it('a new page load starts with the stored token, before any mint lands', async () => {
        const { store } = fakeBrowser();
        store.set('openalexUiToken', JSON.stringify({ token: 'stored', expiresAt: Date.now() + 3600_000 }));
        await initUiProvenance();
        expect(getUiToken()).toBe('stored');
    });

    it('ignores a stored token that is expired or about to expire', async () => {
        const { store } = fakeBrowser();
        store.set('openalexUiToken', JSON.stringify({ token: 'old', expiresAt: Date.now() + 1000 }));
        await initUiProvenance();
        expect(getUiToken()).toBeNull();
    });

    it('on a refresh signal: drops the token and re-mints once for a burst of responses', async () => {
        const { store, widget } = fakeBrowser();
        axios.post.mockResolvedValue({ data: { token: 'tok-1', expiresIn: 1800 } });
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        for (let i = 0; i < 5; i++) interceptors[0].ok(refresh('tok-1'));
        expect(getUiToken()).toBeNull();
        expect(store.has('openalexUiToken')).toBe(false);
        expect(widget.resets).toBe(1);
        axios.post.mockResolvedValue({ data: { token: 'tok-2', expiresIn: 1800 } });
        widget.callback('solve-2');
        await flush();
        expect(getUiToken()).toBe('tok-2');
    });

    it('reads the signal on error responses too (a 429 or 503 still carries it)', async () => {
        const { widget } = fakeBrowser();
        axios.post.mockResolvedValue({ data: { token: 'tok-1', expiresIn: 1800 } });
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        await expect(interceptors[0].err({ response: refresh('tok-1') })).rejects.toBeDefined();
        expect(getUiToken()).toBeNull();
        expect(widget.resets).toBe(1);
    });

    it('ignores a stale signal for a token already replaced, and responses without it', async () => {
        const { widget } = fakeBrowser();
        axios.post.mockResolvedValue({ data: { token: 'tok-2', expiresIn: 1800 } });
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        handleUiTokenStatus(refresh('tok-1'));
        handleUiTokenStatus({ headers: {}, config: { headers: { 'X-OpenAlex-UI': 'tok-2' } } });
        handleUiTokenStatus(undefined);
        expect(getUiToken()).toBe('tok-2');
        expect(widget.resets).toBe(0);
    });

    it('a failed mint keeps a still-valid token', async () => {
        const { store, widget } = fakeBrowser();
        store.set('openalexUiToken', JSON.stringify({ token: 'stored', expiresAt: Date.now() + 3600_000 }));
        axios.post.mockRejectedValue(new Error('429'));
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        expect(getUiToken()).toBe('stored');
    });

    it('works from memory when storage is blocked, and never throws', async () => {
        const { widget } = fakeBrowser();
        const blocked = () => { throw new Error('blocked'); };
        vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked });
        axios.post.mockResolvedValue({ data: { token: 'tok-1', expiresIn: 1800 } });
        await initUiProvenance();
        widget.callback('solve');
        await flush();
        expect(getUiToken()).toBe('tok-1');
        expect(() => handleUiTokenStatus(refresh('tok-1'))).not.toThrow();
        expect(getUiToken()).toBeNull();
    });
});
