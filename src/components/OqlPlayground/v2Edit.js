// In-place edits on the v2 render tree — the no-code builder's edit model
// (oxjob #428 iter 22, decision B). The server-rendered `oql_render_v2` tree is
// the single source of truth; the builder mutates nodes here, then rebuilds the
// OQO (v2ToOqo.js) and re-renders through the server, which returns a fresh,
// canonical tree + `lines`. So these mutations only need to produce a VALID OQO
// — the server re-canonicalizes (NNF, factoring, layout) on the next render.
//
// Node shapes are exactly oql_render_v2's (see v2ToOqo.js). Two value-bearing
// token flavors share editing here:
//   - factored clause: value is a `vgroup` of `vleaf`s (each its own node/id)
//   - simple clause:   no value vgroup; the scalar lives on `clause.leaf`, and
//                      its value token carries the CLAUSE id
// so an edit addressed by token id may land on a vleaf OR a simple clause.
//
// DRAFTS: an incomplete clause being created has no server representation (the
// server only ever renders complete queries). Drafts live in a local array,
// render via tokensForDraft(), and fold into the query once they have a value.

import { isSearchColumn, searchSurfaceToFilter, searchBaseColumn, searchColumnSuffix } from "@/components/OqlPlayground/oqoTree";

let _seq = 1;
const eid = () => `e${_seq++}`;

function vleaf(value = "", display = null, negated = false) {
  return { node: "vleaf", id: eid(), value,
           display: display == null ? String(value) : display, negated: !!negated };
}

// ---- locate a node by id, anywhere in the tree (or in the draft list) -------
// Returns { node, kind, detach() } where detach() removes the node from its
// parent (splicing an array child, or deleting a clause's `value`, or nulling a
// single top-level `where`). null if not found.
export function locate(tree, id, drafts = []) {
  let res = null;

  const inValue = (v, detach) => {
    if (res) return;
    if (v.id === id) { res = { node: v, kind: v.node, detach }; return; }
    if (v.node === "vgroup")
      v.children.forEach((c, i) => inValue(c, () => v.children.splice(i, 1)));
  };
  const inExpr = (n, detach) => {
    if (res) return;
    if (n.id === id) { res = { node: n, kind: n.node, detach }; return; }
    if (n.node === "clause" && n.value) inValue(n.value, () => { delete n.value; });
    if (n.node === "group")
      n.children.forEach((c, i) => inExpr(c, () => n.children.splice(i, 1)));
  };

  if (tree) {
    const w = tree.where;
    if (w) {
      if (w.node === "group" && w.implicit)
        w.children.forEach((c, i) => inExpr(c, () => w.children.splice(i, 1)));
      else inExpr(w, () => { tree.where = null; });
    }
  }
  // drafts (local, incomplete clauses)
  for (let di = 0; di < drafts.length && !res; di++) {
    const d = drafts[di];
    if (d.id === id) { res = { node: d, kind: "clause", detach: () => drafts.splice(di, 1) }; continue; }
    if (d.value) inValue(d.value, () => { delete d.value; });
  }
  return res;
}

// ---- value edits (addressed by a vbrick token id) ---------------------------

// Set a scalar/search/entity value. Routes search surface forms to the right
// `.search`/`.search.exact` column (quotes/wildcards), and coerces numerics.
export function setValue(tree, id, raw, { numeric = false } = {}, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  const coerce = (val) =>
    numeric && typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))
      ? Number(val) : val;
  if (hit.kind === "vleaf") {
    hit.node.value = coerce(raw);
    hit.node.display = String(raw);
  } else if (hit.kind === "clause" && hit.node.leaf) {
    const leaf = hit.node.leaf;
    if (isSearchColumn(leaf.column_id)) {
      const r = searchSurfaceToFilter(raw, leaf.column_id);
      leaf.column_id = r.column_id; leaf.value = r.value;
    } else {
      leaf.value = coerce(raw);
    }
  }
}

// Set an entity value (chip pick): value is the openalex id, display the name.
export function setEntityValue(tree, id, openalexId, displayName, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  if (hit.kind === "vleaf") {
    hit.node.value = openalexId;
    hit.node.display = displayName || String(openalexId);
    hit.node.entity = { id: openalexId, display_name: displayName };
  } else if (hit.kind === "clause" && hit.node.leaf) {
    hit.node.leaf.value = openalexId;
  }
}

// Set a boolean value (true/false). Booleans are always a simple clause.
export function setBool(tree, id, val, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  if (hit.kind === "clause" && hit.node.leaf) hit.node.leaf.value = val;
  else if (hit.kind === "vleaf") { hit.node.value = val; hit.node.display = String(val); }
}

// Change a committed clause's relational operator (the op chip). Addressed by the
// clause id. The operator must reach the OQO: a FACTORED clause carries it on the
// clause node (v2ToOqo passes clause.operator down to every leaf); a SIMPLE clause
// emits its raw `leaf` dict verbatim, so the operator must live on `leaf.operator`.
// `unary` ops (e.g. "is unknown") drop the value (OQO leaf value = null); turning a
// unary clause back to binary leaves an empty value for the user to fill.
export function setOperator(tree, id, { op, unary } = {}, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit || hit.kind !== "clause") return;
  const c = hit.node;
  const newOp = op || "is";
  c.operator = newOp;
  if (unary) {
    delete c.value;
    c.leaf = { column_id: c.column_id, value: null, operator: newOp };
    return;
  }
  if (c.value) { return; }                 // factored: operator on clause is enough
  if (!c.leaf) c.leaf = { column_id: c.column_id, value: "" };
  if (c.leaf.value === null || c.leaf.value === undefined) c.leaf.value = "";
  c.leaf.operator = newOp;
}

// Re-point a SEARCH clause to a sibling search surface (title <-> abstract <-> full
// text), keyed by the clause id — the field chip's only field swap (changing any
// other field's property would make its existing values meaningless). `newColumnId`
// is a base `.search` column from searchFieldSiblings(). Analogous to setOperator:
// it rewrites the clause's column AND, for a SIMPLE clause, the raw leaf's column —
// swapping only the BASE while preserving each column's own `.search`/`.search.exact`
// surface suffix (one row can mix exact + stemmed values, e.g.
// `contains (amphibian or "amphibi*")`). A FACTORED clause carries no per-value
// column_id: each value's surface is re-derived from its text at OQO-build time
// (v2ToOqo.valueToFilter -> searchSurfaceToFilter), so swapping the clause base is
// enough — the suffixes follow automatically. No-op on a non-search clause.
export function setColumn(tree, id, newColumnId, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit || hit.kind !== "clause") return;
  const c = hit.node;
  if (!isSearchColumn(c.column_id) || !isSearchColumn(newColumnId)) return;
  const newBase = searchBaseColumn(newColumnId);
  const reBase = (col) => `${newBase}${searchColumnSuffix(col)}`;
  c.column_id = reBase(c.column_id);
  if (c.column) c.column = newBase;                       // display name follows on re-render
  if (c.leaf && c.leaf.column_id) c.leaf.column_id = reBase(c.leaf.column_id);
}

// Toggle the negation bit on a value (vleaf) or a simple clause's leaf.
export function toggleNeg(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  if (hit.kind === "vleaf") hit.node.negated = !hit.node.negated;
  else if (hit.kind === "clause" && hit.node.leaf)
    hit.node.leaf.is_negated = !hit.node.leaf.is_negated;
}

// Flip a connector (and <-> or) on a group or value vgroup.
export function toggleJoin(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  if (hit.node.join) hit.node.join = hit.node.join === "and" ? "or" : "and";
}

// Negate a whole parenthesized group (the paren-block toolbar's `[not]`), keyed by
// the paren token id. Two cases, because the OQO carries negation differently for
// the two group flavors (NNF: negation never lives on a value vgroup):
//
//   - CLAUSE group  -> set `group.negated`. The server's NNF render shape for a
//     negated group is an OUTER `negated:true` group wrapping a SINGLE plain inner
//     group (oql_render_v2._expr_node); v2ToOqo.exprToFilter reads that exact shape
//     (`is_negated` from the wrapper, join/filters from the inner). So to negate we
//     WRAP the group's children in a fresh inner group; to un-negate we UNWRAP it.
//     The paren token on an already-negated group carries the INNER group's id (the
//     `not ` chrome carries the outer id) — handle both by checking the parent.
//   - VALUE vgroup  -> De Morgan in place: flip every join and toggle `negated` on
//     every descendant leaf (a vgroup has no `negated` flag). The server re-
//     canonicalizes on the next render.
export function negateGroup(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  if (hit.kind === "vgroup") { deMorgan(hit.node); return; }
  if (hit.kind !== "group") return;

  const g = hit.node;
  if (g.negated) { unwrapNegated(g); return; }    // clicked the `not` chrome (outer id)

  // un-negated group: if it is the lone inner child of a negated parent, the user
  // clicked the paren of an already-negated group -> un-negate by unwrapping the parent.
  const parent = findExprParent(tree, id);
  if (parent && parent.node === "group" && parent.negated &&
      parent.children.length === 1 && parent.children[0] === g) {
    unwrapNegated(parent);
    return;
  }
  wrapNegated(g);
}

function wrapNegated(g) {
  const inner = { node: "group", id: eid(), join: g.join, negated: false,
                  paren: true, children: g.children };
  g.negated = true;
  g.children = [inner];
}

function unwrapNegated(g) {
  g.negated = false;
  const inner = (g.children && g.children.length === 1 && g.children[0].node === "group")
    ? g.children[0] : null;
  if (inner) { g.join = inner.join; g.children = inner.children; }
}

// Full negation of a value vtree via De Morgan: flip the join at every level and
// toggle the `negated` bit on every scalar leaf. NOT(a OR b) == (NOT a AND NOT b);
// recursion handles nested vgroups, e.g. NOT((a or b) and c) == ((not a and not b) or not c).
function deMorgan(node) {
  if (node.node === "vgroup") {
    node.join = node.join === "and" ? "or" : "and";
    node.children.forEach(deMorgan);
  } else {
    node.negated = !node.negated;
  }
}

// Find the expr-tree parent of a node id (group children only — clauses/values are
// leaves for this purpose). Returns the parent expr node, or null at the top level.
function findExprParent(tree, id) {
  let res = null;
  const walk = (n, parent) => {
    if (res) return;
    if (n.id === id) { res = parent; return; }
    if (n.node === "group") n.children.forEach((c) => walk(c, n));
  };
  const w = tree && tree.where;
  if (w) {
    if (w.node === "group" && w.implicit) w.children.forEach((c) => walk(c, w));
    else walk(w, null);
  }
  return res;
}

// Remove a node. A value brick: drop it from its vgroup (and if that empties the
// clause's values, drop the clause). A clause/group row: drop the row.
export function removeNode(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return;
  hit.detach();
  pruneEmpty(tree);
}

// After a removal, drop any clause whose value vgroup went empty, and collapse a
// vgroup with a single child up into its parent slot (server would anyway).
function pruneEmpty(tree) {
  const visitExpr = (n, parentArr, idx) => {
    if (n.node === "clause" && n.value && n.value.children && !n.value.children.length) {
      if (parentArr) parentArr.splice(idx, 1);
      return;
    }
    if (n.node === "group") {
      for (let i = n.children.length - 1; i >= 0; i--) visitExpr(n.children[i], n.children, i);
    }
  };
  const w = tree && tree.where;
  if (!w) return;
  if (w.node === "group" && w.implicit) {
    for (let i = w.children.length - 1; i >= 0; i--) visitExpr(w.children[i], w.children, i);
    if (!w.children.length) tree.where = null;
  } else {
    visitExpr(w, null, -1);
  }
}

// Add another value to a value list (Enter / "Add value"). Given any vbrick id
// inside a clause, append an empty sibling vleaf. A simple clause (leaf, single
// value) is promoted to a factored vgroup of two vleaves.
export function addValue(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return null;
  if (hit.kind === "vgroup") {
    // addressed by the value-group id itself (paren-block `[+]`): append a sibling
    const nv = vleaf(""); hit.node.children.push(nv); return nv.id;
  }
  if (hit.kind === "vleaf") {
    // find the owning vgroup
    const grp = findVGroupOf(tree, id, drafts);
    if (grp) { const nv = vleaf(""); grp.children.push(nv); return nv.id; }
  }
  if (hit.kind === "clause") {
    const c = hit.node;
    if (c.value && c.value.node === "vgroup") {
      const nv = vleaf(""); c.value.children.push(nv); return nv.id;
    }
    if (c.leaf) {
      // promote simple -> factored: existing value becomes a vleaf, add an empty one
      const cur = vleaf(c.leaf.value, undefined, c.leaf.is_negated);
      const nv = vleaf("");
      c.value = { node: "vgroup", id: eid(), join: "or", children: [cur, nv] };
      delete c.leaf;
      return nv.id;
    }
  }
  return null;
}

function findVGroupOf(tree, childId, drafts = []) {
  let res = null;
  const inV = (v) => {
    if (res) return;
    if (v.node === "vgroup") {
      if (v.children.some((c) => c.id === childId)) { res = v; return; }
      v.children.forEach(inV);
    }
  };
  const inE = (n) => {
    if (res) return;
    if (n.node === "clause" && n.value) inV(n.value);
    if (n.node === "group") n.children.forEach(inE);
  };
  const w = tree && tree.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach(inE) : inE(w); }
  drafts.forEach((d) => { if (d.value) inV(d.value); });
  return res;
}

// ---- drafts (clause creation) ----------------------------------------------

export function makeDraft() {
  return { node: "clause", id: eid(), draft: true, column_id: null,
           column: null, operator: "is", clause_kind: "other",
           unary: false, numeric: false, value: null, editing: false };
}

// Pop an already-committed FLAT scalar clause into an "editing" draft that carries
// its existing values plus a fresh empty one. This is how you add another value to
// a committed scalar clause: the server-lines model can't render an empty
// intermediate (the server only ever lays out COMPLETE queries), so we move the
// whole clause into the local draft layer — which DOES render incomplete clauses —
// until the new value is filled. The `editing` flag keeps the draft from folding
// back into the query on the pop-time re-render (see OqlQueryBuilder currentOqo /
// renderQuery); it's cleared on blur, after which the draft folds canonically.
// Entity values don't need this (they're picked atomically, never empty).
export function popClauseToDraft(tree, clauseId, drafts, { column, kind, op } = {}) {
  const hit = locate(tree, clauseId, drafts);
  if (!hit || hit.kind !== "clause") return null;
  const c = hit.node;
  const existing = [];
  if (c.leaf) existing.push(vleaf(c.leaf.value, String(c.leaf.value), c.leaf.is_negated));
  else if (c.value) {
    const collect = (v) => {
      if (v.node === "vleaf") existing.push(vleaf(v.value, v.display, v.negated));
      else (v.children || []).forEach(collect);
    };
    (c.value.children || []).forEach(collect);
  }
  const empty = vleaf("");
  const d = makeDraft();
  d.column_id = c.column_id;
  d.column = column || c.column || c.column_id;
  d.operator = op || c.operator || "is";
  d.clause_kind = kind === "entity" ? "entity" : kind === "boolean" ? "bool" : "other";
  d.numeric = kind === "number";
  d.value = { node: "vgroup", id: eid(), join: (c.value && c.value.join) || "or",
              children: [...existing, empty] };
  d.editing = true;
  hit.detach();          // remove the committed clause from the tree
  pruneEmpty(tree);
  drafts.push(d);
  return { draft: d, newId: empty.id };
}

// Fill a draft when a field is picked. kind/op come from the property catalog
// (computed by the caller via oqoTree helpers).
export function draftSetField(draft, { column_id, column, kind, op, unary }) {
  draft.column_id = column_id;
  draft.column = column;
  draft.operator = op || "is";
  draft.clause_kind = kind === "entity" ? "entity" : kind === "boolean" ? "bool" : "other";
  draft.unary = !!unary;
  draft.numeric = kind === "number";
  if (unary) { draft.value = null; return; }
  // entity values are PICKED (atomic, never an empty intermediate) → start empty
  // and let the picker add them; scalar/boolean start with one editable brick.
  const children = kind === "entity" ? []
    : [kind === "boolean" ? vleaf(true, "true") : vleaf("")];
  draft.value = { node: "vgroup", id: eid(), join: "or", children };
}

export function draftSetOperator(draft, { op, unary }) {
  draft.operator = op || "is";
  draft.unary = !!unary;
  if (unary) draft.value = null;
  else if (!draft.value)
    draft.value = { node: "vgroup", id: eid(), join: "or", children: [vleaf("")] };
}

// A draft is "complete" (ready to fold into the query) when it has a column and
// either is unary, or carries at least one non-empty value.
export function draftComplete(draft) {
  if (!draft.column_id) return false;
  if (draft.unary) return true;
  return !!(draft.value && draft.value.children.some(vFilled));
}
function vFilled(v) {
  return v.node === "vgroup" ? v.children.some(vFilled) : v.value !== "" && v.value != null;
}

// A completed draft -> an OQO filter (leaf or same-column branch), to append to
// the query's filter_rows. Mirrors v2ToOqo's value reconstruction.
export function draftToFilter(draft) {
  const col = draft.column_id;
  const op = draft.operator || "is";
  if (draft.unary)
    return { column_id: col, value: null, operator: op };
  const vToF = (v) => {
    if (v.node === "vleaf") {
      if (draft.clause_kind === "other" && isSearchColumn(col)) {
        const r = searchSurfaceToFilter(v.value, col);
        const o = { column_id: r.column_id, value: r.value };
        if (op !== "is") o.operator = op;
        if (v.negated) o.is_negated = true;
        return o;
      }
      const o = { column_id: col, value: v.value, operator: op, is_negated: !!v.negated };
      return o;
    }
    return { join: v.join, filters: v.children.filter(vFilled).map(vToF) };
  };
  const filled = draft.value.children.filter(vFilled);
  if (filled.length === 1) return vToF(filled[0]);
  return { join: draft.value.join, filters: filled.map(vToF) };
}
