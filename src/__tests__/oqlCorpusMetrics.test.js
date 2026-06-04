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
  const PROVENANCE_TYPES = new Set([
    "spec design", "analytics question", "librarian guide",
    "vendor docs", "zendesk ticket",
  ]);

  it("every row carries a known category and provenance type + label", () => {
    const bad = oqlCorpus
      .filter(
        (r) =>
          !CATEGORIES.has(r.category) ||
          !r.provenance ||
          !PROVENANCE_TYPES.has(r.provenance.type) ||
          !r.provenance.label
      )
      .map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("gives the #284 worked examples their real provenance", () => {
    const a01 = oqlCorpus.find((r) => r.id === "A01");
    expect(a01.category).toBe("filter, sort & sample");
    expect(a01.provenance.type).toBe("analytics question");

    const l02a = oqlCorpus.find((r) => r.id === "L02a");
    expect(l02a.provenance.type).toBe("librarian guide");
    expect(l02a.provenance.url).toContain("umanitoba");

    const l21 = oqlCorpus.find((r) => r.id === "L21");
    expect(l21.provenance.type).toBe("zendesk ticket");
  });
});

describe("oxurl (auto-rendered classic SERP URL)", () => {
  it("every row carries an explicit oxurl_representable flag", () => {
    const bad = oqlCorpus
      .filter((r) => typeof r.oxurl_representable !== "boolean")
      .map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("non-representable rows have no oxurl", () => {
    const leaked = oqlCorpus
      .filter((r) => !r.oxurl_representable && r.oxurl)
      .map((r) => r.id);
    expect(leaked).toEqual([]);
  });

  it("renders a real openalex.org URL where representable (e.g. A04 sort)", () => {
    const a04 = oqlCorpus.find((r) => r.id === "A04");
    expect(a04.oxurl).toBe(
      "https://openalex.org/works?filter=authorships.institutions.lineage:I130438778&sort=cited_by_count:desc"
    );
  });

  it("percent-encodes reserved chars in values (L10 doi +)", () => {
    const l10 = oqlCorpus.find((r) => r.id === "L10");
    expect(l10.oxurl).toContain("doi:10.1021/es052595%2B");
  });

  it("leaves a representable row null when the translator can't render it (L21 gap)", () => {
    const l21 = oqlCorpus.find((r) => r.id === "L21");
    expect(l21.oxurl_representable).toBe(true);
    expect(l21.oxurl).toBe(null);
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
