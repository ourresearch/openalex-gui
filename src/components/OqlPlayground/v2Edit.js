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
// `has (amphibian or "amphibi*")`). A FACTORED clause carries no per-value
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

// ---- move a logical ROW (drag-and-drop reorder, oxjob #475) ------------------
// Move a node — an expr (a `clause` or a clause `group`), OR a value-bag (`vgroup`) —
// to a new position among the children of `targetParentId` at `targetIndex`. The drag
// machinery only ever offers TYPE-COMPATIBLE targets (an expr drops into a clause-list
// `group`; a value-bag drops into a value-list `vgroup`), but we re-check here so the op
// is safe to call directly. Mutates the tree in place; the caller re-renders through the
// server, which re-canonicalizes joins / parens / first-sibling dots. Returns true on a
// real move, false on a no-op / invalid request.
export function moveNode(tree, id, targetParentId, targetIndex, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return false;
  const node = hit.node;
  // can't drop a node into itself or anywhere inside its own subtree
  if (id === targetParentId || subtreeHasId(node, targetParentId)) return false;

  // NB: locate() only walks the implicit `where` group's CHILDREN (never the group node
  // itself), so resolve the target container with findNodeById, which checks the `where`
  // root too — the top-level implicit group is the most common drop target.
  const targetNode = findNodeById(tree, targetParentId, drafts);
  if (!targetNode) return false;

  // pick the source parent + verify kind compatibility
  let parent;
  if (node.node === "clause" || node.node === "group") {
    if (targetNode.node !== "group") return false;     // filters only into clause-lists
    parent = findExprParent(tree, id);
  } else if (node.node === "vgroup") {
    if (targetNode.node !== "vgroup") return false;     // value-bags only into value-lists
    parent = findVGroupOf(tree, id, drafts);
  } else {
    return false;                                       // vleaf moves are chip-level (later)
  }
  if (!parent) return false;

  const srcArr = parent.children;
  const dstArr = targetNode.children;
  const sameArr = parent.id === targetNode.id;          // compare by id (reactive-proxy safe)
  const oldIndex = srcArr.findIndex((c) => c.id === id);
  if (oldIndex < 0) return false;

  let idx = targetIndex;
  srcArr.splice(oldIndex, 1);
  // reorder index-fix: removing a node before the insertion point in the SAME array
  // shifts every later slot left by one.
  if (sameArr && oldIndex < idx) idx -= 1;
  if (idx < 0) idx = 0;
  if (idx > dstArr.length) idx = dstArr.length;
  dstArr.splice(idx, 0, node);

  pruneEmpty(tree);
  return true;
}

// Does `id` live anywhere inside `node`'s subtree (excluding `node` itself)? Guards
// moveNode against dropping a node into its own descendant.
function subtreeHasId(node, id) {
  let found = false;
  const visit = (n) => {
    if (found || !n) return;
    if (n.id === id) { found = true; return; }
    if (n.node === "group") n.children.forEach(visit);
    else if (n.node === "clause" && n.value) visit(n.value);
    else if (n.node === "vgroup") n.children.forEach(visit);
  };
  if (node.node === "group") node.children.forEach(visit);
  else if (node.node === "clause" && node.value) visit(node.value);
  else if (node.node === "vgroup") node.children.forEach(visit);
  return found;
}

// Find any node by id, INCLUDING the implicit `where` group root (which locate() skips
// — it only walks that group's children). Used to resolve a move's target container.
function findNodeById(tree, id, drafts = []) {
  let res = null;
  const visit = (n) => {
    if (res || !n) return;
    if (n.id === id) { res = n; return; }
    if (n.node === "group") n.children.forEach(visit);
    else if (n.node === "clause" && n.value) visit(n.value);
    else if (n.node === "vgroup") n.children.forEach(visit);
  };
  if (tree && tree.where) visit(tree.where);
  drafts.forEach((d) => { if (d.value) visit(d.value); });
  return res;
}

// The owning vgroup of a value node (drag-and-drop slot geometry, oxjob #475) —
// a public alias for findVGroupOf so the builder can resolve a value-bag's parent.
export function findValueParent(tree, id, drafts = []) {
  return findVGroupOf(tree, id, drafts);
}

// The clause whose DIRECT value IS the vleaf `id` (a single-value filter like
// `year is 2020` — value is a bare vleaf, no enclosing vgroup), or null when the value
// lives inside a vgroup. Dragging such a sole value OUT empties its clause, so moveValues
// removes the now-value-less clause (it would be an invalid OQO otherwise). (oxjob #475.)
function soleValueClause(tree, id, drafts = []) {
  let res = null;
  const inExpr = (n) => {
    if (res) return;
    if (n.node === "clause") { if (n.value && n.value.node === "vleaf" && n.value.id === id) res = n; }
    else if (n.node === "group") n.children.forEach(inExpr);
  };
  const w = tree && tree.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach(inExpr) : inExpr(w); }
  drafts.forEach((d) => { if (d.value && d.value.node === "vleaf" && d.value.id === id) res = d; });
  return res;
}

// Document-order list of the value ids in `idSet` (so a multi-chip drag preserves the
// on-screen order of the dragged values when they re-land in the target list). Note a SIMPLE
// (single-value) clause stores its scalar on `leaf` and the value token carries the CLAUSE id
// (no separate vleaf) — so a clause id in the set is itself a draggable value.
function valuesInDocOrder(tree, idSet, drafts = []) {
  const out = [];
  const inValue = (v) => { if (idSet.has(v.id)) out.push(v.id); if (v.node === "vgroup") v.children.forEach(inValue); };
  const inExpr = (n) => {
    if (n.node === "clause") { if (n.value) inValue(n.value); else if (idSet.has(n.id)) out.push(n.id); }
    else if (n.node === "group") n.children.forEach(inExpr);
  };
  const w = tree && tree.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach(inExpr) : inExpr(w); }
  drafts.forEach((d) => { if (d.value) inValue(d.value); else if (idSet.has(d.id)) out.push(d.id); });
  return out;
}

// Resolve a move's destination value list (a vgroup). A vgroup target drops straight in; a
// single-value `clause` target is PROMOTED to a list first so the dropped chip joins its value
// (`year is 2020` + 2021-drop → `year is (2020 or 2021)`). Both the `value:vleaf` shape and the
// real server `leaf` shape are lifted into a fresh `or`-vgroup. Returns the vgroup, or null.
function resolveDestVgroup(target) {
  if (!target) return null;
  if (target.node === "vgroup") return target;
  if (target.node !== "clause") return null;
  if (target.value && target.value.node === "vgroup") return target.value;
  if (target.value && target.value.node === "vleaf") {
    target.value = { node: "vgroup", id: eid(), join: "or", children: [target.value] };
    return target.value;
  }
  if (target.leaf) {
    const lf = vleaf(target.leaf.value, target.leaf.display, target.leaf.negated);
    target.value = { node: "vgroup", id: eid(), join: "or", children: [lf] };
    delete target.leaf;
    return target.value;
  }
  return null;
}

// Take the value `id` out of the tree as a standalone vleaf, ready to re-insert elsewhere.
// Two source shapes: a real `vleaf` inside a vgroup (detach it in place), or a SIMPLE clause
// whose scalar lives on `leaf` (the value id IS the clause id) — synthesize a vleaf from the
// leaf and flag the now-value-less clause for removal. Returns { node, removeClause } or null.
function takeValue(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit) return null;
  if (hit.kind === "vleaf") {
    const sc = soleValueClause(tree, id, drafts);   // defensive: a `value:vleaf` sole shape
    hit.detach();
    return { node: hit.node, removeClause: sc ? sc.id : null };
  }
  if (hit.kind === "clause" && hit.node.leaf) {
    const lf = vleaf(hit.node.leaf.value, hit.node.leaf.display, hit.node.leaf.negated);
    return { node: lf, removeClause: hit.node.id };
  }
  return null;
}

// Move a SET of value chips (vleaves) into a target value list at `targetIndex` — the
// chip-level drag-and-drop (oxjob #475, "reverse of dragging rows": a vertical insertion
// line between chips). The dragged values are spliced out of wherever they live (one list
// or several) and re-inserted, in document order, into the destination list:
//   • targetParentId is a `vgroup` → drop straight in;
//   • targetParentId is a single-value `clause` → promote its lone value to a vgroup first
//     (so the dropped chip joins it, `year is 2020` + apple-drop is structurally a list).
// `targetIndex` is the insertion position among the destination's CURRENT children, as the
// drag geometry computed it; we re-anchor to the node at that slot so the index is robust to
// the removals. A dragged value that was a clause's SOLE value leaves that clause empty, so
// we drop the clause. The moved chip adopts the destination list's join (conjunction is a
// vgroup property, not the chip's — Jason 2026-06-17): nothing to copy, it just renders with
// the new parent's join. The server re-canonicalizes on the next swap render. Returns true on
// a real move, false on a no-op / invalid request. Mutates the tree in place.
export function moveValues(tree, ids, targetParentId, targetIndex, drafts = []) {
  const uniq = [...new Set((ids || []).filter((x) => x != null))];
  if (!uniq.length) return false;
  if (uniq.includes(targetParentId)) return false;             // can't drop into one of the dragged chips

  // resolve the destination value list, promoting a single-value clause target to a vgroup.
  const target = findNodeById(tree, targetParentId, drafts);
  const dest = resolveDestVgroup(target);
  if (!dest || dest.node !== "vgroup" || uniq.includes(dest.id)) return false;

  // the node to insert BEFORE (null = append): the first dest child at/after the slot that
  // is NOT itself being dragged — re-found by id after the removals, so splicing is safe.
  let anchor = null;
  for (let i = Math.max(0, targetIndex); i < dest.children.length; i++) {
    if (!uniq.includes(dest.children[i].id)) { anchor = dest.children[i]; break; }
  }

  // take the dragged values out (document order), tracking any source clause emptied by it.
  const ordered = valuesInDocOrder(tree, new Set(uniq), drafts);
  const collected = [];
  const emptiedClauses = [];
  for (const id of ordered) {
    const taken = takeValue(tree, id, drafts);
    if (!taken) continue;
    collected.push(taken.node);
    if (taken.removeClause) emptiedClauses.push(taken.removeClause);
  }
  if (!collected.length) return false;

  const at = anchor ? dest.children.findIndex((c) => c.id === anchor.id) : dest.children.length;
  dest.children.splice(at < 0 ? dest.children.length : at, 0, ...collected);

  // drop clauses whose only value we just moved away (a simple clause's scalar source). locate
  // finds the now-value-less clause + detaches it; pruneEmpty tidies any emptied ancestors.
  emptiedClauses.forEach((cid) => { const h = locate(tree, cid, drafts); if (h) h.detach(); });
  pruneEmpty(tree);
  return true;
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

// Insert an empty sibling vleaf immediately AFTER the value `afterId`, within its
// OWN vgroup — so a chip's "New" adds the new chip right to its right (Jason
// 2026-06-16), not at the end of the clause, and respecting the local group (a
// value in a nested `or`-group gets its new sibling inside that same group). For a
// value that isn't a factored vleaf (a simple clause's sole value, addressed by the
// clause id, or a vgroup addressed directly) we fall back to addValue, which
// promotes/appends — the "after" is unambiguous there (one value, or end-of-group).
// Returns the new vleaf id. (oxjob #428.)
export function addValueAfter(tree, afterId, drafts = []) {
  const hit = locate(tree, afterId, drafts);
  if (!hit) return null;
  if (hit.kind === "vleaf") {
    const grp = findVGroupOf(tree, afterId, drafts);
    if (grp) {
      const i = grp.children.findIndex((c) => c.id === afterId);
      const nv = vleaf("");
      grp.children.splice(i < 0 ? grp.children.length : i + 1, 0, nv);
      return nv.id;
    }
  }
  return addValue(tree, afterId, drafts);
}

// Add an empty sibling value immediately AFTER the value-group `groupId`, within that
// group's PARENT vgroup — the nested-bag hover "+" (oxjob #475): a `(a or b)` bag nested
// in `( bagA and bagB )` gets a NEW value as a sibling of the bag, not inside it. Returns
// { id, join } (join = the parent vgroup's connector), or null when `groupId` has no
// enclosing vgroup (it's the clause's own value root — the caller then adds INSIDE it).
export function addSiblingValueAfterGroup(tree, groupId, drafts = []) {
  const parent = findVGroupOf(tree, groupId, drafts);
  if (!parent) return null;
  const i = parent.children.findIndex((c) => c.id === groupId);
  const nv = vleaf("");
  parent.children.splice(i < 0 ? parent.children.length : i + 1, 0, nv);
  return { id: nv.id, join: parent.join || "and" };
}

// The join ("and"/"or") of the vgroup that directly owns value `id` — used to render
// the leading connector for a transient empty value box added inside a nested group
// (#472, committed-tree scalar "New"). Defaults to "or" when the value isn't in a
// vgroup (a simple clause's sole value).
export function joinOfValue(tree, id, drafts = []) {
  const g = findVGroupOf(tree, id, drafts);
  return (g && g.join) || "or";
}

// Wrap value `id` in a NEW nested vgroup seeded with the value plus an empty sibling —
// the value-chip "Group" gesture (#472 gesture 2). e.g. `(Boy and Girl and cat)` → click
// Girl → `(Boy and (Girl or _) and cat)`. The inner group's join defaults to the OPPOSITE
// of the owning group's join, since that's the only nesting that changes meaning (the
// canonical `A and (B or C)`); a same-join nest would just re-flatten on canonicalization.
// Only meaningful for a factored `vleaf` that already sits in a vgroup (real nesting);
// returns null otherwise (a simple clause's lone value has nothing to nest WITHIN — the
// caller falls back to a plain add). Like the scalar "New" pending box, the empty sibling
// is stripped on round-trip (vFilled) and the singleton vgroup would then collapse, so the
// caller must render this transiently (pendingGroup) and only commit once the 2nd value is
// typed. Returns { innerId, emptyId, innerJoin }.
export function wrapValueInGroup(tree, id, drafts = []) {
  const hit = locate(tree, id, drafts);
  if (!hit || hit.kind !== "vleaf") return null;
  const grp = findVGroupOf(tree, id, drafts);
  if (!grp) return null;                       // a vleaf is always inside a vgroup; guard anyway
  const innerJoin = grp.join === "and" ? "or" : "and";
  const empty = vleaf("");
  const ng = { node: "vgroup", id: eid(), join: innerJoin, children: [hit.node, empty] };
  const i = grp.children.findIndex((c) => c.id === id);
  grp.children.splice(i, 1, ng);               // replace the value in place with the wrapper
  return { innerId: ng.id, emptyId: empty.id, innerJoin };
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

// ---- multi-select: group / delete a SET of values (oxjob #472) --------------
// Selecting several value chips (Shift/Cmd-click) and "Add to subclause" wraps them
// into a new nested vgroup at their LOWEST COMMON ANCESTOR vgroup. Same-field only
// (Jason 2026-06-16): every selected value must be a vleaf in the SAME clause, so the
// new subclause is a value-group `col is (…)` — cross-field grouping is a follow-up.
// Unlike the single-value "Group" gesture (wrapValueInGroup), every selected value is
// already FILLED, so the wrap produces a valid OQO directly — NO transient pending box:
// the caller just renderQuery({swap:true}) and the server canonicalizes (it collapses
// the now-singleton leftover vgroups, e.g. `(Boy or X)` minus Boy → X).

// The chain of vgroup NODES from a clause's value root down to the vgroup that directly
// owns `id` (inclusive), or null if `id` isn't a vleaf anywhere under `vroot`.
function leafChain(vroot, id) {
  if (!vroot || vroot.node !== "vgroup") return null;
  if (vroot.children.some((c) => c.id === id)) return [vroot];
  for (const c of vroot.children) {
    if (c.node === "vgroup") {
      const sub = leafChain(c, id);
      if (sub) return [vroot, ...sub];
    }
  }
  return null;
}

// Locate a vleaf's clause + its vgroup-ancestor chain. Returns { clause, columnId, chain }
// or null (id not a factored vleaf — e.g. a simple clause's sole value has no vgroup, so
// there's nothing to group it within).
function leafContext(tree, id, drafts = []) {
  let res = null;
  const inClause = (c) => {
    if (res || !c.value || c.value.node !== "vgroup") return;
    const chain = leafChain(c.value, id);
    if (chain) res = { clause: c, columnId: c.column_id, chain };
  };
  const inExpr = (n) => {
    if (res) return;
    if (n.node === "clause") inClause(n);
    else if (n.node === "group") n.children.forEach(inExpr);
  };
  const w = tree && tree.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach(inExpr) : inExpr(w); }
  drafts.forEach(inClause);
  return res;
}

function containsValueId(v, id) {
  if (!v) return false;
  if (v.id === id) return true;
  return v.node === "vgroup" && v.children.some((c) => containsValueId(c, id));
}

// Can the given value ids be wrapped into ONE subclause? Yes iff there are ≥2 distinct
// of them and all are factored vleaves in the SAME clause (same field). Returns
// { clause, columnId, lca } (lca = the deepest shared vgroup node) or null. The builder
// uses this to enable/disable the "Add to subclause" menu item. (Same-field-only, #472.)
export function groupableValues(tree, ids, drafts = []) {
  const uniq = [...new Set((ids || []).filter((x) => x != null))];
  if (uniq.length < 2) return null;
  const ctxs = uniq.map((id) => leafContext(tree, id, drafts));
  if (ctxs.some((c) => !c)) return null;
  const clause = ctxs[0].clause;
  if (ctxs.some((c) => c.clause !== clause)) return null;     // same field only
  // LCA = longest common prefix of the (root-anchored) vgroup chains.
  let lca = ctxs[0].chain[0];
  for (let d = 1; ; d++) {
    const node = ctxs[0].chain[d];
    if (!node || ctxs.some((c) => c.chain[d] !== node)) break;
    lca = node;
  }
  return { clause, columnId: ctxs[0].columnId, lca };
}

// Wrap the selected values into a new nested vgroup inserted at their LCA ("Add to
// subclause", #472). The new group's join is the OPPOSITE of the LCA's join — the only
// nesting that survives canonicalization as a real precedence boundary (a same-join nest
// just re-flattens). The selected leaves are MOVED out of their original positions into
// the new group in document order; leftover singletons (e.g. `(Boy or X)` minus Boy) are
// collapsed by the server on the next render. Returns the new vgroup id, or null.
export function wrapValuesInGroup(tree, ids, drafts = []) {
  const info = groupableValues(tree, ids, drafts);
  if (!info) return null;
  const { lca } = info;
  const idset = new Set(ids);
  // document-order list of the selected leaf NODES under the clause's value root
  const ordered = [];
  const collect = (v) => {
    if (v.node === "vgroup") v.children.forEach(collect);
    else if (idset.has(v.id)) ordered.push(v);
  };
  collect(info.clause.value);
  if (ordered.length < 2) return null;
  // insertion slot: the LCA-direct-child subtree that holds the FIRST selected leaf. A
  // placeholder reserves it while we detach the leaves (some may be direct children of
  // the LCA), so the index stays valid; we re-find the placeholder by its unique id after.
  // Find by id, NOT by reference: on a Vue REACTIVE tree the spliced-in object is wrapped
  // in a proxy, so `c === placeholder` is false (proxy ≠ raw) → findIndex returns -1 →
  // splice(-1,…) clobbers the LAST child and strands the empty placeholder. The id is a
  // plain string, unaffected by proxying. (Plain-object unit tests never hit this.)
  const insAt = lca.children.findIndex((child) => containsValueId(child, ordered[0].id));
  const phId = eid();
  lca.children.splice(insAt < 0 ? lca.children.length : insAt, 0,
    { node: "vgroup", id: phId, join: lca.join, children: [] });
  ordered.forEach((leaf) => {
    const parent = findVGroupOf(tree, leaf.id, drafts);
    if (parent) { const i = parent.children.findIndex((c) => c.id === leaf.id); if (i >= 0) parent.children.splice(i, 1); }
  });
  const ng = { node: "vgroup", id: eid(), join: lca.join === "and" ? "or" : "and", children: ordered };
  const pi = lca.children.findIndex((c) => c.id === phId);
  lca.children.splice(pi, 1, ng);
  return ng.id;
}

// Remove a SET of nodes by id, pruning once at the end (batch "Delete n chips", #472).
// Each id is located fresh against the current tree state, so detaches don't invalidate
// one another's indices.
export function removeNodes(tree, ids, drafts = []) {
  [...new Set((ids || []).filter((x) => x != null))].forEach((id) => {
    const hit = locate(tree, id, drafts);
    if (hit) hit.detach();
  });
  pruneEmpty(tree);
}

// ---- multi-select: group a SET of whole FILTERS into a clause group ----------
// (oxjob #472, unblocks #428 Phase B). The clause-level analog of wrapValuesInGroup:
// select ≥2 whole filters by their FIELD chip and wrap them into a parenthesized
// CLAUSE group, e.g. `type is article and year is 2020` → select both →
// `(type is article or year is 2020)`. Unlike value grouping this works ACROSS fields
// — a clause group's children are independent filters, not values of one column. The
// new group's join is the OPPOSITE of the parent's (an `and` parent → an `or` group),
// the only nesting that survives canonicalization as a real precedence boundary (a
// same-join nest just re-flattens). Every selected filter is already complete, so the
// wrap produces a valid OQO directly — no transient pending box; the caller just
// renderQuery({swap:true}) and the server re-canonicalizes.

// The expr node (clause | group) for `id` plus the expr GROUP that directly contains it
// (its sibling list), or null if `id` isn't a committed expr node. The top-level implicit
// `where` group counts as the parent of the root filter rows. Drafts are excluded — a
// half-built clause isn't a committed filter row.
function exprContext(tree, id) {
  let res = null;
  const walk = (n, parent) => {
    if (res) return;
    if ((n.node === "clause" || n.node === "group") && n.id === id && !n.draft) {
      res = { node: n, parent };
      return;
    }
    if (n.node === "group") n.children.forEach((c) => walk(c, n));
  };
  const w = tree && tree.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach((c) => walk(c, w)) : walk(w, null); }
  return res;
}

// The effective join of an expr group: the implicit top-level `where` group is an AND
// (its children are filter_rows, joined implicitly), an explicit group carries its own.
function exprGroupJoin(g) {
  return g && g.implicit ? "and" : ((g && g.join) || "and");
}

// Can the given ids be wrapped into ONE clause group? Yes iff there are ≥2 distinct of
// them and all are committed expr nodes (clauses/groups) that are SIBLINGS — direct
// children of the same expr group. Returns { parent } (the shared parent group) or null.
// The builder uses this to enable/disable "Wrap as subclause" for a whole-filter selection.
export function groupableFilters(tree, ids) {
  const uniq = [...new Set((ids || []).filter((x) => x != null))];
  if (uniq.length < 2) return null;
  const ctxs = uniq.map((id) => exprContext(tree, id));
  if (ctxs.some((c) => !c || !c.parent)) return null;
  const parent = ctxs[0].parent;
  if (ctxs.some((c) => c.parent !== parent)) return null;  // must be siblings
  return { parent };
}

// Wrap the selected filters into a new clause group inserted at their shared parent
// ("Wrap as subclause" for a whole-filter selection, #472). The new group's join is the
// OPPOSITE of the parent's. The selected expr nodes are MOVED out of their positions into
// the new group in document order; any non-selected siblings stay put. Returns the new
// group id, or null.
export function wrapFiltersInGroup(tree, ids) {
  const info = groupableFilters(tree, ids);
  if (!info) return null;
  const { parent } = info;
  const idset = new Set(ids);
  // document-order list of the selected child nodes (direct children of the parent)
  const ordered = parent.children.filter((c) => idset.has(c.id));
  if (ordered.length < 2) return null;
  const groupJoin = exprGroupJoin(parent) === "and" ? "or" : "and";
  // Insert a placeholder at the FIRST selected child's slot, then detach the selected
  // children (re-find each by id so shifting indices stay valid), then swap the
  // placeholder for the real group. Find by id, NOT by reference: on a Vue REACTIVE tree
  // a spliced-in raw object reads back as its proxy, so `c === placeholder` is false →
  // findIndex returns -1 → splice(-1,…) clobbers the wrong child. (Same trap as
  // wrapValuesInGroup; plain-object unit tests never hit it.)
  const insAt = parent.children.findIndex((c) => c.id === ordered[0].id);
  const phId = eid();
  parent.children.splice(insAt < 0 ? parent.children.length : insAt, 0,
    { node: "group", id: phId, join: groupJoin, paren: true, children: [] });
  ordered.forEach((node) => {
    const i = parent.children.findIndex((c) => c.id === node.id);
    if (i >= 0) parent.children.splice(i, 1);
  });
  const ng = { node: "group", id: eid(), join: groupJoin, paren: true, children: ordered };
  const pi = parent.children.findIndex((c) => c.id === phId);
  parent.children.splice(pi, 1, ng);
  return ng.id;
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
// `afterId` (optional): insert the new empty value right after that EXISTING value
// (the clicked chip), so scalar "New" adds the box to the chip's right rather than
// at the clause end (oxjob #428, Jason 2026-06-16). Only meaningful for a FLAT
// clause — the caller guards nested clauses out (the flat-vgroup draft model can't
// represent nesting), so `collect` here only ever sees a single level.
export function popClauseToDraft(tree, clauseId, drafts, { column, kind, op, afterId } = {}) {
  const hit = locate(tree, clauseId, drafts);
  if (!hit || hit.kind !== "clause") return null;
  const c = hit.node;
  const existing = [];
  let insertIdx = -1;
  const pushOne = (origId, vl) => { existing.push(vl); if (origId != null && origId === afterId) insertIdx = existing.length; };
  // a simple clause's sole value is addressed by the CLAUSE id (see locate's header)
  if (c.leaf) pushOne(c.id, vleaf(c.leaf.value, String(c.leaf.value), c.leaf.is_negated));
  else if (c.value) {
    const collect = (v) => {
      if (v.node === "vleaf") pushOne(v.id, vleaf(v.value, v.display, v.negated));
      else (v.children || []).forEach(collect);
    };
    (c.value.children || []).forEach(collect);
  }
  const empty = vleaf("");
  if (insertIdx >= 0) existing.splice(insertIdx, 0, empty); else existing.push(empty);
  const d = makeDraft();
  d.column_id = c.column_id;
  d.column = column || c.column || c.column_id;
  d.operator = op || c.operator || "is";
  d.clause_kind = kind === "entity" ? "entity" : kind === "boolean" ? "bool" : "other";
  d.numeric = kind === "number";
  d.value = { node: "vgroup", id: eid(), join: (c.value && c.value.join) || "or",
              children: existing };
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
