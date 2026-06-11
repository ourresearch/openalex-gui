// Field-picker metadata for the no-code OQL builder (oxjob #428 iter 6).
//
// The builder's field vocabulary comes from the OQL `/properties` API (the full
// filterable/searchable surface). To drive the SHARED SERP `SelectionMenu`
// (popular-first + search-all + "More") we just need, per entity:
//   - allKeys        : every filter/search property name
//   - popularKeys    : the ~8-10 to show before searching
//   - getDisplayName : key -> human label
//   - getIcon        : key -> mdi icon
//
// We borrow the SERP's curated popular set + icons from `facetConfigs` where a key
// lines up with an OQL property name (most popular ones do: primary_topic.id,
// authorships.author.id, open_access.is_oa, …); anything OQL-only still appears via
// search and falls back to a type-based icon. `/properties` carries no categories,
// so the "More" dialog is SelectionMenu's flat searchable list for now (a
// categorized tour is a follow-up once the API exposes groupings).

import { facetConfigs } from "@/facetConfigs";

// The filterable/searchable property keys, de-duplicated the way the builder's
// field list always has: drop `.search.exact` twins and collapse duplicate
// search-only display names.
export function fieldKeys(properties) {
  const seenSearch = new Set();
  const out = [];
  for (const p of Object.values(properties || {})) {
    const acts = p.actions || [];
    const isFilter = acts.includes("filter");
    const isSearch = acts.includes("search");
    if (!isFilter && !isSearch) continue;
    if (p.name.endsWith(".search.exact")) continue;
    if (isSearch && !isFilter) {
      const dn = (p.display_name || p.name).toLowerCase();
      if (seenSearch.has(dn)) continue;
      seenSearch.add(dn);
    }
    out.push(p.name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

const _facetMapCache = {};
function facetMap(entity) {
  if (!_facetMapCache[entity]) {
    const m = {};
    try { for (const c of facetConfigs(entity)) m[c.key] = c; } catch { /* entity may have none */ }
    _facetMapCache[entity] = m;
  }
  return _facetMapCache[entity];
}

// Popular keys = the SERP's popular filters for this entity that also exist as OQL
// properties; topped up with the first few available keys if too few line up.
export function popularFieldKeys(entity, allKeys) {
  const fm = facetMap(entity);
  const present = new Set(allKeys);
  const popular = Object.values(fm)
    .filter((c) => (c.actionsPopular || []).includes("filter"))
    .map((c) => c.key)
    .filter((k) => present.has(k));
  if (popular.length < 4) {
    for (const k of allKeys) {
      if (popular.length >= 8) break;
      if (!popular.includes(k)) popular.push(k);
    }
  }
  return popular.slice(0, 10);
}

const TYPE_ICON = {
  boolean: "mdi-toggle-switch-outline",
  number: "mdi-numeric",
  openalex_id: "mdi-tag-outline",
  search: "mdi-magnify",
  string: "mdi-form-textbox",
};
export function fieldIcon(entity, key, properties) {
  const fc = facetMap(entity)[key];
  if (fc?.icon) return fc.icon;
  return TYPE_ICON[(properties || {})[key]?.type] || "mdi-tag-outline";
}

// ---- categorized field list (the picker's "More" tour) ----------------------
// `/properties` now carries a nullable `category` (oxjob #441). Group the
// filterable/searchable props by it for the categorized "More" dialog; null
// categories fold into "other".
const CATEGORY_ORDER = [
  "aboutness", "author", "institution", "investigator", "funder",
  "source", "open access", "citation", "dates", "geo", "ids", "other",
];
const CATEGORY_ICON = {
  aboutness: "mdi-tag-outline",
  author: "mdi-account-outline",
  institution: "mdi-town-hall",
  investigator: "mdi-account-search-outline",
  funder: "mdi-cash-multiple",
  source: "mdi-book-open-variant",
  "open access": "mdi-lock-open-outline",
  citation: "mdi-format-quote-close",
  dates: "mdi-calendar-outline",
  geo: "mdi-earth",
  ids: "mdi-identifier",
  other: "mdi-dots-horizontal",
};

export function fieldsByCategory(properties) {
  const byCat = {};
  for (const k of fieldKeys(properties)) {
    const cat = (properties[k]?.category) || "other";
    (byCat[cat] = byCat[cat] || []).push({
      name: k,
      display_name: properties[k]?.display_name || k,
      type: properties[k]?.type,
    });
  }
  const order = [...CATEGORY_ORDER];
  for (const c of Object.keys(byCat)) if (!order.includes(c)) order.push(c);
  return order
    .filter((c) => byCat[c]?.length)
    .map((c) => ({
      category: c,
      icon: CATEGORY_ICON[c] || "mdi-tag-outline",
      items: byCat[c].sort((a, b) => a.display_name.localeCompare(b.display_name)),
    }));
}
