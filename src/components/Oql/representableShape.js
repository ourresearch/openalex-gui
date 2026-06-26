// Representable-shape gate for the 2D grid builder (oxjob #523).
//
// The grid builder gives up 100% coverage of arbitrary boolean query trees in
// exchange for clarity: it can ONLY render the AND-of-OR-groups shape that real
// systematic-review queries overwhelmingly take. Anything outside that shape is
// kicked to the OQL text tab (the builder tab disables). `canRepresentAsGrid`
// IS that gate — a pure structural test over the v2 `where` tree.
//
// THE REPRESENTABLE SET (LOCKED SPEC, #523):
//   - Top level is an AND of "rows". Each row is either ONE filter, or an OR-group
//     of filters (filter-scope OR). OR-ed filters must have FLAT value sets
//     (no nested AND, no sub-parens) — bullet 2 of the spec.
//   - A single-filter row's value is its own grid: an AND-of-OR-groups of value
//     atoms, with AT MOST ONE extra explicit-paren level per column
//     (e.g. `pie or (tart and pastry)` — the `(tart and pastry)` is the one level).
//   - NOT/negation is structurally transparent (a per-term modifier; Q11) — it
//     never changes whether a tree is representable, so we ignore `negated` here.
//   - Simple clauses (date range, boolean, proximity `near/within`, `is between`)
//     are atomic single cells (Q12) → always representable.
//
// Node shapes (mirrors treeToTokens.js:18-26 / v2ToOqo.js):
//   expr    clause | group
//     clause  { node:"clause", column_id, operator, value? , leaf?, ... }
//               - factored: has `value` (a value vtree)
//               - simple:   `value == null` (has `leaf`/`segments`) -> atomic cell
//     group   { node:"group", join:"and"|"or", negated?, children:[expr...] }
//   value   vleaf  { node:"vleaf", value, negated, ... }
//           vgroup { node:"vgroup", join:"and"|"or", children:[value...] }
//
// Canonical OQL never nests a group inside a same-join group (it flattens
// `a and (b and c)` -> `a and b and c`), so the checks below assume alternating
// joins; a stray same-join nesting just reads as "too deep" and kicks to OQL,
// which is the safe direction.

const isGroup = (n) => n && n.node === "group";
const isClause = (n) => n && n.node === "clause";
const isVleaf = (v) => v && v.node === "vleaf";
const isVgroup = (v) => v && v.node === "vgroup";
const isFactored = (clause) => isClause(clause) && clause.value != null;

const ok = () => ({ ok: true, reason: null });
const no = (reason) => ({ ok: false, reason });

// ---- value scope (inside one filter) --------------------------------------

// A COLUMN inside a value OR-group: a single atom, OR the one allowed extra
// paren level (an AND-group of plain atoms, e.g. `(tart and pastry)`).
function columnOk(v) {
  if (isVleaf(v)) return true;
  if (isVgroup(v) && v.join === "and") return (v.children || []).every(isVleaf);
  return false; // a deeper group, or an OR inside a column -> too deep
}

// A value ROW (an OR-group of columns): a lone atom or `a or b or (c and d)`.
function orGroupOk(v) {
  if (isVleaf(v)) return true;
  if (isVgroup(v) && v.join === "or") return (v.children || []).every(columnOk);
  if (isVgroup(v) && v.join === "and") return false; // an AND where a row is expected
  return false;
}

// A whole filter VALUE: an AND of OR-groups (the value grid), or a single row,
// or a lone atom.
function valueOk(v) {
  if (isVleaf(v)) return true;
  if (isVgroup(v) && v.join === "and") return (v.children || []).every(orGroupOk);
  if (isVgroup(v) && v.join === "or") return orGroupOk(v); // a single OR row
  return false;
}

// A FLAT value set (required of filters that are OR-ed with other filters,
// bullet 2): a lone atom or a single-level group of atoms — no nested group.
function isFlatValue(v) {
  if (v == null) return true; // simple clause: atomic
  if (isVleaf(v)) return true;
  if (isVgroup(v)) return (v.children || []).every(isVleaf);
  return false;
}

// ---- filter scope ---------------------------------------------------------

// One filter. `flat` = it shares a row with other (OR-ed) filters, so its value
// must be flat. A simple clause (no value vtree) is an atomic cell -> always ok.
function clauseOk(clause, flat) {
  if (!isClause(clause)) return false;
  if (!isFactored(clause)) return true; // simple/atomic cell (Q12)
  return flat ? isFlatValue(clause.value) : valueOk(clause.value);
}

// One ROW: a single filter, or an OR-group of (flat) filters.
function rowOk(node) {
  if (isClause(node)) return clauseOk(node, false);
  if (isGroup(node)) {
    if (node.join === "or") return (node.children || []).every((c) => clauseOk(c, true));
    // A single-child AND/implicit wrapper is transparent; flatten to its child.
    const kids = node.children || [];
    if (kids.length === 1) return rowOk(kids[0]);
    return false; // a multi-child AND group is not a single row
  }
  return false;
}

// ---- public ----------------------------------------------------------------

/**
 * Can the given v2 `where` tree be rendered in the 2D grid builder?
 * @param {object|null} where  the tree's `where` node (clause | group), or null.
 * @returns {{ok: boolean, reason: string|null}}
 */
export function canRepresentAsGrid(where) {
  if (where == null) return ok(); // empty query -> empty builder is fine
  if (isClause(where)) {
    return rowOk(where) ? ok() : no("filter value too complex for the grid");
  }
  if (isGroup(where)) {
    // Top is an AND of rows, OR a single OR-row of filters.
    if (where.join === "and" || where.implicit) {
      return (where.children || []).every(rowOk)
        ? ok()
        : no("query shape is deeper than the grid can show");
    }
    if (where.join === "or") {
      return rowOk(where) ? ok() : no("OR-ed filters must have simple values");
    }
  }
  return no("query shape is not a grid of AND-ed OR-groups");
}

// Convenience: accept either a full tree ({entity, where, ...}) or a bare where node.
export function treeRepresentable(treeOrWhere) {
  if (treeOrWhere == null) return ok();
  const where = (treeOrWhere.node === "clause" || treeOrWhere.node === "group")
    ? treeOrWhere
    : treeOrWhere.where;
  return canRepresentAsGrid(where);
}
