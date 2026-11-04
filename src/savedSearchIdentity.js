// Which saved search is this page? (oxjob #2002)
//
// A results page names a saved search with `?id=`. Eight-odd places write that param
// (save, open, create alert, copy, alert emails, shared links, chip edits that keep
// the rest of the URL), and two readers used to judge it on their own:
//   - the SERP dropped any `?id=` it couldn't find in the list, signed-out visitors
//     included, with a push to the 'Serp' route that throws on `/q` (Sentry GUI-V):
//     a copied or alert-email link opened an empty page;
//   - the star and bell matched by id alone, so after a chip edit on an old-format
//     (`?filter=`) saved search they still said "Saved, alert active" while the alert
//     kept running the stored query.
// Both now ask savedSearchIdState(). Its states:
//   none     no `?id=`, or nobody signed in (an id means nothing to a visitor; the query still runs)
//   loading  signed in, the saved-search list hasn't arrived yet
//   unknown  signed in, list loaded, the id isn't in it (deleted, or someone else's): drop it from the URL
//   edited   the id is theirs, but this page's query isn't the one stored: not "saved"
//   saved    the id is theirs and the stored query is this page's query

import { oqlForUrl } from "@/oqlSerialize";

// URL params that change how results are shown or which page, never which works.
const NOT_THE_QUERY = new Set([
    "id", "page", "per_page", "per-page", "cursor",
    "view", "mode", "group_by", "show_api", "hide_results",
    "ui", "elastic", "data-version", "v2",
]);

// The query a page runs, as one comparable string: the entity (from the path, except
// on OQL links, where the OQL names it) plus every query param, sorted, OQL whitespace
// collapsed the way the URL writer does it.
export function searchQueryKey(path, query) {
    const params = Object.entries(query || {})
        .filter(([k, v]) => !NOT_THE_QUERY.has(k) && v != null && v !== "")
        .map(([k, v]) => {
            const value = Array.isArray(v) ? v.join(",") : String(v);
            return [k, k === "oql" ? oqlForUrl(value) : value];
        })
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const isOql = params.some(([k]) => k === "oql");
    const entity = isOql ? "" : String(path || "").split("/").filter(Boolean)[0] || "";
    return JSON.stringify([entity, params]);
}

// The stored `search_url` (a full https://openalex.org/... link) read the same way, and
// the way the router reads it on arrival: `arrivalQuery` is its rewrite of an inbound link
// (url.filterSearchRedirectQuery: #397 turns `filter=title.search:x` into `search.title=x`),
// or null when it leaves the link alone. Without it an unedited old link reads as edited.
export function savedSearchQueryKey(searchUrl, arrivalQuery) {
    try {
        const u = new URL(searchUrl, "https://openalex.org");
        const query = Object.fromEntries(u.searchParams);
        return searchQueryKey(u.pathname, arrivalQuery?.(query) || query);
    } catch {
        return null;
    }
}

export function savedSearchIdState({ queryId, signedIn, loaded, savedSearches, path, query, arrivalQuery }) {
    if (!queryId || !signedIn) return "none";
    if (!loaded) return "loading";
    const saved = (savedSearches || []).find((s) => s.id === queryId);
    if (!saved) return "unknown";
    return savedSearchQueryKey(saved.search_url, arrivalQuery) === searchQueryKey(path, query) ? "saved" : "edited";
}
