// Derive classic REST export params from the server's canonical x_query.url echo.
//
// On the OQL route (/q?oql=...) the query never appears as `filter=`/`search=`
// route params, so the export request can't be built from route.query the way
// the classic SERP does — doing so silently exports the ENTIRE corpus (the
// users-api /export endpoint treats "no filter" as "all works"). Instead we
// source the scope from `meta.x_query.url`, the server's own classic-URL
// rendering of the canonical OQO (e.g. "/works?filter=authorships...").
//
// Returns a plain {param: value} object to merge into the export request, or
// null when the export CANNOT be faithfully scoped and must be blocked:
//   - x_query.url is null/absent (the query isn't URL-expressible: nested
//     boolean trees, non-core corpus, ...), or
//   - the rendered URL carries a row-set-changing param the export pipeline
//     doesn't honor (e.g. `sample=` — the exporter would return the full
//     filtered set, not the sample). Unknown params are treated the same way:
//     refusing is always safer than mis-scoping.

// Params forwarded verbatim — these define (or order) the exported row set and
// are all accepted by the users-api /export endpoint.
const PASS_THROUGH_PARAMS = new Set([
  'filter',
  'sort',
  'include_xpac',
  'search',
  'search.exact',
  'search.semantic',
  'search.title',
  'search.title.exact',
  'search.title_and_abstract',
  'search.title_and_abstract.exact',
]);

// View chrome that doesn't change WHICH rows exist: safe to drop. The export
// worker manages its own cursor/per_page, and column selection travels
// separately as columns_v2.
const IGNORED_PARAMS = new Set([
  'page',
  'per_page',
  'per-page',
  'cursor',
  'select',
  'group_by',
  'group-by',
  'group_bys',
  'group-bys',
  'seed',
  'mailto',
  'api_key',
]);

export function deriveOqlExportParams(xQueryUrl) {
  if (!xQueryUrl) return null;
  let parsed;
  try {
    parsed = new URL(xQueryUrl, 'https://api.openalex.org');
  } catch {
    return null;
  }
  const out = {};
  for (const [key, value] of parsed.searchParams.entries()) {
    if (PASS_THROUGH_PARAMS.has(key)) {
      out[key] = value;
    } else if (!IGNORED_PARAMS.has(key)) {
      return null;
    }
  }
  return out;
}
