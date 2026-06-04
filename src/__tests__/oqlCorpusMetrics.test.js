import { describe, it, expect } from "vitest";
import { oqoLeafCount } from "@/oqlCorpusMetrics";
import { oqlCorpus } from "@/oqlCorpus";

describe("oqoLeafCount", () => {
  it("returns null when there is no OQO (error / boundary cases)", () => {
    expect(oqoLeafCount(null)).toBe(null);
    expect(oqoLeafCount(undefined)).toBe(null);
  });

  it("counts a single leaf", () => {
    expect(
      oqoLeafCount({ get_rows: "works", filter_rows: [{ column_id: "x", value: "1" }] })
    ).toBe(1);
  });

  it("counts a bare entity query (no filters) as 0", () => {
    expect(oqoLeafCount({ get_rows: "works", filter_rows: [] })).toBe(0);
    expect(oqoLeafCount({ get_rows: "works" })).toBe(0);
  });

  it("recurses into branch nodes", () => {
    const oqo = {
      get_rows: "works",
      filter_rows: [
        { column_id: "a", value: "1" },
        { join: "or", filters: [{ column_id: "b", value: "2" }, { column_id: "c", value: "3" }] },
      ],
    };
    expect(oqoLeafCount(oqo)).toBe(3);
  });

  it("scores the L21 systematic-review tree at 114 leaves (the anchor)", () => {
    const l21 = oqlCorpus.find((r) => r.id === "L21");
    expect(l21).toBeTruthy();
    expect(oqoLeafCount(l21.oqo)).toBe(114);
  });
});

describe("corpus facets (explicit fields from corpus.yaml)", () => {
  const CATEGORIES = new Set([
    "entity references", "boolean logic", "search semantics",
    "proximity & wildcards", "filter, sort & sample", "group by",
    "librarian & SR queries",
  ]);
  const SOURCES = new Set(["spec spine", "#284 worked examples"]);

  it("every row carries a known category and source", () => {
    const bad = oqlCorpus
      .filter((r) => !CATEGORIES.has(r.category) || !SOURCES.has(r.source))
      .map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("groups the #284 worked examples under that source", () => {
    const a01 = oqlCorpus.find((r) => r.id === "A01");
    expect(a01.category).toBe("filter, sort & sample");
    expect(a01.source).toBe("#284 worked examples");
  });
});

describe("corpus integrity", () => {
  it("every ok case carries an executable OQO", () => {
    const missing = oqlCorpus.filter((r) => r.status === "ok" && !r.oqo).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it("error / boundary cases have no OQO (complexity shows as —)", () => {
    const wrong = oqlCorpus
      .filter((r) => r.status !== "ok" && r.oqo)
      .map((r) => r.id);
    expect(wrong).toEqual([]);
  });
});
