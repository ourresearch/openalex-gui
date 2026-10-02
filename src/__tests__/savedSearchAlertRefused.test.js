import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1505: users-api refuses to switch an alert on when it can't run (a works
// collection never gains new works) with a 400 and the reason. The store shows the
// reason; creating a search with an alert still saves the search, without the alert.

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
import userStore from '../store/user.store';

const REASON = "Alerts aren't available for a works collection: it's a fixed list of works.";
const refused = () => Object.assign(new Error('400'), {
  response: { status: 400, data: { message: REASON } },
});

function ctx(savedSearches = []) {
  return {
    commit: vi.fn(),
    dispatch: vi.fn(),
    state: { savedSearches },
  };
}

beforeEach(() => {
  axios.put.mockReset();
});

describe('alert refused by the API (oxjob #1505)', () => {
  it('updateSearchAlert shows the reason and does not claim the alert was added', async () => {
    axios.put.mockRejectedValueOnce(refused());
    const c = ctx([{ id: 's1', search_url: 'https://openalex.org/works?filter=collection:col_x' }]);
    await userStore.actions.updateSearchAlert(c, { id: 's1', has_alert: true });
    expect(c.commit).toHaveBeenCalledWith('snackbar', { msg: REASON, color: 'error' }, { root: true });
    expect(c.commit).not.toHaveBeenCalledWith('snackbar', 'Alert added', { root: true });
  });

  it('createSearch with an alert saves the search without it and shows the reason', async () => {
    axios.put.mockRejectedValueOnce(refused()).mockResolvedValueOnce({ data: {} });
    const c = ctx();
    await userStore.actions.createSearch(c, {
      search_url: 'https://openalex.org/works?filter=collection:col_x', name: 'n', has_alert: true,
    });
    expect(axios.put).toHaveBeenCalledTimes(2);
    expect(axios.put.mock.calls[1][1].has_alert).toBe(false);
    expect(c.commit).toHaveBeenCalledWith('snackbar', { msg: REASON, color: 'error' }, { root: true });
  });

  it('other errors still throw', async () => {
    axios.put.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500 } }));
    await expect(userStore.actions.updateSearchAlert(ctx([{ id: 's1' }]), { id: 's1', has_alert: true }))
      .rejects.toThrow('500');
  });
});
