// Id-preserving reconciliation for the OQL builder's smooth drag-and-drop (oxjob #475).
//
// The builder has a DUAL representation of the query: `v2Edit` mutates the STRUCTURAL
// tree (`where` → clause/group/vgroup/vleaf, which drives the OQO sent to the server),
// while `displayLines` renders from the server's precomputed `tree.lines` flat token
// stream. They're kept in sync by reseeding `v2` from each server render — but the
// server RENUMBERS every node id on every render, so a naive reseed tears down and
// rebuilds the whole chip DOM (no stable identity → jarring flicker, no animation).
//
// `reconcileTreeIds` lets a structural edit (a move/reorder) adopt the server's
// authoritative render WITHOUT losing chip identity: it walks the freshly-rendered
// SERVER tree against the pre-edit LOCAL tree in lockstep, and if they're isomorphic
// (true for a pure reorder, where the server preserves order) rewrites EVERY id in the
// server tree — structure AND the `lines` token stream, which share ids — back to the
// matching local id. Returns true (server tree mutated in place) on success, false if
// the shapes diverge (the caller then does a plain reseed and accepts a flicker for
// that edit). Two passes — build the map purely first, only rewrite if FULLY isomorphic
// — so a partial match never leaves the tree half-remapped. When fully isomorphic every
// server id is mapped to a distinct local id, so the rewrite can't introduce duplicates.

// Walk two nodes in structural lockstep, recording serverId -> localId in `map`.
// Returns false the moment the shapes diverge (different node kind, different child count).
export function buildIdMap(s, l, map) {
  if (!s && !l) return true;
  if (!s || !l || s.node !== l.node) return false;
  if (s.id && l.id) map[s.id] = l.id;
  if (s.node === "clause") return buildIdMap(s.value, l.value, map);
  if (s.node === "group" || s.node === "vgroup") {
    const sc = s.children || [];
    const lc = l.children || [];
    if (sc.length !== lc.length) return false;
    for (let i = 0; i < sc.length; i += 1) {
      if (!buildIdMap(sc[i], lc[i], map)) return false;
    }
    return true;
  }
  return true; // vleaf / leaf — id already mapped, nothing nested
}

// Rewrite every `id` field anywhere in `node` (deep) via `map`. Ids with no mapping are
// left as-is. Touches both the structure and the `lines` token stream (they share ids).
export function rewriteIds(node, map) {
  if (Array.isArray(node)) {
    for (const n of node) rewriteIds(n, map);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (typeof node.id === "string" && map[node.id]) node.id = map[node.id];
  for (const k in node) {
    if (k !== "id") rewriteIds(node[k], map);
  }
}

// Try to remap `serverTree`'s ids onto `localTree`'s ids in place. Returns true if the
// two `where` subtrees are isomorphic (and the rewrite was applied), false otherwise.
export function reconcileTreeIds(serverTree, localTree) {
  if (!serverTree || !localTree || !serverTree.where || !localTree.where) return false;
  const map = {};
  if (!buildIdMap(serverTree.where, localTree.where, map)) return false;
  rewriteIds(serverTree, map);
  return true;
}
