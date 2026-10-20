// Which charts fit a result, best first (oxjob #1745).
//
// Like Google Sheets' suggested charts, but it reads what OpenAlex data means: years are a
// time axis, countries are a map, open-access status and yes/no fields are shares of a whole,
// authors/institutions/sources/funders/topics are ranked bars, a single number is a tile.
// Shapes and their order come from the #1618 question map (746 chartable questions): ranked
// things 50%, one number 14%, category breakdowns 13%, over time 9%, time x group 15%.
//
// pickChart(resultsObject, oql) is the contract with the page (#1744): null for a plain list
// of rows (the answer opens on List/Table), else {type, options, measure}.

import { chartData, DIM } from "./chartData";

export const CHART = {
  NUMBER: "number",
  BARS: "bars",
  COLUMNS: "columns",
  LINE: "line",
  MAP: "map",
  SHARES: "shares",
  LINES: "lines",
  SHARES_TIME: "shares_over_time",
  STACKED: "stacked",
  SMALL: "small_multiples",
  STACKED_BARS: "stacked_bars",
  HEATMAP: "heatmap",
  SCATTER: "scatter",
};

// Names and icons for the chooser (mdi icon classes, loaded app-wide by @mdi/font).
export const CHART_INFO = {
  [CHART.NUMBER]: { label: "Number", icon: "mdi-numeric" },
  [CHART.BARS]: { label: "Bars", icon: "mdi-format-align-left" },
  [CHART.COLUMNS]: { label: "Columns", icon: "mdi-chart-bar" },
  [CHART.LINE]: { label: "Line", icon: "mdi-chart-line" },
  [CHART.MAP]: { label: "Map", icon: "mdi-earth" },
  [CHART.SHARES]: { label: "Shares", icon: "mdi-percent-outline" },
  [CHART.LINES]: { label: "Lines", icon: "mdi-chart-multiline" },
  [CHART.SHARES_TIME]: { label: "Shares by year", icon: "mdi-chart-bar-stacked" },
  [CHART.STACKED]: { label: "Stacked", icon: "mdi-chart-bar-stacked" },
  [CHART.SMALL]: { label: "Small multiples", icon: "mdi-view-grid-outline" },
  [CHART.STACKED_BARS]: { label: "Stacked bars", icon: "mdi-view-sequential-outline mdi-rotate-90" },
  [CHART.HEATMAP]: { label: "Heatmap", icon: "mdi-grid" },
  [CHART.SCATTER]: { label: "Scatter", icon: "mdi-chart-scatter-plot" },
};

// Series past these fold away: lines past six are spaghetti; shares past seven blur.
export const MAX_LINES = 6;
export const MAX_SHARES = 7;
const MAX_TANGLE = 4; // more series than this open on small multiples

// The measure a chart opens on: the one the query sorts by; else, over years, the measure asked
// for beside the count ("count and percent open access" by year is a question about the share;
// the chat lists count first by habit); else the first.
export function defaultMeasure(data) {
  if (!data?.measures?.length) return null;
  const sorted = data.measures.find((m) => m.key === data.sort?.key);
  if (sorted) return sorted;
  if (data.dims?.some((d) => d.kind === DIM.YEAR)) {
    const asked = data.measures.find((m) => m.measure !== "count" && m.measure !== "percent_of_those");
    if (asked) return asked;
  }
  return data.measures[0];
}

// The groups a chart draws at one split: unknowns drop out of rankings and maps (they
// aren't a place or a thing), but stay in shares of a whole.
export function knownCount(data, level = 0) {
  const keys = new Set();
  for (const r of data.rows) if (!r.path[level]?.unknown) keys.add(r.path[level].key);
  return keys.size;
}

const isShareDim = (d, n) =>
  d.kind === DIM.OA_STATUS || d.kind === DIM.YESNO || d.kind === DIM.BINS || (d.partition && n <= MAX_SHARES);

// Every chart that fits, best first. `measureKey` matters: shares and stacks need a measure
// that adds up (a count), not a mean or a percent.
export function chartOptions(data, measureKey) {
  if (!data || data.kind === "list" || data.kind === "empty") return [];
  if (!data.measures.length) return [];
  const measure = data.measures.find((m) => m.key === measureKey) || defaultMeasure(data);
  const add = measure.additive;
  const many = data.measures.length >= 2;

  if (data.kind === "number") return [CHART.NUMBER];

  if (data.dims.length === 1) {
    const d = data.dims[0];
    const n = d.kind === DIM.OA_STATUS || d.kind === DIM.YESNO ? data.rows.length : knownCount(data);
    if (n === 0) return [];
    if (n === 1 && d.kind !== DIM.YEAR) return [CHART.NUMBER];
    const scatter = many && n >= 5 && [DIM.THING, DIM.COUNTRY, DIM.NAMED, DIM.CATEGORY].includes(d.kind);
    const out = [];
    switch (d.kind) {
      case DIM.YEAR:
        out.push(...(n >= 3 ? [CHART.LINE, CHART.COLUMNS] : [CHART.COLUMNS, CHART.LINE]));
        break;
      case DIM.COUNTRY:
        out.push(CHART.MAP, CHART.BARS);
        break;
      case DIM.BINS:
        out.push(CHART.COLUMNS, CHART.BARS);
        if (add) out.push(CHART.SHARES);
        break;
      case DIM.OA_STATUS:
      case DIM.YESNO:
        out.push(...(add ? [CHART.SHARES, CHART.BARS] : [CHART.BARS]));
        break;
      case DIM.CATEGORY:
        if (add && d.partition && n <= MAX_SHARES) out.push(CHART.SHARES, CHART.BARS);
        else out.push(CHART.BARS);
        break;
      default: // THING, NAMED
        out.push(CHART.BARS);
    }
    if (scatter) out.push(CHART.SCATTER);
    return out;
  }

  if (data.dims.length === 2) {
    const yi = data.dims.findIndex((d) => d.kind === DIM.YEAR);
    if (yi >= 0) {
      const si = 1 - yi;
      const series = data.dims[si];
      if (series.kind === DIM.YEAR) return [];
      const n = knownCount(data, si);
      if (n === 0) return [];
      if (add && isShareDim(series, n)) return [CHART.SHARES_TIME, CHART.STACKED, CHART.LINES];
      // Past four series, lines tangle: small multiples read better (dataviz skill).
      return n > MAX_TANGLE ? [CHART.SMALL, CHART.LINES] : [CHART.LINES, CHART.SMALL];
    }
    const inner = data.dims[1];
    const nInner = knownCount(data, 1);
    if (add && isShareDim(inner, nInner)) return [CHART.STACKED_BARS, CHART.HEATMAP];
    return [CHART.HEATMAP];
  }

  // Three splits: the Table tab shows them better than any one chart.
  return [];
}

export function pickChart(resultsObject /* , oql: unused, the response says it all */) {
  const data = chartData(resultsObject);
  const measure = defaultMeasure(data);
  const options = chartOptions(data, measure?.key);
  if (!options.length) return null;
  return { type: options[0], options, measure: measure.key };
}
