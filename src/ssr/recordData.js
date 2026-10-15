// #1689 (Sentry OPENALEX-GUI-J): a record page's useAsyncData result must belong
// to the route on screen.
//
// EntityPage is one component instance reused across record navigations
// (/authors/A… → /works/W…), and its useAsyncData key follows the route. When
// that key changes, Nuxt 4 seeds the new key with the OLD key's data while the
// new fetch runs (nuxt/dist/app/composables/asyncData.js: `initialValue = oldKey
// && hadData ? _asyncData[oldKey].data.value : cachedData`). So for one render
// the page had route type 'works' but the author's record, and work-only
// components (WorkLinkouts: data.primary_location.landing_page_url) crashed.
//
// Fix: each fetch result carries the path it was fetched for, and the page only
// uses a result whose path is the current one; anything else reads as "still
// loading" (null), as it did before the Nuxt migration.

export function tagRecordData(path, data) {
  return { path, data };
}

export function recordDataFor(tagged, path) {
  if (!tagged || typeof tagged !== 'object' || tagged.path !== path) return null;
  return tagged.data ?? null;
}
