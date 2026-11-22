import { describe, it, expect } from 'vitest';
import { orcidTripUrl, takeOrcidTrip, newSignupKeyHash, signupKeys } from '@/components/Orcid/orcidAuth.js';

// Trips to orcid.org and back (oxjob #2538): /orcid-callback uses a code only when its state is one this browser
// saved, once, within 30 minutes.
function memoryStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

const T0 = 1_000_000;
const env = (storage, now = T0) => ({ storage, origin: 'https://openalex.org', cryptoObj: globalThis.crypto, now });
const stateOf = (url) => new URL(url).searchParams.get('state');

describe('ORCID trips (#2538)', () => {
  it('saves the trip and sends its state to ORCID', () => {
    const storage = memoryStorage();
    const u = new URL(orcidTripUrl({ flow: 'login', redirect: '/works' }, env(storage)));
    const state = u.searchParams.get('state');
    expect(state).toMatch(/^[0-9a-f]{32}$/);
    expect(u.searchParams.get('redirect_uri')).toBe('https://openalex.org/orcid-callback');
    expect(takeOrcidTrip(state, { storage, now: T0 })).toEqual({ flow: 'login', authorId: null, redirect: '/works', userId: null });
  });

  it('refuses a state this browser did not save, and keeps the real trip', () => {
    const storage = memoryStorage();
    const state = stateOf(orcidTripUrl({ flow: 'settings', userId: 'user-A' }, env(storage)));
    expect(takeOrcidTrip('0123456789abcdef0123456789abcdef', { storage, now: T0 })).toBe(null);
    expect(takeOrcidTrip(state, { storage, now: T0 })).toEqual({ flow: 'settings', authorId: null, redirect: null, userId: 'user-A' });
    expect(takeOrcidTrip('anything', { storage: memoryStorage() })).toBe(null);
  });

  it('uses a state once', () => {
    const storage = memoryStorage();
    const state = stateOf(orcidTripUrl({ flow: 'claim', authorId: 'A1', userId: 'user-A' }, env(storage)));
    expect(takeOrcidTrip(state, { storage, now: T0 })?.authorId).toBe('A1');
    expect(takeOrcidTrip(state, { storage, now: T0 })).toBe(null);
  });

  it('refuses a trip older than 30 minutes, or a missing state', () => {
    const storage = memoryStorage();
    const state = stateOf(orcidTripUrl({ flow: 'signup' }, env(storage)));
    expect(takeOrcidTrip(state, { storage, now: T0 + 31 * 60 * 1000 })).toBe(null);
    orcidTripUrl({ flow: 'signup' }, env(storage));
    expect(takeOrcidTrip(undefined, { storage, now: T0 })).toBe(null);
  });

  it('two trips in two tabs both work, in either order', () => {
    const storage = memoryStorage();
    const first = stateOf(orcidTripUrl({ flow: 'login' }, env(storage)));
    const second = stateOf(orcidTripUrl({ flow: 'signup' }, env(storage, T0 + 1)));
    expect(first).not.toBe(second);
    expect(takeOrcidTrip(second, { storage, now: T0 + 2 })?.flow).toBe('signup');
    expect(takeOrcidTrip(first, { storage, now: T0 + 2 })?.flow).toBe('login');
  });

  it('keeps at most five trips', () => {
    const storage = memoryStorage();
    const states = [0, 1, 2, 3, 4, 5].map((i) => stateOf(orcidTripUrl({ flow: 'login' }, env(storage, T0 + i))));
    expect(takeOrcidTrip(states[0], { storage, now: T0 + 6 })).toBe(null);
    expect(takeOrcidTrip(states[5], { storage, now: T0 + 6 })?.flow).toBe('login');
  });

  it('knows only its four trips, and linking needs the signed-in account', () => {
    expect(() => orcidTripUrl({ flow: 'admin' }, env(memoryStorage()))).toThrow();
    expect(() => orcidTripUrl({ flow: 'settings' }, env(memoryStorage()))).toThrow();
    expect(() => orcidTripUrl({ flow: 'claim', authorId: 'A1' }, env(memoryStorage()))).toThrow();
  });

  it('keeps sign-up keys here and hands out only their SHA-256', async () => {
    const storage = memoryStorage();
    const hash1 = await newSignupKeyHash({ storage, cryptoObj: globalThis.crypto, now: T0 });
    const hash2 = await newSignupKeyHash({ storage, cryptoObj: globalThis.crypto, now: T0 + 1 });
    const keys = signupKeys({ storage, now: T0 + 2 });
    expect(keys).toHaveLength(2);
    const sha = async (k) => Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(k))),
      (b) => b.toString(16).padStart(2, '0')).join('');
    expect(await sha(keys[0])).toBe(hash2);
    expect(await sha(keys[1])).toBe(hash1);
    // Two days later they're gone; unreadable storage means no keys, never an error.
    expect(signupKeys({ storage, now: T0 + 3 * 24 * 60 * 60 * 1000 })).toEqual([]);
    expect(signupKeys({ storage: { getItem: () => { throw new Error('blocked'); } } })).toEqual([]);
  });
});
