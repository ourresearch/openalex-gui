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
