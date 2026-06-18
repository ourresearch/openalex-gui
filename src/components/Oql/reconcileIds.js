// Id-preserving reconciliation for the OQL builder's smooth drag-and-drop + edits (#475).
//
// The builder has a DUAL representation of the query: `v2Edit` mutates the STRUCTURAL
// tree (`where` → clause/group/vgroup/vleaf, which drives the OQO sent to the server),
// while `displayLines` renders from the server's precomputed `tree.lines` flat token
// stream. They're kept in sync by reseeding `v2` from each server render — but the
// server RENUMBERS every node id on every render, so a naive reseed gives every chip a
// new identity: Vue tears down + rebuilds the whole chip DOM (jarring flicker, and a
// <TransitionGroup> sees every node as removed+added instead of moved → no slide).
//
// `reconcileTreeIds` fixes that by carrying our STABLE pre-edit ids onto the freshly-
// rendered server tree. It walks the old (local) and new (server) `where` trees together
// and pairs up "the same" node by a structural SIGNATURE (node kind + column/value),
// tolerant to insertions/deletions/reorders — so the SURVIVORS of an edit keep their id
// even when a sibling is added or removed. Paired server ids are rewritten to the local
// id; genuinely-new server nodes get a freshly-minted id that can't collide. Every id is
// rewritten in place across BOTH the structure and the `lines` token stream (they share
// ids). The result: a move slides, a delete leaves the removed chip + slides the rest, an
// add enters the new chip + slides the rest. (#464 EXPLORE "…jarring redraw".)

let genSeq = 0;

// A structural signature used to pair an old node with its new counterpart. Deliberately
// coarse (kind + column, plus the scalar value for leaves) so a node still pairs with
// itself after a sibling is added/removed or the subtree is reordered.
function sig(node) {
  if (!node) return "_";
  switch (node.node) {
    case "vleaf":
      return `vl:${node.value}`;
    case "clause":
      return `cl:${node.column_id || ""}`;
    case "vgroup":
      return `vg:${node.join || ""}:${(node.children || []).length}`;
    case "group":
      return `gp:${node.implicit ? "i" : node.join || ""}`;
    default:
      return `?:${node.node}`;
  }
}

// Greedily pair children of two same-kind container nodes by signature, in order, then
// recurse into each pair. Each old child is consumed at most once. Unpaired new children
// stay null in the result (they're genuinely new → minted later).
function pairChildren(oldKids, newKids, map) {
  const taken = new Array(oldKids.length).fill(false);
  for (const nk of newKids) {
    const s = sig(nk);
    let matched = -1;
    for (let i = 0; i < oldKids.length; i += 1) {
      if (!taken[i] && sig(oldKids[i]) === s) { matched = i; break; }
    }
    if (matched >= 0) { taken[matched] = true; walkPair(oldKids[matched], nk, map); }
  }
}

// Pair two nodes (old↔new) and record new.id -> old.id, then recurse.
function walkPair(oldN, newN, map) {
  if (!oldN || !newN || oldN.node !== newN.node) return;
  if (oldN.id && newN.id) map[newN.id] = oldN.id;
  if (newN.node === "clause") {
    walkPair(oldN.value, newN.value, map);
  } else if (newN.node === "group" || newN.node === "vgroup") {
    pairChildren(oldN.children || [], newN.children || [], map);
  }
}

// Walk the whole server tree; any node id not already paired gets a freshly-minted id
// guaranteed not to collide with a carried-over (local) id or another mint. Mutates `map`.
function mintUnpaired(node, map, used) {
  if (Array.isArray(node)) { for (const n of node) mintUnpaired(n, map, used); return; }
  if (!node || typeof node !== "object") return;
  // Only STRUCTURE nodes carry a `node` discriminator + a real identity to preserve.
  if (typeof node.node === "string" && typeof node.id === "string" && !(node.id in map)) {
    let fresh;
    do { fresh = `g${(genSeq += 1)}`; } while (used.has(fresh));
    used.add(fresh);
    map[node.id] = fresh;
  }
  for (const k in node) if (k !== "id") mintUnpaired(node[k], map, used);
}

// Collect every structure-node id in a tree (the id space we carry FROM / must not reuse).
function collectIds(node, set) {
  if (Array.isArray(node)) { for (const n of node) collectIds(n, set); return; }
  if (!node || typeof node !== "object") return;
  if (typeof node.node === "string" && typeof node.id === "string") set.add(node.id);
  for (const k in node) collectIds(node[k], set);
}

// Rewrite every `id` field (deep) via `map`; ids with no mapping are left untouched
// (e.g. the `works` entity keyword token). Touches structure + the `lines` token stream.
export function rewriteIds(node, map) {
  if (Array.isArray(node)) { for (const n of node) rewriteIds(n, map); return; }
  if (!node || typeof node !== "object") return;
  if (typeof node.id === "string" && map[node.id]) node.id = map[node.id];
  for (const k in node) if (k !== "id") rewriteIds(node[k], map);
}

// Carry localTree's stable ids onto serverTree in place. Always best-effort (never
// throws / never fails): survivors keep their id, new nodes get a fresh non-colliding id.
// Returns true if it ran (both trees present), false if there was nothing to reconcile.
export function reconcileTreeIds(serverTree, localTree) {
  if (!serverTree || !localTree || !serverTree.where || !localTree.where) return false;
  const map = {};
  walkPair(localTree.where, serverTree.where, map); // pair survivors: serverId -> localId
  const used = new Set();
  collectIds(localTree, used);                      // ids we carry over (don't reuse for mints)
  mintUnpaired(serverTree, map, used);              // fresh ids for genuinely-new nodes
  rewriteIds(serverTree, map);                      // structure + `lines` tokens (share ids)
  return true;
}

// Exposed for unit testing.
export { sig, walkPair };
