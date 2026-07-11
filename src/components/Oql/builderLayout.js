// Builder line-layout (oxjob #428; rewritten for the 2D indent model in #523,
// superseding #507's rigid column grid). The no-code builder DIVERGES from the
// server's char-based `format_oql` wrapping: it re-derives every line break
// CLIENT-SIDE from the query's group structure so it can use the *viewport* width
// (flex-wrap) instead of a fixed 80-col text wrap.
//
// THE LAYOUT MODEL (oxjob #575, Jason 2026-07-07 — the two-column TABLE, superseding
// #523's indent model): the two boolean operators still map to the two screen axes —
// AND = rows (down), OR = columns (right) — but every line now splits into a shared
// FIELD cell and a VALUE cell so that AND-siblings align symmetrically:
//
//   FILTER scope (top level): each filter is its OWN row — field chip in the field
//   column, value list in the value column. A newline reads as AND. A FLAT OR-group
//   of filters (`title has foo or keyword is biology`) renders as ONE line whose
//   "either … or" block spans the group's nested mini-table rows — see renderOrRows
//   (the winner of the #575 filter-OR experiment, Jason 2026-07-10; the "arms" and
//   "subclause" candidates were stripped). Deeper mixed shapes stay gated to the
//   OQL tab by representableShape.
//
//   VALUE scope (inside one filter): the value's FIRST OR-group sits in the value
//   cell of the filter's row; each further AND-group gets its OWN row with an EMPTY
//   field cell and its `&` connector at the field|value column boundary — so sibling
//   AND-arms read symmetrically and adding one never reflows the rows above. OR
//   values stay inline in their cell. The ONE allowed extra level — an AND sub-group
//   inside an OR row (`pie or (tart and pastry)`) — is shown inline WITH parens.
//
// Hero shape — `title has ((cancer or tumor) and (therapy or treatment) and (child or
// pediatric))` (product-of-sums, ~46% of real SR queries):
//
//   title has │ cancer or tumor or neoplasm
//           & │ therapy or treatment
//           & │ child or pediatric
//
// Two AND-ed FILTERS (newline = AND; each field in the shared field column):
//
//   title has │ apple or banana
//   & year is │ 2020
//
// We work over the server's `oql_render_v2` token stream (enriched by enrichToken).
// Parens in the stream mark group boundaries (we parse the nesting) and are re-emitted
// ONLY for the one in-column AND sub-group. The representable-shape gate
// (representableShape.js) guarantees the tree never nests deeper than this can show.
// Each output line carries:
//   { key, cols, items, tokens, depth, _indent, _lead, _hasFieldMenu,
//     _fieldToks, _valueToks, _fieldConn }
//   - cols       : always [] now (the #507 structural column grid is gone).
//   - tokens     : the FULL flat content-token list (field/op/value/inline-conn).
//                  Still the source for selection/drag/menu lookups.
//   - _fieldToks : the FIELD-cell tokens (#575 two-column table) — the folded
//                  field(+op) chip run on a filter row; the lone leading `&`
//                  connector on a value-continuation row (rendered right-aligned
//                  at the column boundary, `_fieldConn: true`); [] otherwise.
//   - _valueToks : the VALUE-cell tokens — everything after the field cell.
//                  tokens === [..._fieldToks, ..._valueToks] always.
//   - items      : tokens wrapped as { tok } (kept for template compatibility).
//   - _indent    : 0 for a filter row; 1 for a value-continuation row (a fact about
//                  the row — the old indent CSS is gone; the field column aligns).

const isOpen = (t) => t && t.t === "paren" && (t.text || "").trim() === "(";
const isClose = (t) => t && t.t === "paren" && (t.text || "").trim() === ")";
const isSpace = (t) => t && t.t === "text" && !(t.text || "").trim();
// An item SEPARATOR within a group — the infix `conn` (and/or) connector.
const isSep = (t) => t && t.t === "conn";
// "chrome" = a keyword brick (the entity selector / `where`) or whitespace — a
// token that carries NO clause content.
const isChromeNode = (n) => n && !n.group && (n.tok.t === "kw" || isSpace(n.tok));

// ---- parse the flat token stream into a node tree --------------------------
// node = { tok } | { group: true, open, children: node[], close }
function parseSeq(tokens) {
  let i = 0;
  const walk = () => {
    const nodes = [];
    while (i < tokens.length) {
      const tok = tokens[i];
      if (isOpen(tok)) {
        i += 1; // consume the `(` opener
        const children = walk(); // parse until the matching ) (or end)
        const close = isClose(tokens[i]) ? tokens[i] : null;
        if (close) i += 1; // consume )
        nodes.push({ group: true, open: tok, children, close });
      } else if (isClose(tok)) {
        return nodes; // matching close: stop; the OPENER consumes it
      } else {
        nodes.push({ tok });
        i += 1;
      }
    }
    return nodes;
  };
  return walk();
}

// Split a group's children into OPERANDS at the connector separators. Returns
// { join, operands } where each operand is { nodes, sep } — `sep` is the `conn`
// token that PRECEDED this operand (null for operand 0), used to render its
// column connector cell (it carries the group's id + join label). Pure-space
// nodes are dropped. `join` is the group's connector word (from a conn separator).
function splitOperands(children) {
  const operands = [];
  let cur = null;
  let pendingSep = null;
  let join = null;
  const start = (sep) => { cur = { nodes: [], sep: sep || null }; operands.push(cur); };
  for (const node of children) {
    if (!node.group && isSpace(node.tok)) continue;
    if (!node.group && isSep(node.tok)) {
      if (join == null && node.tok.label) join = node.tok.label;
      pendingSep = node.tok;
      continue;
    }
    if (!cur || pendingSep !== null) { start(pendingSep); pendingSep = null; }
    cur.nodes.push(node);
  }
  return { join: join || "and", operands };
}

// Builder for an inline connector token (`or` / `&`). `opIndex` is the index of the
// operand this connector PRECEDES within its group (1..n-1) — it lets connector-as-unit
// editing flip exactly THIS connector and let precedence restructure the group (oxjob
// #507 Phase 3, v2Edit.flipConnector). `level` is "filter" (joins whole filters → GRAY)
// or "value" (joins values inside one field → BLUE + bold), driving colour only. A
// value-continuation row's LEADING `&` is also a connCell (its first content token).
const connCell = (sepTok, join, groupId, opIndex, level = "filter") => ({
  t: "conn",
  id: (sepTok && sepTok.id != null) ? sepTok.id : groupId,
  text: ` ${(sepTok && sepTok.label) || join} `,
  label: (sepTok && sepTok.label) || join,
  _opIndex: opIndex,
  _level: level,
});

// A group is "value-level" when it joins/heads VALUES (no clause/`col` token anywhere in its
// subtree) — i.e. one field's value bag. The implicit root and any clause-group carry `col`
// tokens → filter-level. Drives the value-vs-filter colour split (gray filter conns, blue value).
const hasColTok = (nd) => nd.group ? nd.children.some(hasColTok) : (nd.tok && nd.tok.t === "col");
const isValueLevel = (groupNode) => !groupNode.children.some(hasColTok);
// A clause-group joins/heads whole FILTERS (an operand carries a `col`) — i.e. filter-scope OR.
const isClauseGroup = (groupNode) => groupNode.children.some(hasColTok);

// Serialize a node subtree to the TEXT-BLOCK form (oxjob #523 round 2): a parenthesized,
// `and`/`or`/`not`-joined string with each language feature (parens, the connectors, `not`)
// flagged `op:true` so the chip can BOLD it. Returns `[{ text, op }]` parts whose
// concatenation is the editable raw text (`(nicotine and vaping)`) — #575 round 4: the
// display glyph is the WORD "and" (no more `&`); valueExpr still parses a typed `&` back.
function serializeBlock(nd, parts) {
  if (nd.group) {
    const { join, operands } = splitOperands(nd.children);
    parts.push({ text: "(", op: true });
    operands.forEach((op, i) => {
      if (i) parts.push({ text: ` ${join} `, op: true });
      op.nodes.forEach((c) => serializeBlock(c, parts));
    });
    parts.push({ text: ")", op: true });
    return;
  }
  if (isSpace(nd.tok)) return;
  const tk = nd.tok;
  if (tk.t === "conn") { parts.push({ text: ` ${tk.label} `, op: true }); return; }
  if (tk.t === "paren") { parts.push({ text: (tk.text || "").trim(), op: true }); return; }
  if (tk.negated) parts.push({ text: "not ", op: true });
  const disp = tk.display != null ? tk.display : (tk.value != null ? String(tk.value) : (tk.text || ""));
  parts.push({ text: disp, op: false });
}

// Build a single `textblock` token for an in-column AND sub-group (`(tart and pastry)`,
// possibly deeper). `gid` is the value GROUP's id → the chip's raw-text edit replaces that
// vgroup's whole subtree (v2Edit.setValueExpr). (oxjob #523 round 2.)
function textBlockToken(groupNode, gid) {
  const parts = [];
  serializeBlock(groupNode, parts);
  const text = parts.map((p) => p.text).join("").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
  return { t: "textblock", id: gid, _vgroupId: gid, _level: "value", _parts: parts, text };
}

// An empty (being-added / pending) value brick — a value box awaiting input. Excludes the entity
// placeholder (which has its own chip + picker). Used to keep a mid-edit AND sub-group EXPANDED,
// and by the builder's enrichToken placeholder check — the ONE spelling of the #554 predicate.
// Empty = a transient blank box (`value: ""`). A `value: null` brick with display
// text is the NULL SENTINEL (`unknown`, #554) — a real chip, not an empty box.
export const isEmptyVbrick = (t) => t && t.t === "vbrick" && !t._placeholder
  && (t.value === "" || (t.value == null && !(t.display || t.text || "").trim()));
// Does a node subtree contain an empty value brick? (#523 Phase 4 — the draft-conjunction merge
// leaves an editable empty inside a freshly-formed AND sub-group.)
const hasEmptyValue = (nd) => nd.group ? nd.children.some(hasEmptyValue) : isEmptyVbrick(nd.tok);
// The id of a value box currently being EDITED (pendingScalar), set per layoutLines call. An AND
// sub-group containing it stays EXPANDED even after the box gets text — so typing doesn't collapse
// the group to a text block mid-keystroke (it re-collapses on commit/blur, when this clears).
let _editingId = null;
const hasIdInSubtree = (nd, id) => id == null ? false
  : (nd.group ? nd.children.some((c) => hasIdInSubtree(c, id)) : (nd.tok && nd.tok.id === id));

// #523 round 8 (Jason): the 2D indent model deliberately STRIPS the parens OQL writes
// (it replaces them with rows + indent). To TEACH the query's grouping/precedence, we put
// those parens BACK — but NOT as their own chips. Instead we stamp decoration COUNTS onto
// the FIRST and LAST content token of each genuine paren-group: `_pOpen` / `_pClose` are
// integer depths (so nested groups stack, e.g. `((a or b) and c)`), rendered as bold glyphs
// glued to that chip's edge. They are pure visual scaffolding — never editable, and the
// template hides them on a chip that's mid-edit (parenHidden). We mark ONLY real paren-groups
// (the opener is an actual `(` token): the SYNTHETIC root group's opener is a
// bare `{id}` (no `.t`) so it stays bare, matching OQL's bare top level; and the row-spanning
// outer value-AND is never inlined here (renderFilter splits it into rows itself; each
// per-row OR-group gets its own parens here, and renderFilter stamps the wrapper's own
// parens across the rows — open on the first row's first value chip, close on the last
// row's last chip, #575 round 7).
// Clones the edge tokens so a shared stream token is never mutated.
function markParens(out, groupNode) {
  const open = groupNode && groupNode.open;
  const isRealOpener = open && open.t === "paren";
  if (!isRealOpener || !out.length) return out;
  if (out.length === 1) {
    out[0] = { ...out[0], _pOpen: (out[0]._pOpen || 0) + 1, _pClose: (out[0]._pClose || 0) + 1 };
    return out;
  }
  out[0] = { ...out[0], _pOpen: (out[0]._pOpen || 0) + 1 };
  const li = out.length - 1;
  out[li] = { ...out[li], _pClose: (out[li]._pClose || 0) + 1 };
  return out;
}

// Inline a group to a content-token run (oxjob #523 indent model). OR operands are joined by
// `or`. An in-column AND sub-group (`pie or (tart and pastry)`, now allowed to nest arbitrarily
// deep — #523 round 2) collapses to ONE bold TEXT-BLOCK chip — the builder's escape hatch for
// value sub-expressions the column grid can't draw (it serializes the whole subtree to editable
// text). A single-operand group is transparent. Recurses for nested OR sub-groups.
function inlineGroup(groupNode) {
  const { join, operands } = splitOperands(groupNode.children);
  const gid = groupNode.open && groupNode.open.id;
  const level = isValueLevel(groupNode) ? "value" : "filter";
  // An AND sub-group (>1 operands) → one text-block chip. Only reached at VALUE scope: the
  // top-level filter AND becomes rows (renderFilter) and filter-scope groups are OR, so a
  // `paren`-worthy AND here is always an in-column value sub-group.
  if (join === "and" && operands.length > 1) {
    // EXCEPTION (#523 Phase 4): while it still holds an EMPTY value, OR a value box inside it is
    // being edited (the draft-conjunction merge), render the sub-group EXPANDED — `( banana & [__] )`
    // — so that box stays editable through typing. Once committed (box blurs), the next render
    // canonicalizes it back to a single text block.
    if (!hasEmptyValue(groupNode) && !hasIdInSubtree(groupNode, _editingId))
      return [textBlockToken(groupNode, gid)];
    const out = [];
    if (groupNode.open) out.push(groupNode.open);          // the `(` paren chip
    operands.forEach((op, i) => {
      if (i) out.push(connCell(op.sep, join, gid, i, level)); // a flippable `&` between operands
      out.push(...inlineNodes(op.nodes));
    });
    if (groupNode.close) out.push(groupNode.close);        // the `)` paren chip
    return out;
  }
  const out = [];
  operands.forEach((op, i) => {
    if (i) out.push(connCell(op.sep, join, gid, i, level));
    out.push(...inlineNodes(op.nodes));
    // (#575: the `addplus` chip that used to follow a non-terminal filter in an
    // OR-of-filters row is gone — filter-scope OR is no longer representable in the
    // two-column table (representableShape gates it to the OQL tab); this inline path
    // survives only as a defensive fallback for transient states.)
  });
  // Re-attach this group's OQL parens as edge decorations (a genuine multi-operand paren
  // group only — a single transparent operand draws none). (#523 round 8)
  if (operands.length > 1) markParens(out, groupNode);
  return out;
}
// Inline a run of nodes (lead tokens + any sub-groups) to content tokens.
function inlineNodes(nodes) {
  const out = [];
  for (const nd of nodes) {
    if (nd.group) out.push(...inlineGroup(nd));
    else if (!isSpace(nd.tok)) out.push(nd.tok);
  }
  return out;
}

// ---- public entry ----------------------------------------------------------
// Turn a flat enriched token stream (the whole WHERE) into display lines (oxjob #523
// indent model — replaces #507's rigid column grid). See the file header for the line
// shape. Two axes, two scopes:
//   FILTER scope (top level): each filter is its own row, flush-left, NO connector and
//     NO indent (a newline reads as AND). OR-ed filters (rare) SHARE one row, joined by
//     `or`. Filters never indent.
//   VALUE scope (inside one filter): field+op plus the value's FIRST OR-group sit inline
//     on row 1; each further AND-group drops to its own row with a small indent + a
//     leading `&`. OR values stay inline; the one paren level shows parens inline.
// A value block's parens belong INSIDE the value chips — `[open access is][(true)]`, never
// `[open access is] ( [true] )` (oxjob #560 Phase 2, Jason QA 2026-07-05). GROUP parens already
// render that way (markParens → `_pOpen`/`_pClose` → the chips' faded `.val-paren` glyphs), but
// a SIMPLE clause's value parens arrive as literal `(` / `)` TEXT segments the server bakes
// around the value (and treeToTokens emits the same inert text parens around a bare-vleaf
// value, #554) — so they rendered as separate text outside the chip. Absorb them: an exact
// `(` text token immediately before a value brick stamps `_pOpen` on it, an exact `)` text
// token immediately after one stamps `_pClose`; the text token disappears. Anything else
// (unpaired parens, other text) passes through untouched.
export function absorbValueParens(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const txt = t && t.t === "text" ? (t.text || "").trim() : null;
    if (txt === "(" && tokens[i + 1] && tokens[i + 1].t === "vbrick") {
      tokens = tokens.slice(); // don't mutate the caller's array
      tokens[i + 1] = { ...tokens[i + 1], _pOpen: (tokens[i + 1]._pOpen || 0) + 1 };
      continue;
    }
    if (txt === ")" && out.length && out[out.length - 1].t === "vbrick") {
      out[out.length - 1] = { ...out[out.length - 1], _pClose: (out[out.length - 1]._pClose || 0) + 1 };
      continue;
    }
    out.push(t);
  }
  return out;
}

// Split one line's flat content tokens into the two table cells (#575). Returns
// { fieldToks, valueToks, fieldConn }:
//   - a FILTER row (leads with its folded field(+op) chip): fieldToks = that leading
//     col/op run, valueToks = the rest.
//   - a VALUE-CONTINUATION row (leads with its `&` connector, no col): fieldToks =
//     [that conn] with fieldConn:true — the template right-aligns it at the
//     field|value column boundary so sibling AND-arms' values align.
//   - anything else (defensive: a filter-scope-OR line — gated to the OQL tab by
//     representableShape, but never crash on one — or a chrome-ish line): everything
//     stays in the value cell.
// Also used by OqlQueryBuilder.draftLine so draft rows get a field cell like any filter.
export function splitLineCells(tokens) {
  const toks = tokens || [];
  let i = 0;
  while (i < toks.length && (toks[i].t === "col" || toks[i].t === "op")) i += 1;
  // a genuine single-filter row: one leading field(+op) run, no second col later
  if (i > 0 && !toks.slice(i).some((t) => t.t === "col")) {
    const fieldToks = toks.slice(0, i);
    // The folded predicate ("has" / "is" / "≥", foldPredicates → col._predicate) renders in
    // the connector SLOT chip between the field and its values (#575 round 4) — not inside
    // the field chip. Null when the clause has none (bare row-subject chips like `cites`).
    const predTok = fieldToks.find((t) => t.t === "col" && t._predicate);
    return { fieldToks, valueToks: toks.slice(i), fieldConn: false,
      slotPred: predTok ? predTok._predicate : null };
  }
  if (i === 0 && toks.length && toks[0].t === "conn")
    return { fieldToks: [toks[0]], valueToks: toks.slice(1), fieldConn: true, slotPred: null };
  return { fieldToks: [], valueToks: toks, fieldConn: false, slotPred: null };
}

export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  _editingId = opts.editingId || null; // keep a mid-edit AND sub-group expanded (#523 Phase 4)
  let n = 0;

  // A line: { cols:[], content:[tok], _indent }. `cols` stays empty (the #507 column
  // grid is gone); `_indent` (0|1) is the small left pad for a value-continuation row.
  const line = (content, indent = 0) => ({ cols: [], content, _indent: indent });

  // ---- filter-scope OR → the "either … or" group line (#575, Jason 2026-07-10) ----
  // `title has (foo) or keyword is (biology)` — the whole flat OR-group is ONE spine
  // line (the winner of the filter-OR experiment; the "arms"/"subclause" candidates and
  // their toolbar toggle were stripped 2026-07-10). Each disjunct renders as a sub-row
  // led by a field-column-width conn chip ("either" / "or" — the template derives the
  // word from `_orJoin`), and the disjuncts form a nested MINI-TABLE: their own shared
  // field column (right-aligned labels), predicate slot, and value edge — a recursive
  // copy of the outer table on its OWN grid (deliberately out of sync with the outer
  // slot/value columns). Emitted as one line with `_orRows` (per-disjunct {key,
  // fieldToks, valueToks, slotPred, tokens} cells) + `_orJoin` + `_gfieldCh`/`_gpredCh`
  // (the group's mini-column widths in ch, the fieldColW trick).
  const renderOrRows = (groupNode) => {
    const { join, operands } = splitOperands(groupNode.children);
    // Split each disjunct into mini-table cells (same shape splitLineCells gives an
    // outer filter row). Value parens are absorbed per row HERE (finalize's absorb
    // runs on the flat concat and wouldn't see the row boundaries).
    // Each row carries `_connWord` for its conn-chip column: "either" on the group's
    // first row, the join word on each further DISJUNCT head row, null (a transparent
    // spacer) on a value-continuation row.
    //
    // #595 round 7 (Jason: "duplicate the entire table approach, but in miniature"):
    // a disjunct whose VALUE is an AND of OR-groups no longer collapses to a text-block
    // chip — it splits into SUB-ROWS exactly like the outer table's renderFilter does
    // one level up: field + first OR-group on the disjunct's head row, each further
    // AND-arm on its own row with the `and` conn chip in the mini predicate slot
    // (`_connTok`) and an empty field cell. The wrapper vgroup's parens span the arm
    // rows (open glued to the first row's first value chip, close to the last row's
    // last chip — the outer #575 round-7 recipe).
    const rows = [];
    const splitCells = (toks) => {
      let j = 0;
      while (j < toks.length && (toks[j].t === "col" || toks[j].t === "op")) j += 1;
      const fieldToks = toks.slice(0, j);
      const predTok = fieldToks.find((t) => t.t === "col" && t._predicate);
      return { fieldToks, valueToks: toks.slice(j), slotPred: predTok ? predTok._predicate : null };
    };
    operands.forEach((op, di) => {
      const headWord = di === 0 ? "either" : (join || "or");
      const sub = op.nodes.find((nd) => nd.group);
      const lead = op.nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
      let vsplit = null;
      if (sub && lead.length && isValueLevel(sub)) {
        const v = splitOperands(sub.children);
        if (v.join === "and" && v.operands.length > 1) vsplit = v;
      }
      if (!vsplit) {
        const toks = absorbValueParens(inlineNodes(op.nodes));
        const cells = splitCells(toks);
        const keyTok = toks.find((t) => t.id != null);
        rows.push({ key: keyTok ? `gr:${keyTok.id}` : null, ...cells, tokens: toks,
          _connWord: headWord });
        return;
      }
      // multi-row disjunct: head row + one row per further AND-arm
      const gid = sub.open && sub.open.id;
      const headToks = absorbValueParens([...lead, ...inlineNodes(vsplit.operands[0].nodes)]);
      const cells = splitCells(headToks);
      const keyTok = headToks.find((t) => t.id != null);
      const keyBase = keyTok ? `gr:${keyTok.id}` : `gr:d${di}`;
      const armRows = [{ key: keyBase, ...cells, tokens: headToks, _connWord: headWord }];
      for (let i = 1; i < vsplit.operands.length; i++) {
        const conn = connCell(vsplit.operands[i].sep, vsplit.join, gid, i, "filter");
        const valueToks = absorbValueParens(inlineNodes(vsplit.operands[i].nodes));
        armRows.push({ key: `${keyBase}:a${i}`, fieldToks: [], valueToks, slotPred: null,
          tokens: [conn, ...valueToks], _connTok: conn, _connWord: null });
      }
      if (sub.open && sub.open.t === "paren") {
        const fv = armRows[0].valueToks;
        if (fv.length) fv[0] = { ...fv[0], _pOpen: (fv[0]._pOpen || 0) + 1 };
        const lastR = armRows[armRows.length - 1];
        const lv = lastR.valueToks, li = lv.length - 1;
        if (li >= 0) lv[li] = { ...lv[li], _pClose: (lv[li]._pClose || 0) + 1 };
        // re-sync each row's flat token list with the cloned edge chips
        armRows[0].tokens = [...armRows[0].fieldToks, ...armRows[0].valueToks];
        lastR.tokens = lastR._connTok ? [lastR._connTok, ...lv] : [...lastR.fieldToks, ...lv];
      }
      rows.push(...armRows);
    });
    const ln = line(rows.flatMap((r) => r.tokens));
    ln._orRows = rows;
    ln._orJoin = join;
    ln._valueOnly = true; // the outer field cell stays empty; the block renders beside it
    let fw = 0, pw = 2;
    for (const r of rows) {
      let w = 0;
      for (const t of r.fieldToks) w += (((t._label || t.text || "").trim()) || "select field").length;
      fw = Math.max(fw, w);
      if (r.slotPred) pw = Math.max(pw, String(r.slotPred).trim().length);
      if (r._connTok) pw = Math.max(pw, ((r._connTok.label || "and").trim() || "and").length);
    }
    ln._gfieldCh = Math.min(fw, 36);
    ln._gpredCh = Math.min(pw, 14);
    // No wrapper-paren stamping: the spanning block IS the grouping mark.
    return [ln];
  };

  // Render ONE top-level filter operand → its line(s). The operand is either a single
  // filter (lead [col, op] + a value group) or an OR-group of whole filters (→ one
  // inline row, `A or B`).
  const renderFilter = (nodes) => {
    const groupNode = nodes.find((nd) => nd.group);
    const lead = nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
    // filter-scope OR among whole clauses (no own lead) → the "either … or" group line
    // (renderOrRows). A non-OR / single-operand clause-group keeps the old defensive
    // single-row inline (representableShape kicks those shapes to the OQL tab anyway).
    if (groupNode && !lead.length && isClauseGroup(groupNode)) {
      const { join, operands } = splitOperands(groupNode.children);
      if (join === "or" && operands.length > 1) return renderOrRows(groupNode);
      return [line(inlineGroup(groupNode))];
    }
    let out;
    if (!groupNode) {
      out = [line(lead)]; // simple/atomic clause (year is 2020)
    } else {
      const { join, operands } = splitOperands(groupNode.children);
      // value = AND of OR-groups → field+op + first OR-group inline, each further AND
      // operand on its own indented `& …` row. (AND = rows.) Otherwise (OR / single
      // value) the whole value inlines on the field's line. (OR = columns.)
      if (join === "and" && operands.length > 1) {
        const gid = groupNode.open && groupNode.open.id;
        out = [line([...lead, ...inlineNodes(operands[0].nodes)])];
        for (let i = 1; i < operands.length; i++) {
          // The row-LEADING `&` renders filter-level (PEACH) — an AND value row reads as
          // "the filter repeated, joined by AND" (#575 round 2, Jason). Colour only: the
          // flip address (id + _opIndex) still targets the value-AND group. Conns INSIDE
          // a row (the `or`s / in-column `&`s) stay value-level periwinkle.
          out.push(line([connCell(operands[i].sep, join, gid, i, "filter"), ...inlineNodes(operands[i].nodes)], 1));
        }
        // The wrapper group's OWN parens span the rows (#575 round 7, Jason): `(` glued to
        // the first row's first value chip, `)` to the last row's last chip — `(England` /
        // `not "new england")`. The table's shared value column makes the row-spanning
        // wrapper drawable after all (it was omitted as "undrawable" under the #523 indent
        // model). Same clone-don't-mutate contract as markParens.
        if (groupNode.open && groupNode.open.t === "paren") {
          const first = out[0].content, fi = lead.length;
          if (first[fi]) first[fi] = { ...first[fi], _pOpen: (first[fi]._pOpen || 0) + 1 };
          const last = out[out.length - 1].content, li = last.length - 1;
          if (last[li]) last[li] = { ...last[li], _pClose: (last[li]._pClose || 0) + 1 };
        }
      } else {
        out = [line([...lead, ...inlineGroup(groupNode)])];
      }
    }
    // The bottom-edge "add row" furniture line was removed in #523 round 4 (Jason: the blank line
    // imposed ugly vertical space). Adding a value-AND row / a new filter now lives in the per-line
    // end-of-line dropdown menu (`.line-menu` in OqlQueryBuilder.vue) instead.
    return out;
  };

  // A line key derived from the STABLE node id of the line's anchor content token,
  // so a line keeps its identity across edits (a moved/added/removed row re-renders
  // at a new POSITION but the same key) — which lets the row list slide rather than
  // teardown/rebuild (oxjob #475). Group/clause/value ids drive it; falls back to a
  // positional key when no token has an id (unit-test fixtures).
  const lineKeyFor = (flat) => {
    const col = flat.find((t) => t.t === "col" && t.id);
    if (col) return `cl:${col.id}`;
    const vb = flat.find((t) => t.t === "vbrick" && t.id);
    if (vb) return `vb:${vb.id}`;
    const any = flat.find((t) => t.id != null);
    return any ? `x:${any.id}` : null;
  };

  // Finalize a {cols, content, _indent} line into the public line shape.
  const finalize = (ln) => {
    const tokens = absorbValueParens(ln.content);
    // #575: a `_valueOnly` line (the "either … or" group line) keeps its content out
    // of the field cell — the spanning block renders there instead.
    const cells = ln._valueOnly
      ? { fieldToks: [], valueToks: tokens, fieldConn: false, slotPred: null }
      : splitLineCells(tokens); // #575: the two table cells
    const out = {
      key: lineKeyFor(tokens) || `${base}_${n}`,
      cols: ln.cols,           // always [] now (the #507 column grid is gone)
      depth: ln.cols.length,
      _indent: ln._indent || 0, // 0 = filter row; 1 = value-continuation row
      // Filter-scope leading chip (#523 round 2): "arrow" (→) on the first filter row, "and"
      // (a pale-peach `&`) on each subsequent filter row; null on value-continuation rows.
      _lead: ln._lead || null,
      items: tokens.map((tok) => ({ tok })),
      tokens,
      _fieldToks: cells.fieldToks,
      _valueToks: cells.valueToks,
      _fieldConn: cells.fieldConn,
      _slotPred: cells.slotPred || null,
      // #575: the "either … or" group line's nested mini-table rows + its mini-column
      // widths (null/absent on ordinary lines).
      _orRows: ln._orRows || null,
      _orJoin: ln._orJoin || null,
      _gfieldCh: ln._gfieldCh || 0,
      _gpredCh: ln._gpredCh || 0,
      _hasFieldMenu: false,
    };
    n += 1;
    return out;
  };

  const nodes = parseSeq(tokens);
  // Discard the leading entity chrome (`works`, `where`): the subject-entity selector
  // lives in the toolbar now, so the canvas is a pure list of filters.
  while (nodes.length && isChromeNode(nodes[0])) nodes.shift();
  if (!nodes.length) return [];

  // The body is the implicit top-level FILTER list. Split it into filter operands.
  const rootOpen = opts.rootId != null ? { id: opts.rootId } : null;
  const { join: rootJoin, operands: filters } = splitOperands(nodes);
  let bodyLines;
  if (rootJoin === "or" && filters.length > 1) {
    // filter-scope OR at the top → the "either … or" group line (renderOrRows). The
    // group line leads with the `the` chip like any first filter.
    bodyLines = renderOrRows({ group: true, open: rootOpen, children: nodes, close: null });
    if (bodyLines.length) bodyLines[0]._lead = "arrow";
  } else {
    // AND-ed (or single) filters → each filter its own row(s). The FIRST row of each filter
    // leads with a filter-scope conjunction chip: the `→` arrow on the very first filter, a
    // pale-peach `&` on each subsequent one (#523 round 2). Value-continuation rows get none.
    bodyLines = [];
    filters.forEach((f, fi) => {
      const fl = renderFilter(f.nodes);
      if (fl.length) fl[0]._lead = fi === 0 ? "arrow" : "and";
      bodyLines.push(...fl);
    });
  }
  return bodyLines.map(finalize);
}
