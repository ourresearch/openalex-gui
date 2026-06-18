// v2 render tree -> OQO reconstruction (oxjob #428 iter 22, decision B).
//
// The server's `oql_render_v2` tree (query_translation/oql_render_v2.py) is the
// no-code builder's EDIT MODEL: the client holds it as the reactive source of
// truth, mutates it in place, and rebuilds the OQO from the tree alone — no side
// data. This module is the rebuild direction.
//
// It is a faithful port of `v2_tree_to_oqo` in elastic-api's
// tests/unit/test_oql_render_v2.py — proven there to reconstruct the SAME
// canonical OQO (filter_rows) as the original parse, for every round-trip case.
// Keep the two in lockstep: if that reference changes, change this too.
//
// Node shapes (from oql_render_v2.build_tree):
//   tree    { entity:{id}, where, directives, lines }
//   where   an expr node, OR an implicit group wrapping the top-level rows
//   expr    clause | group
//     clause  { node:"clause", column_id, operator, value? , leaf? }
//               - factored: has `value` (a value vtree) -> a same-column branch
//               - simple:   has `leaf` (a raw OQO leaf dict), no `value`
//     group   { node:"group", join, negated?, children:[expr...] }
//   value   vleaf  { node:"vleaf", value, negated, ... }   (scalar atom)
//           vgroup { node:"vgroup", join, children:[value...] }

import { isSearchColumn, searchSurfaceToFilter } from "@/components/OqlPlayground/oqoTree";

// Is a value node non-empty? (Live editing leaves transient empty inputs — e.g.
// Enter adds a blank value box — which must NOT reach the server. The original
// reference never sees these because the server only renders complete queries.)
function vFilled(v) {
  return v.node === "vgroup" ? v.children.some(vFilled) : v.value !== "" && v.value != null;
}

// A factored value vtree -> an OQO filter, carrying the clause's column + operator
// down to every scalar leaf (LeafFilter.value is always a bare scalar — the
// branching lives in vgroups). Mirrors _value_to_filter in the reference, plus:
// drops empty leaves, collapses singleton groups, and routes typed search surface
// forms (quotes/wildcards) to the right `.search`/`.search.exact` column.
function valueToFilter(v, col, op) {
  if (v.node === "vleaf") {
    if (isSearchColumn(col)) {
      const r = searchSurfaceToFilter(v.value, col); // per-value column routing
      return { column_id: r.column_id, value: r.value, operator: op, is_negated: !!v.negated };
    }
    return { column_id: col, value: v.value, operator: op, is_negated: !!v.negated };
  }
  const filters = v.children.filter(vFilled).map((c) => valueToFilter(c, col, op));
  if (!filters.length) return null;
  if (filters.length === 1) return filters[0]; // a 1-item group collapses
  return { join: v.join, filters };
}

// An expr node (clause | group) -> an OQO filter, or null when incomplete (so
// half-built clauses simply don't contribute). Mirrors _expr_to_filter.
function exprToFilter(n) {
  if (n.node === "clause") {
    if (n.value != null) {                                  // factored
      if (!vFilled(n.value)) return null;
      return valueToFilter(n.value, n.column_id, n.operator);
    }
    if (!n.leaf) return null;                               // draft with no value yet
    const isUnary = n.leaf.value === null;                  // "is unknown" keeps null
    if (!isUnary && (n.leaf.value === "" || n.leaf.value == null)) return null;
    return { ...n.leaf };                                   // simple: raw leaf
  }
  const children = n.children.map(exprToFilter).filter(Boolean);
  if (n.negated) {
    if (!children.length) return null;
    const inner = children[0];                              // NNF wrapper: not (group)
    return { join: inner.join, filters: inner.filters, is_negated: true };
  }
  if (!children.length) return null;
  return { join: n.join, filters: children };
}

// The v2 tree's `where` -> OQO filter_rows. An implicit top-level group becomes
// sibling rows (the builder's filter rows); anything else is a single row.
// Incomplete nodes drop out (null-filtered).
export function v2FilterRows(tree) {
  const w = tree && tree.where;
  if (w == null) return [];
  if (w.node === "group" && w.implicit) {
    const filters = w.children.map(exprToFilter).filter(Boolean);
    // The top-level join (the outer all/any block, decision 32 / oxjob #475): AND is the
    // default — sibling filter_rows joined by commas. OR turns the whole body into a single
    // cross-field OR group row (`any (abstract has banana, title has apple)`). A 0/1-child
    // body has no join to express, so it stays a flat row list.
    if (w.join === "or" && filters.length > 1) return [{ join: "or", filters }];
    return filters;
  }
  const r = exprToFilter(w);
  return r ? [r] : [];
}

// Rebuild a full OQO dict from the v2 tree plus the component-owned sort/select
// (those stay component refs — the v2 tree only models the where clause). The
// get_rows / filter_rows / sort_by / select shape is exactly what the server's
// /query/oqo endpoint expects.
export function v2ToOqo({ tree, getRows, sortBy, select }) {
  const oqo = { get_rows: getRows || (tree && tree.entity && tree.entity.id) || "works" };
  const rows = v2FilterRows(tree);
  if (rows.length) oqo.filter_rows = rows;
  if (sortBy && sortBy.length) {
    oqo.sort_by = sortBy
      .filter((s) => s.column_id)
      .map((s) => ({ column_id: s.column_id, direction: s.direction || "asc" }));
  }
  if (select && select.length) oqo.select = select;
  return oqo;
}
