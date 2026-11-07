// Group_by-picked closed vocabularies in the no-code OQL builder.
//
// The builder takes a column's value kind from the server /properties catalog. A
// column is entity-kind (value picker, plus NOT in the chip's action menu) only when
// it is an `openalex_id` or carries an `entity_type` with its own list endpoint
// (work-types, source-lists, study-designs, …). Plain keyword columns such as awards
// `provenance` / `funding_type` or locations `provenance` / `version` have neither, so
// they fell through to a free-text box: no list of values to pick from, and negation
// reachable only by typing a literal `not ` prefix.
//
// The GUI already treats these columns as closed vocabularies elsewhere: facetConfigs
// marks them `selectEntity` with no `entityToSelect`, and NoviceFilterChip loads their
// values via group_by (#1205). This applies the same rule to the builder. Matching
// catalog columns are tagged `_groupByVocab` when the catalog loads, valueKindForProperty
// reports them as entity-kind, and BuilderAddValue lists their group_by buckets.
//
// Kept out of builderFieldMeta.js: that module imports `filters`, which imports the
// store, and the store imports this module.

import { facetConfigs } from "@/facetConfigs";
import { resolvePropertyKey } from "@/components/OqlPlayground/oqoTree";

// A facet whose values are picked from its own group_by buckets: an entity-style
// select with no entity to autocomplete against, and both filterable and groupable.
export function isGroupByVocabFacet(fc) {
  if (!fc || fc.type !== "selectEntity" || fc.entityToSelect) return false;
  const actions = fc.actions || [];
  return actions.includes("filter") && actions.includes("group_by");
}

// A copy of an entity's /properties catalog with every group_by-vocab column tagged
// `_groupByVocab: true`. Columns the server already types as entities are left alone.
export function tagGroupByVocab(entity, props) {
  if (!props) return props;
  let facets;
  try { facets = facetConfigs(entity); } catch { return props; }
  let out = props;
  for (const fc of facets || []) {
    if (!isGroupByVocabFacet(fc)) continue;
    const col = resolvePropertyKey(props, fc.key);
    const p = props[col];
    if (!p || p.entity_type || p.type === "openalex_id" || p._groupByVocab) continue;
    if (out === props) out = { ...props };
    out[col] = { ...p, _groupByVocab: true };
  }
  return out;
}

// The value picker's rows for a group_by vocab (`vocab` = getGroupByValues' result):
// the buckets matching the typed query, most common first, each with its count. When
// the list may be incomplete (a full group_by page, e.g. an open-ended column like
// funder_scheme), the typed text itself is offered last so the list never blocks a
// value the old free-text box accepted.
export function groupByVocabRows(vocab, query, entity) {
  const { values = [], truncated = false } = vocab || {};
  const typed = String(query || "").trim();
  const needle = typed.toLowerCase();
  const rows = values
    .filter((v) => !needle || v.display_name.toLowerCase().includes(needle) ||
                   v.value.toLowerCase().includes(needle))
    .map((v) => ({ ...v, hint: v.count != null ? `${v.count.toLocaleString("en-US")} ${entity}` : undefined }));
  if (truncated && needle && !values.some((v) => v.value.toLowerCase() === needle)) {
    rows.push({ value: typed, display_name: typed, hint: "use this value" });
  }
  return rows;
}
