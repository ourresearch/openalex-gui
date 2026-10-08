// OQL pipeline-language results (oxjob #1536 and #1550, API side #1530).
//
// A pipeline query (`get works where ...; then group those works by ...; then
// calculate ...`) answers with groups that carry calculated columns and a summary
// instead of a page of rows:
//
//   meta.measures = [{key, measure, column_id, oql}]   one per calculated column
//   meta.splits   = [{oql, column_id, kind, has_ids}]  one per split, outer first
//   group_by      = [{key, key_display_name, count, <measure keys>, groups?}]
//   summary       = {all: {key: "all", key_display_name, count, <measure keys>},
//                    splits?: [{groups: [...], more_groups}]}   (2+ splits)
//
// The JSON nests (splits under `groups`); the website's table is flat (#1550,
// Jason: "Flat is what users are used to ... It's what a table should always be"):
// one row per innermost group, a column per split, every row sortable on its own.
// The summary is its own table: the whole set, then each split's groups on their
// own, computed by the API from the works. This module is plain JS so it can be
// unit-tested (no component mounts here).

import * as openalexId from "@/openalexId";
import { entityConfigs } from "@/entityConfigs";

// A response is a pipeline response when it names its calculated columns.
export function isPipelineResponse(resultsObject) {
  return Array.isArray(resultsObject?.meta?.measures);
}

// An OQO is a pipeline query when it calculates, or splits in a way today's
// group-by can't (listed values, bins, conditions, group filters). Its builder
// render (`oql_render_v2`) is null, so the builder can't show it.
export function isPipelineOqo(oqo) {
  if (!oqo || typeof oqo !== "object") return false;
  if (Array.isArray(oqo.calculate) && oqo.calculate.length) return true;
  return (oqo.group_by || []).some(
    (g) => g && typeof g === "object" && Object.keys(g).some((k) => k !== "column_id"),
  );
}

// Percent measures print with a % sign; everything else is a plain number.
const PERCENT_MEASURES = new Set(["percent", "percent_of_those"]);

export function formatMeasure(measure, value) {
  if (value == null || Number.isNaN(value)) return "–";
  if (typeof value !== "number") return String(value);
  if (PERCENT_MEASURES.has(measure?.measure)) {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

// A group's link: entity groups (institutions, authors, SDGs, countries...) link to
// their entity page; yes/no groups, bins, conditions and searches have no page.
export function groupLink(key) {
  if (typeof key !== "string" || !key.startsWith("https://openalex.org/")) return null;
  const entityType = openalexId.getEntityType(key);
  const shortId = openalexId.getShortId(key);
  if (!entityType || !shortId || !entityConfigs[entityType]) return null;
  return `/${entityType}/${shortId}`;
}

// The flat groups table: one row per innermost group. `path` holds the group at
// each split, outer first (the cells of the split columns); `group` is the
// innermost one (its calculated columns). The id is the path of keys, so it
// survives a re-sort.
export function flatRows(groups, depth, path = []) {
  const rows = [];
  for (const g of Array.isArray(groups) ? groups : []) {
    const p = [...path, g];
    if (p.length < depth) rows.push(...flatRows(g.groups, depth, p));
    else rows.push({ id: p.map((x) => x.key).join("/"), path: p, group: g });
  }
  return rows;
}

// The summary table: the whole set, then each split's groups on their own (only
// with 2+ splits; a single split's groups are the groups table itself). `of` is
// the split the row breaks down (null for the whole set); the other split cells
// are null, shown as "all".
export function summaryRows(summary, depth) {
  if (!summary?.all) return [];
  const blank = () => Array(depth).fill(null);
  const rows = [{ id: "all", of: null, path: blank(), group: summary.all }];
  (summary.splits || []).forEach((part, i) => {
    for (const g of part?.groups || []) {
      const path = blank();
      path[i] = g;
      rows.push({ id: `${i}/${g.key}`, of: i, path, group: g });
    }
  });
  return rows;
}

// A row's value for a sort key: `split:<i>` sorts by that split's group name, any
// other key is one of the row's calculated columns.
function rowValue(row, key) {
  if (key.startsWith("split:")) return row.path?.[Number(key.slice(6))]?.key_display_name;
  return row.group?.[key];
}

// Missing values (a mean over no values) always sort last, whichever the
// direction, so they never crowd the top.
function compareRows(a, b, sort) {
  const va = rowValue(a, sort.key);
  const vb = rowValue(b, sort.key);
  const aMissing = va == null || Number.isNaN(va);
  const bMissing = vb == null || Number.isNaN(vb);
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  const sign = sort.dir === "asc" ? 1 : -1;
  if (typeof va === "string" || typeof vb === "string") {
    return sign * String(va).localeCompare(String(vb), undefined, { numeric: true });
  }
  return sign * (va - vb);
}

// Sort flat rows on any column (stable); null sort keeps the API's order.
export function sortRows(rows, sort) {
  if (!Array.isArray(rows)) return [];
  if (!sort?.key) return rows;
  return rows
    .map((r, i) => [r, i])
    .sort(([a, ia], [b, ib]) => compareRows(a, b, sort) || ia - ib)
    .map(([r]) => r);
}

// The message for an API refusal: today's validation errors, or a pipeline limit
// ({error, message, fix}), which carries its fix separately.
export function refusalMessage(data) {
  if (!data || typeof data !== "object") return null;
  if (data.fix && data.message) return `${data.message} Fix: ${data.fix}`;
  return null;
}

// The CSV's file name from Content-Disposition, else one from the date and table.
export function csvFilename(disposition, now = new Date(), table = "groups") {
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition || "");
  if (m) return decodeURIComponent(m[1].trim());
  return `openalex-${table}-${now.toISOString().slice(0, 10)}.csv`;
}

// Price line for a /query check or an executed pipeline response's meta.cost.
export function formatCost(cost) {
  if (!cost || cost.credits == null) return null;
  const credits = `${cost.credits.toLocaleString("en-US")} credit${cost.credits === 1 ? "" : "s"}`;
  if (cost.usd == null) return credits;
  const usd = cost.usd < 0.01
    ? `$${cost.usd.toLocaleString("en-US", { maximumSignificantDigits: 2 })}`
    : `$${cost.usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${credits} (${usd})`;
}
