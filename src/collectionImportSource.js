// What an import adds to a collection: the search on screen, as the API runs it
// (oxjob #1527). "Save results as a collection" and "Select all" send this instead of
// IDs, and users-api pages it on the server.
//
// The server-canonical query rides on every executed response as meta.x_query: its
// `url` (the flat /works?filter=... form) when the query has one, else its OQL.
// Responses from the legacy GET path carry neither, so the route builds the URL.

import { searchParamKeys } from '@/searchParamKeys';

// The API URL for the route's filter, searches and sort (the legacy path).
export function legacyApiUrl(routeQuery, entityType) {
  const params = new URLSearchParams();
  if (routeQuery.filter) params.set('filter', routeQuery.filter);
  for (const key of searchParamKeys) {
    if (routeQuery[key]) params.set(key, routeQuery[key]);
  }
  if (routeQuery.sort) params.set('sort', routeQuery.sort);
  const qs = params.toString();
  return `https://api.openalex.org/${entityType}${qs ? '?' + qs : ''}`;
}

// {query} or {oql}, for POST /collections/{id}/imports.
export function importSource(resultsObject, routeQuery, entityType) {
  const xq = resultsObject?.meta?.x_query;
  if (xq?.url) return { query: `https://api.openalex.org${xq.url}` };
  const oql = xq?.oql || routeQuery?.oql;
  if (oql) return { oql };
  return { query: legacyApiUrl(routeQuery || {}, entityType) };
}
