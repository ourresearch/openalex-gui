// Vuex module: the canonical query state (oxjob #464 pillar A — Phase 0).
//
// GOAL (pillar A): make ONE canonical OQO the frontend's single source of truth
// and POST it as the primary GUI↔API channel, dissolving the multi-representation
// sync bugs (the #369 "random-query dice landed on the previous query" race — see
// the job EXPLORE "Motivating evidence"). The backend channel already exists:
// `POST /` body `{oqo:{...}}` runs the query and echoes the server-canonical OQO in
// `meta.x_query.oqo` (elastic-api, shipped #372 Phase 3) — so pillar A is a nearly
// pure frontend re-architecture (no new backend endpoint).
//
// PHASE 0 (this file) is deliberately a NO-OP SHADOW. It is NOT yet authoritative:
//   - `queryOqo` + `viewState` are populated FROM each settled response's
//     `meta.x_query.oqo` (split into the citeable query vs. the view chrome), so the
//     canonical model exists and is observable, but nothing reads it to drive a fetch.
//   - `executionOqo` reconstructs the object we WOULD POST once the store is
//     authoritative (Phase 1).
//   - A dev-only round-trip assertion (syncFromResponse, guarded by NODE_ENV) POSTs
//     that reconstructed `executionOqo` back through `api.executeOqo` and checks it
//     returns the SAME results as the live (GET / executeOql) response — de-risking
//     the cutover before Phase 1 routes the real fetch through POST-OQO.
// Phase 1 flips `authoritative` and makes the SERP fetch read `executionOqo`.
//
// THE QUERY / VIEW SPLIT (job decisions D1/D2 + the ⭐ shareable-state table;
// completed by #661's column-model redesign):
//   queryOqo = the citeable query (entity + filters + corpus). This is the
//   share/dedup key pillar B mints.
//   viewState = recipient-local OQO chrome (sidebar group_by widgets, dice
//   seed/sample) — stripped from the share id, but still rides in the OQO.
//   sort / paging = client-owned view state (#661): sort is transient per result
//   set, paging is session chrome; both are POSTed as SIBLING request params
//   beside the OQO, never inside it. Columns never touch this store at all —
//   they're the sticky per-entity localStorage preference (useColumnsState).
// `group_by` is the sidebar widget set = chrome (D1: recipient keeps their own), NOT
// the analytical Stage-B grouping; the default sort is owned by the engine and never
// stored (D2) — a null state.sort means "engine default".
//
// state() is a FUNCTION (per-store isolation; see oqlBuilder.store.js).

import {
  toggleRefinementValue as toggleRefinementValueRows,
  setRefinementValue as setRefinementValueRows,
  setRefinementValues as setRefinementValuesRows,
  removeRefinement as removeRefinementRows,
} from "@/components/Oql/refinements";


// The fields of an OQO that constitute the citeable QUERY (ride in the share id)…
// `corpus` (#481) is a corpus SELECTION — part of the query's identity (it renders
// in the canonical OQL, e.g. "works (all corpora)"), so it must survive the split:
// dropping it made every store-driven re-execution (facet group_bys, refinements,
// sort edits) silently fall back to the core corpus (#642).
// #661: sort_by/select are GONE from the OQO entirely (public spec v1.4) — sort is
// transient client state (state.sort), columns are the sticky per-entity
// localStorage preference (useColumnsState); neither ever enters the query.
const QUERY_KEYS = ["get_rows", "filter_rows", "corpus"];
// …vs. the OQO's recipient-local chrome that still rides IN the OQO (part of an
// execution, not the query identity). `seed`/`sample` back the random-query dice.
// #661: page/per_page/cursor left the OQO too — they travel as sibling request
// params (state.paging → executionParams), per the query/view split.
const VIEW_KEYS = ["group_by", "seed", "sample"];

// Keep only the keys whose value is actually present (not null/undefined), so a
// reconstructed OQO never sends spurious nulls and matches the server's "absent =
// default" canonical form.
const pickDefined = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && obj[k] != null) acc[k] = obj[k];
    return acc;
  }, {});

// Split a (server-canonical) OQO into the query slice and the view slice.
export const splitOqo = (oqo) => ({
  queryOqo: pickDefined(oqo || {}, QUERY_KEYS),
  viewState: pickDefined(oqo || {}, VIEW_KEYS),
});

export default {
  namespaced: true,
  state: () => ({
    // The citeable query (entity + filters + corpus). Source of truth
    // in Phase 1+; a shadow of the response in Phase 0.
    queryOqo: null,
    // Recipient-local OQO chrome (sidebar group_by widgets, dice seed/sample).
    viewState: {},
    // The current result-set's sort — TRANSIENT client state (#661): set by the
    // sort UI, reset to null (= engine default) on every new query, never part of
    // the OQO or the URL. null | [{column_id, direction}].
    sort: null,
    // Client-owned paging (#661): {page?, per_page?, cursor?}. Travels as sibling
    // request params next to the OQO, never inside it. per_page survives query
    // edits (it's a size preference); page/cursor reset on any query change.
    paging: {},
    // Phase gate. Phase 2a (#464) FLIPS this true: the store now drives the SERP
    // fetch for OQL-mode queries (`route.query.oql` present). Components branch on
    // it during the surface-by-surface migration; basic/chip (OXURL) mode still
    // uses the legacy URL path.
    authoritative: true,
    // Monotonic edit counter. Every edit-surface ACTION (setSort, …) bumps it; the
    // SERP execution watcher (Serp.vue) watches it and POSTs `executionOqo` via
    // `api.executeOqo`. Seeding from a response (`syncFromResponse`) deliberately
    // does NOT bump it, so adopting the server-canonical OQO never re-triggers a
    // fetch. This is the single-writer mechanism: edits → store → one execution.
    editEpoch: 0,
    // The OQL string we most recently executed + projected to the URL. The inbound
    // route watcher uses it to recognise its OWN `replaceState` projection and skip
    // a redundant re-fetch (a store-driven edit executes via POST-OQO, then projects
    // `?oql=<canonical>`; without this the route change would fetch a second time).
    lastExecutedOql: null,
    // Nav intent of the LAST edit (Phase 2b, #464): 'push' or 'replace'. The SERP
    // projector reads it to decide `url.pushToRoute` vs `url.replaceToRoute` when it
    // writes the canonical URL — so the back button behaves by edit SEMANTICS, fixed
    // in ONE place instead of per-surface. Policy (job decision, 2026-06-18):
    //   push  (back-worthy) = a new query: add/remove a filter or search term, change
    //                         entity type, dice.
    //   replace (tuning)    = sort flip, paging, group-by toggle, debounced keystroke.
    // Defaults to 'replace' (the safe, non-history-littering choice); every edit
    // action sets it explicitly via the `bumpEdit` payload.
    lastEditNav: "replace",
  }),
  getters: {
    // The OQO we POST to `/` to execute: the citeable query merged with the OQO
    // chrome (group_by/seed/sample). Pure "which rows" (#661) — sort and paging
    // travel beside it as sibling params (executionParams below), never inside.
    executionOqo: (state) => {
      if (!state.queryOqo) return null;
      return { ...state.queryOqo, ...pickDefined(state.viewState, VIEW_KEYS) };
    },
    // The sibling request params for that execution, in the classic wire syntax
    // the API takes next to the OQO (`sort=col:desc,col2:asc`, `page`, `per_page`,
    // `cursor`). Only keys with a value are present. (#661 query/view split.)
    executionParams: (state) => {
      const params = {};
      if (Array.isArray(state.sort) && state.sort.length) {
        params.sort = state.sort
          .map((s) => `${s.column_id}:${s.direction === "asc" ? "asc" : "desc"}`)
          .join(",");
      }
      for (const k of ["page", "per_page", "cursor"]) {
        if (state.paging?.[k] != null) params[k] = state.paging[k];
      }
      return params;
    },
    // The current TOP-LEVEL filter rows of the citeable query. The stats-widget
    // facets (#528) read this to show their selected/checked state, and the
    // refinement actions below rewrite it. `[]` when there's no query yet.
    queryFilterRows: (state) => state.queryOqo?.filter_rows || [],
  },
  mutations: {
    setViewState(state, view) {
      state.viewState = view || {};
    },
    setAuthoritative(state, v) {
      state.authoritative = !!v;
    },
    setLastExecutedOql(state, oql) {
      state.lastExecutedOql = oql;
    },
    // Bump the edit counter — the signal the SERP execution watcher fires on — and
    // record this edit's nav intent ('push' | 'replace', default 'replace') so the
    // projector picks push-vs-replace by edit semantics (Phase 2b back-button policy).
    bumpEdit(state, nav = "replace") {
      state.lastEditNav = nav === "push" ? "push" : "replace";
      state.editEpoch++;
    },
    // Replace the whole citeable query (entity + filters + corpus).
    setQueryOqoFull(state, oqo) {
      state.queryOqo = oqo;
    },
    // Shallow-merge a patch into the citeable query; a key set to `undefined`
    // is DELETED so the reconstructed OQO keeps the server's "absent = default"
    // canonical shape (e.g. clearing filter_rows back to "no filters").
    patchQueryOqo(state, patch) {
      const next = { ...(state.queryOqo || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      state.queryOqo = next;
    },
    // Same, for the OQO chrome (group_by/seed/sample).
    patchViewState(state, patch) {
      const next = { ...(state.viewState || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      state.viewState = next;
    },
    // The transient result-set sort (#661): null clears back to the engine default.
    setSortState(state, sort) {
      state.sort = Array.isArray(sort) && sort.length ? sort : null;
    },
    // Client-owned paging (#661): a key set to `undefined` is deleted.
    patchPaging(state, patch) {
      const next = { ...(state.paging || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      state.paging = next;
    },
  },
  actions: {
    // Adopt a settled SERP response as the canonical state (the SEED). Called by the
    // SERP fetch path after EVERY execution — inbound (executeOql / legacy GET) and
    // store-driven (executeOqo) alike — so the store always mirrors the server's
    // canonical OQO. Deliberately does NOT `bumpEdit`: seeding must never re-trigger
    // the execution watcher (that would loop). Also records `lastExecutedOql` so the
    // inbound route watcher can recognise our own URL projection. Never throws.
    // #661: only the QUERY_KEYS + OQO chrome are adopted from the echo. sort and
    // paging are CLIENT-owned (transient / sibling params) — the echo never
    // overwrites them, and any sort_by/select/page/per_page/cursor a transitional
    // server still echoes is simply ignored (splitOqo drops unknown keys).
    syncFromResponse({ commit }, resultsObject) {
      const oqo = resultsObject?.meta?.x_query?.oqo;
      const oql = resultsObject?.meta?.x_query?.oql ?? null;
      if (!oqo) {
        // No canonical OQO echoed (errored / empty fetch) — clear the shadow.
        commit("setQueryOqoFull", null);
        commit("setViewState", {});
        commit("setSortState", null);
        commit("patchPaging", { page: undefined, cursor: undefined });
        commit("setLastExecutedOql", null);
        return;
      }
      const { queryOqo, viewState } = splitOqo(oqo);
      commit("setQueryOqoFull", queryOqo);
      commit("setViewState", viewState);
      commit("setLastExecutedOql", oql);
    },

    // ---- Edit-surface actions (each mutates the canonical state + bumps the edit
    // counter the execution watcher fires on) ---------------------------------

    // Set a single-dimension sort (the novice sort menu collapses multi-sorts to one).
    // `field` null/empty clears back to the engine default. `direction` defaults to
    // 'desc'. Resets to page 1 (a re-sort invalidates the current page). #661: sort
    // is transient client state, POSTed as a sibling param — never in the OQO.
    setSort({ commit }, { field, direction = "desc" } = {}) {
      commit(
        "setSortState",
        field ? [{ column_id: field, direction: direction === "asc" ? "asc" : "desc" }] : null,
      );
      commit("patchPaging", { page: undefined, cursor: undefined });
      // A sort flip is tuning, not a new query → replace (don't litter history).
      commit("bumpEdit", "replace");
    },

    // ---- Paging (Phase 2b, #464; #661 moved it to sibling params) -----------
    // In OQL mode the inbound `executeOql(oql)` channel carries ONLY the oql string,
    // so `?page=`/`?per_page=` in the URL are ignored — paging is store-driven:
    // these actions patch the client-owned `paging` slice and `executeOqo` POSTs it
    // as sibling params beside the OQO. `perPage` is passed in by the surface
    // (which owns the GUI page-size store) so the store stays decoupled from
    // url.js and the executed page size always matches the displayed one.

    // Go to a results page. page<=1 clears the key (page 1 = absent = default).
    // Always (re)assert per_page from the caller so the POSTed size is authoritative.
    setPage({ commit }, { page, perPage } = {}) {
      const patch = { page: page > 1 ? page : undefined, cursor: undefined };
      if (perPage != null) patch.per_page = perPage;
      commit("patchPaging", patch);
      commit("bumpEdit", "replace");
    },

    // Change the results-per-page. Resets to page 1 (a size change invalidates the
    // current page offset), like the legacy url.setPerPage.
    setPerPage({ commit }, { perPage } = {}) {
      commit("patchPaging", {
        per_page: perPage != null ? perPage : undefined,
        page: undefined,
        cursor: undefined,
      });
      commit("bumpEdit", "replace");
    },

    // ---- Builder / OQL-text edits (Phase 2c, #464) --------------------------
    // The OQL builder owns the WHOLE citeable query — entity (get_rows) and the
    // nested boolean filter tree (filter_rows) — and computes its OQO locally
    // (v2ToOqo). So a builder edit REPLACES the query slice wholesale (unlike
    // setSort/setPage, which patch one key). We split the incoming OQO and keep
    // only the QUERY_KEYS (so any stray view bits — including a transitional
    // builder's sort_by/select — never enter the query, #661), then reset paging
    // AND the transient sort: a query change is a new result set, and sort is
    // per-result-set state (#661 decision 3). syncFromResponse re-adopts the
    // SERVER-canonical OQO right after the executeOqo fetch, so a slightly
    // non-canonical local shape self-heals.
    //
    // nav (back-button policy, #464): the builder tags each edit's intent —
    //   'push'    a back-worthy NEW query: add/remove a filter or value, change the
    //             entity, toggle a boolean operator (a committed structural edit).
    //   'replace' tuning that shouldn't litter history: a debounced keystroke in a
    //             value being typed, a column (return) toggle.
    // The projector in Serp.vue reads lastEditNav to pick pushToRoute vs replaceToRoute.
    setQueryFromOqo({ commit }, { oqo, nav = "push" } = {}) {
      const { queryOqo } = splitOqo(oqo || {});
      commit("setQueryOqoFull", queryOqo);
      commit("setSortState", null);
      commit("patchPaging", { page: undefined, cursor: undefined });
      commit("bumpEdit", nav === "replace" ? "replace" : "push");
    },

    // ---- Stats-widget refinements (oxjob #528) ------------------------------
    // The left-rail facets refine results by adding a TOP-LEVEL AND clause to the
    // citeable query — OR within a facet, AND across facets — without touching the
    // user's authored nested tree (WoS/Scopus "refine results" model). The merge
    // logic lives in the pure `refinements` helpers; these actions just thread it
    // through queryOqo.filter_rows, reset paging (a refinement is a new query, like
    // any filter edit), and bump the edit counter with 'push' (back-worthy). A
    // refinement is a NEW query → push (mirrors the builder's add/remove-filter).
    //
    // No-op if there's no query yet (the SERP always seeds queryOqo from the first
    // response before any facet is visible, so this guard is defensive only).
    applyRefinementRows({ state, commit }, nextRows) {
      if (!state.queryOqo) return;
      commit("patchQueryOqo", { filter_rows: nextRows.length ? nextRows : undefined });
      // A refinement is a NEW query → new result set → transient sort resets
      // (#661 decision 3), and paging resets like any filter edit.
      commit("setSortState", null);
      commit("patchPaging", { page: undefined, cursor: undefined });
      commit("bumpEdit", "push");
    },

    // Multi-select facet gesture: toggle one scalar value in `columnId` on/off.
    toggleRefinementValue({ getters, dispatch }, { columnId, value, operator } = {}) {
      const next = toggleRefinementValueRows(getters.queryFilterRows, { columnId, value, operator });
      dispatch("applyRefinementRows", next);
    },

    // Single-value facet (boolean / range): set `columnId` to exactly `value`
    // (null/empty clears it).
    setRefinementValue({ getters, dispatch }, { columnId, value, operator } = {}) {
      const next = setRefinementValueRows(getters.queryFilterRows, { columnId, value, operator });
      dispatch("applyRefinementRows", next);
    },

    // Multi-select "More…" dialog: replace `columnId`'s selection with EXACTLY
    // `values` (the dialog owns the whole set).
    setRefinementValues({ getters, dispatch }, { columnId, values, operator } = {}) {
      const next = setRefinementValuesRows(getters.queryFilterRows, { columnId, values, operator });
      dispatch("applyRefinementRows", next);
    },

    // Clear a facet's refinement entirely.
    removeRefinement({ getters, dispatch }, { columnId, operator } = {}) {
      const next = removeRefinementRows(getters.queryFilterRows, { columnId, operator });
      dispatch("applyRefinementRows", next);
    },
  },
};
