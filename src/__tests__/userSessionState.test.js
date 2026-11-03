import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1999: who is signed in, and with which key, has one signed-out definition (initial state and logout),
// the boot-from-cache keeps the person's key, a rename touches only the name, and a magic-link login counts as
// done when its own call succeeded.

vi.mock('axios', () => ({ default: { post: vi.fn(), patch: vi.fn() } }));
vi.mock('@/url', () => ({ url: {} }));
vi.mock('@/api', () => ({ api: {} }));
vi.mock('@/navigation', () => ({ navigation: { push: vi.fn() } }));
vi.mock('@/apiConfig.js', () => ({ urlBase: { userApi: 'https://user.test' }, axiosConfig: () => ({}) }));
vi.mock('@/util', () => ({ sanitizeRedirectPath: (x) => x }));
vi.mock('@/components/Entity/claimCopy.js', () => ({ orcidAutoClaim: vi.fn() }));
vi.mock('@/store/magicLoginConfig.js', () => ({ magicLoginConfig: () => ({}) }));

import axios from 'axios';
import userStore, { signedOutUser } from '../store/user.store';
import { apiKeyFromToken, writeUserCache } from '../store/userBoot';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

const KEY = 'aB3dE5gH7jK9mN1pQ3sT5v';  // 22 letters and digits, like users-api's generate_api_key

beforeEach(() => {
  globalThis.localStorage = memoryStorage();
  axios.post.mockReset();
  axios.patch.mockReset();
});

describe('apiKeyFromToken', () => {
  it('uses a key-shaped token as the key', () => {
    expect(apiKeyFromToken(KEY)).toBe(KEY);
  });
  it('refuses a JWT (pre-#290 session) and empty values', () => {
    expect(apiKeyFromToken('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl')).toBeNull();
    expect(apiKeyFromToken(null)).toBeNull();
    expect(apiKeyFromToken('')).toBeNull();
  });
});

describe('logout', () => {
  it('clears every signed-in field, the key and the admin flag included', () => {
    const state = { ...userStore.state(), id: 'user-1', name: 'Ada', apiKey: KEY, retiredApiKey: 'old', isAdmin: true,
      activeBoost: { plan: 'x' }, verifiedOrcid: '0000-0001', columnViews: ['kept'] };
    localStorage.setItem('token', KEY);
    userStore.mutations.logout(state);
    const { columnViews, facetViews, isSaving, renameId, editAlertId, activeSearchId,
      impersonatingUserId, impersonatingUserName, ...identity } = state;
    expect(identity).toEqual(signedOutUser());
    expect(columnViews).toEqual(['kept']);          // view preferences aren't identity
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('the initial state is the signed-out state', () => {
    const state = userStore.state();
    for (const [k, v] of Object.entries(signedOutUser())) expect(state[k]).toEqual(v);
  });
});

describe('restoreUserFromCache', () => {
  it('boots with the person\'s key, though the cache strips it', () => {
    localStorage.setItem('token', KEY);
    writeUserCache(localStorage, KEY, { id: 'user-1', display_name: 'Ada', api_key: KEY });
    const commit = vi.fn();
    const state = { id: '' };
    expect(userStore.actions.restoreUserFromCache({ commit, state })).toBe(true);
    const [name, payload] = commit.mock.calls[0];
    expect(name).toBe('setFromApiResp');
    expect(payload.id).toBe('user-1');
    expect(payload.api_key).toBe(KEY);
  });
});

describe('updateName', () => {
  it('changes only the name', async () => {
    axios.patch.mockResolvedValueOnce({ data: {} });
    const commit = vi.fn();
    const state = { ...userStore.state(), id: 'user-1', apiKey: KEY, isAdmin: true, authorId: 'A1' };
    await userStore.actions.updateName({ commit, dispatch: vi.fn(), state }, 'Ada L.');
    expect(commit).toHaveBeenCalledWith('setName', 'Ada L.');
    expect(commit.mock.calls.map((c) => c[0])).not.toContain('setFromApiResp');
    userStore.mutations.setName(state, 'Ada L.');
    expect(state).toMatchObject({ name: 'Ada L.', apiKey: KEY, isAdmin: true, authorId: 'A1' });
  });
});

describe('loginWithMagicToken', () => {
  it('resolves once the login call succeeded, even when the profile load after it fails', async () => {
    axios.post.mockResolvedValueOnce({ data: { api_key: KEY, key_activated: true } });
    const commit = vi.fn();
    const dispatch = vi.fn().mockRejectedValueOnce(new Error('504 on /users/me'));
    const data = await userStore.actions.loginWithMagicToken({ commit, dispatch }, { token: 't' });
    expect(commit).toHaveBeenCalledWith('setToken', KEY);
    expect(data.key_activated).toBe(true);
  });

  it('rejects when the login call itself is refused', async () => {
    const refused = Object.assign(new Error('403'), { response: { status: 403, data: { code: 'turnstile_required' } } });
    axios.post.mockRejectedValueOnce(refused);
    await expect(userStore.actions.loginWithMagicToken({ commit: vi.fn(), dispatch: vi.fn() }, { token: 't' }))
      .rejects.toBe(refused);
  });
});
