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

describe("#464 Phase 2b — bumpEdit records nav intent (back-button policy)", () => {
  it("defaults to 'replace' (tuning, no history entry)", () => {
    const s = freshState();
    queryModule.mutations.bumpEdit(s);
    expect(s.lastEditNav).toBe("replace");
    expect(s.editEpoch).toBe(1);
  });

  it("records 'push' for a back-worthy new query", () => {
    const s = freshState();
    queryModule.mutations.bumpEdit(s, "push");
    expect(s.lastEditNav).toBe("push");
    expect(s.editEpoch).toBe(1);
  });

  it("treats any non-'push' value as 'replace'", () => {
    const s = freshState();
    queryModule.mutations.bumpEdit(s, "garbage");
    expect(s.lastEditNav).toBe("replace");
  });

  it("setSort tags its edit as replace (a sort flip is tuning)", () => {
    const s = freshState();
    s.queryOqo = { get_rows: "works" };
    queryModule.actions.setSort({ commit: commitInto(s) }, { field: "cited_by_count" });
    expect(s.lastEditNav).toBe("replace");
  });
});

describe("#464 Phase 2b — paging edit actions (store-driven, replace intent)", () => {
  const runSetPage = (payload, start = { page: 1, per_page: 50, cursor: "c0" }) => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.viewState = { ...start };
    queryModule.actions.setPage({ commit: commitInto(state) }, payload);
    return state;
  };

  it("sets a deep page, asserts per_page, clears cursor, bumps as replace", () => {
    const s = runSetPage({ page: 3, perPage: 100 });
    expect(s.viewState.page).toBe(3);
    expect(s.viewState.per_page).toBe(100); // executed size matches displayed
    expect("cursor" in s.viewState).toBe(false);
    expect(s.editEpoch).toBe(1);
    expect(s.lastEditNav).toBe("replace");
  });

  it("page 1 clears the page key (page 1 = absent = default)", () => {
    const s = runSetPage({ page: 1, perPage: 25 });
    expect("page" in s.viewState).toBe(false);
  });

  it("leaves per_page untouched when the caller omits it", () => {
    const s = runSetPage({ page: 2 }, { per_page: 20 });
    expect(s.viewState.page).toBe(2);
    expect(s.viewState.per_page).toBe(20);
  });

  it("setPerPage sets the size, resets to page 1, clears cursor, bumps as replace", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.viewState = { page: 5, per_page: 25, cursor: "x" };
    queryModule.actions.setPerPage({ commit: commitInto(state) }, { perPage: 100 });
    expect(state.viewState.per_page).toBe(100);
    expect("page" in state.viewState).toBe(false);
    expect("cursor" in state.viewState).toBe(false);
    expect(state.editEpoch).toBe(1);
    expect(state.lastEditNav).toBe("replace");
  });

  it("executionOqo carries the migrated paging so executeOqo POSTs it inline", () => {
    const s = runSetPage({ page: 2, perPage: 100 });
    expect(executionOqo(s.queryOqo, s.viewState)).toEqual({
      get_rows: "works",
      page: 2,
      per_page: 100,
    });
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

describe("#464 Phase 2c — setQueryFromOqo (builder/OQL-text edits)", () => {
  const runSetQuery = (oqo, payload, startView = { page: 4, per_page: 100, cursor: "c0" }) => {
    const state = freshState();
    state.viewState = { ...startView };
    queryModule.actions.setQueryFromOqo(
      { commit: commitInto(state) },
      { oqo, ...(payload || {}) }
    );
    return state;
  };

  it("replaces the whole query slice with the builder's OQO (entity + nested filters)", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [
        { join: "and", filters: [
          { join: "or", filters: [
            { column_id: "publication_year", value: 2020 },
            { column_id: "publication_year", value: 2021 },
          ] },
          { column_id: "type", value: "article" },
        ] },
      ],
    };
    const s = runSetQuery(oqo, { nav: "push" });
    expect(s.queryOqo).toEqual(oqo); // filter tree preserved verbatim
    expect(s.editEpoch).toBe(1);
    expect(s.lastEditNav).toBe("push"); // add/remove a filter = back-worthy
  });

  it("resets paging (a query change invalidates the page) but keeps per_page", () => {
    const s = runSetQuery({ get_rows: "authors", filter_rows: [] }, { nav: "push" });
    expect("page" in s.viewState).toBe(false);
    expect("cursor" in s.viewState).toBe(false);
    expect(s.viewState.per_page).toBe(100); // page size is recipient-local, preserved
  });

  it("keeps ONLY the citeable query keys (a stray view bit never clobbers viewState)", () => {
    // The builder's OQO should only carry query keys, but if a view bit leaks in we
    // split it off so it can't overwrite the recipient-local viewState.
    const s = runSetQuery(
      { get_rows: "works", sort_by: [{ column_id: "cited_by_count", direction: "desc" }], page: 9 },
      { nav: "push" }
    );
    expect(s.queryOqo).toEqual({
      get_rows: "works",
      sort_by: [{ column_id: "cited_by_count", direction: "desc" }],
    });
    expect("page" in s.queryOqo).toBe(false); // page is view chrome, dropped from the query
    expect("page" in s.viewState).toBe(false); // and reset, not adopted from the stray bit
  });

  it("defaults a missing nav to 'push' (the common builder edit is a structural change)", () => {
    const s = runSetQuery({ get_rows: "works", filter_rows: [] });
    expect(s.lastEditNav).toBe("push");
  });

  it("tags a debounced keystroke edit as 'replace' (tuning, no history entry)", () => {
    const s = runSetQuery({ get_rows: "works", filter_rows: [] }, { nav: "replace" });
    expect(s.lastEditNav).toBe("replace");
    expect(s.editEpoch).toBe(1);
  });

  it("is a no-op-safe call with an empty payload (never throws, no edit)", () => {
    const state = freshState();
    queryModule.actions.setQueryFromOqo({ commit: commitInto(state) }, {});
    expect(state.queryOqo).toEqual({}); // splitOqo({}) → {} ; still a deliberate set
    expect(state.editEpoch).toBe(1);
  });

  it("the resulting executionOqo is what executeOqo POSTs (query + surviving view)", () => {
    const s = runSetQuery(
      { get_rows: "works", filter_rows: [{ column_id: "type", value: "article" }] },
      { nav: "push" },
      { per_page: 50 }
    );
    expect(executionOqo(s.queryOqo, s.viewState)).toEqual({
      get_rows: "works",
      filter_rows: [{ column_id: "type", value: "article" }],
      per_page: 50,
    });
  });
});
