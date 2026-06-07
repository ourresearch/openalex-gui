// Translate the SERP per-row checkbox selection (the `selection` Vuex module)
// into an export-scope decision. Used by the export flow so that ticking rows
// downloads ONLY those rows instead of the whole result set (ZD #8373, #388).
//
// The selection subsystem (#179/#228) and the export subsystem (#304) were
// built separately; this is the bridge. The common case — a handful of rows
// ticked — is exported by re-querying the OpenAlex API with an
// `ids.openalex:W..|W..` filter, so no backend change is needed.

import { toDisplayFormat } from '@/openalexId';

// Max OpenAlex IDs we'll inline into an `ids.openalex:` export filter before
// falling back to a full-result-set export. The existing works-by-id fetch
// path (useAuthorWorksCuration) chunks at 50 — the OR-list size the live API is
// known to accept — so we hold that proven ceiling. It also keeps the export
// request line well under the OpenAlex / api-proxy limit (~4 KB, see #191.3).
export const MAX_INLINE_EXPORT_IDS = 50;

// Normalize any stored id form (full URL, namespaced, short) to the bare short
// form the OpenAlex `ids.openalex:` filter expects (e.g. "W2035669333").
export function bareId(id) {
  return toDisplayFormat(id, 'short') || String(id);
}

// Decide how an export should be scoped given the current selection state.
//
// Returns { scoped, reason, ids, count }:
//   scoped: true  -> export ONLY `ids` (caller builds an ids.openalex filter)
//   scoped: false -> export the full result set (current behavior); `reason`
//                    is one of 'empty' | 'select-all' | 'over-cap'.
//
// `selection` is the `selection` Vuex module state (selectedIds, excludedIds,
// selectAllMode, loadedIds, totalCount).
export function resolveExportSelection(selection, { cap = MAX_INLINE_EXPORT_IDS } = {}) {
  const s = selection || {};
  const selectAllMode = !!s.selectAllMode;
  const loadedIds = s.loadedIds || [];
  const totalCount = s.totalCount || 0;

  // In select-all mode the full set is only enumerable client-side when every
  // result is already loaded; beyond that there's no list of ids to send.
  const enumerationBlocked = selectAllMode && totalCount > loadedIds.length;

  let ids;
  if (selectAllMode) {
    const excluded = new Set(s.excludedIds || []);
    ids = loadedIds.filter((id) => !excluded.has(id));
  } else {
    ids = [...(s.selectedIds || [])];
  }

  const count = ids.length;
  if (enumerationBlocked) return { scoped: false, reason: 'select-all', ids: [], count };
  if (count === 0) return { scoped: false, reason: 'empty', ids: [], count: 0 };
  if (count > cap) return { scoped: false, reason: 'over-cap', ids, count };
  return { scoped: true, reason: 'ok', ids, count };
}

// Build the OpenAlex `ids.openalex:` filter clause that selects exactly `ids`.
export function idsOpenAlexFilter(ids) {
  return `ids.openalex:${ids.map(bareId).join('|')}`;
}
