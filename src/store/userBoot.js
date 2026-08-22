// Pure helpers for the logged-in boot sequence (oxjob #860).
//
// Before #860, `user/fetchUser` awaited /users/me → /saved-search → corrections
// in series, and `router.beforeEach` awaited all of that before resolving the
// first route — App.vue renders no chrome until then, so every logged-in page
// load was a blank white page for ~1.2–1.5 s even with a warm bundle cache.
//
// Only /users/me is needed for first paint (the route guards read userId /
// isAdmin / organizationRole from it). Everything else loads in the background
// after the user is applied; consumers that genuinely need the secondary data
// (the saved-search `?id=` restore on the SERP) await `ensureSavedSearches`.

/**
 * Run `fetchMe`, apply it, then kick off the background loaders WITHOUT
 * awaiting them. Resolves as soon as `applyMe` has run.
 *
 * - A `fetchMe` failure propagates (the router guard logs out on 401).
 * - Background loaders start only after `applyMe` (they may read user state,
 *   e.g. fetchCorrections needs the email).
 * - A background failure never rejects anything; it's logged and the rest
 *   still run. `settled` resolves when all of them have finished, for callers
 *   (tests, impersonation) that want to wait.
 */
export async function bootUser({ fetchMe, applyMe, background = [] }) {
  const me = await fetchMe();
  applyMe(me);
  const settled = runInBackground(background);
  return { me, settled };
}

/** Start every loader now; never reject; resolve when all have settled. */
export function runInBackground(loaders) {
  const promises = loaders.map((load) => {
    try {
      return Promise.resolve(load());
    } catch (e) {
      return Promise.reject(e);
    }
  });
  return Promise.allSettled(promises).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`background load #${i} failed:`, r.reason);
      }
    });
    return results;
  });
}

/**
 * The SERP drops a `?id=<saved search>` that isn't in the user's list (it was
 * deleted, or belongs to someone else). With the list loading in the
 * background that check must not fire before the list has arrived — an empty
 * not-yet-loaded list is not "not found".
 */
export function shouldDropSavedSearchId({ queryId, savedSearches, loaded }) {
  if (!queryId) return false;
  if (!loaded) return false;
  return !savedSearches.some((s) => s.id === queryId);
}
