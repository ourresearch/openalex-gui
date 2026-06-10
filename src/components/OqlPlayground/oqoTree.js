// Pure OQO <-> editor-tree adapter for the no-code OQL builder (oxjob #428).
//
// The OQO filter tree IS the builder's data model:
//   BranchFilter { join, filters[] }                       -> a clause group (AND/OR)
//   LeafFilter   { column_id, operator, value, is_negated } -> a condition row
// (dispatch on the presence of a "join" key — query_translation/oqo.py).
//
// VALUE-LEVEL TREE (oxjob #428 item 5): OQL also supports nested boolean values
// for ONE property — `institution is (A or (B and C))` parses to a same-column
// nested branch and renders with the property named once. So a leaf's value is a
// "value tree" (vtree): a value-group { vjoin, items[] } whose items are value
// leaves { value, label } or nested value-groups. A same-column clause branch is
// collapsed into a single leaf row with a vtree (property not repeated).

let _seq = 1;
export function newId() { return `n${_seq++}`; }
function newVid() { return `v${_seq++}`; }

export const VALID_OPERATORS = ["is", ">", ">=", "<", "<=", "contains", "in collection"];

// ---- property metadata -> value-editor kind ---------------------------------

export function valueKindForProperty(prop) {
  if (!prop) return "text";
  const t = prop.type;
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  if (t === "openalex_id") return "entity";
  if (prop.entity_type) return "enum";
  return "text";
}

export function autocompleteEntityFor(prop) {
  return prop?.entity_type || null;
}

// ---- property operator-classes -> UI operator options -----------------------

export function uiOperatorsForProperty(prop) {
  const cls = new Set(prop?.operators || []);
  const type = prop?.type;
  const out = [];
  const add = (label, op, neg = false, unary = false) =>
    out.push({ key: `${op}|${neg}|${unary}`, label, op, neg, unary });

  if (type === "boolean") {
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
  if (cls.has("eq") || (!cls.has("search") && !cls.has("range"))) {
    add("is", "is", false);
    add("is not", "is", true);
  } else if (cls.has("range")) {
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

// ---- value-tree constructors ------------------------------------------------

export function makeVLeaf(value = "", label) {
  return { _id: newVid(), value, label: label == null ? String(value) : label };
}
export function makeVGroup(vjoin = "or", items = []) {
  return { _id: newVid(), group: true, vjoin, items };
}
export function isVGroup(x) {
  return !!(x && x.group === true);
}
function vItemFilled(it) {
  return isVGroup(it) ? it.items.some(vItemFilled) : it.value !== "" && it.value != null;
}
export function vtreeHasValue(vtree) {
  return !!(vtree && vtree.items.some(vItemFilled));
}

// ---- clause-tree node constructors ------------------------------------------

export function makeLeaf(column_id = "", op = "is", neg = false) {
  return { _id: newId(), type: "leaf", column_id, op, neg, unary: false, numeric: false, vtree: null };
}
export function makeGroup(join = "and", children = []) {
  return { _id: newId(), type: "group", join, children };
}

// A fresh value-tree for a newly-picked field of a given kind.
export function initialVTreeFor(kind) {
  if (kind === "boolean") return makeVGroup("or", [makeVLeaf(true, "true")]);
  if (kind === "entity") return makeVGroup("or", []);
  return makeVGroup("or", [makeVLeaf("")]); // scalar: one empty input
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
    numeric: typeof f.value === "number",
    vtree: isNull ? null : makeVGroup("or", [makeVLeaf(f.value)]),
  };
}

// All descendant leaves of a branch agree on (column, operator, is_negated)?
function collectLeaves(node, acc = []) {
  if (node.join) node.filters.forEach((c) => collectLeaves(c, acc));
  else acc.push(node);
  return acc;
}
function branchSingleColumn(branch) {
  const leaves = collectLeaves(branch);
  if (!leaves.length) return null;
  if (leaves.some((l) => l.value === null || l.value === undefined)) return null;
  const sig = (l) => `${l.column_id}|${l.operator || "is"}|${!!l.is_negated}`;
  const s0 = sig(leaves[0]);
  if (leaves.some((l) => sig(l) !== s0)) return null;
  return { col: leaves[0].column_id, op: leaves[0].operator || "is", neg: !!leaves[0].is_negated };
}
function oqoFilterToVNode(f) {
  if (f.join) return makeVGroup(f.join, f.filters.map(oqoFilterToVNode));
  return makeVLeaf(f.value);
}

function nodeFromOqo(f) {
  if (f && f.join) {
    const sig = branchSingleColumn(f);
    if (sig) {
      // same-column (nested) value branch -> one leaf row with a value-tree
      return {
        _id: newId(),
        type: "leaf",
        column_id: sig.col,
        op: sig.op,
        neg: sig.neg,
        unary: false,
        numeric: typeof collectLeaves(f)[0].value === "number",
        vtree: makeVGroup(f.join, f.filters.map(oqoFilterToVNode)),
      };
    }
    return { _id: newId(), type: "group", join: f.join, children: (f.filters || []).map(nodeFromOqo) };
  }
  return leafFromOqo(f);
}

export function rootFromOqo(oqo) {
  const rows = (oqo && oqo.filter_rows) || [];
  if (rows.length === 1 && rows[0] && rows[0].join && !branchSingleColumn(rows[0])) {
    return { _id: newId(), type: "group", join: rows[0].join, children: (rows[0].filters || []).map(nodeFromOqo) };
  }
  return { _id: newId(), type: "group", join: "and", children: rows.map(nodeFromOqo) };
}

// ---- tree -> OQO ------------------------------------------------------------

function vItemToFilter(it, node) {
  if (isVGroup(it)) {
    const kids = it.items.filter(vItemFilled);
    if (kids.length === 1) return vItemToFilter(kids[0], node); // unwrap single-child group
    return { join: it.vjoin, filters: kids.map((k) => vItemToFilter(k, node)) };
  }
  const coerce = (val) =>
    node.numeric && typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))
      ? Number(val)
      : val;
  const o = { column_id: node.column_id, value: coerce(it.value) };
  if (node.op && node.op !== "is") o.operator = node.op;
  if (node.neg) o.is_negated = true;
  return o;
}

function leafToOqo(node) {
  if (node.unary || !vtreeHasValue(node.vtree)) {
    const base = { column_id: node.column_id, value: null };
    if (node.op && node.op !== "is") base.operator = node.op;
    if (node.neg) base.is_negated = true;
    return base;
  }
  const items = node.vtree.items.filter(vItemFilled);
  if (items.length === 1) return vItemToFilter(items[0], node);
  return { join: node.vtree.vjoin, filters: items.map((it) => vItemToFilter(it, node)) };
}

export function isCompleteNode(n) {
  if (n.type === "group") return n.children.some(isCompleteNode);
  return n.unary || vtreeHasValue(n.vtree);
}

function nodeToOqo(node) {
  if (node.type === "group") {
    return { join: node.join, filters: node.children.filter(isCompleteNode).map(nodeToOqo) };
  }
  return leafToOqo(node);
}

export function rootToFilterRows(root) {
  const kids = (root.children || []).filter(isCompleteNode);
  if (kids.length === 0) return [];
  if (root.join === "and") return kids.map(nodeToOqo);
  return [{ join: "or", filters: kids.map(nodeToOqo) }];
}

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
