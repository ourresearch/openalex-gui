import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1091 (ZD 26666): the toolbar names a saved search after its query text, and
// users-api refuses a name over 400 characters, so a long Boolean search failed to save
// with no message. The store caps the name, and a refused save says why.

vi.mock('axios', () => ({ default: { put: vi.fn(), get: vi.fn() } }));
vi.mock('@/url', () => ({ url: { pushSearchUrlToRoute: vi.fn() } }));
vi.mock('@/api', () => ({ api: {} }));
vi.mock('@/navigation', () => ({ navigation: {} }));
vi.mock('@/apiConfig.js', () => ({ urlBase: { userApi: 'https://user.test' }, axiosConfig: () => ({}) }));
vi.mock('@/util', () => ({ sanitizeRedirectPath: (x) => x }));
vi.mock('@/store/userBoot', () => ({
  bootUser: vi.fn(), readUserCache: vi.fn(), writeUserCache: vi.fn(), clearUserCache: vi.fn(),
}));
vi.mock('@/components/Entity/claimCopy.js', () => ({ orcidAutoClaim: vi.fn() }));

import axios from 'axios';
import userStore, { capSavedSearchName, SAVED_SEARCH_NAME_MAX } from '../store/user.store';

function ctx() {
  return { commit: vi.fn(), dispatch: vi.fn(), state: { savedSearches: [] } };
}

beforeEach(() => {
  axios.put.mockReset();
});

const LONG = '((“Saudi Arabia” OR UAE) AND (“air defence” OR “missile defence”)) '.repeat(10); // 680+ chars

describe('saved search names (oxjob #1091)', () => {
  it('caps a long name at the API limit, counting characters as the API does', () => {
    const capped = capSavedSearchName(LONG);
    expect(Array.from(capped).length).toBeLessThanOrEqual(SAVED_SEARCH_NAME_MAX);
    expect(capped.endsWith('…')).toBe(true);
    expect(capSavedSearchName('short')).toBe('short');
    expect(capSavedSearchName(undefined)).toBe(undefined);
  });

  it('createSearch sends the capped name', async () => {
    axios.put.mockResolvedValueOnce({ data: {} });
    await userStore.actions.createSearch(ctx(), { search_url: 'https://openalex.org/works?search=x', name: LONG });
    expect(Array.from(axios.put.mock.calls[0][1].name).length).toBeLessThanOrEqual(400);
  });

  it('a refused save shows the reason instead of failing silently', async () => {
    axios.put.mockRejectedValueOnce(Object.assign(new Error('400'), {
      response: { status: 400, data: { message: 'search_url is required' } },
    }));
    const c = ctx();
    await expect(userStore.actions.createSearch(c, { search_url: 'https://openalex.org/works?search=x', name: 'n' }))
      .rejects.toThrow('400');
    expect(c.commit).toHaveBeenCalledWith('snackbar',
      { msg: "Couldn't save this search: search_url is required", color: 'error' }, { root: true });
  });
});
