/**
 * oxjob #464 pillar A — Phase 0 shadow query store.
 *
 * Phase 0 is a no-op shadow: it splits a settled response's canonical OQO into the
 * citeable query vs. the view chrome and reconstructs the executionOqo we WILL POST
 * once the store is authoritative (Phase 1). The real risk in this phase is the
 * SPLIT — drop a field that actually affects execution and the Phase-1 cutover would
 * silently change results. These tests pin the split + the round-trip invariant
 * (reconstruct == the executable original), which is exactly what the dev-only
 * POST-OQO probe checks at runtime, but durably and offline.
 */
import { describe, it, expect, vi } from "vitest";

// Mock @/api so importing the store doesn't pull in apiConfig.js (which reads
// `window` at module load). The prod-guard test spies on this mock.
vi.mock("@/api", () => ({ api: { executeOqo: vi.fn() } }));

import queryModule, { splitOqo } from "@/store/query.store";

const executionOqo = (queryOqo, viewState) =>
  queryModule.getters.executionOqo({ queryOqo, viewState });

describe("#464 Phase 0 — splitOqo", () => {
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
    // A default query: bare entity + one filter, no sort/select/paging.
    const oqo = { get_rows: "works", filter_rows: [{ column_id: "publication_year", value: 2019 }] };
    const { queryOqo, viewState } = splitOqo(oqo);
    expect(queryOqo).toEqual(oqo);
    expect(viewState).toEqual({});
    // …so a default query carries no sort/paging in its share key (D2 dedup).
    expect("sort_by" in queryOqo).toBe(false);
  });

  it("tolerates a null/empty oqo", () => {
    expect(splitOqo(null)).toEqual({ queryOqo: {}, viewState: {} });
    expect(splitOqo(undefined)).toEqual({ queryOqo: {}, viewState: {} });
  });
});

describe("#464 Phase 0 — executionOqo getter (round-trip)", () => {
  it("reconstructs the merged query+view OQO that will be POSTed", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [{ column_id: "type", value: "article" }],
      sort_by: [{ column_id: "publication_date", direction: "desc" }],
      page: 2,
      per_page: 50,
    };
    const { queryOqo, viewState } = splitOqo(oqo);
    // Reconstructed execution OQO equals the original (it carried only known keys).
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

describe("#464 Phase 0 — syncFromResponse (shadow population + prod guard)", () => {
  const makeResp = (oqo) => ({ meta: { x_query: { oqo }, count: 42 }, results: [{ id: "W1" }] });

  it("commits the split from meta.x_query.oqo and clears on a missing oqo", async () => {
    // Run as production so we exercise only the shadow-population path (the dev probe
    // is covered separately below).
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const restore = () => { process.env.NODE_ENV = prev; };
    const commits = [];
    const commit = (type, payload) => commits.push([type, payload]);
    const getters = { executionOqo: null };

    try {
    await queryModule.actions.syncFromResponse(
      { commit, getters },
      makeResp({ get_rows: "authors", filter_rows: [], page: 2 })
    );
    expect(commits).toContainEqual(["setQueryOqo", { get_rows: "authors", filter_rows: [] }]);
    expect(commits).toContainEqual(["setViewState", { page: 2 }]);

    commits.length = 0;
    await queryModule.actions.syncFromResponse({ commit, getters }, { meta: { count: 0 } });
    expect(commits).toContainEqual(["setQueryOqo", null]);
    expect(commits).toContainEqual(["setViewState", {}]);
    } finally { restore(); }
  });

  it("does NOT fire the POST-OQO probe in production (no api call, no doubled request)", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const { api } = await import("@/api");
    api.executeOqo.mockClear();
    try {
      const commit = () => {};
      await queryModule.actions.syncFromResponse(
        { commit, getters: { executionOqo: { get_rows: "works" } } },
        makeResp({ get_rows: "works" })
      );
      expect(api.executeOqo).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
