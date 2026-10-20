// Draw one chart type for a result with Observable Plot (oxjob #1745).
//
// renderChart(Plot, {data, type, measureKey, width, world}) -> {node, title, note}
//   Plot: the @observablehq/plot module (loaded lazily by the component)
//   data: chartData(resultsObject); type: a CHART value; world: map features (maps only)
// Marks follow the dataviz skill: bars <= 24 px with a 4 px rounded data end, 2 px lines,
// hairline grid, a 2 px surface gap between stacked marks, labels in text ink, a legend for
// two or more series, a tooltip on every chart. Labels are API data: Plot sets them as text.

import { DIM, OA_ORDER, plural } from "./chartData";
import { CHART, MAX_LINES, MAX_SHARES } from "./pickChart";
import { INK, SERIES, OTHER, RAMP, OA_COLORS, FONT, formatValue, tickFormat, truncate, textWidth, joinNotes } from "./chartStyle";

const TOP_BARS = 15;
const TOP_PANELS = 12;
const TOP_HEAT_ROWS = 15;
const TOP_HEAT_COLS = 10;
export const CURRENT_YEAR = new Date().getFullYear();

const STYLE = { fontFamily: FONT, fontSize: "12px", color: INK.secondary, background: "transparent", overflow: "visible" };

const num = (v) => typeof v === "number" && Number.isFinite(v);
const measureOf = (data, key) => data.measures.find((m) => m.key === key) || data.measures[0];

// Tooltip text: the group's name, then every measure (the chosen one first).
function tipText(name, values, data, m, extra = "") {
  const lines = [name + extra];
  for (const x of [m, ...data.measures.filter((y) => y.key !== m.key)]) {
    if (num(values?.[x.key])) lines.push(`${x.label}: ${formatValue(x, values[x.key])}`);
  }
  return lines.join("\n");
}

// The whole set's value for a mean or a percent: the baseline every group reads against.
const wholeValue = (data, m) => (!m.additive && num(data.whole?.[m.key]) ? data.whole[m.key] : null);

// ---- one split -------------------------------------------------------------------------

function oneDimRows(data, m) {
  const d = data.dims[0];
  const keepUnknown = [DIM.OA_STATUS, DIM.YESNO, DIM.BINS].includes(d.kind);
  return data.rows
    .map((r) => ({ ...r.path[0], value: r.values[m.key], values: r.values }))
    .filter((r) => num(r.value) && (keepUnknown || !r.unknown));
}

function ordered(rows, d, data, m) {
  if (d.kind === DIM.YEAR) return [...rows].sort((a, b) => a.year - b.year);
  if (d.kind === DIM.OA_STATUS) return [...rows].sort((a, b) => OA_ORDER.indexOf(a.status) - OA_ORDER.indexOf(b.status));
  if (d.kind === DIM.YESNO) return [...rows].sort((a, b) => Number(b.yes) - Number(a.yes));
  if (d.kind === DIM.BINS) return rows; // the API's order: low to high
  if (data.sort?.key === m.key) return rows; // the query's own order, ascending or descending
  return [...rows].sort((a, b) => b.value - a.value);
}

// "Top 15 of 32,864 institutions"; re-ranking a page of groups by another measure says so.
function rankNote(data, d, shown, total, m) {
  const parts = [];
  const all = d.more ? d.groupsCount : total;
  if (all > shown) parts.push(`Top ${shown} of ${all.toLocaleString("en-US")} ${plural(d.noun, all)}`);
  if (d.more && data.sort?.key !== m.key && m.key !== "count" && d.kind !== DIM.YEAR) {
    parts.push(`ranked among the ${total.toLocaleString("en-US")} with the most works`);
  }
  return parts.join(", ");
}

function yearsOnly(rows) {
  const future = rows.filter((r) => r.year > CURRENT_YEAR).length;
  return { rows: rows.filter((r) => r.year <= CURRENT_YEAR), future };
}

function yearNotes(m, rows, future) {
  const notes = [];
  if (m.additive && rows.some((r) => r.year === CURRENT_YEAR)) notes.push(`${CURRENT_YEAR} is the year so far`);
  if (future) notes.push(`works dated after ${CURRENT_YEAR} left out`);
  return notes;
}

// Integer year ticks that fit the width.
function yearTicks(years, width) {
  const step = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(width / 64))));
  return years.filter((y, i) => (years.length - 1 - i) % step === 0);
}

function bars(Plot, data, m, width) {
  const d = data.dims[0];
  const all = ordered(oneDimRows(data, m), d, data, m);
  const shown = all.length <= 20 ? all : all.slice(0, TOP_BARS); // never "top 15 of 17"
  const labelMax = width < 700 ? 24 : width < 880 ? 36 : 44;
  const labelOf = new Map(shown.map((r) => [String(r.key), truncate(r.name, labelMax)]));
  const marginLeft = Math.min(width * 0.42, Math.max(48, ...shown.map((r) => textWidth(labelOf.get(String(r.key))))) + 14);
  const valueText = (r) => formatValue(m, r.value, { short: true });
  const marginRight = Math.max(...shown.map((r) => textWidth(valueText(r)))) + 18;
  const base = wholeValue(data, m);
  const fill = d.kind === DIM.OA_STATUS ? (r) => OA_COLORS[r.status] || OTHER : SERIES[0];
  const marks = [
    Plot.barX(shown, { x: "value", y: (r) => String(r.key), fill, rx2: 4, insetTop: 4, insetBottom: 4 }),
    Plot.ruleX([0], { stroke: INK.baseline }),
    Plot.text(shown, { x: "value", y: (r) => String(r.key), text: valueText, dx: 6, textAnchor: "start", fill: INK.secondary }),
    Plot.tip(shown, Plot.pointerY({ x: "value", y: (r) => String(r.key), title: (r) => tipText(r.name, r.values, data, m) })),
  ];
  if (base != null) {
    marks.splice(2, 0, Plot.ruleX([base], { stroke: INK.primary, strokeOpacity: 0.55 }));
    marks.push(Plot.text([base], { x: (v) => v, frameAnchor: "top", dy: -14, text: (v) => `All works ${formatValue(m, v)}`, fill: INK.secondary }));
  }
  const node = Plot.plot({
    width,
    height: shown.length * 30 + 44,
    marginLeft,
    marginRight,
    marginTop: base != null ? 26 : 8,
    marginBottom: 30,
    style: STYLE,
    x: { grid: true, nice: true, label: null, tickFormat: tickFormat(m), ticks: Math.max(2, Math.floor((width - marginLeft) / 110)), ...(m.percent ? { domain: [0, 100] } : {}) },
    y: { domain: shown.map((r) => String(r.key)), label: null, tickSize: 0, tickFormat: (k) => labelOf.get(k), tickPadding: 6 },
    marks,
  });
  return { node, title: `${m.label} by ${d.label}`, note: rankNote(data, d, shown.length, all.length, m) };
}

function line(Plot, data, m, width) {
  const d = data.dims[0];
  const { rows, future } = yearsOnly(ordered(oneDimRows(data, m), d, data, m));
  const partial = m.additive && rows.length > 1 && rows[rows.length - 1].year === CURRENT_YEAR;
  const solid = partial ? rows.slice(0, -1) : rows;
  const tail = partial ? rows.slice(-2) : [];
  const c = SERIES[0];
  const last = solid[solid.length - 1];
  const tip = (r) => tipText(String(r.year), r.values, data, m, r.year === CURRENT_YEAR && m.additive ? " (so far)" : "");
  const node = Plot.plot({
    width,
    height: 380,
    marginLeft: 52,
    marginRight: 40,
    marginTop: 24,
    marginBottom: 30,
    style: STYLE,
    x: { label: null, tickFormat: (y) => String(y), ticks: yearTicks(rows.map((r) => r.year), width) },
    y: { grid: true, nice: true, label: null, zero: m.additive || m.percent, tickFormat: tickFormat(m), ...(m.percent ? { domain: [0, 100] } : {}) },
    marks: [
      m.additive ? Plot.areaY(solid, { x: "year", y: "value", fill: c, fillOpacity: 0.1 }) : null,
      m.additive ? Plot.ruleY([0], { stroke: INK.baseline }) : null,
      Plot.lineY(solid, { x: "year", y: "value", stroke: c, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
      Plot.lineY(tail, { x: "year", y: "value", stroke: c, strokeWidth: 2, strokeDasharray: "2,4", strokeLinecap: "round" }),
      Plot.dot(last ? [last] : [], { x: "year", y: "value", r: 4, fill: c, stroke: INK.surface, strokeWidth: 2 }),
      Plot.dot(partial ? [rows[rows.length - 1]] : [], { x: "year", y: "value", r: 4, fill: INK.surface, stroke: c, strokeWidth: 2 }),
      Plot.text(last ? [last] : [], { x: "year", y: "value", text: (r) => formatValue(m, r.value, { short: true }), dy: -14, fill: INK.primary, fontWeight: 600 }),
      Plot.ruleX(rows, Plot.pointerX({ x: "year", stroke: INK.baseline })),
      Plot.dot(rows, Plot.pointerX({ x: "year", y: "value", r: 4, fill: c, stroke: INK.surface, strokeWidth: 2 })),
      Plot.tip(rows, Plot.pointerX({ x: "year", y: "value", title: tip })),
    ].filter(Boolean),
  });
  return { node, title: `${m.label} per year`, note: joinNotes(yearNotes(m, rows, future)) };
}

function columns(Plot, data, m, width) {
  const d = data.dims[0];
  let rows = ordered(oneDimRows(data, m), d, data, m);
  let future = 0;
  if (d.kind === DIM.YEAR) ({ rows, future } = yearsOnly(rows));
  const keys = rows.map((r) => String(r.key));
  const nameOf = new Map(rows.map((r) => [String(r.key), r.name]));
  const plotW = width - 70;
  const band = (plotW / Math.max(1, rows.length)) * 0.9;
  const inset = Math.max(1, (band - 24) / 2);
  const showTick = new Set(d.kind === DIM.YEAR ? yearTicks(rows.map((r) => r.year), width).map(String) : keys);
  const partialKey = m.additive && d.kind === DIM.YEAR ? String(CURRENT_YEAR) : null;
  const labelCaps = rows.length <= 12;
  const node = Plot.plot({
    width,
    height: 380,
    marginLeft: 52,
    marginRight: 16,
    marginTop: labelCaps ? 24 : 12,
    marginBottom: 30,
    style: STYLE,
    x: { domain: keys, label: null, tickSize: 0, tickFormat: (k) => (showTick.has(k) ? truncate(nameOf.get(k), 14) : "") },
    y: { grid: true, nice: true, label: null, tickFormat: tickFormat(m), ...(m.percent ? { domain: [0, 100] } : {}) },
    marks: [
      Plot.barY(rows, { x: (r) => String(r.key), y: "value", fill: SERIES[0], fillOpacity: (r) => (String(r.key) === partialKey ? 0.45 : 1), ry2: 4, insetLeft: inset, insetRight: inset }),
      Plot.ruleY([0], { stroke: INK.baseline }),
      labelCaps ? Plot.text(rows, { x: (r) => String(r.key), y: "value", text: (r) => formatValue(m, r.value, { short: true }), dy: -8, fill: INK.secondary }) : null,
      Plot.tip(rows, Plot.pointerX({ x: (r) => String(r.key), y: "value", title: (r) => tipText(r.name, r.values, data, m, String(r.key) === partialKey ? " (so far)" : "") })),
    ].filter(Boolean),
  });
  const notes = d.kind === DIM.YEAR ? yearNotes(m, rows, future) : [];
  const title = d.kind === DIM.YEAR ? `${m.label} per year` : `${m.label} by ${d.label}`;
  return { node, title, note: joinNotes(notes) };
}

function map(Plot, data, m, width, world) {
  const rows = oneDimRows(data, m).filter((r) => r.code);
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const vals = rows.map((r) => r.value).filter((v) => v > 0);
  const skewed = m.additive && vals.length > 2 && Math.max(...vals) / Math.min(...vals) > 50;
  const features = (world || []).map((f) => ({ ...f, row: byCode.get(f.properties.iso2) }));
  const withData = features.filter((f) => f.row && (!skewed || f.row.value > 0));
  // A log legend labels only powers of ten (every minor tick collides).
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const logTicks = [];
  for (let p = 10 ** Math.ceil(Math.log10(lo || 1)); p <= hi; p *= 10) logTicks.push(p);
  const node = Plot.plot({
    width,
    height: Math.round(width * 0.47),
    margin: 4,
    style: STYLE,
    projection: { type: "equal-earth", domain: { type: "Sphere" } },
    color: {
      type: skewed ? "log" : "linear",
      range: [RAMP[0], RAMP[6]],
      interpolate: "hcl",
      legend: true,
      label: m.label,
      width: Math.min(320, width - 20),
      tickFormat: tickFormat(m),
      ...(skewed ? { ticks: logTicks } : { ticks: 4 }),
      ...(m.percent ? { domain: [0, 100] } : {}),
    },
    marks: [
      Plot.sphere({ stroke: INK.grid, strokeWidth: 1 }),
      Plot.geo(features, { fill: INK.empty, stroke: INK.surface, strokeWidth: 0.5 }),
      Plot.geo(withData, { fill: (f) => f.row.value, stroke: INK.surface, strokeWidth: 0.5 }),
      Plot.tip(withData, Plot.pointer(Plot.geoCentroid({ title: (f) => tipText(f.row.name, f.row.values, data, m) }))),
    ],
  });
  const missing = rows.length - withData.length;
  const note = joinNotes([
    missing > 0 ? `${missing} ${plural("country", missing)} too small for this map; see Bars` : "",
    m.additive ? "A work counts for every country among its authors" : "",
  ]);
  return { node, title: `${m.label} by country`, note };
}

// Shares of a whole: one 100% bar, with a legend that names every part and its share.
function shares(Plot, data, m, width, doc) {
  const d = data.dims[0];
  let rows = ordered(oneDimRows(data, m), d, data, m);
  if (rows.length > MAX_SHARES) {
    const rest = rows.slice(MAX_SHARES - 1);
    rows = [...rows.slice(0, MAX_SHARES - 1), { key: "__other", name: `Other (${rest.length})`, value: rest.reduce((s, r) => s + r.value, 0), other: true }];
  }
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  rows = rows.map((r, i) => ({
    ...r,
    share: r.value / total,
    color: r.other ? OTHER : d.kind === DIM.OA_STATUS ? OA_COLORS[r.status] || OTHER : d.kind === DIM.YESNO ? (r.yes ? SERIES[0] : OTHER) : SERIES[i % SERIES.length],
  }));
  const pct = (s) => `${(s * 100).toLocaleString("en-US", { maximumFractionDigits: s < 0.1 ? 1 : 0 })}%`;
  const bar = Plot.plot({
    width,
    height: 64,
    margin: 0,
    marginTop: 8,
    marginBottom: 8,
    style: STYLE,
    x: { axis: null, domain: [0, 1] },
    y: { axis: null },
    marks: [
      Plot.barX(rows, Plot.stackX({ x: "share", fill: (r) => r.color, stroke: INK.surface, strokeWidth: 2, order: null, title: (r) => `${r.name}\n${pct(r.share)} · ${formatValue(m, r.value)} works` , tip: true })),
      Plot.text(rows, Plot.stackX({ x: "share", order: null, text: (r) => (r.share * width >= textWidth(pct(r.share)) + 14 ? pct(r.share) : ""), fill: (r) => (["#eda100", "#1baf7a", "#6da7ec", OTHER].includes(r.color) ? INK.primary : "#ffffff"), fontWeight: 600 })),
    ],
  });
  const legend = doc.createElement("div");
  legend.className = "nl-chart-shares";
  for (const r of rows) {
    const item = doc.createElement("div");
    item.className = "nl-chart-shares__item";
    const sw = doc.createElement("span");
    sw.className = "nl-chart-shares__swatch";
    sw.style.background = r.color;
    const name = doc.createElement("span");
    name.className = "nl-chart-shares__name";
    name.textContent = r.name;
    const share = doc.createElement("strong");
    share.textContent = pct(r.share);
    const count = doc.createElement("span");
    count.className = "nl-chart-shares__count";
    count.textContent = formatValue(m, r.value);
    item.append(sw, name, share, count);
    legend.append(item);
  }
  const node = doc.createElement("div");
  node.append(bar, legend);
  const overlap = !d.partition && d.kind !== DIM.OA_STATUS && d.kind !== DIM.YESNO;
  return { node, title: `${m.label} by ${d.label}`, note: overlap ? "Works can sit in more than one group" : "" };
}

function scatter(Plot, data, m, width) {
  const d = data.dims[0];
  const xM = data.measures.find((x) => x.additive && x.key !== m.key) || data.measures.find((x) => x.key !== m.key);
  const yM = m.key === xM.key ? data.measures.find((x) => x.key !== xM.key) : m;
  const rows = oneDimRows(data, yM).filter((r) => num(r.values[xM.key]) && num(r.values[yM.key]));
  const xs = rows.map((r) => r.values[xM.key]).filter((v) => v > 0);
  const xLog = xM.additive && xs.length && Math.max(...xs) / Math.min(...xs) > 50;
  // Label the standouts (highest up the side, furthest along), placed so no two collide.
  const byY = [...rows].sort((a, b) => b.values[yM.key] - a.values[yM.key]);
  const byX = [...rows].sort((a, b) => b.values[xM.key] - a.values[xM.key]);
  const candidates = [...new Map([byY[0], byX[0], byY[1], byX[1], byY[2], byY[3], byX[2], byY[4]].filter(Boolean).map((r) => [r.key, r])).values()];
  const base = wholeValue(data, yM);
  const options = (labelled) => ({
    width,
    height: 420,
    marginLeft: 56,
    marginRight: 130,
    marginTop: 24,
    marginBottom: 40,
    style: STYLE,
    x: { type: xLog ? "log" : "linear", grid: true, label: `${xM.label} →`, labelAnchor: "right", tickFormat: tickFormat(xM), ticks: Math.floor(width / 120) },
    y: { grid: true, nice: true, label: `↑ ${yM.label}`, tickFormat: tickFormat(yM), ...(yM.percent ? { domain: [0, 100] } : {}) },
    marks: [
      base != null ? Plot.ruleY([base], { stroke: INK.primary, strokeOpacity: 0.55 }) : null,
      base != null ? Plot.text([base], { y: (v) => v, frameAnchor: "right", dx: 4, textAnchor: "start", text: (v) => `All works ${formatValue(yM, v)}`, fill: INK.secondary }) : null,
      Plot.dot(rows, { x: (r) => r.values[xM.key], y: (r) => r.values[yM.key], r: 4.5, fill: SERIES[0], fillOpacity: 0.85, stroke: INK.surface, strokeWidth: 1.5 }),
      Plot.text(labelled, { x: (r) => r.values[xM.key], y: (r) => r.values[yM.key], text: (r) => truncate(r.name, 26), dx: 8, textAnchor: "start", fill: INK.secondary }),
      Plot.tip(rows, Plot.pointer({ x: (r) => r.values[xM.key], y: (r) => r.values[yM.key], title: (r) => tipText(r.name, r.values, data, yM) })),
    ].filter(Boolean),
  });
  // Two passes: draw to learn the scales, then keep each label only where it hits no other.
  const first = Plot.plot(options([]));
  const sx = first.scale("x");
  const sy = first.scale("y");
  const boxes = [];
  const labelled = [];
  for (const r of candidates) {
    const x = sx.apply(r.values[xM.key]) + 8;
    const y = sy.apply(r.values[yM.key]);
    const box = [x, y - 8, x + textWidth(truncate(r.name, 26)), y + 8];
    if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
    boxes.push(box);
    labelled.push(r);
  }
  const node = Plot.plot(options(labelled));
  const all = d.more ? d.groupsCount : rows.length;
  const note = all > rows.length ? `The ${rows.length} ${plural(d.noun, rows.length)} with the most works, of ${all.toLocaleString("en-US")}` : "";
  return { node, title: `${yM.label} and ${xM.label.toLowerCase()} by ${d.label}`, note };
}

// ---- two splits ------------------------------------------------------------------------

// The series of a split, biggest first by works (so colours follow the thing, not the measure).
function seriesOf(data, si) {
  const countKey = data.measures.find((x) => x.additive)?.key || data.measures[0].key;
  const totals = new Map();
  if (si === 0 && data.outer.length) {
    for (const o of data.outer) if (!o.path[0].unknown) totals.set(o.path[0].key, { ...o.path[0], total: o.values[countKey] || 0 });
  } else {
    for (const r of data.rows) {
      const p = r.path[si];
      if (p.unknown) continue;
      const t = totals.get(p.key) || { ...p, total: 0 };
      t.total += r.values[countKey] || 0;
      totals.set(p.key, t);
    }
  }
  const d = data.dims[si];
  const list = [...totals.values()];
  if (d.kind === DIM.OA_STATUS) return list.sort((a, b) => OA_ORDER.indexOf(a.status) - OA_ORDER.indexOf(b.status));
  if (d.kind === DIM.YESNO) return list.sort((a, b) => Number(b.yes) - Number(a.yes));
  if (d.kind === DIM.BINS) return list;
  if (d.kind === DIM.NAMED) return list; // the order the question named them
  return list.sort((a, b) => b.total - a.total);
}

// Unique display names for a legend (two institutions can share a name).
function uniqueNames(series) {
  const seen = new Map();
  return series.map((s) => {
    const n = seen.get(s.name) || 0;
    seen.set(s.name, n + 1);
    return n ? `${s.name} (${n + 1})` : s.name;
  });
}

function yearSeriesRows(data, m, keep) {
  const yi = data.dims.findIndex((d) => d.kind === DIM.YEAR);
  const si = 1 - yi;
  return data.rows
    .filter((r) => keep.has(r.path[si].key) && num(r.values[m.key]) && r.path[yi].year <= CURRENT_YEAR)
    .map((r) => ({ year: r.path[yi].year, skey: r.path[si].key, value: r.values[m.key], values: r.values }))
    .sort((a, b) => a.year - b.year);
}

function lines(Plot, data, m, width) {
  const yi = data.dims.findIndex((d) => d.kind === DIM.YEAR);
  const sd = data.dims[1 - yi];
  const all = seriesOf(data, 1 - yi);
  const top = all.slice(0, MAX_LINES);
  const names = uniqueNames(top);
  const nameOf = new Map(top.map((s, i) => [s.key, names[i]]));
  const colors = sd.kind === DIM.OA_STATUS ? top.map((s) => OA_COLORS[s.status] || OTHER) : SERIES.slice(0, top.length);
  const rows = yearSeriesRows(data, m, new Set(nameOf.keys())).map((r) => ({ ...r, series: nameOf.get(r.skey) }));
  const partial = m.additive && rows.some((r) => r.year === CURRENT_YEAR);
  const solid = partial ? rows.filter((r) => r.year < CURRENT_YEAR) : rows;
  const tail = partial ? rows.filter((r) => r.year >= CURRENT_YEAR - 1) : [];
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const byYear = years.map((y) => {
    const at = rows.filter((r) => r.year === y).sort((a, b) => b.value - a.value);
    const head = `${y}${partial && y === CURRENT_YEAR ? " (so far)" : ""}`;
    return { year: y, top: Math.max(...at.map((r) => r.value)), title: [head, ...at.map((r) => `${r.series}: ${formatValue(m, r.value)}`)].join("\n") };
  });
  const lastPoints = names.map((n) => solid.filter((r) => r.series === n).pop()).filter(Boolean);
  // Up to four series also get their name at the line's end, unless the ends crowd each other.
  const ends = names.map((n) => rows.filter((r) => r.series === n).pop()).filter(Boolean);
  const allV = rows.map((r) => r.value);
  const span = Math.max(...allV) - (m.additive ? 0 : Math.min(...allV)) || 1;
  const endV = ends.map((e) => e.value).sort((a, b) => a - b);
  const endLabels = top.length <= 4 && endV.every((v, i) => !i || v - endV[i - 1] >= span * 0.07);
  const endText = (e) => truncate(e.series, 22);
  const node = Plot.plot({
    width,
    height: 400,
    marginLeft: 52,
    marginRight: endLabels ? Math.max(...ends.map((e) => textWidth(endText(e)))) + 18 : 20,
    marginTop: 16,
    marginBottom: 30,
    style: STYLE,
    color: { domain: names, range: colors, legend: true, swatchSize: 12 },
    x: { label: null, tickFormat: (y) => String(y), ticks: yearTicks(years, width) },
    y: { grid: true, nice: true, label: null, zero: m.additive, tickFormat: tickFormat(m), ...(m.percent ? { domain: [0, 100] } : {}) },
    marks: [
      m.additive ? Plot.ruleY([0], { stroke: INK.baseline }) : null,
      Plot.lineY(solid, { x: "year", y: "value", z: "series", stroke: "series", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }),
      Plot.lineY(tail, { x: "year", y: "value", z: "series", stroke: "series", strokeWidth: 2, strokeDasharray: "2,4", strokeLinecap: "round" }),
      Plot.dot(lastPoints, { x: "year", y: "value", fill: "series", r: 4, stroke: INK.surface, strokeWidth: 2 }),
      endLabels ? Plot.text(ends, { x: "year", y: "value", text: endText, dx: 8, textAnchor: "start", fill: INK.secondary }) : null,
      Plot.ruleX(byYear, Plot.pointerX({ x: "year", stroke: INK.baseline })),
      Plot.tip(byYear, Plot.pointerX({ x: "year", y: "top", title: "title" })),
    ].filter(Boolean),
  });
  const notes = [];
  if (all.length > top.length) notes.push(`Top ${top.length} of ${(sd.more ? sd.groupsCount : all.length).toLocaleString("en-US")} ${plural(sd.noun, all.length)} by works`);
  notes.push(...yearNotes(m, rows, 0));
  return { node, title: `${m.label} per year, by ${sd.label}`, note: joinNotes(notes) };
}

function smallMultiples(Plot, data, m, width) {
  const yi = data.dims.findIndex((d) => d.kind === DIM.YEAR);
  const sd = data.dims[1 - yi];
  const all = seriesOf(data, 1 - yi);
  const top = all.slice(0, TOP_PANELS);
  const cols = width < 720 ? 2 : width < 980 ? 3 : 4;
  const idx = new Map(top.map((s, i) => [s.key, i]));
  const names = uniqueNames(top);
  const rows = yearSeriesRows(data, m, new Set(idx.keys())).map((r) => {
    const i = idx.get(r.skey);
    return { ...r, series: names[i], fx: i % cols, fy: Math.floor(i / cols) };
  });
  const panels = top.map((s, i) => ({ name: truncate(names[i], Math.floor(width / cols / 7.5)), fx: i % cols, fy: Math.floor(i / cols) }));
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const nRows = Math.ceil(top.length / cols);
  const node = Plot.plot({
    width,
    height: nRows * 132 + 36,
    marginLeft: 44,
    marginRight: 12,
    marginTop: 22,
    marginBottom: 28,
    style: STYLE,
    fx: { axis: null, paddingInner: 0.14 },
    fy: { axis: null, paddingInner: 0.32 },
    x: { label: null, tickFormat: (y) => String(y), ticks: years.length ? [years[0], years[years.length - 1]] : [] },
    y: { grid: true, nice: true, label: null, ticks: 3, zero: m.additive, tickFormat: tickFormat(m), ...(m.percent ? { domain: [0, 100] } : {}) },
    marks: [
      Plot.frame({ stroke: INK.grid, strokeWidth: 1, anchor: "bottom" }),
      m.additive ? Plot.areaY(rows, { x: "year", y: "value", fx: "fx", fy: "fy", fill: SERIES[0], fillOpacity: 0.1 }) : null,
      Plot.lineY(rows, { x: "year", y: "value", fx: "fx", fy: "fy", stroke: SERIES[0], strokeWidth: 1.5 }),
      Plot.text(panels, { fx: "fx", fy: "fy", text: "name", frameAnchor: "top-left", dy: -16, fill: INK.primary, fontWeight: 600 }),
      Plot.tip(rows, Plot.pointerX({ x: "year", y: "value", fx: "fx", fy: "fy", title: (r) => `${r.series}\n${r.year}: ${formatValue(m, r.value)}` })),
    ].filter(Boolean),
  });
  const notes = [];
  if (all.length > top.length) notes.push(`Top ${top.length} of ${(sd.more ? sd.groupsCount : all.length).toLocaleString("en-US")} ${plural(sd.noun, all.length)} by works; same scale in every panel`);
  else notes.push("Same scale in every panel");
  notes.push(...yearNotes(m, rows, 0));
  return { node, title: `${m.label} per year, by ${sd.label}`, note: joinNotes(notes) };
}

// The parts of a whole at a split, in their colours; past MAX_SHARES the tail folds to Other.
function partsOf(data, si) {
  const d = data.dims[si];
  const series = seriesOf(data, si);
  const keep = series.slice(0, series.length > MAX_SHARES ? MAX_SHARES - 1 : MAX_SHARES);
  const names = uniqueNames(keep);
  const nameOf = new Map(keep.map((s, i) => [s.key, names[i]]));
  const colors = keep.map((s, i) =>
    d.kind === DIM.OA_STATUS ? OA_COLORS[s.status] || OTHER : d.kind === DIM.YESNO ? (s.yes ? SERIES[0] : OTHER) : SERIES[i % SERIES.length],
  );
  const folded = series.length > keep.length;
  if (folded) {
    names.push("Other");
    colors.push(OTHER);
  }
  return { nameOf, names, colors, folded };
}

function stackedYears(Plot, data, m, width, normalize) {
  const yi = data.dims.findIndex((d) => d.kind === DIM.YEAR);
  const si = 1 - yi;
  const sd = data.dims[si];
  const { nameOf, names, colors } = partsOf(data, si);
  const rows = data.rows
    .filter((r) => num(r.values[m.key]) && r.path[yi].year <= CURRENT_YEAR && !r.path[si].unknown)
    .map((r) => ({ year: String(r.path[yi].year), part: nameOf.get(r.path[si].key) || "Other", value: r.values[m.key] }));
  const years = [...new Set(rows.map((r) => r.year))].sort();
  const showTick = new Set(yearTicks(years.map(Number), width).map(String));
  const band = ((width - 70) / Math.max(1, years.length)) * 0.9;
  const inset = Math.max(1, (band - 28) / 2);
  const totals = new Map();
  for (const r of rows) totals.set(r.year, (totals.get(r.year) || 0) + r.value);
  const pct = (r) => `${((r.value / totals.get(r.year)) * 100).toFixed(1)}%`;
  const node = Plot.plot({
    width,
    height: 400,
    marginLeft: 52,
    marginRight: 16,
    marginTop: 16,
    marginBottom: 30,
    style: STYLE,
    color: { domain: names, range: colors, legend: true, swatchSize: 12 },
    x: { domain: years, label: null, tickSize: 0, tickFormat: (y) => (showTick.has(y) ? y : "") },
    y: { grid: true, label: null, tickFormat: normalize ? (v) => `${Math.round(v * 100)}%` : tickFormat(m) },
    marks: [
      Plot.barY(rows, Plot.stackY({ x: "year", y: "value", fill: "part", order: names, offset: normalize ? "normalize" : null, stroke: INK.surface, strokeWidth: 1, insetLeft: inset, insetRight: inset, title: (r) => `${r.part}, ${r.year}${Number(r.year) === CURRENT_YEAR ? " (so far)" : ""}\n${pct(r)} · ${formatValue(m, r.value)} works`, tip: true })),
      Plot.ruleY([0], { stroke: INK.baseline }),
    ],
  });
  const notes = [];
  if (!normalize) notes.push(...yearNotes(m, rows.map((r) => ({ year: Number(r.year) })), 0));
  if (!sd.partition && sd.kind !== DIM.OA_STATUS && sd.kind !== DIM.YESNO) notes.push("Works can sit in more than one group");
  return { node, title: normalize ? `Share of works per year, by ${sd.label}` : `${m.label} per year, by ${sd.label}`, note: joinNotes(notes) };
}

function stackedBars(Plot, data, m, width) {
  const od = data.dims[0];
  const id = data.dims[1];
  const outer = seriesOf(data, 0).slice(0, TOP_BARS);
  const { nameOf, names, colors } = partsOf(data, 1);
  const keepOuter = new Set(outer.map((o) => o.key));
  const labelMax = width < 700 ? 22 : 34;
  const labelOf = new Map(outer.map((o) => [String(o.key), truncate(o.name, labelMax)]));
  const rows = data.rows
    .filter((r) => keepOuter.has(r.path[0].key) && !r.path[1].unknown && num(r.values[m.key]))
    .map((r) => ({ outer: String(r.path[0].key), oname: r.path[0].name, part: nameOf.get(r.path[1].key) || "Other", value: r.values[m.key] }));
  const marginLeft = Math.min(width * 0.4, Math.max(48, ...[...labelOf.values()].map((l) => textWidth(l))) + 14);
  const node = Plot.plot({
    width,
    height: outer.length * 30 + 48,
    marginLeft,
    marginRight: 16,
    marginTop: 8,
    marginBottom: 30,
    style: STYLE,
    color: { domain: names, range: colors, legend: true, swatchSize: 12 },
    x: { grid: true, label: null, tickFormat: (v) => `${Math.round(v * 100)}%` },
    y: { domain: outer.map((o) => String(o.key)), label: null, tickSize: 0, tickFormat: (k) => labelOf.get(k) },
    marks: [
      Plot.barX(rows, Plot.stackX({ y: "outer", x: "value", fill: "part", order: names, offset: "normalize", stroke: INK.surface, strokeWidth: 2, insetTop: 4, insetBottom: 4, title: (r) => `${r.oname}\n${r.part}: ${formatValue(m, r.value)} works`, tip: true })),
    ],
  });
  return { node, title: `Share of works by ${id.label}, for each ${od.label}`, note: rankNote(data, od, outer.length, seriesOf(data, 0).length, m) };
}

function heatmap(Plot, data, m, width) {
  const od = data.dims[0];
  const id = data.dims[1];
  const outer = seriesOf(data, 0).slice(0, TOP_HEAT_ROWS);
  const inner = seriesOf(data, 1).slice(0, TOP_HEAT_COLS);
  const ok = new Set(outer.map((o) => o.key));
  const ik = new Set(inner.map((o) => o.key));
  const rows = data.rows
    .filter((r) => ok.has(r.path[0].key) && ik.has(r.path[1].key) && num(r.values[m.key]))
    .map((r) => ({ o: String(r.path[0].key), i: String(r.path[1].key), oname: r.path[0].name, iname: r.path[1].name, value: r.values[m.key] }));
  const oLabel = new Map(outer.map((o) => [String(o.key), truncate(o.name, width < 700 ? 20 : 30)]));
  const iLabel = new Map(inner.map((o) => [String(o.key), truncate(o.name, 14)]));
  const marginLeft = Math.min(width * 0.35, Math.max(48, ...[...oLabel.values()].map((l) => textWidth(l))) + 12);
  const cellW = (width - marginLeft - 16) / Math.max(1, inner.length);
  const max = Math.max(...rows.map((r) => r.value), 0);
  const node = Plot.plot({
    width,
    height: outer.length * 28 + 90,
    marginLeft,
    marginRight: 16,
    marginTop: 8,
    marginBottom: 60,
    style: STYLE,
    color: { type: "linear", range: [RAMP[0], RAMP[6]], interpolate: "hcl", legend: true, label: m.label, tickFormat: tickFormat(m) },
    x: { domain: inner.map((o) => String(o.key)), label: null, tickSize: 0, tickRotate: inner.length > 6 ? -30 : 0, tickFormat: (k) => iLabel.get(k) },
    y: { domain: outer.map((o) => String(o.key)), label: null, tickSize: 0, tickFormat: (k) => oLabel.get(k) },
    marks: [
      Plot.cell(rows, { x: "i", y: "o", fill: "value", inset: 1, rx: 2, title: (r) => `${r.oname} · ${r.iname}\n${m.label}: ${formatValue(m, r.value)}`, tip: true }),
      cellW >= 40 ? Plot.text(rows, { x: "i", y: "o", text: (r) => formatValue(m, r.value, { short: true }), fill: (r) => (r.value > max * 0.55 ? "#ffffff" : INK.primary) }) : null,
    ].filter(Boolean),
  });
  const allInner = seriesOf(data, 1).length;
  const note = joinNotes([
    rankNote(data, od, outer.length, seriesOf(data, 0).length, m),
    allInner > inner.length ? `top ${inner.length} of ${allInner} ${plural(id.noun, allInner)}` : "",
  ]);
  return { node, title: `${m.label} by ${od.label} and ${id.label}`, note };
}

// ---- entry -----------------------------------------------------------------------------

export function renderChart(Plot, { data, type, measureKey, width, world, document: doc = globalThis.document }) {
  const m = measureOf(data, measureKey);
  const w = Math.max(320, Math.round(width || 640));
  switch (type) {
    case CHART.BARS:
      return bars(Plot, data, m, w);
    case CHART.LINE:
      return line(Plot, data, m, w);
    case CHART.COLUMNS:
      return columns(Plot, data, m, w);
    case CHART.MAP:
      return map(Plot, data, m, w, world);
    case CHART.SHARES:
      return shares(Plot, data, m, w, doc);
    case CHART.SCATTER:
      return scatter(Plot, data, m, w);
    case CHART.LINES:
      return lines(Plot, data, m, w);
    case CHART.SMALL:
      return smallMultiples(Plot, data, m, w);
    case CHART.SHARES_TIME:
      return stackedYears(Plot, data, m, w, true);
    case CHART.STACKED:
      return stackedYears(Plot, data, m, w, false);
    case CHART.STACKED_BARS:
      return stackedBars(Plot, data, m, w);
    case CHART.HEATMAP:
      return heatmap(Plot, data, m, w);
    default:
      return null;
  }
}
