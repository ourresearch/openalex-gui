// Stats-widget refinements → OQO filter_rows (oxjob #528).
//
// The left-rail stats widgets (GroupBy.vue) are "refine results" facets, modeled
// on Web of Science / Scopus: a facet click refines the *result set* of whatever
// query produced it. It does NOT reach into and rewrite the user's authored
// boolean expression — it ANDs a clause onto it. (Design sign-off, Jason
// 2026-06-27; see the job EXPLORE.md "WoS/Scopus" section.)
//
// That maps cleanly onto an OQO because top-level filter_rows are AND-joined by
// default (v2ToOqo.js: "AND is the default — sibling filter_rows joined by `and`").
// So a refinement is simply a TOP-LEVEL ROW:
//   - within one facet, multiple selected values OR together   → an OR group
//   - across facets, each facet is its own top-level row       → AND between them
// Appending a top-level row therefore yields `(existing query) AND (facet)` for
// free, whether the existing query is a flat AND list or a single wrapped OR
// group — no clever tree surgery, and no lossy OQL↔filter round-trip.
//
// Crucially, refinements and builder-authored top-level chips are the SAME data:
// a facet selection of `type is article` is byte-identical to typing it in the
// builder, so refinements show up as ordinary chips and round-trip through OQL.
//
// All functions here are PURE and immutable (return new arrays/objects; never
// mutate the input). filter_rows shapes (from v2ToOqo.js):
//   leaf   { column_id, value, operator, is_negated? }
//   group  { join: "and"|"or", filters: [row...], is_negated? }
//
// v1 is include-only: every emitted leaf is a plain `is` (no is_negated). An
// Exclude ("is not") affordance is a deliberate fast-follow, not this job.

const OP_IS = "is";

// A row we are allowed to treat as "this facet's selection": a plain, un-negated
// `is` leaf on `columnId`, OR an un-negated OR-group whose children are all such
// leaves. Anything else (negated, a different operator, a nested AND, a mixed-
// column group, a search clause) is user-authored structure we must NOT touch.
function isLeafFor(row, columnId, operator) {
  return (
    !!row &&
    !row.join &&
    row.column_id === columnId &&
    (row.operator || OP_IS) === operator &&
    !row.is_negated
  );
}

export function isRefinementRowFor(row, columnId, operator = OP_IS) {
  if (isLeafFor(row, columnId, operator)) return true;
  if (
    row &&
    row.join === "or" &&
    !row.is_negated &&
    Array.isArray(row.filters) &&
    row.filters.length > 0
  ) {
    return row.filters.every((f) => isLeafFor(f, columnId, operator));
  }
  return false;
}

// Scalar values currently selected in a refinement row (leaf → [value];
// OR-group → each child's value). Order preserved.
export function rowValues(row) {
  if (!row) return [];
  if (row.join === "or" && Array.isArray(row.filters)) {
    return row.filters.map((f) => f.value);
  }
  return [row.value];
}

// Build a top-level row for `columnId` from a list of scalar values:
//   0 values → null (caller drops the row entirely)
//   1 value  → a bare leaf
//   2+       → an OR group of leaves (OR-within-facet)
export function makeRefinementRow(columnId, values, operator = OP_IS) {
  const vals = (values || []).filter((v) => v !== "" && v != null);
  if (vals.length === 0) return null;
  if (vals.length === 1) {
    return { column_id: columnId, value: vals[0], operator };
  }
  return {
    join: "or",
    filters: vals.map((v) => ({ column_id: columnId, value: v, operator })),
  };
}

// Index of the (first) top-level row that is this facet's selection, else -1.
function findRefinementIndex(filterRows, columnId, operator = OP_IS) {
  return (filterRows || []).findIndex((r) => isRefinementRowFor(r, columnId, operator));
}

// The scalar values currently selected for `columnId` at the top level (for the
// widget's selected/checked state). Compared as strings by the caller.
export function selectedValues(filterRows, columnId, operator = OP_IS) {
  const idx = findRefinementIndex(filterRows, columnId, operator);
  return idx === -1 ? [] : rowValues(filterRows[idx]);
}

// Toggle a single scalar `value` in `columnId`'s refinement (the multi-select
// facet gesture): add it if absent, remove it if present. OR-within-facet.
// Returns a NEW filter_rows array.
export function toggleRefinementValue(filterRows, { columnId, value, operator = OP_IS }) {
  const rows = [...(filterRows || [])];
  const idx = findRefinementIndex(rows, columnId, operator);
  const current = idx === -1 ? [] : rowValues(rows[idx]);
  const sval = String(value);
  const has = current.some((v) => String(v) === sval);
  const nextVals = has
    ? current.filter((v) => String(v) !== sval)
    : [...current, value];
  const nextRow = makeRefinementRow(columnId, nextVals, operator);
  if (idx === -1) {
    if (nextRow) rows.push(nextRow);
  } else if (nextRow) {
    rows[idx] = nextRow;
  } else {
    rows.splice(idx, 1);
  }
  return rows;
}

// Set `columnId` to exactly one value (boolean / range facets, where the widget
// owns a single value like `true`, `2012-2020`, or `>2019`). Replaces any
// existing simple row for the column; a null/empty value removes it. Returns a
// NEW filter_rows array.
export function setRefinementValue(filterRows, { columnId, value, operator = OP_IS }) {
  return setRefinementValues(filterRows, {
    columnId,
    values: value == null || value === "" ? [] : [value],
    operator,
  });
}

// Set `columnId` to EXACTLY the given list of values (the multi-select "More…"
// dialog: the dialog owns the whole selection, so we replace, not toggle). 0
// values clears the column; 1 → leaf; 2+ → OR group. Returns a NEW array.
export function setRefinementValues(filterRows, { columnId, values, operator = OP_IS }) {
  const rows = (filterRows || []).filter((r) => !isRefinementRowFor(r, columnId, operator));
  const row = makeRefinementRow(columnId, values, operator);
  if (row) rows.push(row);
  return rows;
}

// Drop `columnId`'s refinement entirely. Returns a NEW filter_rows array.
export function removeRefinement(filterRows, { columnId, operator = OP_IS }) {
  return (filterRows || []).filter((r) => !isRefinementRowFor(r, columnId, operator));
}
