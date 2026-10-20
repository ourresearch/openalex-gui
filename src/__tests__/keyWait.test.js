import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1744: a signed-in first load sent its API calls keyless until /users/me brought the
// key, so on an IP out of anonymous budget the new search page's first query 429'd.

import { needsKeyWait, waitForApiKey, installKeyWait } from '../keyWait';

const API = 'https://api.openalex.org';
const base = { hasToken: true, apiKey: null, nlSearch: true, apiBase: API, waitedOnce: false };

describe('needsKeyWait', () => {
  it('holds a keyless API call while a signed-in user has the new search on', () => {
    expect(needsKeyWait({ url: `${API}/?mailto=x`, headers: {} }, base)).toBe(true);
  });
  it('lets everything else straight through', () => {
    const cfg = { url: `${API}/works`, headers: {} };
    expect(needsKeyWait(cfg, { ...base, hasToken: false })).toBe(false); // signed out
    expect(needsKeyWait(cfg, { ...base, apiKey: 'k' })).toBe(false); // key already here
    expect(needsKeyWait(cfg, { ...base, nlSearch: false })).toBe(false); // flag off: unchanged site
    expect(needsKeyWait(cfg, { ...base, waitedOnce: true })).toBe(false); // waits once per load
    expect(needsKeyWait({ url: 'https://user.openalex.org/users/me', headers: {} }, base)).toBe(false);
    expect(needsKeyWait({ url: `${API}/works`, headers: { Authorization: 'Bearer t' } }, base)).toBe(false);
  });
});

describe('installKeyWait', () => {
  let interceptor;
  const axios = { interceptors: { request: { use: (fn) => { interceptor = fn; } } } };
  const mem = new Map();
  beforeEach(() => {
    mem.clear();
    mem.set('token', 'user-token');
    globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null };
  });

  it('waits for the key, adds it, and shares one wait between concurrent calls', async () => {
    const store = { state: { user: { apiKey: null } }, getters: { nlSearch: true }, dispatch: vi.fn(async () => {}) };
    installKeyWait(axios, store, API);
    setTimeout(() => { store.state.user.apiKey = 'live-key'; }, 50);
    const [a, b] = await Promise.all([
      interceptor({ url: `${API}/?mailto=x`, headers: {} }),
      interceptor({ url: `${API}/query/text`, headers: {} }),
    ]);
    expect(a.headers.Authorization).toBe('Bearer live-key');
    expect(b.headers.Authorization).toBe('Bearer live-key');
    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });

  it('gives up after one wait and never waits again', async () => {
    const store = { state: { user: { apiKey: null } }, getters: { nlSearch: true }, dispatch: vi.fn(async () => {}) };
    installKeyWait(axios, store, API);
    const first = await interceptor({ url: `${API}/works`, headers: {} });
    expect(first.headers.Authorization).toBeUndefined();
    const t0 = Date.now();
    await interceptor({ url: `${API}/works`, headers: {} });
    expect(Date.now() - t0).toBeLessThan(50);
  }, 10000);
});

describe('waitForApiKey', () => {
  it('returns at once when the key is there', async () => {
    const store = { state: { user: { apiKey: 'k' } }, dispatch: vi.fn() };
    expect(await waitForApiKey(store)).toBe('k');
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
