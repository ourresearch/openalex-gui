import { describe, it, expect, vi } from 'vitest';
import { bootUser, runInBackground, shouldDropSavedSearchId } from '@/store/userBoot';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('bootUser (oxjob #860)', () => {
  it('resolves after /me is applied, without waiting for background loads', async () => {
    const me = deferred();
    const saved = deferred();
    const order = [];
    const applyMe = vi.fn(() => order.push('applyMe'));
    const bg = vi.fn(() => { order.push('bg'); return saved.promise; });

    const boot = bootUser({ fetchMe: () => me.promise, applyMe, background: [bg] });
    await tick();
    expect(bg).not.toHaveBeenCalled();   // nothing starts before /me

    me.resolve({ id: 'user-1' });
    const { me: result } = await boot;  // resolves while `saved` is still pending
    expect(result).toEqual({ id: 'user-1' });
    expect(applyMe).toHaveBeenCalledWith({ id: 'user-1' });
    expect(order).toEqual(['applyMe', 'bg']);
    saved.resolve();
  });

  it('propagates a /me failure (the router guard decides about logout)', async () => {
    const err = { response: { status: 401 } };
    const bg = vi.fn();
    await expect(
      bootUser({ fetchMe: () => Promise.reject(err), applyMe: vi.fn(), background: [bg] })
    ).rejects.toBe(err);
    expect(bg).not.toHaveBeenCalled();
  });

  it('starts all background loads concurrently, not in series', async () => {
    const a = deferred(), b = deferred();
    const started = [];
    const { settled } = await bootUser({
      fetchMe: async () => ({}),
      applyMe: () => {},
      background: [
        () => { started.push('a'); return a.promise; },
        () => { started.push('b'); return b.promise; },
      ],
    });
    expect(started).toEqual(['a', 'b']);   // b did not wait for a
    a.resolve(); b.resolve();
    await settled;
  });

  it('a failing background load is logged and does not fail boot or its siblings', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ok = vi.fn(async () => 'ok');
    const { settled } = await bootUser({
      fetchMe: async () => ({}),
      applyMe: () => {},
      background: [() => Promise.reject(new Error('corrections down')), ok, () => { throw new Error('sync'); }],
    });
    const results = await settled;
    expect(results.map((r) => r.status)).toEqual(['rejected', 'fulfilled', 'rejected']);
    expect(ok).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('runInBackground with no loaders settles immediately', async () => {
    expect(await runInBackground([])).toEqual([]);
  });
});

describe('shouldDropSavedSearchId', () => {
  const list = [{ id: 'ss-1' }, { id: 'ss-2' }];
  it('never drops when there is no id in the URL', () => {
    expect(shouldDropSavedSearchId({ queryId: undefined, savedSearches: [], loaded: true })).toBe(false);
  });
  it('never drops before the list has loaded (empty ≠ not found)', () => {
    expect(shouldDropSavedSearchId({ queryId: 'ss-1', savedSearches: [], loaded: false })).toBe(false);
  });
  it('keeps an id that is in the loaded list', () => {
    expect(shouldDropSavedSearchId({ queryId: 'ss-2', savedSearches: list, loaded: true })).toBe(false);
  });
  it('drops an id missing from the loaded list', () => {
    expect(shouldDropSavedSearchId({ queryId: 'ss-9', savedSearches: list, loaded: true })).toBe(true);
    expect(shouldDropSavedSearchId({ queryId: 'ss-9', savedSearches: [], loaded: true })).toBe(true);
  });
});

import { shouldAwaitLiveUser, writeUserCache, readUserCache, clearUserCache, USER_CACHE_KEY } from '@/store/userBoot';

const route = (...metas) => metas.map((meta) => ({ meta }));

describe('shouldAwaitLiveUser (round 2: public routes never wait)', () => {
  it('public route: never waits, known user or not', () => {
    expect(shouldAwaitLiveUser({ matched: route({}), haveUser: false })).toBe(false);
    expect(shouldAwaitLiveUser({ matched: route({}), haveUser: true })).toBe(false);
    expect(shouldAwaitLiveUser({ matched: [], haveUser: false })).toBe(false);
  });
  it('requiresAuth: waits only when the user is still unknown', () => {
    expect(shouldAwaitLiveUser({ matched: route({ requiresAuth: true }), haveUser: false })).toBe(true);
    expect(shouldAwaitLiveUser({ matched: route({ requiresAuth: true }), haveUser: true })).toBe(false);
  });
  it.each(['requiresAdmin', 'requiresOrgOwner', 'requiresSiteWideAccess', 'requiresOrgCuratorOrOwner'])(
    'role-gated (%s): always waits for the live user, even with a cached one', (k) => {
      expect(shouldAwaitLiveUser({ matched: route({ requiresAuth: true }, { [k]: true }), haveUser: true })).toBe(true);
    });
  it('nested route records: any record in the chain counts', () => {
    expect(shouldAwaitLiveUser({ matched: route({}, { requiresAdmin: true }), haveUser: true })).toBe(true);
    expect(shouldAwaitLiveUser({ matched: [{ meta: undefined }, { meta: { requiresAuth: true } }], haveUser: false })).toBe(true);
  });
});

describe('user cache (stale-while-revalidate /users/me)', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };
  const me = { id: 'user-1', display_name: 'J', email: 'j@x.org', is_admin: true, api_key: 'SECRET', retired_api_key: 'OLD', notes: 'internal', exports: [1, 2], feature_flags: ['oql'] };

  it('round-trips for the same token', () => {
    const s = mem();
    expect(writeUserCache(s, 'tok', me)).toBe(true);
    const back = readUserCache(s, 'tok');
    expect(back.id).toBe('user-1');
    expect(back.feature_flags).toEqual(['oql']);
    expect(back.is_admin).toBe(true);
  });
  it('strips secrets and bulk fields', () => {
    const s = mem(); writeUserCache(s, 'tok', me);
    const raw = s.getItem(USER_CACHE_KEY);
    expect(raw).not.toContain('SECRET');
    expect(raw).not.toContain('OLD');
    const back = readUserCache(s, 'tok');
    expect(back).not.toHaveProperty('api_key');
    expect(back).not.toHaveProperty('retired_api_key');
    expect(back).not.toHaveProperty('exports');
    expect(back).not.toHaveProperty('notes');
  });
  it('is bound to the token: another login or a rotated key ignores it', () => {
    const s = mem(); writeUserCache(s, 'tok-A', me);
    expect(readUserCache(s, 'tok-B')).toBeNull();
    expect(readUserCache(s, null)).toBeNull();
    expect(readUserCache(s, '')).toBeNull();
  });
  it('never writes without a token or a real user', () => {
    const s = mem();
    expect(writeUserCache(s, null, me)).toBe(false);
    expect(writeUserCache(s, 'tok', null)).toBe(false);
    expect(writeUserCache(s, 'tok', { display_name: 'no id' })).toBe(false);
    expect(s.getItem(USER_CACHE_KEY)).toBeNull();
  });
  it('tolerates corrupt JSON and a throwing storage', () => {
    const s = mem(); s.setItem(USER_CACHE_KEY, '{not json');
    expect(readUserCache(s, 'tok')).toBeNull();
    const boom = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => { throw new Error('x'); } };
    expect(readUserCache(boom, 'tok')).toBeNull();
    expect(writeUserCache(boom, 'tok', me)).toBe(false);
    expect(() => clearUserCache(boom)).not.toThrow();
    expect(() => clearUserCache(null)).not.toThrow();
  });
  it('clearUserCache removes it', () => {
    const s = mem(); writeUserCache(s, 'tok', me); clearUserCache(s);
    expect(readUserCache(s, 'tok')).toBeNull();
  });
});
