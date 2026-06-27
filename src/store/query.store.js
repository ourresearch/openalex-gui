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
// THE QUERY / VIEW SPLIT (job decisions D1/D2 + the ⭐ shareable-state table):
//   queryOqo = the citeable query (entity + filters + sort + projection). This is the
//   share/dedup key pillar B mints.
//   viewState = recipient-local chrome (paging, sidebar group_by widgets, dice seed) —
//   stripped from the share id, but still needed to reproduce an execution.
// `group_by` is the sidebar widget set = chrome (D1: recipient keeps their own), NOT
// the analytical Stage-B grouping; the default sort is owned by the engine and never
// stored (D2) — so it simply never appears in a default query's echoed OQO.
//
// state() is a FUNCTION (per-store isolation; see oqlBuilder.store.js).

import {
  toggleRefinementValue as toggleRefinementValueRows,
  setRefinementValue as setRefinementValueRows,
  setRefinementValues as setRefinementValuesRows,
  removeRefinement as removeRefinementRows,
} from "@/components/Oql/refinements";


// The fields of an OQO that constitute the citeable QUERY (ride in the share id)…
const QUERY_KEYS = ["get_rows", "filter_rows", "sort_by", "select"];
// …vs. the executable VIEW chrome (reproduce an execution, but recipient-local / not
// part of the query identity). `seed`/`sample` back the random-query dice.
const VIEW_KEYS = ["page", "per_page", "group_by", "cursor", "seed", "sample"];

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
    // The citeable query (entity + filters + sort + projection). Source of truth
    // in Phase 1+; a shadow of the response in Phase 0.
    queryOqo: null,
    // Recipient-local view chrome (paging, sidebar widgets, dice seed).
    viewState: {},
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
    // The object we POST to `/` to execute: the citeable query merged with the
    // executable view bits. This is what Phase 1 will send instead of building a URL.
    executionOqo: (state) => {
      if (!state.queryOqo) return null;
      return { ...state.queryOqo, ...pickDefined(state.viewState, VIEW_KEYS) };
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
    // Replace the whole citeable query (entity + filters + sort + projection).
    setQueryOqoFull(state, oqo) {
      state.queryOqo = oqo;
    },
    // Shallow-merge a patch into the citeable query; a key set to `undefined`
    // is DELETED so the reconstructed OQO keeps the server's "absent = default"
    // canonical shape (e.g. clearing sort_by back to the engine default).
    patchQueryOqo(state, patch) {
      const next = { ...(state.queryOqo || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      state.queryOqo = next;
    },
    // Same, for the view chrome (page/per_page/group_by/cursor/seed/sample).
    patchViewState(state, patch) {
      const next = { ...(state.viewState || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v === undefined) delete next[k];
        else next[k] = v;
      }
      state.viewState = next;
    },
  },
  actions: {
    // Adopt a settled SERP response as the canonical state (the SEED). Called by the
    // SERP fetch path after EVERY execution — inbound (executeOql / legacy GET) and
    // store-driven (executeOqo) alike — so the store always mirrors the server's
    // canonical OQO. Deliberately does NOT `bumpEdit`: seeding must never re-trigger
    // the execution watcher (that would loop). Also records `lastExecutedOql` so the
    // inbound route watcher can recognise our own URL projection. Never throws.
    syncFromResponse({ commit }, resultsObject) {
      const oqo = resultsObject?.meta?.x_query?.oqo;
      const oql = resultsObject?.meta?.x_query?.oql ?? null;
      if (!oqo) {
        // No canonical OQO echoed (errored / empty fetch) — clear the shadow.
        commit("setQueryOqoFull", null);
        commit("setViewState", {});
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
    // `field` null/empty clears sort_by back to the engine default (D2). `direction`
    // defaults to 'desc'. Resets to page 1 (a re-sort invalidates the current page).
    setSort({ commit }, { field, direction = "desc" } = {}) {
      if (!field) {
        commit("patchQueryOqo", { sort_by: undefined });
      } else {
        commit("patchQueryOqo", {
          sort_by: [{ column_id: field, direction: direction === "asc" ? "asc" : "desc" }],
        });
      }
      commit("patchViewState", { page: undefined, cursor: undefined });
      // A sort flip is tuning, not a new query → replace (don't litter history).
      commit("bumpEdit", "replace");
    },

    // ---- Paging (Phase 2b, #464) --------------------------------------------
    // In OQL mode the inbound `executeOql(oql)` channel carries ONLY the oql string,
    // so `?page=`/`?per_page=` in the URL are ignored — paging was effectively dead
    // in OQL mode. Routing paging through the store fixes it: `executionOqo` merges
    // these view bits and `executeOqo` POSTs them inline. `perPage` is passed in by
    // the surface (which owns the GUI page-size store) so the store stays decoupled
    // from url.js and the executed page size always matches the displayed one.

    // Go to a results page. page<=1 clears the key (page 1 = absent = default).
    // Always (re)assert per_page from the caller so the POSTed size is authoritative.
    setPage({ commit }, { page, perPage } = {}) {
      const patch = { page: page > 1 ? page : undefined, cursor: undefined };
      if (perPage != null) patch.per_page = perPage;
      commit("patchViewState", patch);
      commit("bumpEdit", "replace");
    },

    // Change the results-per-page. Resets to page 1 (a size change invalidates the
    // current page offset), like the legacy url.setPerPage.
    setPerPage({ commit }, { perPage } = {}) {
      commit("patchViewState", {
        per_page: perPage != null ? perPage : undefined,
        page: undefined,
        cursor: undefined,
      });
      commit("bumpEdit", "replace");
    },

    // ---- Builder / OQL-text edits (Phase 2c, #464) --------------------------
    // The OQL builder owns the WHOLE citeable query — entity (get_rows), the nested
    // boolean filter tree (filter_rows), sort_by and select — and computes its OQO
    // locally (v2ToOqo). So a builder edit REPLACES the query slice wholesale
    // (unlike setSort/setPage, which patch one key). We split the incoming OQO and
    // keep only the QUERY_KEYS (so any stray view bits in the builder's OQO never
    // clobber the recipient-local viewState), then reset paging — a query change
    // invalidates the current page offset, exactly like setSort. syncFromResponse
    // re-adopts the SERVER-canonical OQO right after the executeOqo fetch, so a
    // slightly non-canonical local shape (e.g. an empty sort_by[]) self-heals.
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
      commit("patchViewState", { page: undefined, cursor: undefined });
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
      commit("patchViewState", { page: undefined, cursor: undefined });
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
