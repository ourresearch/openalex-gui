import { describe, it, expect } from "vitest";
import { oqoLeafCount, caseCategory, caseSource } from "@/oqlCorpusMetrics";
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

describe("caseCategory / caseSource (from ID prefix)", () => {
  it("maps spine prefixes to topical categories on the spec spine", () => {
    expect(caseCategory("ENT3")).toBe("Entity references");
    expect(caseCategory("BOOL1")).toBe("Boolean logic");
    expect(caseCategory("PW12")).toBe("Proximity & wildcards");
    expect(caseCategory("G7b")).toBe("Search semantics");
    ["ENT3", "BOOL1", "PW12", "G7b"].forEach((id) =>
      expect(caseSource(id)).toBe("#330 spec spine")
    );
  });

  it("splits the #284 worked-examples corpus by sub-source", () => {
    expect(caseCategory("A01")).toBe("Filter, sort & sample");
    expect(caseCategory("B09")).toBe("Group by");
    expect(caseCategory("L21")).toBe("Librarian & SR queries");
    ["A01", "B09", "L21"].forEach((id) =>
      expect(caseSource(id)).toBe("#284 worked examples")
    );
  });

  it("does not confuse BOOL with the B (#284) prefix", () => {
    expect(caseCategory("BOOL4")).toBe("Boolean logic");
    expect(caseSource("BOOL4")).toBe("#330 spec spine");
  });

  it("classifies every corpus row (no 'Other')", () => {
    const unclassified = oqlCorpus
      .filter((r) => caseCategory(r.id) === "Other" || caseSource(r.id) === "Other")
      .map((r) => r.id);
    expect(unclassified).toEqual([]);
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
