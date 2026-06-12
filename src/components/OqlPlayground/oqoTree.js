// Pure OQO <-> editor-tree adapter for the no-code OQL builder (oxjob #428).
//
// The OQO filter tree IS the builder's data model:
//   BranchFilter { join, filters[] }                       -> a clause group (AND/OR)
//   LeafFilter   { column_id, operator, value, is_negated } -> a condition row
// (dispatch on the presence of a "join" key — query_translation/oqo.py).
//
// VALUE-LEVEL LIST (oxjob #428 iter 6 — Jason): a leaf's value is a FLAT list of
// values sharing ONE conjunction (all `and` OR all `or` — never mixed, never
// nested). `institution is (A or B or C)` is one row with three values; a single
// `vjoin` toggles them together. We keep the value-group shape { vjoin, items[] }
// (items = value leaves { value, label }) but the items are always leaves — the
// earlier nested value-tree was removed as too complex (see BuilderValueGroup).
//
// Round-trip rule: on IMPORT, a same-column clause branch collapses into one
// row ONLY when it is FLAT (every filter a leaf, one shared conjunction). Genuinely
// nested/mixed value logic like `col is (A or (B and C))` is NOT folded — it is
// decomposed back out into clause-level rows/groups (the user composes nesting by
// adding filter rows inside a filter group). On OUTPUT we therefore never emit
// nesting inside a single property's value — only a flat list.

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

// ---- search-term surface form (oxjob #428 iter 11) ---------------------------
// OQL search-value conventions (query_translation/oql_lang.py `_parse_search_atom`):
//   bare word     -> stemmed            (.search)
//   "quoted"      -> exact, no-stem     (.search.exact)  <- wildcards belong here
//   near "phrase" -> stemmed, adjacent  (.search)
// The builder lets the user type those surface forms directly into a value box;
// each VALUE routes to its own column, so one row can mix exact + stemmed values
// (`contains (amphibian or "amphibi*")`). A bare wildcard auto-routes to exact —
// stemming destroys the literal prefix, so `near`/stemmed + wildcard is invalid
// (the parser rejects it); the old passthrough produced exactly that bug.

const SEARCH_COL_RE = /\.search(\.exact)?$/;
export function isSearchColumn(col) {
  return typeof col === "string" && SEARCH_COL_RE.test(col);
}
export function searchBaseColumn(col) {
  return String(col).replace(SEARCH_COL_RE, "");
}

// typed surface text -> { column_id, value } on a search base column
export function searchSurfaceToFilter(text, anyCol) {
  const base = searchBaseColumn(anyCol);
  const t = String(text).trim();
  const near = t.match(/^near\s+(.+)$/i);
  if (near && near[1].startsWith('"')) {
    return { column_id: `${base}.search`, value: near[1] }; // stemmed adjacent phrase
  }
  if (/^".*"~\d+(~".*")?$/.test(t)) {
    return { column_id: `${base}.search.exact`, value: t }; // proximity passthrough
  }
  const quoted = t.match(/^"(.*)"$/s);
  if (quoted) {
    const inner = quoted[1];
    // exact: the column suffix carries exactness; single token stays bare,
    // a multi-word phrase keeps its quotes (mirrors the parser's encoding)
    return { column_id: `${base}.search.exact`, value: /\s/.test(inner) ? t : inner };
  }
  if (/[*?]/.test(t)) {
    // wildcards run on exact (no-stem) text — auto-route instead of erroring
    return { column_id: `${base}.search.exact`, value: /\s/.test(t) ? `"${t}"` : t };
  }
  return { column_id: `${base}.search`, value: t };
}

// OQO search leaf -> the surface text shown in the value box
export function searchFilterToSurface(column_id, value) {
  const v = String(value);
  if (String(column_id).endsWith(".search.exact")) {
    return v.startsWith('"') ? v : `"${v}"`;
  }
  return v.startsWith('"') ? `near ${v}` : v; // quoted on a stemmed col = near-phrase
}

// A fresh value-tree for a newly-picked field of a given kind.
export function initialVTreeFor(kind) {
  if (kind === "boolean") return makeVGroup("or", [makeVLeaf(true, "true")]);
  if (kind === "entity" || kind === "enum") return makeVGroup("or", []); // picker kinds start empty
  return makeVGroup("or", [makeVLeaf("")]); // scalar: one empty input
}

// ---- OQO -> tree ------------------------------------------------------------

function leafFromOqo(f) {
  const isNull = f.value === null || f.value === undefined;
  // Search leaves normalize to the base `.search` property (the one the field
  // picker lists); per-value exactness lives in the value's surface form.
  const search = !isNull && isSearchColumn(f.column_id);
  return {
    _id: newId(),
    type: "leaf",
    column_id: search ? `${searchBaseColumn(f.column_id)}.search` : f.column_id,
    op: f.operator || "is",
    neg: !!f.is_negated,
    unary: isNull,
    numeric: typeof f.value === "number",
    vtree: isNull
      ? null
      : makeVGroup("or", [
          search ? makeVLeaf(searchFilterToSurface(f.column_id, f.value)) : makeVLeaf(f.value),
        ]),
  };
}

// A branch we can fold into ONE leaf row with a FLAT value list: every filter is
// a leaf (no nested sub-branches) and they all share column/operator/negation.
// Mixed/nested logic (e.g. `col is (A or (B and C))`) returns null -> it stays a
// clause group, decomposing the nesting to the row level (iter 6).
function branchFlatSingleColumn(branch) {
  const fs = branch.filters || [];
  if (!fs.length) return null;
  if (fs.some((l) => l && l.join)) return null; // any nested sub-branch -> not flat
  if (fs.some((l) => l.value === null || l.value === undefined)) return null;
  // Search columns fold on their BASE: `.search` + `.search.exact` siblings are one
  // row whose values differ in exactness (`contains (amphibian or "amphibi*")`).
  const colKey = (c) => (isSearchColumn(c) ? `${searchBaseColumn(c)}.search` : c);
  const sig = (l) => `${colKey(l.column_id)}|${l.operator || "is"}|${!!l.is_negated}`;
  const s0 = sig(fs[0]);
  if (fs.some((l) => sig(l) !== s0)) return null;
  return { col: colKey(fs[0].column_id), op: fs[0].operator || "is", neg: !!fs[0].is_negated };
}

function nodeFromOqo(f) {
  if (f && f.join) {
    const sig = branchFlatSingleColumn(f);
    if (sig) {
      // flat same-column value branch -> one leaf row with a flat value list
      const search = isSearchColumn(sig.col);
      return {
        _id: newId(),
        type: "leaf",
        column_id: sig.col,
        op: sig.op,
        neg: sig.neg,
        unary: false,
        numeric: typeof f.filters[0].value === "number",
        vtree: makeVGroup(
          f.join,
          f.filters.map((c) =>
            search ? makeVLeaf(searchFilterToSurface(c.column_id, c.value)) : makeVLeaf(c.value)
          )
        ),
      };
    }
    // a real clause group; any nested same-column value logic decomposes to rows here
    return { _id: newId(), type: "group", join: f.join, children: (f.filters || []).map(nodeFromOqo) };
  }
  return leafFromOqo(f);
}

export function rootFromOqo(oqo) {
  const rows = (oqo && oqo.filter_rows) || [];
  if (rows.length === 1 && rows[0] && rows[0].join && !branchFlatSingleColumn(rows[0])) {
    return { _id: newId(), type: "group", join: rows[0].join, children: (rows[0].filters || []).map(nodeFromOqo) };
  }
  return { _id: newId(), type: "group", join: "and", children: rows.map(nodeFromOqo) };
}

// ---- tree -> OQO ------------------------------------------------------------

function vItemToFilter(it, node) {
  // Values are a flat list now (iter 6) — items are always leaves, never groups.
  if (isSearchColumn(node.column_id)) {
    // Each search VALUE picks its own column from its surface form: quotes /
    // wildcards -> `.search.exact` (no-stem), bare / `near "…"` -> `.search`.
    const { column_id, value } = searchSurfaceToFilter(it.value, node.column_id);
    const o = { column_id, value };
    if (node.op && node.op !== "is") o.operator = node.op;
    if (node.neg) o.is_negated = true;
    return o;
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

export function buildOqo({ getRows, root, sortBy, select }) {
  const oqo = { get_rows: getRows || "works" };
  const rows = rootToFilterRows(root);
  if (rows.length) oqo.filter_rows = rows;
  if (sortBy && sortBy.length) {
    oqo.sort_by = sortBy
      .filter((s) => s.column_id)
      .map((s) => ({ column_id: s.column_id, direction: s.direction || "asc" }));
  }
  // return columns (OQL `return …`) — only emitted when non-default; the host
  // maps the table's gui column keys to API select names before passing them.
  if (select && select.length) oqo.select = select;
  return oqo;
}
