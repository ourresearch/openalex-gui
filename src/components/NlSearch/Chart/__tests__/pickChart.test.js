// oxjob #1745: the chart picker on real production answers (fixtures fetched 2026-10-20
// from POST https://api.openalex.org/ {oql}; refetch with the job's work/fetch_fixtures.py).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { pickChart, chartOptions, CHART } from "../pickChart";
import { chartData, DIM, groupFilterRows } from "../chartData";
import { shortLabels } from "../chartStyle";

describe("groupFilterRows: from a group back to its works", () => {
  it("things, countries, years, statuses, yes/no", () => {
    // Ids filter by their short form, as the facets do (the API takes either case).
    const inst = chartData(answer("rank_institutions"));
    expect(groupFilterRows(inst, [{ level: 0, key: "https://openalex.org/I19820366" }]))
      .toEqual([{ column_id: "authorships.institutions.lineage", value: "i19820366" }]);
    const ctry = chartData(answer("countries"));
    expect(groupFilterRows(ctry, [{ level: 0, key: "https://openalex.org/countries/US" }]))
      .toEqual([{ column_id: "authorships.countries", value: "us" }]);
    const yr = chartData(answer("year_oa_status"));
    expect(groupFilterRows(yr, [{ level: 0, key: "2020" }, { level: 1, key: "gold" }])).toEqual([
      { column_id: "publication_year", value: 2020 },
      { column_id: "open_access.oa_status", value: "gold" },
    ]);
    const yn = chartData(answer("is_oa_yesno"));
    expect(groupFilterRows(yn, [{ level: 0, key: "1" }])).toEqual([{ column_id: "open_access.is_oa", value: true }]);
  });

  it("bins become ranges; searches use their own filter row; unknowns can't be drilled", () => {
    const bins = chartData(answer("citation_bins"));
    // Edges come from the query's own bins (at 1, 10, 100).
    expect(groupFilterRows(bins, [{ level: 0, key: "10-99" }])).toEqual([
      { column_id: "cited_by_count", value: 10, operator: ">=" },
      { column_id: "cited_by_count", value: 100, operator: "<" },
    ]);
    expect(groupFilterRows(bins, [{ level: 0, key: "0" }])).toEqual([
      { column_id: "cited_by_count", value: 0, operator: ">=" },
      { column_id: "cited_by_count", value: 1, operator: "<" },
    ]);
    expect(groupFilterRows(bins, [{ level: 0, key: "100+" }])).toEqual([{ column_id: "cited_by_count", value: 100, operator: ">=" }]);
    const s = chartData(answer("compare_searches_year"));
    expect(groupFilterRows(s, [{ level: 0, key: '"deep learning"' }])[0]).toMatchObject({ value: '"deep learning"', operator: "has" });
    expect(groupFilterRows(chartData(answer("countries")), [{ level: 0, key: "https://openalex.org/countries/unknown" }])).toBe(null);
  });
});

describe("shortLabels", () => {
  it("cuts names that would collide in the middle, keeping their ends", () => {
    const items = [
      { key: "a", name: "Indian Institute of Technology Delhi" },
      { key: "b", name: "Indian Institute of Technology Bombay" },
      { key: "c", name: "Indian Institute of Science Bangalore" },
    ];
    const l = shortLabels(items, 24);
    expect(new Set(l.values()).size).toBe(3);
    expect(l.get("a").endsWith("Delhi")).toBe(true);
    expect(l.get("b").endsWith("Bombay")).toBe(true);
  });
});

// CHART_FIXTURES=<dir> reruns every expectation on freshly fetched answers (an API change check).
const dir = process.env.CHART_FIXTURES || path.join(__dirname, "../__fixtures__");
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), "utf8"));
const answer = (name) => fixture(name).response;

// name -> [default, ...the others offered], or null when no chart fits
const EXPECTED = {
  works_list: null,
  authors_list: null,
  number_count: [CHART.NUMBER],
  number_count_pct: [CHART.NUMBER],
  year_count: [CHART.LINE, CHART.COLUMNS],
  year_count_pct: [CHART.MEASURES, CHART.LINE, CHART.COLUMNS],
  oa_status: [CHART.SHARES, CHART.BARS],
  is_oa_yesno: [CHART.SHARES, CHART.BARS],
  type: [CHART.BARS],
  language: [CHART.BARS],
  sdg: [CHART.BARS],
  topics: [CHART.BARS],
  citation_bins: [CHART.COLUMNS, CHART.BARS, CHART.SHARES],
  rank_institutions: [CHART.MEASURES, CHART.BARS, CHART.SCATTER],
  rank_authors: [CHART.MEASURES, CHART.BARS, CHART.SCATTER],
  rank_sources: [CHART.BARS],
  rank_funders: [CHART.BARS],
  countries: [CHART.MAP, CHART.MEASURES, CHART.BARS, CHART.SCATTER],
  compare_institutions: [CHART.MEASURES, CHART.BARS],
  year_oa_status: [CHART.SHARES_TIME, CHART.STACKED, CHART.LINES],
  year_type: [CHART.SMALL, CHART.LINES],
  compare_institutions_year: [CHART.LINES, CHART.SMALL],
  compare_searches_year: [CHART.LINES, CHART.SMALL],
  institutions_by_year: [CHART.SMALL, CHART.LINES],
  countries_by_year: [CHART.SMALL, CHART.LINES],
  compare_institutions_oa: [CHART.STACKED_BARS, CHART.HEATMAP],
  countries_sdg: [CHART.HEATMAP],
  rank_journals_retracted: [CHART.BARS],
  sdg_with_share: [CHART.BARS],
};

describe("pickChart on real answers", () => {
  it("has an expectation for every fixture", () => {
    const names = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
    expect(names.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  for (const [name, expected] of Object.entries(EXPECTED)) {
    it(`${name}: ${expected ? expected.join(", ") : "no chart (a list)"}`, () => {
      const { response, oql } = fixture(name);
      const pick = pickChart(response, oql);
      if (expected === null) {
        expect(pick).toBe(null);
        return;
      }
      expect(pick.type).toBe(expected[0]);
      expect(pick.options).toEqual(expected);
    });
  }
});

describe("chartData", () => {
  it("a calculation with no split is a number with the whole set's values", () => {
    const d = chartData(answer("number_count_pct"));
    expect(d.kind).toBe("number");
    expect(d.whole.count).toBe(128862);
    expect(d.measures.map((m) => m.key)).toEqual(["count", "percent_open_access_is_oa"]);
    expect(d.measures[1].percent).toBe(true);
  });

  it("reads the splits of a plain group-by from the echoed query", () => {
    const d = chartData(answer("year_oa_status"));
    expect(d.dims.map((x) => x.kind)).toEqual([DIM.YEAR, DIM.OA_STATUS]);
    expect(d.rows.length).toBeGreaterThan(30);
    expect(d.rows[0].path[0].year).toBeTypeOf("number");
    expect(d.measures.map((m) => m.key)).toEqual(["count"]);
  });

  it("names yes/no groups after the field", () => {
    const d = chartData(answer("is_oa_yesno"));
    expect(d.dims[0].kind).toBe(DIM.YESNO);
    expect(d.rows.map((r) => r.path[0].name).sort()).toEqual(["Not open access", "Open access"]);
  });

  it("reads countries as ISO codes and comparisons as named things", () => {
    expect(chartData(answer("countries")).rows[0].path[0].code).toBe("US");
    const c = chartData(answer("compare_searches_year"));
    expect(c.dims.map((x) => x.kind)).toEqual([DIM.NAMED, DIM.YEAR]);
    expect(c.rows[0].path[0].name).toBe("machine learning");
  });

  it("names sources limited to one type after the type", () => {
    expect(chartData(answer("rank_journals_retracted")).dims[0]).toMatchObject({ label: "journal", noun: "journal" });
  });

  it("knows thing splits and their nouns", () => {
    const d = chartData(answer("rank_institutions"));
    expect(d.dims[0]).toMatchObject({ kind: DIM.THING, noun: "institution", more: true });
    expect(d.dims[0].groupsCount).toBeGreaterThan(1000);
  });

  it("opens on the measure the query sorts by", () => {
    const r = answer("rank_institutions");
    const sorted = { ...r, meta: { ...r.meta, x_query: { ...r.meta.x_query, oqo: { ...r.meta.x_query.oqo, sort_by: [{ column_id: "mean_fwci", direction: "desc" }] } } } };
    expect(pickChart(sorted).measure).toBe("mean_fwci");
    expect(pickChart(r).measure).toBe("count");
  });

  it("over years, opens on the measure asked for beside the count", () => {
    expect(pickChart(answer("year_count_pct")).measure).toBe("percent_open_access_is_oa");
    expect(pickChart(answer("compare_institutions_year")).measure).toBe("mean_fwci");
    expect(pickChart(answer("year_count")).measure).toBe("count");
  });
});

describe("chartOptions follows the measure", () => {
  it("no shares or stacks for a mean or a percent", () => {
    const d = chartData(answer("year_count_pct"));
    expect(chartOptions(d, "percent_open_access_is_oa")).toEqual([CHART.MEASURES, CHART.LINE, CHART.COLUMNS]);
    const c = chartData(answer("compare_institutions_year"));
    expect(chartOptions(c, "mean_fwci")).toEqual([CHART.LINES, CHART.SMALL]);
  });

  it("a count with its own share offers no scatter and no panels", () => {
    const r = answer("sdg_with_share");
    const share = { key: "percent_of_those", measure: "percent_of_those", column_id: null, oql: "percent of those works" };
    const total = r.group_by.reduce((s, g) => s + g.count, 0);
    const withShare = {
      ...r,
      meta: { ...r.meta, measures: [...r.meta.measures, share] },
      group_by: r.group_by.map((g) => ({ ...g, percent_of_those: (100 * g.count) / total })),
    };
    expect(pickChart(withShare).options).toEqual([CHART.BARS]);
  });

  it("empty and odd answers never throw", () => {
    expect(pickChart(null)).toBe(null);
    expect(pickChart({})).toBe(null);
    expect(pickChart({ meta: { count: 0 }, group_by: [] })).toBe(null);
    expect(pickChart({ meta: { measures: [{ key: "count", measure: "count" }], splits: [] }, summary: { all: { count: 3 } }, group_by: [] }).type).toBe(CHART.NUMBER);
  });
});
