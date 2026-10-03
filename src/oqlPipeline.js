// OQL pipeline-language results (oxjob #1536, API side #1530).
//
// A pipeline query (`get works where ...; then group those works by ...; then
// calculate ...`) answers with groups that carry calculated columns and a total
// row instead of a page of rows:
//
//   meta.measures = [{key, measure, column_id, oql}]   one per calculated column
//   total         = {key: "total", key_display_name, count, <measure keys>, groups?}
//   group_by      = [{key, key_display_name, count, <measure keys>, groups?}]
//
// Nested splits nest under `groups`. This module turns that into table rows and
// sorts them; it is plain JS so it can be unit-tested (no component mounts here).

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

// Compare two groups on a sort key. Missing values (a mean over no values) always
// sort last, whichever the direction, so they never crowd the top.
function compareGroups(a, b, sort) {
  const field = sort.key === "group" ? "key_display_name" : sort.key;
  const va = a?.[field];
  const vb = b?.[field];
  const aMissing = va == null || Number.isNaN(va);
  const bMissing = vb == null || Number.isNaN(vb);
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  const sign = sort.dir === "asc" ? 1 : -1;
  if (typeof va === "string" || typeof vb === "string") {
    return sign * String(va).localeCompare(String(vb), undefined, { numeric: true });
  }
  return sign * (va - vb);
}

// Sort one level of groups (stable); null sort keeps the API's order.
export function sortGroups(groups, sort) {
  if (!Array.isArray(groups)) return [];
  if (!sort?.key) return groups;
  return groups
    .map((g, i) => [g, i])
    .sort(([a, ia], [b, ib]) => compareGroups(a, b, sort) || ia - ib)
    .map(([g]) => g);
}

// Flatten the group tree into display rows, depth-first, sorting every level the
// same way. `collapsed` is a Set of row ids whose children are hidden. A row id is
// its path of keys, so it survives a re-sort.
export function flattenGroups(groups, { sort = null, collapsed = new Set(), level = 0, parentId = "" } = {}) {
  const rows = [];
  for (const g of sortGroups(groups, sort)) {
    const id = `${parentId}/${g.key}`;
    const children = Array.isArray(g.groups) ? g.groups : [];
    rows.push({ id, level, group: g, hasChildren: children.length > 0 });
    if (children.length && !collapsed.has(id)) {
      rows.push(...flattenGroups(children, { sort, collapsed, level: level + 1, parentId: id }));
    }
  }
  return rows;
}

// How many split levels a response has (1 for one split, up to 3).
export function splitDepth(groups) {
  let depth = 0;
  for (const g of groups || []) {
    depth = Math.max(depth, 1 + splitDepth(g.groups));
  }
  return depth;
}

// The message for an API refusal: today's validation errors, or a pipeline limit
// ({error, message, fix}), which carries its fix separately.
export function refusalMessage(data) {
  if (!data || typeof data !== "object") return null;
  if (data.fix && data.message) return `${data.message} Fix: ${data.fix}`;
  return null;
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
