/**
 * oxjob #464 pillar A — canonical query store (Phase 0 split + Phase 2a edit engine).
 *
 * Phase 0 introduced the SPLIT (citeable query vs. view chrome) and the executionOqo
 * reconstruction; the real risk there is dropping a field that affects execution, so
 * the split + round-trip invariant are pinned below.
 *
 * Phase 2a (#464) makes the store AUTHORITATIVE: edit-surface actions mutate the
 * canonical state and bump `editEpoch` (the signal the SERP execution watcher POSTs
 * on), while `syncFromResponse` adopts the server-canonical OQO WITHOUT bumping (so
 * seeding never re-triggers a fetch). These tests pin that single-writer contract —
 * the mechanism the dice-bug dissolution rests on.
 */
import { describe, it, expect } from "vitest";

import queryModule, { splitOqo } from "@/store/query.store";

const executionOqo = (queryOqo, viewState) =>
  queryModule.getters.executionOqo({ queryOqo, viewState });

// Tiny harness: run a mutation/action against a fresh state and capture bumps.
const freshState = () => queryModule.state();
const commitInto = (state) => (type, payload) => queryModule.mutations[type](state, payload);

describe("#464 — splitOqo", () => {
  it("separates the citeable query keys from the view-chrome keys", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [{ column_id: "publication_year", value: 2019 }],
      sort_by: [{ column_id: "cited_by_count", direction: "desc" }],
      select: ["id", "display_name"],
      page: 3,
      per_page: 25,
      group_by: ["open_access.is_oa"],
      cursor: "abc",
    };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(queryOqo).toEqual({
      get_rows: "works",
      filter_rows: [{ column_id: "publication_year", value: 2019 }],
      sort_by: [{ column_id: "cited_by_count", direction: "desc" }],
      select: ["id", "display_name"],
    });
    expect(viewState).toEqual({
      page: 3,
      per_page: 25,
      group_by: ["open_access.is_oa"],
      cursor: "abc",
    });
  });

  it("omits absent keys entirely (matches the server 'absent = default' form)", () => {
    const oqo = { get_rows: "works", filter_rows: [{ column_id: "publication_year", value: 2019 }] };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(queryOqo).toEqual(oqo);
    expect(viewState).toEqual({});
    expect("sort_by" in queryOqo).toBe(false);
  });

  it("tolerates a null/empty oqo", () => {
    expect(splitOqo(null)).toEqual({ queryOqo: {}, viewState: {} });
    expect(splitOqo(undefined)).toEqual({ queryOqo: {}, viewState: {} });
  });
});

describe("#464 — executionOqo getter (round-trip)", () => {
  it("reconstructs the merged query+view OQO that will be POSTed", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [{ column_id: "type", value: "article" }],
      sort_by: [{ column_id: "publication_date", direction: "desc" }],
      page: 2,
      per_page: 50,
    };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(executionOqo(queryOqo, viewState)).toEqual(oqo);
  });

  it("is null until a query is set (nothing to execute)", () => {
    expect(executionOqo(null, {})).toBe(null);
  });

  it("never emits null/undefined view fields", () => {
    const oqo = { get_rows: "works", page: undefined, per_page: null };
    const { queryOqo, viewState } = splitOqo(oqo);
    const exec = executionOqo(queryOqo, viewState);
    expect("page" in exec).toBe(false);
    expect("per_page" in exec).toBe(false);
    expect(exec).toEqual({ get_rows: "works" });
  });
});

describe("#464 Phase 2a — store is authoritative by default", () => {
  it("starts authoritative with a zero edit counter and no last-executed OQL", () => {
    const s = freshState();
    expect(s.authoritative).toBe(true);
    expect(s.editEpoch).toBe(0);
    expect(s.lastExecutedOql).toBe(null);
  });
});

describe("#464 Phase 2a — syncFromResponse SEEDS without bumping the edit counter", () => {
  const makeResp = (oqo, oql) => ({ meta: { x_query: { oqo, oql }, count: 42 }, results: [{ id: "W1" }] });

  it("adopts the server-canonical split + records lastExecutedOql, never bumps editEpoch", () => {
    const state = freshState();
    const commit = commitInto(state);
    queryModule.actions.syncFromResponse(
      { commit },
      makeResp({ get_rows: "authors", filter_rows: [], page: 2 }, "authors")
    );
    expect(state.queryOqo).toEqual({ get_rows: "authors", filter_rows: [] });
    expect(state.viewState).toEqual({ page: 2 });
    expect(state.lastExecutedOql).toBe("authors");
    // Seeding must NOT look like an edit — otherwise adopting a response would loop
    // the execution watcher.
    expect(state.editEpoch).toBe(0);
  });

  it("clears the canonical state (and lastExecutedOql) on a missing oqo", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.lastExecutedOql = "works";
    const commit = commitInto(state);
    queryModule.actions.syncFromResponse({ commit }, { meta: { count: 0 } });
    expect(state.queryOqo).toBe(null);
    expect(state.viewState).toEqual({});
    expect(state.lastExecutedOql).toBe(null);
    expect(state.editEpoch).toBe(0);
  });
});

describe("#464 Phase 2a — setSort edit action", () => {
  const runSetSort = (startQueryOqo, payload) => {
    const state = freshState();
    state.queryOqo = startQueryOqo;
    state.viewState = { page: 4, per_page: 50 };
    queryModule.actions.setSort({ commit: commitInto(state) }, payload);
    return state;
  };

  it("sets a single-dimension sort_by, resets paging, and bumps the edit counter", () => {
    const s = runSetSort({ get_rows: "works" }, { field: "cited_by_count", direction: "desc" });
    expect(s.queryOqo.sort_by).toEqual([{ column_id: "cited_by_count", direction: "desc" }]);
    expect(s.queryOqo.get_rows).toBe("works"); // other query keys preserved
    expect("page" in s.viewState).toBe(false); // paging reset on re-sort
    expect("cursor" in s.viewState).toBe(false);
    expect(s.viewState.per_page).toBe(50); // page size preserved
    expect(s.editEpoch).toBe(1);
  });

  it("normalises an unknown direction to desc", () => {
    const s = runSetSort({ get_rows: "works" }, { field: "publication_year", direction: "sideways" });
    expect(s.queryOqo.sort_by).toEqual([{ column_id: "publication_year", direction: "desc" }]);
  });

  it("keeps an explicit asc direction", () => {
    const s = runSetSort({ get_rows: "works" }, { field: "publication_year", direction: "asc" });
    expect(s.queryOqo.sort_by[0].direction).toBe("asc");
  });

  it("clears sort_by back to the engine default when field is null (relevance / D2)", () => {
    const s = runSetSort(
      { get_rows: "works", sort_by: [{ column_id: "cited_by_count", direction: "desc" }] },
      { field: null }
    );
    expect("sort_by" in s.queryOqo).toBe(false); // absent = engine default
    expect(s.editEpoch).toBe(1);
  });
});

describe("#464 Phase 2a — patch mutations delete on undefined (absent = default)", () => {
  it("patchQueryOqo deletes a key set to undefined and merges the rest", () => {
    const state = { queryOqo: { get_rows: "works", sort_by: [1], select: ["id"] } };
    queryModule.mutations.patchQueryOqo(state, { sort_by: undefined, select: ["id", "doi"] });
    expect("sort_by" in state.queryOqo).toBe(false);
    expect(state.queryOqo).toEqual({ get_rows: "works", select: ["id", "doi"] });
  });

  it("patchViewState deletes on undefined too", () => {
    const state = { viewState: { page: 3, per_page: 25 } };
    queryModule.mutations.patchViewState(state, { page: undefined });
    expect(state.viewState).toEqual({ per_page: 25 });
  });
});
