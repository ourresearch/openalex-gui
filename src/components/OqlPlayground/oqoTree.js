// Pure OQO <-> editor-tree adapter for the no-code OQL builder (oxjob #428).
//
// The OQO filter tree IS the builder's data model:
//   BranchFilter { join, filters[] }                       -> a clause group (AND/OR)
//   LeafFilter   { column_id, operator, value, is_negated } -> a condition row
// (dispatch on the presence of a "join" key — query_translation/oqo.py).
//
// VALUE-LEVEL TREE (oxjob #428 iter 20 — Jason; reverses iter 6's flatten):
// a leaf row's value is a recursive boolean tree mirroring the server's canonical
// render. `title contains (beaver and (dam or pond))` is ONE row whose value is a
// nested tree, NOT distributed across rows. Negation is a per-VALUE bit (`neg` on
// a value leaf), shown as a bold `not(...)` prefix brick — this matches the OQO's
// uniform `is_negated`-on-leaves model (charter decisions 20/21/22, NNF canonical).
//   vLeaf  { value, label, neg }                  -> one value brick
//   vGroup { group:true, vjoin, items[] }         -> a parenthesized value sub-tree
//
// Round-trip rule (always-canonical / Option 2 — the builder mirrors the server):
//   IMPORT folds same-(column,operator) filter_rows that the canonical OQO
//   distributes (top-level AND flattens to siblings; same-field OR is already one
//   branch) back into ONE leaf row with a recursive value tree. Per-leaf is_negated
//   becomes the value leaf's `neg`. Predicate negation (`is not`/`does not contain`)
//   is gone from the editable surface (decision 22) — operators are affirmative and
//   negation always wraps the value; the server still renders a single negated leaf
//   as `is not X` / `does not contain X` and a De Morgan'd group as `(not(a) and
//   not(b))`, but both are the same OQO, so the tree and the OQL never diverge.
//   EXPORT emits, per row, either a single negatable leaf or ONE same-column nested
//   branch — the server accepts both and canonicalizes identically (verified live).

let _seq = 1;
export function newId() { return `n${_seq++}`; }
function newVid() { return `v${_seq++}`; }

export const VALID_OPERATORS = ["is", ">", ">=", "<", "<=", "contains", "in collection"];

// Inequalities take exactly ONE value: `year >= (2016 or 2020)` is parseable but
// never what anyone means — `is` can have many values, `>=` can't (iter 18.4).
// They also offer NO negation (reverse the operator instead; iter 20).
const INEQUALITY_OPS = new Set([">", ">=", "<", "<="]);
export function isInequalityOp(op) {
  return INEQUALITY_OPS.has(op);
}

// ---- property metadata -> value-editor kind ---------------------------------
// Value bricks are exactly text/search · number · boolean · entity (iter 20 —
// "no enum class; everything is an entity"). The fixed-vocab pickers that iter 11
// called "enum" (type/country/institution-type) are just entity value-picking
// over a list endpoint, so they report as "entity" with an enumEntity hint.

export function valueKindForProperty(prop) {
  if (!prop) return "text";
  const t = prop.type;
  if (t === "boolean") return "boolean";
  if (t === "number") return "number";
  if (t === "openalex_id") return "entity";
  if (prop.entity_type) return "entity"; // list-vocab entity (formerly "enum")
  return "text";
}

// An entity whose values come from a fixed `/{entity-type}` list rather than the
// `/autocomplete/{entity}` search — the only thing that distinguishes the old
// "enum" kind. Used by the value picker to pick its data source.
export function isListVocabEntity(prop) {
  return !!(prop && prop.type !== "openalex_id" && prop.entity_type);
}

export function autocompleteEntityFor(prop) {
  return prop?.entity_type || null;
}

// ---- property operator-classes -> UI operator options -----------------------
// Operators are strictly AFFIRMATIVE (iter 20 / decision 22): `is`, `contains`,
// `>`… — never `is not` / `does not contain`. Negation lives on the value.

export function uiOperatorsForProperty(prop) {
  const cls = new Set(prop?.operators || []);
  const type = prop?.type;
  const out = [];
  const add = (label, op, unary = false) =>
    out.push({ key: `${op}|${unary}`, label, op, unary });

  if (type === "boolean") {
    add("is", "is");
    if (cls.has("null")) add("is unknown", "is", true);
    return out;
  }
  if (cls.has("search")) add("contains", "contains");
  if (cls.has("range")) {
    add("≥", ">=");
    add("≤", "<=");
    add(">", ">");
    add("<", "<");
  }
  if (cls.has("eq") || (!cls.has("search") && !cls.has("range"))) add("is", "is");
  else if (cls.has("range")) add("is", "is");
  if (cls.has("collection")) add("in collection", "in collection");
  if (cls.has("null")) add("is unknown", "is", true);
  return out;
}

export function matchOperator(prop, op, unary) {
  const opts = uiOperatorsForProperty(prop);
  return (
    opts.find((o) => o.op === op && o.unary === !!unary) ||
    opts.find((o) => o.op === op) ||
    opts[0] ||
    null
  );
}

// ---- value-tree constructors ------------------------------------------------

export function makeVLeaf(value = "", label, neg = false) {
  return { _id: newVid(), value, label: label == null ? String(value) : label, neg: !!neg };
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

// De Morgan: negating a value group flips its conjunction and negates every child
// in place (`not(a or b)` -> `(not(a) and not(b))`; a child group recurses). This
// keeps the builder's OQO in NNF — `not` only ever sits on a leaf, never a group,
// exactly as the server's canonical render (iter 20 / Option 2 always-canonical).
export function deMorganGroup(group) {
  group.vjoin = group.vjoin === "and" ? "or" : "and";
  for (const it of group.items) {
    if (isVGroup(it)) deMorganGroup(it);
    else it.neg = !it.neg;
  }
}

// Quote-aware leading-`not` extraction for text/number value bricks. A user typing
// `not climate` negates the term; `"not"` (quoted) is a literal search word per the
// reserved-word rule and is NOT treated as negation. Idempotent at the call site.
export function extractLeadingNot(raw) {
  const s = String(raw);
  if (/^\s*"/.test(s)) return { neg: false, text: s }; // quoted leading token = literal
  const m = s.match(/^\s*not\s+(\S.*)$/i);
  if (!m) return { neg: false, text: s };
  return { neg: true, text: m[1] };
}

// ---- clause-tree node constructors ------------------------------------------

export function makeLeaf(column_id = "", op = "is") {
  return { _id: newId(), type: "leaf", column_id, op, neg: false, unary: false, numeric: false, vtree: null };
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
  if (kind === "entity") return makeVGroup("or", []); // picker kinds start empty
  return makeVGroup("or", [makeVLeaf("")]); // scalar: one empty input
}

// ---- OQO -> tree ------------------------------------------------------------

// Is this OQO node (leaf or branch) entirely on ONE search-base column + operator,
// with all leaf values non-null? Such a node maps to a single value-tree row
// (per-leaf is_negated rides along inside the tree). Returns { col, op } or null.
function uniformSig(node) {
  if (node && node.join) {
    const subs = (node.filters || []).map(uniformSig);
    if (!subs.length || subs.some((s) => !s)) return null;
    const s0 = subs[0];
    if (subs.some((s) => s.col !== s0.col || s.op !== s0.op)) return null;
    return s0;
  }
  if (!node || node.value === null || node.value === undefined) return null;
  const col = isSearchColumn(node.column_id)
    ? `${searchBaseColumn(node.column_id)}.search`
    : node.column_id;
  return { col, op: node.operator || "is" };
}

// the first concrete leaf inside a (possibly nested) uniform node
function firstLeaf(node) {
  return node.join ? firstLeaf(node.filters[0]) : node;
}

// a uniform OQO node -> a value-tree item (leaf or nested vGroup)
function vtreeItemFromOqo(node) {
  if (node.join) return makeVGroup(node.join, node.filters.map(vtreeItemFromOqo));
  const v = isSearchColumn(node.column_id)
    ? searchFilterToSurface(node.column_id, node.value)
    : node.value;
  return makeVLeaf(v, undefined, !!node.is_negated);
}

// Build ONE leaf row from a set of AND-sibling uniform OQO nodes (all same col+op).
// One node -> its value tree directly; many -> an `and` value group of them.
function leafRowFromUniform(nodes) {
  const sig = uniformSig(nodes[0]);
  let vtree;
  if (nodes.length === 1) {
    const only = vtreeItemFromOqo(nodes[0]);
    vtree = isVGroup(only) ? only : makeVGroup("or", [only]);
  } else {
    vtree = makeVGroup("and", nodes.map(vtreeItemFromOqo));
  }
  return {
    _id: newId(),
    type: "leaf",
    column_id: sig.col,
    op: sig.op,
    neg: false,
    unary: false,
    numeric: typeof firstLeaf(nodes[0]).value === "number",
    vtree,
  };
}

// a null-valued (unary, e.g. "is unknown") leaf
function unaryLeafFromOqo(f) {
  return {
    _id: newId(),
    type: "leaf",
    column_id: f.column_id,
    op: f.operator || "is",
    neg: !!f.is_negated,
    unary: true,
    numeric: false,
    vtree: null,
  };
}

function groupFromBranch(branch) {
  return {
    _id: newId(),
    type: "group",
    join: branch.join,
    children: nodesFromFilters(branch.filters || [], branch.join),
  };
}

// Turn a list of OQO filters (in a given clause join) into builder tree nodes.
// In an AND context the canonical OQO distributes same-field terms into siblings —
// fold each (col,op) run back into ONE value-tree row. In an OR context same-field
// values are already merged into one uniform branch, so no folding is needed.
function nodesFromFilters(filters, join) {
  const result = [];
  const folds = new Map(); // "col|op" -> { idx, nodes[] }
  const doFold = join === "and";
  for (const f of filters) {
    const sig = uniformSig(f);
    if (sig && doFold) {
      const key = `${sig.col}|${sig.op}`;
      if (folds.has(key)) folds.get(key).nodes.push(f);
      else { folds.set(key, { idx: result.length, nodes: [f] }); result.push(null); }
    } else if (sig) {
      result.push(leafRowFromUniform([f]));      // OR context: uniform node -> one row
    } else if (f && f.join) {
      result.push(groupFromBranch(f));            // real cross-field sub-group
    } else {
      result.push(unaryLeafFromOqo(f));           // null-valued leaf
    }
  }
  for (const entry of folds.values()) result[entry.idx] = leafRowFromUniform(entry.nodes);
  return result;
}

export function rootFromOqo(oqo) {
  const rows = (oqo && oqo.filter_rows) || [];
  // a single cross-field branch at root IS the root group (its own join)
  if (rows.length === 1 && rows[0] && rows[0].join && !uniformSig(rows[0])) {
    return {
      _id: newId(),
      type: "group",
      join: rows[0].join,
      children: nodesFromFilters(rows[0].filters || [], rows[0].join),
    };
  }
  // otherwise the filter_rows are an implicit AND
  return { _id: newId(), type: "group", join: "and", children: nodesFromFilters(rows, "and") };
}

// ---- tree -> OQO ------------------------------------------------------------

function vItemToOqo(item, node) {
  if (isVGroup(item)) {
    const filters = item.items.filter(vItemFilled).map((it) => vItemToOqo(it, node)).filter(Boolean);
    if (!filters.length) return null;
    if (filters.length === 1) return filters[0]; // a 1-item group collapses
    return { join: item.vjoin, filters };
  }
  if (item.value === "" || item.value == null) return null;
  if (isSearchColumn(node.column_id)) {
    // Each search VALUE picks its own column from its surface form: quotes /
    // wildcards -> `.search.exact` (no-stem), bare / `near "…"` -> `.search`.
    const { column_id, value } = searchSurfaceToFilter(item.value, node.column_id);
    const o = { column_id, value };
    if (node.op && node.op !== "is") o.operator = node.op;
    if (item.neg) o.is_negated = true;
    return o;
  }
  const coerce = (val) =>
    node.numeric && typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))
      ? Number(val)
      : val;
  const o = { column_id: node.column_id, value: coerce(item.value) };
  if (node.op && node.op !== "is") o.operator = node.op;
  if (item.neg) o.is_negated = true;
  return o;
}

function leafToOqo(node) {
  if (node.unary || !vtreeHasValue(node.vtree)) {
    const base = { column_id: node.column_id, value: null };
    if (node.op && node.op !== "is") base.operator = node.op;
    if (node.neg) base.is_negated = true;
    return base;
  }
  const filters = node.vtree.items.filter(vItemFilled).map((it) => vItemToOqo(it, node)).filter(Boolean);
  if (filters.length === 1) return filters[0]; // single value -> a plain leaf
  return { join: node.vtree.vjoin, filters }; // a same-column nested value branch
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
