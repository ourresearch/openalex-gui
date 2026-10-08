// oxjob #1536 / #1550: OQL pipeline-language results (calculated columns, a flat
// groups table with a column per split, the summary table, sort by any column).
// Shapes copied from production responses (api.openalex.org, 2026-10-03 and
// 2026-10-08).

import { describe, it, expect } from "vitest";
import {
  isPipelineResponse,
  isPipelineOqo,
  formatMeasure,
  groupLink,
  flatRows,
  sortRows,
  wholeSetMeasures,
  exportRows,
  exportCredits,
  calculationFormatOptions,
  refusalMessage,
  formatCost,
} from "@/oqlPipeline";

const MEAN_FWCI = { key: "mean_fwci", measure: "mean", column_id: "fwci", oql: "mean FWCI" };
const PCT_OA = { key: "percent_open_access_is_oa", measure: "percent", column_id: "open_access.is_oa", oql: "percent open access" };

const institutions = [
  { key: "https://openalex.org/I63966007", key_display_name: "Massachusetts Institute of Technology", count: 1140, mean_fwci: 10.5247 },
  { key: "https://openalex.org/I97018004", key_display_name: "Stanford University", count: 1253, mean_fwci: 4.0065 },
  { key: "https://openalex.org/I136199984", key_display_name: "Harvard University", count: 2289, mean_fwci: 8.5282 },
];

// wind power 2023-2024 by year, then by open access status (production, 2026-10-08)
const oa = (rows) => rows.map(([key, count, mean_fwci]) => ({ key, key_display_name: key, count, mean_fwci }));
const nested = [
  { key: "2024", key_display_name: "2024", count: 7264, mean_fwci: 1.3597,
    groups: oa([["closed", 3592, 1.3491], ["gold", 1393, 1.4877], ["hybrid", 507, 2.5219]]) },
  { key: "2023", key_display_name: "2023", count: 6379, mean_fwci: 1.3422,
    groups: oa([["closed", 3137, 1.368], ["gold", 1305, 1.4607], ["hybrid", 357, null]]) },
];
const summary = {
  all: { key: "all", key_display_name: "all works", count: 13643, mean_fwci: 1.3516 },
  splits: [
    { groups: nested.map(({ groups, ...g }) => g), more_groups: false },
    { groups: oa([["closed", 6729, 1.3579], ["gold", 2698, 1.4744]]), more_groups: false },
  ],
};

describe("isPipelineResponse / isPipelineOqo", () => {
  it("a response with meta.measures is a pipeline response; today's are not", () => {
    expect(isPipelineResponse({ meta: { measures: [] } })).toBe(true);
    expect(isPipelineResponse({ meta: { count: 3 }, results: [] })).toBe(false);
    expect(isPipelineResponse(null)).toBe(false);
  });

  it("calculate or a split beyond column_id makes a pipeline OQO", () => {
    expect(isPipelineOqo({ get_rows: "works", calculate: [{ measure: "count" }] })).toBe(true);
    expect(isPipelineOqo({ get_rows: "works", group_by: [{ column_id: "x", values: ["I1"] }] })).toBe(true);
    expect(isPipelineOqo({ get_rows: "works", group_by: [{ conditions: [] }] })).toBe(true);
  });

  it("today's queries (plain filters, plain group_by) are not pipeline OQOs", () => {
    expect(isPipelineOqo({ get_rows: "works", filter_rows: [{ column_id: "publication_year", value: 2020 }] })).toBe(false);
    expect(isPipelineOqo({ get_rows: "works", group_by: [{ column_id: "publication_year" }] })).toBe(false);
    expect(isPipelineOqo(null)).toBe(false);
  });
});

describe("formatMeasure", () => {
  it("percents get a % sign and one decimal; others up to two decimals", () => {
    expect(formatMeasure(PCT_OA, 56.3753)).toBe("56.4%");
    expect(formatMeasure({ measure: "percent_of_those" }, 0.1029)).toBe("0.1%");
    expect(formatMeasure(MEAN_FWCI, 10.5247)).toBe("10.52");
    expect(formatMeasure({ measure: "count" }, 146058140)).toBe("146,058,140");
  });

  it("a missing value prints a dash", () => {
    expect(formatMeasure(MEAN_FWCI, null)).toBe("–");
    expect(formatMeasure(MEAN_FWCI, undefined)).toBe("–");
  });
});

describe("groupLink", () => {
  it("entity groups link to their entity page", () => {
    expect(groupLink("https://openalex.org/I63966007")).toBe("/institutions/i63966007");
    expect(groupLink("https://openalex.org/sdgs/3")).toBe("/sdgs/3");
  });

  it("yes/no, bins, conditions and searches have no link", () => {
    expect(groupLink("true")).toBe(null);
    expect(groupLink("1-9")).toBe(null);
    expect(groupLink("institution is (I99464096)")).toBe(null);
    expect(groupLink(true)).toBe(null);
  });
});

describe("flatRows", () => {
  it("one row per innermost group, naming its group at every split", () => {
    const rows = flatRows(nested, 2);
    expect(rows.map((r) => r.path.map((g) => g.key_display_name))).toEqual([
      ["2024", "closed"], ["2024", "gold"], ["2024", "hybrid"],
      ["2023", "closed"], ["2023", "gold"], ["2023", "hybrid"],
    ]);
    expect(rows[0].group.count).toBe(3592);   // the innermost group's numbers
    expect(rows[0].id).toBe("2024/closed");
  });

  it("one split: the groups themselves", () => {
    expect(flatRows(institutions, 1).map((r) => r.group.count)).toEqual([1140, 1253, 2289]);
  });

  it("a group with no inner groups has no row", () => {
    expect(flatRows([{ key: "2022", groups: [] }, ...nested], 2)).toHaveLength(6);
    expect(flatRows(undefined, 2)).toEqual([]);
  });
});

describe("sortRows", () => {
  const rows = flatRows(nested, 2);

  it("null sort keeps the API order", () => {
    expect(sortRows(rows, null)).toBe(rows);
  });

  it("every row sorts on its own, across groups, by any calculated column", () => {
    const desc = sortRows(rows, { key: "count", dir: "desc" }).map((r) => r.id);
    expect(desc).toEqual(["2024/closed", "2023/closed", "2024/gold", "2023/gold", "2024/hybrid", "2023/hybrid"]);
  });

  it("sorts by a split column's group names (numbers in number order)", () => {
    const byStatus = sortRows(rows, { key: "split:1", dir: "asc" }).map((r) => r.id);
    expect(byStatus).toEqual(["2024/closed", "2023/closed", "2024/gold", "2023/gold", "2024/hybrid", "2023/hybrid"]);
    const byYear = sortRows(rows, { key: "split:0", dir: "asc" }).map((r) => r.path[0].key);
    expect(byYear).toEqual(["2023", "2023", "2023", "2024", "2024", "2024"]);
  });

  it("missing values sort last in both directions", () => {
    expect(sortRows(rows, { key: "mean_fwci", dir: "desc" }).at(-1).id).toBe("2023/hybrid");
    expect(sortRows(rows, { key: "mean_fwci", dir: "asc" }).at(-1).id).toBe("2023/hybrid");
  });

  it("does not mutate its input", () => {
    const copy = [...rows];
    sortRows(rows, { key: "count", dir: "asc" });
    expect(rows).toEqual(copy);
  });
});

describe("wholeSetMeasures", () => {
  it("the whole set has no share and no group's own field", () => {
    const ms = [{ key: "count", measure: "count" }, MEAN_FWCI, { key: "percent_of_those", measure: "percent_of_those" },
      { key: "value_h", measure: "value" }];
    expect(wholeSetMeasures(ms).map((m) => m.key)).toEqual(["count", "mean_fwci"]);
    expect(wholeSetMeasures(undefined)).toEqual([]);
  });
});

describe("refusalMessage", () => {
  it("a pipeline limit reads as its message plus its fix", () => {
    const data = {
      error: "too_many_groups",
      message: "Splitting by author gives about 100,964,546 groups here; a nested split takes up to 10,000 groups per split.",
      fix: "Narrow the starting set, or make it the only split (one split pages through any number of groups).",
    };
    expect(refusalMessage(data)).toBe(`${data.message} Fix: ${data.fix}`);
  });

  it("anything else (today's validation errors, a timeout) is left to the caller", () => {
    expect(refusalMessage({ validation: { errors: [{ message: "x" }] } })).toBe(null);
    expect(refusalMessage({ error: "Gateway timeout", message: "took too long" })).toBe(null);
    expect(refusalMessage(undefined)).toBe(null);
  });
});

describe("formatCost", () => {
  it("prints credits and dollars", () => {
    expect(formatCost({ credits: 1, usd: 0.0001 })).toBe("1 credit ($0.0001)");
    expect(formatCost({ credits: 31, usd: 0.0031 })).toBe("31 credits ($0.0031)");
    expect(formatCost({ credits: 2500, usd: 0.25 })).toBe("2,500 credits ($0.25)");
    expect(formatCost(null)).toBe(null);
  });
});

describe("exports (mirror users-api export_calculation.py)", () => {
  const withMeta = (meta, extra = {}) => ({ meta: { cost: { credits: 1 }, ...meta }, ...extra });

  it("rows: no split is one row; one split the group count; nested every combination", () => {
    expect(exportRows(withMeta({ splits: [] }), "groups-csv")).toBe(1);
    expect(exportRows(withMeta({ splits: [{}], groups_count: 128284 }), "groups-csv")).toBe(128284);
    expect(exportRows(withMeta({ splits: [{}], groups_count: null }), "groups-csv")).toBe(null);
    expect(exportRows(withMeta({ splits: [{}, {}] }, { group_by: nested }), "groups-csv")).toBe(6);
  });

  it("summary rows: all works plus each split's groups", () => {
    expect(exportRows(withMeta({ splits: [{}, {}] }, { summary }), "summary")).toBe(1 + 2 + 2);
    expect(exportRows(withMeta({ splits: [{}] }, { summary: { all: {} } }), "summary")).toBe(1);
  });

  it("the query's price for every 100 rows, at least once", () => {
    expect(exportCredits(withMeta({}), 1)).toBe(1);
    expect(exportCredits(withMeta({}), 100)).toBe(1);
    expect(exportCredits(withMeta({}), 101)).toBe(2);
    expect(exportCredits(withMeta({}), 128284)).toBe(1283);
    expect(exportCredits(withMeta({ cost: { credits: 10 } }), 23235)).toBe(2330);
    expect(exportCredits(withMeta({}), 0)).toBe(1);
    expect(exportCredits(withMeta({}), null)).toBe(null);
  });

  it("formats: the summary is a zip with 2+ splits", () => {
    expect(calculationFormatOptions(withMeta({ splits: [{}] })).map((o) => o.label)).toEqual(["Groups (CSV)", "Summary (CSV)"]);
    expect(calculationFormatOptions(withMeta({ splits: [{}, {}] })).map((o) => [o.label, o.value]))
      .toEqual([["Groups (CSV)", "groups-csv"], ["Summary (zip)", "summary"]]);
  });
});
