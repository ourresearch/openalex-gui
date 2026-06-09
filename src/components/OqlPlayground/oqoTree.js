// Pure OQO <-> editor-tree adapter for the no-code OQL builder (oxjob #428).
//
// The OQO filter tree IS the builder's data model:
//   BranchFilter { join, filters[] }                 -> a group node (AND/OR)
//   LeafFilter   { column_id, operator, value, is_negated } -> a condition row
// (dispatch on the presence of a "join" key — query_translation/oqo.py).
//
// We keep a lightly-sugared in-memory "tree" for the UI (stable _id keys for Vue,
// a single multi-value row instead of a same-column OR-branch, a uniform root
// group) and convert losslessly to/from canonical OQO. Anything we can't sugar is
// preserved verbatim so round-trip stays lossless (the projectional-editing
// guarantee: OQO is the single source of truth, OQL is rendered from it).
//
// Serialization facts verified live against the API (DESIGN.md §8):
//   - negation is the is_negated polarity bit, NOT an "is not" operator
//   - "is unknown" => value: null
//   - multi-value "is" => same-column OR-branch, renders as `field is (a or b)`
//     ("is any of"/"is in" were REMOVED from OQL)
//   - a root-level OR => filter_rows: [ { join:"or", filters:[...] } ]

let _seq = 1;
export function newId() { return `n${_seq++}`; }

export const VALID_OPERATORS = ["is", ">", ">=", "<", "<=", "contains", "in collection"];

// ---- property metadata -> value-editor kind ---------------------------------

// Map a /properties Property to the value editor we render.
// kinds: "entity" | "enum" | "number" | "boolean" | "text"
export function valueKindForProperty(prop) {
  if (!prop) return "text";
  const t = prop.type;
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  if (t === "openalex_id") return "entity";
  // string-typed columns that point at another entity are enums (work-types,
  // countries, languages, …) — a fixed vocabulary, not free entity lookup.
  if (prop.entity_type) return "enum";
  return "text";
}

// The /autocomplete route (or static-list key) for an entity/enum value slot.
export function autocompleteEntityFor(prop) {
  return prop?.entity_type || null;
}

// ---- property operator-classes -> UI operator options -----------------------

// Each option: { key, label, op, neg, unary }.
//   op    = OQO operator string (VALID_OPERATORS)
//   neg   = is_negated polarity
//   unary = no value slot (value serializes to null)
// `key` is a stable UI id = `${op}|${neg}|${unary}`.
export function uiOperatorsForProperty(prop) {
  const cls = new Set(prop?.operators || []);
  const type = prop?.type;
  const out = [];
  const add = (label, op, neg = false, unary = false) =>
    out.push({ key: `${op}|${neg}|${unary}`, label, op, neg, unary });

  if (type === "boolean") {
    // boolean columns: value true/false carried as the value, operator "is".
    add("is", "is", false);
    if (cls.has("null")) add("is unknown", "is", false, true);
    return out;
  }
  if (cls.has("search")) {
    add("contains", "contains", false);
    add("does not contain", "contains", true);
  }
  if (cls.has("range")) {
    add("≥", ">=");
    add("≤", "<=");
    add(">", ">");
    add("<", "<");
  }
  // eq is the default for almost everything (ids, enums, numbers, strings)
  if (cls.has("eq") || (!cls.has("search") && !cls.has("range"))) {
    add("is", "is", false);
    add("is not", "is", true);
  } else if (cls.has("range")) {
    // numeric exact match still useful alongside ranges
    add("is", "is", false);
    add("is not", "is", true);
  }
  if (cls.has("collection")) add("in collection", "in collection", false);
  if (cls.has("null")) add("is unknown", "is", false, true);
  return out;
}

export function matchOperator(prop, op, neg, unary) {
  const opts = uiOperatorsForProperty(prop);
  return (
    opts.find((o) => o.op === op && o.neg === !!neg && o.unary === !!unary) ||
    opts.find((o) => o.op === op && o.neg === !!neg) ||
    opts[0] ||
    null
  );
}

// ---- node constructors ------------------------------------------------------

export function makeLeaf(column_id = "", op = "is", neg = false) {
  return { _id: newId(), type: "leaf", column_id, op, neg, unary: false, values: [] };
}
export function makeGroup(join = "and", children = []) {
  return { _id: newId(), type: "group", join, children };
}
// A value chip: { value, label }. label is display-only ([Name] for entities).
export function makeValue(value, label) {
  return { value, label: label == null ? String(value) : label };
}

// ---- OQO -> tree ------------------------------------------------------------

function leafFromOqo(f) {
  const isNull = f.value === null || f.value === undefined;
  return {
    _id: newId(),
    type: "leaf",
    column_id: f.column_id,
    op: f.operator || "is",
    neg: !!f.is_negated,
    unary: isNull,
    values: isNull ? [] : [makeValue(f.value)],
  };
}

// Collapse a same-column positive OR-branch into one multi-value leaf.
function tryMultiValueLeaf(branch) {
  if (branch.join !== "or") return null;
  const kids = branch.filters || [];
  if (kids.length < 2) return null;
  if (kids.some((k) => k.join || k.is_negated || k.value === null)) return null;
  const col = kids[0].column_id;
  const op = kids[0].operator || "is";
  if (kids.some((k) => k.column_id !== col || (k.operator || "is") !== op)) return null;
  return {
    _id: newId(),
    type: "leaf",
    column_id: col,
    op,
    neg: false,
    unary: false,
    values: kids.map((k) => makeValue(k.value)),
  };
}

function nodeFromOqo(f) {
  if (f && f.join) {
    const mv = tryMultiValueLeaf(f);
    if (mv) return mv;
    return { _id: newId(), type: "group", join: f.join, children: (f.filters || []).map(nodeFromOqo) };
  }
  return leafFromOqo(f);
}

// Build the uniform root group from an OQO's filter_rows.
export function rootFromOqo(oqo) {
  const rows = (oqo && oqo.filter_rows) || [];
  if (rows.length === 1 && rows[0] && rows[0].join) {
    // a single top-level branch becomes the root group (handles root-level OR)
    return { _id: newId(), type: "group", join: rows[0].join, children: (rows[0].filters || []).map(nodeFromOqo) };
  }
  return { _id: newId(), type: "group", join: "and", children: rows.map(nodeFromOqo) };
}

// ---- tree -> OQO ------------------------------------------------------------

function leafToOqo(node) {
  const base = { column_id: node.column_id };
  if (node.unary || node.values.length === 0) {
    base.value = null;
    if (node.op && node.op !== "is") base.operator = node.op;
    if (node.neg) base.is_negated = true;
    return base;
  }
  const mk = (v) => {
    const o = { column_id: node.column_id, value: v.value };
    if (node.op && node.op !== "is") o.operator = node.op;
    if (node.neg) o.is_negated = true;
    return o;
  };
  if (node.values.length === 1) return mk(node.values[0]);
  // multi-value positive "is" -> same-column OR-branch (renders `is (a or b)`).
  // (negated multi-value stays one chip in the UI, so we never hit De Morgan here)
  return { join: "or", filters: node.values.map(mk) };
}

function nodeToOqo(node) {
  if (node.type === "group") {
    return { join: node.join, filters: node.children.map(nodeToOqo) };
  }
  return leafToOqo(node);
}

// Serialize the root group to filter_rows (top-level AND spreads; OR wraps).
export function rootToFilterRows(root) {
  const kids = (root.children || []).filter(
    (n) => n.type === "group" || (n.column_id && (n.unary || n.values.length > 0))
  );
  if (kids.length === 0) return [];
  if (root.join === "and") return kids.map(nodeToOqo);
  return [{ join: "or", filters: kids.map(nodeToOqo) }];
}

// Assemble a full OQO from the builder's parts.
export function buildOqo({ getRows, root, sortBy }) {
  const oqo = { get_rows: getRows || "works" };
  const rows = rootToFilterRows(root);
  if (rows.length) oqo.filter_rows = rows;
  if (sortBy && sortBy.length) {
    oqo.sort_by = sortBy
      .filter((s) => s.column_id)
      .map((s) => ({ column_id: s.column_id, direction: s.direction || "asc" }));
  }
  return oqo;
}
