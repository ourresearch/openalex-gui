// oxjob #1745: the chart picker on real production answers (fixtures fetched 2026-10-20
// from POST https://api.openalex.org/ {oql}; refetch with the job's work/fetch_fixtures.py).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { pickChart, chartOptions, CHART } from "../pickChart";
import { chartData, DIM } from "../chartData";

const dir = path.join(__dirname, "../__fixtures__");
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

  it("empty and odd answers never throw", () => {
    expect(pickChart(null)).toBe(null);
    expect(pickChart({})).toBe(null);
    expect(pickChart({ meta: { count: 0 }, group_by: [] })).toBe(null);
    expect(pickChart({ meta: { measures: [{ key: "count", measure: "count" }], splits: [] }, summary: { all: { count: 3 } }, group_by: [] }).type).toBe(CHART.NUMBER);
  });
});
