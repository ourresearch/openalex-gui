// Signed-in first loads send their API key (oxjob #1744, 2026-10-20).
//
// On a fresh load the cached sign-in restores the user (and their feature flags) at once, but
// their API key only arrives with the live /users/me a moment later. Calls the page makes in
// that window go out keyless and count against the network's anonymous budget: on a shared
// venue Wi-Fi (or desk, whose IP was out of anonymous budget) the page's first query 429s.
// This request interceptor holds an api.openalex.org call that has no key while a sign-in token
// exists, waits once for the key (about five seconds at most), and adds it.
//
// Scope: only for accounts with `nl_search` on (the new search page), so no one else's site
// changes the night before the Users Meeting demo. shortcut: making it site-wide is one line
// (drop the nlSearch gate) once Jason says so; every signed-in first load would then wait for
// /users/me (~100-300 ms) instead of risking a keyless 429.

const WAIT_TRIES = 25;
const WAIT_MS = 200;

/** Wait for the signed-in user's API key; returns it, or null if it never came. */
export async function waitForApiKey(store, tries = WAIT_TRIES, ms = WAIT_MS) {
  if (store.state.user?.apiKey) return store.state.user.apiKey;
  try {
    await store.dispatch('user/ensureUser');
  } catch (e) { /* the poll below decides */ }
  for (let i = 0; i < tries && !store.state.user?.apiKey; i++) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  return store.state.user?.apiKey || null;
}

function authHeader(headers) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get('Authorization');
  return headers.Authorization || headers.authorization || null;
}

/** Whether this request should wait for the key. Pure, for tests. */
export function needsKeyWait(config, { hasToken, apiKey, nlSearch, apiBase, waitedOnce }) {
  if (waitedOnce || !hasToken || apiKey || !nlSearch) return false;
  if (!apiBase || !String(config?.url || '').startsWith(apiBase)) return false;
  return !authHeader(config.headers);
}

/** Install on the app's axios. `apiBase` is urlBase.api. */
export function installKeyWait(axios, store, apiBase) {
  let waitedOnce = false;
  let waiting = null;
  axios.interceptors.request.use(async (config) => {
    let hasToken = false;
    try { hasToken = !!localStorage.getItem('token'); } catch (e) { /* no storage: no token */ }
    const wait = needsKeyWait(config, {
      hasToken,
      apiKey: store.state.user?.apiKey,
      nlSearch: !!store.getters?.nlSearch,
      apiBase,
      waitedOnce,
    });
    if (!wait) return config;
    // Concurrent first-load calls share one wait; after it, never wait again this page load
    // (an expired token mustn't slow every request).
    waiting = waiting || waitForApiKey(store).finally(() => { waitedOnce = true; });
    const key = await waiting;
    if (key && !authHeader(config.headers)) {
      if (typeof config.headers?.set === 'function') config.headers.set('Authorization', `Bearer ${key}`);
      else config.headers = { ...(config.headers || {}), Authorization: `Bearer ${key}` };
    }
    return config;
  });
}
