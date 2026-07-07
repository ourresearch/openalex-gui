// Representable-shape gate for the 2D grid builder (oxjob #523).
//
// The grid builder gives up 100% coverage of arbitrary boolean query trees in
// exchange for clarity: it can ONLY render the AND-of-OR-groups shape that real
// systematic-review queries overwhelmingly take. Anything outside that shape is
// kicked to the OQL text tab (the builder tab disables). `canRepresentAsGrid`
// IS that gate — a pure structural test over the v2 `where` tree.
//
// THE REPRESENTABLE SET (#575 two-column table — TIGHTENED from the #523 spec):
//   - Top level is an AND of "rows". Each row is exactly ONE filter — the table's
//     field column | value column. FILTER-SCOPE OR IS NOT REPRESENTABLE (#575,
//     Jason 2026-07-07): the table has no place for two fields on one row; those
//     queries live on the OQL tab. (Option C — a second field/value column pair to
//     the right — is the anticipated future extension if users hit this gate.)
//   - A filter's value is its own grid: an AND-of-OR-groups of value atoms, with
//     AT MOST ONE extra explicit-paren level per column
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

// A COLUMN inside a value OR-group: a single atom, OR any sub-expression (#523 round 2).
// The in-column AND sub-group used to be capped at one paren level of plain atoms; it now
// renders as a single bold TEXT-BLOCK chip (builderLayout.textBlockToken), so an arbitrarily
// deep value sub-expression no longer kicks to OQL — it's the block builder's escape hatch.
function columnOk(v) {
  if (isVleaf(v)) return true;
  if (isVgroup(v)) return true; // any depth → a text-block chip
  return false;
}

// A value ROW (an OR-group of columns): a lone atom, `a or b or (c and d)`, or a whole AND
// sub-expression that becomes one text-block column (#523 round 2).
function orGroupOk(v) {
  if (isVleaf(v)) return true;
  if (isVgroup(v) && v.join === "or") return (v.children || []).every(columnOk);
  if (isVgroup(v) && v.join === "and") return true; // a whole AND row → one text-block column
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

// ---- filter scope ---------------------------------------------------------

// One filter. A simple clause (no value vtree) is an atomic cell -> always ok.
function clauseOk(clause) {
  if (!isClause(clause)) return false;
  if (!isFactored(clause)) return true; // simple/atomic cell (Q12)
  return valueOk(clause.value);
}

// One ROW: exactly one filter (#575 — a filter-scope OR-group is NOT a row any more;
// the two-column table has no place for two fields on one line).
function rowOk(node) {
  if (isClause(node)) return clauseOk(node);
  if (isGroup(node)) {
    // A single-child wrapper (any join) is transparent; flatten to its child.
    const kids = node.children || [];
    if (kids.length === 1) return rowOk(kids[0]);
    return false; // a multi-child group is not a single row (incl. filter-scope OR)
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
    // Top is an AND of rows (one filter per row). A top-level OR of 2+ filters is
    // out of the table's shape (#575) — only a transparent single-child wrapper passes.
    if (where.join === "and" || where.implicit) {
      return (where.children || []).every(rowOk)
        ? ok()
        : no("query shape is deeper than the grid can show");
    }
    if (where.join === "or") {
      return rowOk(where) ? ok() : no("OR-ed filters can't be shown in the table — use OQL");
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
