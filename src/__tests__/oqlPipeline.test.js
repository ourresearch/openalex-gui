// oxjob #1536: OQL pipeline-language results (calculated columns, total row,
// nested groups, sort by any column). Shapes copied from production responses
// (api.openalex.org, 2026-10-03).

import { describe, it, expect } from "vitest";
import {
  isPipelineResponse,
  isPipelineOqo,
  formatMeasure,
  groupLink,
  sortGroups,
  flattenGroups,
  splitDepth,
  refusalMessage,
  formatCost,
  splitsLabel,
  csvFilename,
} from "@/oqlPipeline";

const MEAN_FWCI = { key: "mean_fwci", measure: "mean", column_id: "fwci", oql: "mean FWCI" };
const PCT_OA = { key: "percent_open_access_is_oa", measure: "percent", column_id: "open_access.is_oa", oql: "percent open access" };

const institutions = [
  { key: "https://openalex.org/I63966007", key_display_name: "Massachusetts Institute of Technology", count: 1140, mean_fwci: 10.5247 },
  { key: "https://openalex.org/I97018004", key_display_name: "Stanford University", count: 1253, mean_fwci: 4.0065 },
  { key: "https://openalex.org/I136199984", key_display_name: "Harvard University", count: 2289, mean_fwci: 8.5282 },
];

const nested = [
  {
    key: "institution is (I99464096)", key_display_name: "institution is (I99464096)", count: 150235,
    groups: [
      { key: "https://openalex.org/sdgs/3", key_display_name: "Good health and well-being", count: 26536 },
      { key: "https://openalex.org/sdgs/7", key_display_name: "Affordable and clean energy", count: 7393 },
    ],
  },
  {
    key: "country is (BE)", key_display_name: "country is (BE)", count: 500000,
    groups: [
      { key: "https://openalex.org/sdgs/4", key_display_name: "Quality education", count: 9 },
    ],
  },
];

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

describe("sortGroups", () => {
  it("null sort keeps the API order", () => {
    expect(sortGroups(institutions, null)).toBe(institutions);
  });

  it("sorts by any measure, both directions", () => {
    const desc = sortGroups(institutions, { key: "mean_fwci", dir: "desc" }).map((g) => g.key_display_name);
    expect(desc).toEqual(["Massachusetts Institute of Technology", "Harvard University", "Stanford University"]);
    const asc = sortGroups(institutions, { key: "count", dir: "asc" }).map((g) => g.count);
    expect(asc).toEqual([1140, 1253, 2289]);
  });

  it("sorts by the group's name", () => {
    const byName = sortGroups(institutions, { key: "group", dir: "asc" }).map((g) => g.key_display_name);
    expect(byName).toEqual(["Harvard University", "Massachusetts Institute of Technology", "Stanford University"]);
  });

  it("missing values sort last in both directions", () => {
    const withNull = [...institutions, { key: "x", key_display_name: "No FWCI", count: 1, mean_fwci: null }];
    expect(sortGroups(withNull, { key: "mean_fwci", dir: "desc" }).at(-1).key).toBe("x");
    expect(sortGroups(withNull, { key: "mean_fwci", dir: "asc" }).at(-1).key).toBe("x");
  });

  it("does not mutate its input", () => {
    const copy = [...institutions];
    sortGroups(institutions, { key: "count", dir: "desc" });
    expect(institutions).toEqual(copy);
  });
});

describe("flattenGroups", () => {
  it("nests children under their parent with a level", () => {
    const rows = flattenGroups(nested);
    expect(rows.map((r) => [r.level, r.group.key_display_name])).toEqual([
      [0, "institution is (I99464096)"],
      [1, "Good health and well-being"],
      [1, "Affordable and clean energy"],
      [0, "country is (BE)"],
      [1, "Quality education"],
    ]);
    expect(rows[0].hasChildren).toBe(true);
    expect(rows[1].hasChildren).toBe(false);
  });

  it("sorts every level the same way", () => {
    const rows = flattenGroups(nested, { sort: { key: "count", dir: "asc" } });
    expect(rows.map((r) => r.group.count)).toEqual([150235, 7393, 26536, 500000, 9]);
  });

  it("a collapsed parent hides its children; ids are key paths", () => {
    const rows = flattenGroups(nested, { collapsed: new Set(["/institution is (I99464096)"]) });
    expect(rows.map((r) => r.id)).toEqual([
      "/institution is (I99464096)",
      "/country is (BE)",
      "/country is (BE)/https://openalex.org/sdgs/4",
    ]);
  });
});

describe("splitDepth", () => {
  it("counts split levels", () => {
    expect(splitDepth(institutions)).toBe(1);
    expect(splitDepth(nested)).toBe(2);
    expect(splitDepth([])).toBe(0);
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

describe("splitsLabel", () => {
  it("joins each split's OQL words, outer first", () => {
    expect(splitsLabel([{ oql: "institution or country" }, { oql: "SDG" }])).toBe("institution or country › SDG");
    expect(splitsLabel([{ oql: "institution" }])).toBe("institution");
  });

  it("falls back to Group without splits", () => {
    expect(splitsLabel(undefined)).toBe("Group");
    expect(splitsLabel([])).toBe("Group");
  });
});

describe("csvFilename", () => {
  it("reads the server's file name", () => {
    expect(csvFilename('attachment; filename="openalex-crispr.zip"')).toBe("openalex-crispr.zip");
    expect(csvFilename("attachment; filename*=UTF-8''openalex%20groups.zip")).toBe("openalex groups.zip");
  });

  it("falls back to a dated name", () => {
    expect(csvFilename(null, new Date("2026-10-04T12:00:00Z"))).toBe("openalex-groups-2026-10-04.zip");
  });
});
