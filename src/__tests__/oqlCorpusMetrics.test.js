import { describe, it, expect } from "vitest";
import { oqoLeafCount } from "@/oqlCorpusMetrics";
import { oqlCorpus } from "@/oqlCorpus";

describe("oqoLeafCount", () => {
  it("returns null when there is no OQO (error / out-of-scope cases)", () => {
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

  it("scores the systematic-review tree (row 78) at 114 leaves (the anchor)", () => {
    const srTree = oqlCorpus.find((r) => r.id === 78);
    expect(srTree).toBeTruthy();
    expect(oqoLeafCount(srTree.oqo)).toBe(114);
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
    "vendor docs", "zendesk ticket", "systematic review",
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
    const a01 = oqlCorpus.find((r) => r.id === 33);
    expect(a01.category).toBe("filter, sort & sample");
    expect(a01.provenance.type).toBe("analytics question");

    const l02a = oqlCorpus.find((r) => r.id === 56);
    expect(l02a.provenance.type).toBe("librarian guide");
    expect(l02a.provenance.url).toContain("umanitoba");

    const srTree = oqlCorpus.find((r) => r.id === 78);
    expect(srTree.provenance.type).toBe("zendesk ticket");
  });
});

describe("oxurl + oxurl_status (#384 taxonomy)", () => {
  const OXURL_STATUSES = new Set([
    "has-oxurl", "oql-only", "translator-bug", "server-unsupported",
  ]);

  it("every ok row carries a known oxurl_status; error/oos rows carry none", () => {
    const bad = oqlCorpus
      .filter((r) =>
        ["ok", "hint"].includes(r.status)
          ? !OXURL_STATUSES.has(r.oxurl_status)
          : r.oxurl_status != null
      )
      .map((r) => r.id);
    expect(bad).toEqual([]);
  });

  it("oxurl is null IFF the row is oql-only (OXURL can't express it)", () => {
    const wrong = oqlCorpus
      .filter((r) => ["ok", "hint"].includes(r.status))
      .filter((r) => (r.oxurl === null) !== (r.oxurl_status === "oql-only"))
      .map((r) => r.id);
    expect(wrong).toEqual([]);
  });

  it("renders a real openalex.org URL where representable (e.g. row 36 sort)", () => {
    const a04 = oqlCorpus.find((r) => r.id === 36);
    expect(a04.oxurl_status).toBe("has-oxurl");
    expect(a04.oxurl).toBe(
      "https://openalex.org/works?filter=authorships.institutions.lineage:I130438778&sort=cited_by_count:desc"
    );
  });

  it("percent-encodes reserved chars in values (row 66 doi +)", () => {
    const l10 = oqlCorpus.find((r) => r.id === 66);
    expect(l10.oxurl).toContain("doi:10.1021/es052595%2B");
  });

  it("classifies the cross-match-mode OR (row 78) as oql-only, not a translator gap", () => {
    const srTree = oqlCorpus.find((r) => r.id === 78);
    expect(srTree.oxurl_status).toBe("oql-only");
    expect(srTree.oxurl).toBe(null);
  });

  it("classifies multi-dim group_by (row 48) as has-oxurl (server supports nested group_by since #387)", () => {
    // #387 added multi-dim group_by to the live API (it nests the ES terms aggs:
    // each top-level group carries a `groups` array). Verified against api.openalex.org:
    // group_by=primary_topic.id,publication_year returns topic groups each with nested
    // per-year sub-groups, and meta.x_query round-trips the OQL. So row 48's authored
    // oxurl_status was updated to has-oxurl (corpus.yaml note cites #387); this test
    // tracked the old single-dim-only state (#297) and was stale.
    const r48 = oqlCorpus.find((r) => r.id === 48);
    expect(r48.oxurl_status).toBe("has-oxurl");
    expect(r48.oxurl).toContain("group_by=primary_topic.id,publication_year");
  });

  it("routes semantic search to ?search.semantic= (row 30, fixed in #363)", () => {
    const r30 = oqlCorpus.find((r) => r.id === 30);
    expect(r30.oxurl_status).toBe("has-oxurl");
    expect(r30.oxurl).toContain("search.semantic=");
    expect(r30.oxurl).not.toContain("filter=");
  });
});

describe("corpus integrity", () => {
  it("every ok case carries an executable OQO", () => {
    const missing = oqlCorpus.filter((r) => r.status === "ok" && !r.oqo).map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it("error / out-of-scope cases have no OQO (complexity shows as —)", () => {
    const wrong = oqlCorpus
      .filter((r) => r.status !== "ok" && r.oqo)
      .map((r) => r.id);
    expect(wrong).toEqual([]);
  });
});
