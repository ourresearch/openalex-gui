// v2 render tree -> inline token stream (oxjob #490).
//
// This is the render-DISPLAY direction: turn the builder's local `v2.where` tree
// into the SAME flat, ordered token stream the server emits as `oql_render_v2.lines`
// (concatenated). The builder then feeds this stream through `layoutLines`
// (builderLayout.js) to derive client-side line breaks. Producing the tokens
// HERE — from the local tree — instead of round-tripping to the server is what
// makes value commits instant + in place (no flash, no per-keystroke render):
// an edit mutates the tree, this recomputes, the chip repaints the same frame.
// (OQLO charter decision 37; #490 EXPLORE "Task 2 SPIKE RESULT".)
//
// It is a faithful port of `_flat_tokens` in elastic-api's
// query_translation/oql_render_v2.py — keep the two in lockstep. The parity test
// (src/__tests__/treeToTokens.parity.test.js) compares this output against
// captured server `lines` for a sweep of queries; if that reference changes,
// change this too.
//
// Node shapes (same as v2ToOqo.js):
//   tree    { entity:{id,text}, where_keyword, where, directives }
//   expr    clause | group
//     clause  { node:"clause", column_id, column, operator, value? , leaf?, segments?, clause_kind? }
//               - factored: has `value` (a value vtree)  -> derived from the tree (always fresh)
//               - simple:   has `leaf` + `segments`       -> rendered from `segments` (server display)
//     group   { node:"group", join, negated?, children:[expr...] }
//   value   vleaf  { node:"vleaf", value, display, negated, entity? }
//           vgroup { node:"vgroup", join, children:[value...] }
//
// SIMPLE-CLAUSE FRESHNESS (the one caveat): a simple clause renders from its
// server-computed `segments`, which go stale after an in-place edit of that
// clause. Value-text/number edits are patched locally (see patchSegmentsForValue
// below) so per-keystroke typing stays instant; structural changes (boolean
// toggle, entity re-pick, column change) refresh `segments` via a background
// sync. Fully deriving boolean phrases / entity names client-side is deliberately
// out of #490 scope (charter d37 "FUTURE").

const _SEG2TOK = {
  column: "col", operator: "op", value: "vbrick", keyword: "kw", id: "id", text: "text",
};

// A value subtree (vleaf | vgroup) -> tokens. Mirrors `fv` in _flat_tokens.
function flatValue(v, toks) {
  if (v.node === "vleaf") {
    // `text` is the canonical stringify (incl. the bare `not ` prefix, decision
    // 23); the client renders `not` as chrome off `negated` and shows `display`.
    const display = v.display != null ? v.display : String(v.value);
    const tok = {
      t: "vbrick", id: v.id, text: v.negated ? `not ${display}` : display,
      display, value: v.value, negated: !!v.negated,
    };
    if (v.entity != null) tok.entity = v.entity;
    toks.push(tok);
    return;
  }
  // decision 32: a value group renders as `any (a, b)` / `all (a, b)` — a
  // groupkw keyword carrying its open paren, comma-separated children, close paren.
  const kw = v.join === "or" ? "any" : "all";
  toks.push({ t: "groupkw", id: v.id, text: `${kw} (`, label: v.join });
  v.children.forEach((c, i) => {
    if (i) toks.push({ t: "comma", id: v.id, text: ", " });
    flatValue(c, toks);
  });
  toks.push({ t: "paren", id: v.id, text: ")" });
}

// One simple clause's display `segments` -> tokens. Verbatim port of the segments
// loop in _flat_tokens (lines 241-283): the server already baked the human display
// (boolean phrase, entity name, comparison glyph, `not` placement) into segment
// text, so we pass it through — no client-side display derivation.
function flatSegments(n, toks) {
  const leaf = n.leaf || {};
  const neg = !!leaf.is_negated;
  const ck = n.clause_kind;
  for (const s of (n.segments || [])) {
    const kind = s.kind;
    const tok = { t: _SEG2TOK[kind] || "text", id: n.id, text: s.text };
    const m = s.meta || {};
    if ("column_id" in m) tok.column_id = m.column_id;
    if ("value" in m) tok.value = m.value;
    // A boolean clause is one human phrase ("it's open access") surfaced as an
    // interactive value brick (a click flips negation -> the opposite phrase).
    if (ck === "boolean" && kind === "keyword") {
      const effective = !!leaf.value !== neg; // value XOR is_negated
      tok.t = "vbrick";
      tok.bool_phrase = true;
      tok.value = leaf.value;
      tok.negated = !effective;
      tok.kind = "boolean";
    }
    // Predicate-level negation is not part of OQL (decision 23): the one render
    // still emitting `is not` is the generic entity/other `is` path. Move the
    // `not` onto the value brick so the builder shows `is` + a negated chip.
    if (kind === "operator" && neg && s.text === " is not ") {
      tok.text = " is ";
    } else if (kind === "value" && neg && (ck === "entity" || ck === "other")) {
      tok.display = s.text;        // bare value, no prefix
      tok.text = `not ${s.text}`;  // keeps the canonical char stream
      tok.negated = true;
    }
    // Let the client trust the server's value KIND (the /properties catalog is
    // keyed by group, so e.g. `domain.id` isn't found there and would fall back
    // to a bare scalar brick; the kind hint makes it an entity chip).
    if (kind === "value" && tok.kind == null) tok.kind = ck;
    toks.push(tok);
  }
}

// An expr node (clause | group) -> tokens. Mirrors `fe` in _flat_tokens.
function flatExpr(n, toks) {
  // A negated group renders as `not <child>` (decision 23, NNF): no parens of its
  // own — the single inner node supplies any it needs.
  if (n.node === "group" && n.negated) {
    toks.push({ t: "kw", id: n.id, text: "not ", label: "not" });
    n.children.forEach((c) => flatExpr(c, toks));
    return;
  }
  if (n.node === "clause") {
    if (n.value == null) { flatSegments(n, toks); return; } // simple clause
    toks.push({ t: "col", id: n.id, text: n.column, column_id: n.column_id });
    toks.push({ t: "op", id: n.id, text: ` ${n.operator} ` });
    flatValue(n.value, toks);
    return;
  }
  // plain group: a keyword group `any (`/`all (` with comma-separated children
  // (decision 32 — every boolean group, incl. the top-level implicit-AND body,
  // wraps in `all (…)`/`any (…)`).
  const kw = n.join === "or" ? "any" : "all";
  toks.push({ t: "groupkw", id: n.id, text: `${kw} (`, label: n.join });
  n.children.forEach((c, i) => {
    if (i) toks.push({ t: "comma", id: n.id, text: ", " });
    flatExpr(c, toks);
  });
  toks.push({ t: "paren", id: n.id, text: ")" });
}

// Public: a v2 tree -> the inline WHERE token stream (entity chrome + `where` +
// the where body). Directives are intentionally EXCLUDED — the builder owns
// sort/select via its own UI refs, not the render tree. The server stamps a string
// `addr` onto each token in `render_v2`; the builder computes addresses separately
// (buildAddrIndex / lineAddr), so we don't emit `addr` here.
export function treeToTokens(tree) {
  if (!tree) return [];
  const toks = [];
  const ent = tree.entity || {};
  toks.push({ t: "kw", id: ent.id, text: ent.text, label: ent.text });
  const where = tree.where;
  if (where != null) {
    toks.push({ t: "kw", text: tree.where_keyword || " where ", label: "where" });
    flatExpr(where, toks);
  }
  return toks;
}
