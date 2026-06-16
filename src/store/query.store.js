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

import { api } from "@/api";

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
    // Phase gate: false until Phase 1 makes this store drive the fetch. Kept here so
    // the cutover is one line and components can branch on it during the migration.
    authoritative: false,
    // Last dev-only round-trip parity result (handy to assert on in a Cypress run).
    lastParity: null,
  }),
  getters: {
    // The object we POST to `/` to execute: the citeable query merged with the
    // executable view bits. This is what Phase 1 will send instead of building a URL.
    executionOqo: (state) => {
      if (!state.queryOqo) return null;
      return { ...state.queryOqo, ...pickDefined(state.viewState, VIEW_KEYS) };
    },
  },
  mutations: {
    setQueryOqo(state, oqo) {
      state.queryOqo = oqo;
    },
    setViewState(state, view) {
      state.viewState = view || {};
    },
    setAuthoritative(state, v) {
      state.authoritative = !!v;
    },
    setLastParity(state, p) {
      state.lastParity = p;
    },
  },
  actions: {
    // Populate the shadow canonical state from a settled SERP response, then (dev
    // only) de-risk the Phase 1 cutover by POSTing the reconstructed executionOqo and
    // checking it reproduces the live response. Never throws into the fetch path.
    async syncFromResponse({ commit, getters }, resultsObject) {
      const oqo = resultsObject?.meta?.x_query?.oqo;
      if (!oqo) {
        // No canonical OQO echoed (e.g. an errored/empty fetch) — clear the shadow.
        commit("setQueryOqo", null);
        commit("setViewState", {});
        return;
      }
      const { queryOqo, viewState } = splitOqo(oqo);
      commit("setQueryOqo", queryOqo);
      commit("setViewState", viewState);

      // --- Phase 0(c): dev-only POST-OQO round-trip de-risk -------------------
      // Webpack/vue-cli injects NODE_ENV; this whole block is dead-code-eliminated
      // from the production build that auto-deploys, so prod stays untouched.
      if (process.env.NODE_ENV === "production") return;
      try {
        const execOqo = getters.executionOqo;
        const reExecuted = await api.executeOqo(execOqo);
        const liveCount = resultsObject?.meta?.count;
        const postCount = reExecuted?.meta?.count;
        const liveFirstId = resultsObject?.results?.[0]?.id ?? null;
        const postFirstId = reExecuted?.results?.[0]?.id ?? null;
        const match = liveCount === postCount && liveFirstId === postFirstId;
        const parity = { match, liveCount, postCount, liveFirstId, postFirstId };
        commit("setLastParity", parity);
        if (match) {
          console.log(
            `[pillarA/phase0] POST-OQO round-trip OK — count=${postCount}, first=${postFirstId}`,
            execOqo
          );
        } else {
          console.warn(
            "[pillarA/phase0] POST-OQO round-trip MISMATCH — the query/view split or " +
              "the POST channel diverges from the live path. Investigate before Phase 1.",
            { parity, executionOqo: execOqo, liveOqo: oqo }
          );
        }
      } catch (e) {
        // The de-risk probe must never affect the user-facing fetch.
        console.warn("[pillarA/phase0] POST-OQO round-trip probe errored:", e?.message || e);
      }
    },
  },
};
