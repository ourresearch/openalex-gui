// Turn any OQL execute response into one flat shape the charts read (oxjob #1745).
//
// Three response shapes come back from POST https://api.openalex.org/ {oql}:
//   - a list of rows (works, authors...): `results`, no group_by
//   - a calculation (`meta.measures`): `meta.splits` (outer first), nested `group_by[].groups`,
//     `summary.all` (the whole set) and `summary.splits`; no split = one number per measure
//   - a plain group-by (no `meta.measures`): `group_by` with a count per group, nested `groups`
//     for a second field; the fields are in `meta.x_query.oqo.group_by`
// Plain JS, no Vue, so the picker and its tests can run in node.

import pluralize from "pluralize";
import { getShortId } from "@/openalexId";

// What a split's values are, which decides the chart (see pickChart.js).
export const DIM = {
  YEAR: "year", // a time axis
  COUNTRY: "country", // a map
  OA_STATUS: "oa_status", // shares of a whole, in its own colours
  YESNO: "yesno", // shares of a whole
  BINS: "bins", // ordered ranges
  THING: "thing", // authors, institutions, sources, funders, topics...: ranked
  NAMED: "named", // a comparison of a few named things or searches
  CATEGORY: "category", // type, language, SDG, license...
};

// Fields whose groups split the works into parts that add up to the whole (one value per
// work), so shares of a whole are honest. Multi-valued fields (countries, SDGs, topics,
// institutions) overlap: a work counts in several groups.
const PARTITION_FIELDS = new Set([
  "open_access.oa_status",
  "open_access.is_oa",
  "type",
  "language",
  "primary_topic.id",
  "primary_topic.field.id",
  "primary_topic.subfield.id",
  "primary_topic.domain.id",
  "primary_location.source.type",
  "primary_location.license",
  "best_oa_location.license",
  "has_fulltext",
  "is_retracted",
  "has_abstract",
  "has_doi",
]);

// The works fields that group by a thing with its own page (column ids as the API echoes them).
const THING_FIELDS = [
  [/(^|\.)author\.id$/, "author"],
  [/(^|\.)institutions\.(lineage|id)$/, "institution"],
  [/publisher(_lineage)?$/, "publisher"],
  [/(^|\.)source\.id$/, "source"],
  [/(^|\.)(funders\.id|funder)$/, "funder"],
  [/(^|\.|primary_)topics?\.id$/, "topic"],
  [/(^|\.)subfield\.id$/, "subfield"],
  [/(^|\.)field\.id$/, "field"],
  [/(^|\.)domain\.id$/, "domain"],
  [/(^|\.)keywords\.id$/, "keyword"],
];

// A readable name for a plain group-by's field (calculations name their own splits).
const FIELD_LABELS = {
  publication_year: "year",
  "open_access.oa_status": "open access status",
  "open_access.is_oa": "open access",
  type: "type",
  language: "language",
  "sustainable_development_goals.id": "SDG",
  "authorships.countries": "country",
  "authorships.institutions.country_code": "country",
  "primary_location.source.type": "source type",
  "authorships.institutions.type": "institution type",
};

// Open-access statuses in their reading order, most open first.
export const OA_ORDER = ["diamond", "gold", "green", "hybrid", "bronze", "closed"];

const isYesNoKey = (k) => ["0", "1", "true", "false"].includes(String(k).toLowerCase());
const isYesKey = (k) => ["1", "true"].includes(String(k).toLowerCase());

function dimKind(columnId, kind, groups) {
  const id = columnId || "";
  if (kind === "values" || kind === "searches") return DIM.NAMED;
  if (kind === "bins") return DIM.BINS;
  if (id === "publication_year") return DIM.YEAR;
  if (/countr/.test(id) || /country_code/.test(id)) return DIM.COUNTRY;
  if (id === "open_access.oa_status") return DIM.OA_STATUS;
  if (groups.length && groups.length <= 2 && groups.every((g) => isYesNoKey(g.key))) return DIM.YESNO;
  if (THING_FIELDS.some(([re]) => re.test(id))) return DIM.THING;
  return DIM.CATEGORY;
}

function thingNoun(columnId) {
  const hit = THING_FIELDS.find(([re]) => re.test(columnId || ""));
  return hit ? hit[1] : null;
}

function fieldLabel(columnId) {
  if (FIELD_LABELS[columnId]) return FIELD_LABELS[columnId];
  const noun = thingNoun(columnId);
  if (noun) return noun;
  const last = String(columnId || "group").split(".").filter((p) => p !== "id").pop();
  return last.replace(/_/g, " ");
}

// A country group's ISO code from its key ("https://openalex.org/countries/US" -> "US").
export function countryCode(key) {
  const m = /countries\/([A-Za-z]{2})$/.exec(String(key || ""));
  return m ? m[1].toUpperCase() : /^[A-Za-z]{2}$/.test(String(key || "")) ? String(key).toUpperCase() : null;
}

const isUnknownGroup = (g) =>
  g == null || g.key == null || g.key === "" || /(^|\/)(unknown|null)$/i.test(String(g.key));

function groupName(g, kind, dimLabel) {
  const raw = g.key_display_name ?? g.key;
  if (kind === DIM.YESNO) {
    const yes = isYesKey(g.key);
    return yes ? capitalize(dimLabel) : `Not ${dimLabel}`;
  }
  if (kind === DIM.NAMED) return String(raw).replace(/^"(.*)"$/, "$1");
  if ((kind === DIM.CATEGORY || kind === DIM.OA_STATUS) && typeof raw === "string" && /^[a-z-]+$/.test(raw)) {
    return capitalize(raw.replace(/-/g, " "));
  }
  return String(raw);
}

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const PERCENT = new Set(["percent", "percent_of_those"]);

function measureLabel(m) {
  if (m.measure === "count") return "Works";
  const text = m.oql || m.key;
  if (m.measure === "percent_of_those") return "Share of works";
  return capitalize(text);
}

// Values can only be summed across groups for counts (stacked bars, shares).
export const isAdditive = (m) => m?.measure === "count" || m?.measure === "sum";

// The response, flattened.
//   kind: "list" | "number" | "groups" | "empty"
//   dims: [{columnId, kind, label, noun, partition, groupsCount, more}]  outer first
//   measures: [{key, measure, label, percent, additive}]  only the ones with numbers
//   rows: [{path: [{key, name, code?, year?}], values: {measureKey: number}}]  innermost groups
//   outer: same shape, the outer groups' own values (2+ splits)
//   whole: the whole set's values (summary.all), or {count: meta.count}
//   sort: {key, dir} when the query sorts by a measure
export function chartData(resultsObject) {
  const r = resultsObject || {};
  const meta = r.meta || {};
  const oqo = meta.x_query?.oqo || {};
  const base = {
    total: meta.count ?? null,
    rowsEntity: oqo.get_rows || null,
    oqo,
    dims: [],
    measures: [],
    rows: [],
    outer: [],
    whole: r.summary?.all || (meta.count != null ? { count: meta.count } : {}),
    sort: null,
  };
  const groups = Array.isArray(r.group_by) ? r.group_by : [];
  const isCalc = Array.isArray(meta.measures);

  if (!isCalc && !groups.length) {
    return { ...base, kind: Array.isArray(r.results) ? "list" : "empty" };
  }

  // The splits, outer first.
  const splitDefs = isCalc
    ? meta.splits || []
    : (oqo.group_by || []).map((g) => ({ column_id: g.column_id, kind: "column", oql: null }));

  // Measures: a calculation names them; a plain group-by only counts.
  const rawMeasures = isCalc ? meta.measures : [{ key: "count", measure: "count", oql: "count" }];

  // Flatten: walk the nested groups, one row per innermost group.
  const depth = Math.max(splitDefs.length, groups.length ? 1 : 0);
  const levelGroups = Array.from({ length: depth }, () => []);
  const flat = [];
  const walk = (gs, level, path) => {
    for (const g of gs || []) {
      levelGroups[level]?.push(g);
      const p = [...path, g];
      if (level + 1 < depth) walk(g.groups, level + 1, p);
      else flat.push(p);
    }
  };
  walk(groups, 0, []);

  const dims = splitDefs.slice(0, depth).map((s, i) => {
    const kind = dimKind(s.column_id, s.kind, levelGroups[i]);
    let label = (s.oql && kind !== DIM.YESNO ? s.oql : fieldLabel(s.column_id)).replace(/ bins$/, "");
    // Sources limited to one type say so: "Works by journal", not "by source".
    const where = (oqo.group_by || [])[i]?.where;
    if (label === "source" && where?.column_id === "type" && typeof where.value === "string") label = where.value;
    return {
      columnId: s.column_id,
      kind,
      label,
      noun: label,
      partition: PARTITION_FIELDS.has(s.column_id) || kind === DIM.BINS || kind === DIM.YESNO,
      groupsCount: i === 0 ? meta.groups_count ?? levelGroups[0].length : null,
      more: i === 0 ? Boolean(meta.more_groups) || (meta.groups_count ?? 0) > levelGroups[0].length : false,
    };
  });

  const node = (g, d) => {
    const n = { key: g.key, name: groupName(g, d.kind, d.label) };
    if (d.kind === DIM.COUNTRY) n.code = countryCode(g.key);
    if (d.kind === DIM.YEAR) n.year = Number(g.key);
    if (d.kind === DIM.OA_STATUS) n.status = String(g.key).toLowerCase();
    if (d.kind === DIM.YESNO) n.yes = isYesKey(g.key);
    n.unknown = isUnknownGroup(g);
    return n;
  };
  const values = (g) => Object.fromEntries(rawMeasures.map((m) => [m.key, g[m.key]]));

  const rows = flat.map((p) => ({ path: p.map((g, i) => node(g, dims[i])), values: values(p[p.length - 1]) }));
  const outer = depth > 1 ? groups.map((g) => ({ path: [node(g, dims[0])], values: values(g) })) : [];

  // Keep only measures with numbers (an author's last known institution is text).
  const measures = rawMeasures
    .filter((m) => {
      const vals = (rows.length ? rows : [{ values: values(base.whole) }]).map((x) => x.values[m.key]);
      return vals.some((v) => typeof v === "number" && Number.isFinite(v));
    })
    .map((m) => ({
      key: m.key,
      measure: m.measure,
      label: measureLabel(m),
      percent: PERCENT.has(m.measure),
      additive: isAdditive(m),
    }));

  const s = (oqo.sort_by || [])[0];
  const sort = s && measures.some((m) => m.key === s.column_id) ? { key: s.column_id, dir: s.direction || "desc" } : null;

  return {
    ...base,
    kind: depth === 0 ? "number" : "groups",
    dims,
    measures,
    rows,
    outer,
    sort,
  };
}

// ---- from a group back to its works (drill-through) --------------------------------------

// A bin as filter rows: from its lower edge (the label's first number) up to the query's next
// edge (`bins.at`), so "10-99" with edges (1, 10, 100) is >= 10 and < 100, "100+" is >= 100.
// Without edges (equal-width bins), the label's own upper number closes it.
function binRows(columnId, key, edges) {
  const k = String(key);
  const lo = parseFloat(k);
  if (!Number.isFinite(lo)) return null;
  const rows = [{ column_id: columnId, value: lo, operator: ">=" }];
  const next = Array.isArray(edges) ? edges.find((e) => e > lo) : undefined;
  const labelHi = /^-?[\d.]+-(-?[\d.]+)$/.exec(k);
  if (next != null) rows.push({ column_id: columnId, value: next, operator: "<" });
  else if (labelHi) rows.push({ column_id: columnId, value: Number(labelHi[1]), operator: "<=" });
  else if (!k.endsWith("+")) rows.push({ column_id: columnId, value: lo, operator: "<=" });
  return rows;
}

// The filter rows that pick out one group's works, to AND onto the query's starting set
// (Metabase "See these records", Excel "Show Details"). `nodes`: [{level, key}] for one or
// more splits. Null when a group can't be filtered to (unknown, an "Other" fold).
export function groupFilterRows(data, nodes) {
  const rows = [];
  for (const { level, key } of nodes || []) {
    const d = data?.dims?.[level];
    const spec = (data?.oqo?.group_by || [])[level] || {};
    if (!d || isUnknownGroup({ key }) || key === "__other") return null;
    if (d.kind === DIM.YEAR) rows.push({ column_id: d.columnId, value: Number(key) });
    else if (d.kind === DIM.YESNO) rows.push({ column_id: d.columnId, value: isYesKey(key) });
    else if (d.kind === DIM.BINS) {
      const b = binRows(d.columnId, key, spec.bins?.at);
      if (!b) return null;
      rows.push(...b);
    } else if (Array.isArray(spec.values) && spec.values.some((v) => v && typeof v === "object")) {
      // A comparison of searches or of different fields: each item is its own filter row.
      const item = spec.values.find((v) => v && typeof v === "object" && String(v.value) === String(key));
      if (!item) return null;
      rows.push(item);
    } else {
      // An id ("https://openalex.org/I63966007", ".../countries/US") filters by its short form,
      // as the facets do (filterConfigs createFilterValue); the API takes either case.
      rows.push({ column_id: d.columnId, value: getShortId(key) || String(key) });
    }
  }
  return rows.length ? rows : null;
}

// "institution" -> "institutions", for "top 15 of 32,864 institutions".
// Acronyms keep their case: "SDG" -> "SDGs", not "SDGS".
export const plural = (noun, n) => {
  const w = noun || "group";
  if (/^[A-Z]{2,}$/.test(w)) return n === 1 ? w : `${w}s`;
  return pluralize(w, n);
};
