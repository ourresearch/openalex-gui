/**
 * oxjob #464 pillar A — canonical query store (Phase 0 split + Phase 2a edit engine),
 * updated for oxjob #661's column-model redesign (the query/view split at the
 * execute surface).
 *
 * #661 model: the OQO is pure "which rows" — get_rows, corpus, filter_rows, plus
 * the OQO chrome group_by/seed/sample. Sort is TRANSIENT client state
 * (`state.sort`, reset on every new query); paging is the client-owned
 * `state.paging`. Both are POSTed as SIBLING request params (executionParams,
 * classic wire syntax) beside the OQO — never inside it. Columns never touch
 * this store at all (sticky localStorage preference, useColumnsState).
 *
 * Phase 2a (#464) contract still pinned: edit-surface actions mutate the
 * canonical state and bump `editEpoch` (the signal the SERP execution watcher
 * POSTs on), while `syncFromResponse` adopts the server-canonical OQO WITHOUT
 * bumping (so seeding never re-triggers a fetch).
 */
import { describe, it, expect } from "vitest";

import queryModule, { splitOqo } from "@/store/query.store";

const executionOqo = (queryOqo, viewState) =>
  queryModule.getters.executionOqo({ queryOqo, viewState });
const executionParams = (sort, paging) =>
  queryModule.getters.executionParams({ sort, paging });

// Tiny harness: run a mutation/action against a fresh state and capture bumps.
const freshState = () => queryModule.state();
const commitInto = (state) => (type, payload) => queryModule.mutations[type](state, payload);

describe("#661 — splitOqo (query keys vs OQO chrome; view params dropped)", () => {
  it("keeps the citeable query keys + OQO chrome, DROPS sort/select/paging entirely", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [{ column_id: "publication_year", value: 2019 }],
      // A transitional server/builder may still emit these — they must never
      // survive the split (they left the OQO in spec v1.4):
      sort_by: [{ column_id: "cited_by_count", direction: "desc" }],
      select: ["id", "display_name"],
      page: 3,
      per_page: 25,
      cursor: "abc",
      corpus: "all",
      group_by: ["open_access.is_oa"],
      seed: 42,
    };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(queryOqo).toEqual({
      get_rows: "works",
      filter_rows: [{ column_id: "publication_year", value: 2019 }],
      // #642: corpus is a query-identity field — dropping it here made every
      // store-driven re-execution silently revert to the core corpus.
      corpus: "all",
    });
    expect(viewState).toEqual({
      group_by: ["open_access.is_oa"],
      seed: 42,
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

describe("#661 — executionOqo getter (pure 'which rows')", () => {
  it("reconstructs the query + OQO chrome, never any view param", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [{ column_id: "type", value: "article" }],
      group_by: [{ column_id: "open_access.is_oa" }],
      sample: 100,
      seed: 7,
    };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(executionOqo(queryOqo, viewState)).toEqual(oqo);
  });

  it("is null until a query is set (nothing to execute)", () => {
    expect(executionOqo(null, {})).toBe(null);
  });

  it("never emits null/undefined chrome fields", () => {
    const oqo = { get_rows: "works", group_by: undefined, seed: null };
    const { queryOqo, viewState } = splitOqo(oqo);
    const exec = executionOqo(queryOqo, viewState);
    expect("group_by" in exec).toBe(false);
    expect("seed" in exec).toBe(false);
    expect(exec).toEqual({ get_rows: "works" });
  });
});

describe("#661 — executionParams getter (sibling view params, classic wire syntax)", () => {
  it("serializes the transient sort to sort=col:dir[,col:dir] and passes paging through", () => {
    expect(
      executionParams(
        [
          { column_id: "cited_by_count", direction: "desc" },
          { column_id: "publication_year", direction: "asc" },
        ],
        { page: 3, per_page: 50, cursor: "c1" },
      ),
    ).toEqual({
      sort: "cited_by_count:desc,publication_year:asc",
      page: 3,
      per_page: 50,
      cursor: "c1",
    });
  });

  it("is empty when sort is null and paging unset (engine defaults)", () => {
    expect(executionParams(null, {})).toEqual({});
  });

  it("normalises a missing/unknown direction to desc", () => {
    expect(executionParams([{ column_id: "cited_by_count" }], {})).toEqual({
      sort: "cited_by_count:desc",
    });
  });
});

describe("#464 Phase 2a — store is authoritative by default", () => {
  it("starts authoritative: zero edit counter, no last-executed OQL, default sort/paging", () => {
    const s = freshState();
    expect(s.authoritative).toBe(true);
    expect(s.editEpoch).toBe(0);
    expect(s.lastExecutedOql).toBe(null);
    expect(s.sort).toBe(null);
    expect(s.paging).toEqual({});
  });
});

describe("#464 Phase 2a — syncFromResponse SEEDS without bumping the edit counter", () => {
  const makeResp = (oqo, oql) => ({ meta: { x_query: { oqo, oql }, count: 42 }, results: [{ id: "W1" }] });

  it("adopts the server-canonical split + records lastExecutedOql, never bumps editEpoch", () => {
    const state = freshState();
    const commit = commitInto(state);
    queryModule.actions.syncFromResponse(
      { commit },
      makeResp({ get_rows: "authors", filter_rows: [], group_by: [{ column_id: "has_orcid" }] }, "authors")
    );
    expect(state.queryOqo).toEqual({ get_rows: "authors", filter_rows: [] });
    expect(state.viewState).toEqual({ group_by: [{ column_id: "has_orcid" }] });
    expect(state.lastExecutedOql).toBe("authors");
    // Seeding must NOT look like an edit — otherwise adopting a response would loop
    // the execution watcher.
    expect(state.editEpoch).toBe(0);
  });

  it("ignores transitional sort_by/select/paging in the echo — client owns those (#661)", () => {
    const state = freshState();
    state.sort = [{ column_id: "publication_year", direction: "asc" }];
    state.paging = { per_page: 100 };
    const commit = commitInto(state);
    queryModule.actions.syncFromResponse(
      { commit },
      makeResp(
        {
          get_rows: "works",
          sort_by: [{ column_id: "cited_by_count", direction: "desc" }],
          select: ["id"],
          page: 9,
          per_page: 25,
        },
        "works",
      ),
    );
    expect(state.queryOqo).toEqual({ get_rows: "works" });
    expect(state.viewState).toEqual({});
    // The client-owned view state is untouched by the echo:
    expect(state.sort).toEqual([{ column_id: "publication_year", direction: "asc" }]);
    expect(state.paging).toEqual({ per_page: 100 });
  });

  it("clears the canonical state (and lastExecutedOql) on a missing oqo", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.lastExecutedOql = "works";
    state.sort = [{ column_id: "cited_by_count", direction: "desc" }];
    state.paging = { page: 3, per_page: 50 };
    const commit = commitInto(state);
    queryModule.actions.syncFromResponse({ commit }, { meta: { count: 0 } });
    expect(state.queryOqo).toBe(null);
    expect(state.viewState).toEqual({});
    expect(state.sort).toBe(null);
    // page/cursor cleared; per_page (a size preference) survives.
    expect(state.paging).toEqual({ per_page: 50 });
    expect(state.lastExecutedOql).toBe(null);
    expect(state.editEpoch).toBe(0);
  });
});

describe("#661 — setSort edit action (transient client sort)", () => {
  const runSetSort = (payload) => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.paging = { page: 4, per_page: 50, cursor: "c0" };
    queryModule.actions.setSort({ commit: commitInto(state) }, payload);
    return state;
  };

  it("sets the transient sort OUTSIDE the OQO, resets paging, bumps the edit counter", () => {
    const s = runSetSort({ field: "cited_by_count", direction: "desc" });
    expect(s.sort).toEqual([{ column_id: "cited_by_count", direction: "desc" }]);
    expect(s.queryOqo).toEqual({ get_rows: "works" }); // the query is untouched
    expect("page" in s.paging).toBe(false); // paging reset on re-sort
    expect("cursor" in s.paging).toBe(false);
    expect(s.paging.per_page).toBe(50); // page size preserved
    expect(s.editEpoch).toBe(1);
  });

  it("normalises an unknown direction to desc", () => {
    const s = runSetSort({ field: "publication_year", direction: "sideways" });
    expect(s.sort).toEqual([{ column_id: "publication_year", direction: "desc" }]);
  });

  it("keeps an explicit asc direction", () => {
    const s = runSetSort({ field: "publication_year", direction: "asc" });
    expect(s.sort[0].direction).toBe("asc");
  });

  it("clears back to the engine default when field is null (relevance / D2)", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.sort = [{ column_id: "cited_by_count", direction: "desc" }];
    queryModule.actions.setSort({ commit: commitInto(state) }, { field: null });
    expect(state.sort).toBe(null); // null = engine default
    expect(state.editEpoch).toBe(1);
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

describe("#464 Phase 2b — paging edit actions (client-owned, sibling params, replace intent)", () => {
  const runSetPage = (payload, start = { page: 1, per_page: 50, cursor: "c0" }) => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.paging = { ...start };
    queryModule.actions.setPage({ commit: commitInto(state) }, payload);
    return state;
  };

  it("sets a deep page, asserts per_page, clears cursor, bumps as replace", () => {
    const s = runSetPage({ page: 3, perPage: 100 });
    expect(s.paging.page).toBe(3);
    expect(s.paging.per_page).toBe(100); // executed size matches displayed
    expect("cursor" in s.paging).toBe(false);
    expect(s.editEpoch).toBe(1);
    expect(s.lastEditNav).toBe("replace");
  });

  it("page 1 clears the page key (page 1 = absent = default)", () => {
    const s = runSetPage({ page: 1, perPage: 25 });
    expect("page" in s.paging).toBe(false);
  });

  it("leaves per_page untouched when the caller omits it", () => {
    const s = runSetPage({ page: 2 }, { per_page: 20 });
    expect(s.paging.page).toBe(2);
    expect(s.paging.per_page).toBe(20);
  });

  it("setPerPage sets the size, resets to page 1, clears cursor, bumps as replace", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.paging = { page: 5, per_page: 25, cursor: "x" };
    queryModule.actions.setPerPage({ commit: commitInto(state) }, { perPage: 100 });
    expect(state.paging.per_page).toBe(100);
    expect("page" in state.paging).toBe(false);
    expect("cursor" in state.paging).toBe(false);
    expect(state.editEpoch).toBe(1);
    expect(state.lastEditNav).toBe("replace");
  });

  it("paging rides in executionParams (siblings), NEVER in executionOqo (#661)", () => {
    const s = runSetPage({ page: 2, perPage: 100 });
    expect(executionOqo(s.queryOqo, s.viewState)).toEqual({ get_rows: "works" });
    expect(executionParams(s.sort, s.paging)).toEqual({ page: 2, per_page: 100 });
  });
});

describe("#464 Phase 2a — patch mutations delete on undefined (absent = default)", () => {
  it("patchQueryOqo deletes a key set to undefined and merges the rest", () => {
    const state = { queryOqo: { get_rows: "works", filter_rows: [1], corpus: "all" } };
    queryModule.mutations.patchQueryOqo(state, { filter_rows: undefined, corpus: "core" });
    expect("filter_rows" in state.queryOqo).toBe(false);
    expect(state.queryOqo).toEqual({ get_rows: "works", corpus: "core" });
  });

  it("patchViewState deletes on undefined too", () => {
    const state = { viewState: { group_by: [1], seed: 7 } };
    queryModule.mutations.patchViewState(state, { group_by: undefined });
    expect(state.viewState).toEqual({ seed: 7 });
  });

  it("patchPaging deletes on undefined too (#661)", () => {
    const state = { paging: { page: 3, per_page: 25 } };
    queryModule.mutations.patchPaging(state, { page: undefined });
    expect(state.paging).toEqual({ per_page: 25 });
  });
});

describe("#464 Phase 2c — setQueryFromOqo (builder/OQL-text edits)", () => {
  const runSetQuery = (oqo, payload, startPaging = { page: 4, per_page: 100, cursor: "c0" }) => {
    const state = freshState();
    state.paging = { ...startPaging };
    state.sort = [{ column_id: "cited_by_count", direction: "desc" }];
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

  it("resets paging AND the transient sort (a new query = a new result set, #661)", () => {
    const s = runSetQuery({ get_rows: "authors", filter_rows: [] }, { nav: "push" });
    expect("page" in s.paging).toBe(false);
    expect("cursor" in s.paging).toBe(false);
    expect(s.paging.per_page).toBe(100); // page size is recipient-local, preserved
    expect(s.sort).toBe(null); // sort is per-result-set — reset to engine default
  });

  it("drops any stray sort_by/select/view bit from the incoming OQO (#661)", () => {
    // A transitional builder still emits sort_by/select; they must never enter
    // the citeable query (that's the #471 leak class, structurally dead now).
    const s = runSetQuery(
      { get_rows: "works", sort_by: [{ column_id: "cited_by_count", direction: "desc" }], select: ["doi"], page: 9 },
      { nav: "push" }
    );
    expect(s.queryOqo).toEqual({ get_rows: "works" });
    expect("page" in s.paging).toBe(false); // and reset, not adopted from the stray bit
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

  it("the resulting executionOqo + executionParams are what executeOqo POSTs", () => {
    const s = runSetQuery(
      { get_rows: "works", filter_rows: [{ column_id: "type", value: "article" }] },
      { nav: "push" },
      { per_page: 50 }
    );
    expect(executionOqo(s.queryOqo, s.viewState)).toEqual({
      get_rows: "works",
      filter_rows: [{ column_id: "type", value: "article" }],
    });
    expect(executionParams(s.sort, s.paging)).toEqual({ per_page: 50 });
  });
});

describe("#661 — refinements reset the transient sort (a refinement is a new query)", () => {
  it("applyRefinementRows clears sort + page/cursor, keeps per_page, bumps as push", () => {
    const state = freshState();
    state.queryOqo = { get_rows: "works" };
    state.sort = [{ column_id: "cited_by_count", direction: "desc" }];
    state.paging = { page: 2, per_page: 50, cursor: "c0" };
    queryModule.actions.applyRefinementRows(
      { state, commit: commitInto(state) },
      [{ column_id: "type", value: "article" }],
    );
    expect(state.queryOqo.filter_rows).toEqual([{ column_id: "type", value: "article" }]);
    expect(state.sort).toBe(null);
    expect(state.paging).toEqual({ per_page: 50 });
    expect(state.lastEditNav).toBe("push");
    expect(state.editEpoch).toBe(1);
  });
});
