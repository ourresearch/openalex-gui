// Builder line-layout V2 — the "advanced v2" experiment (Jason, 2026-07-11; sibling
// of builderLayout.js, which stays untouched for the side-by-side comparison).
//
// THE V2 LAYOUT MODEL — the OUTLINE model:
//   • The first level of numbering is ALWAYS the top-level AND tree: each top-level
//     filter (or subclause group) is line 1, 2, 3 … A root-level OR renders as ONE
//     top-level item (an "either" group) — a single child of the implicit AND.
//   • Any clause/group with >1 SUBCLAUSES puts each subclause on its OWN line, one
//     indent level deeper, numbered decimally under the parent (1.1, 1.2, 2.1.1 …):
//       – a clause whose value is an AND of groups → a header line holding just the
//         field+predicate, then one line per AND-arm;
//       – an OR-group of whole filters → a header line holding just the "either"
//         chip, then one line per disjunct (recursing for arbitrary depth).
//   • An OR chain of simple values stays INLINE on one line ("title has foo or bar").
//   • The FIRST subclause line of any group leads with a BLANK chip (the head-word
//     chip is gone — Jason 2026-07-11); each further line leads with its join word
//     ("and" / "or"). Lead chips are template chrome, not tokens.
//   • Paren decorations (_pOpen/_pClose) are STRIPPED — the outline (indent +
//     decimal numbers) is the grouping mark now.
//
// Line shape adds to the V1 contract:
//   _level      indent depth (0 = top-level AND item)
//   _lead       null | 'arrow' | 'and' | 'or' | 'blank'
//   _leadScope  'filter' | 'value' — colours the lead chip (peach vs periwinkle)
//   _head       'either' | 'all of' | null — the group-header chip (renders in
//               place of the field cell)
//   _noField    true = render no field cell at all (value-arm lines, header lines)
//   _fieldCh/_predCh  per-sibling-group shared mini column widths (ch), 0 = inherit
//               the global --field-w/--pred-w
//   _disjunctDel  clause id for the per-disjunct trash (deletes ONE alternative)
//   _armDel     value-node id for a value-ARM line's trash (round 8 — deletes ONE
//               AND-ed arm; the render round-trip dissolves a 1-arm AND)
//   _tail       'filter' | null — a group HEADER line ends with a TURN-marker chip
//               showing the AND-flow turning 90° down into the subclause lines.
//               Round 6 (Jason): the marker is chip SHAPE, not ink — a blank chip
//               whose top-right corner is maximally rounded (no more SVG elbow).
//   _slotTail   true on a value-AND HEADER line: the header's predicate chip
//               doubles as the turn marker (top-right corner max-rounded, round 9 —
//               the round-5 word swap is undone; first subclause lines lead with a
//               blank chip again).
//
// Everything below the layoutLines rewrite is carried over from builderLayout.js.

const isOpen = (t) => t && t.t === "paren" && (t.text || "").trim() === "(";
const isClose = (t) => t && t.t === "paren" && (t.text || "").trim() === ")";
const isSpace = (t) => t && t.t === "text" && !(t.text || "").trim();
const isSep = (t) => t && t.t === "conn";
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
        i += 1;
        const children = walk();
        const close = isClose(tokens[i]) ? tokens[i] : null;
        if (close) i += 1;
        nodes.push({ group: true, open: tok, children, close });
      } else if (isClose(tok)) {
        return nodes;
      } else {
        nodes.push({ tok });
        i += 1;
      }
    }
    return nodes;
  };
  return walk();
}

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

const connCell = (sepTok, join, groupId, opIndex, level = "filter") => ({
  t: "conn",
  id: (sepTok && sepTok.id != null) ? sepTok.id : groupId,
  text: ` ${(sepTok && sepTok.label) || join} `,
  label: (sepTok && sepTok.label) || join,
  _opIndex: opIndex,
  _level: level,
});

const hasColTok = (nd) => nd.group ? nd.children.some(hasColTok) : (nd.tok && nd.tok.t === "col");
const isValueLevel = (groupNode) => !groupNode.children.some(hasColTok);
const isClauseGroup = (groupNode) => groupNode.children.some(hasColTok);

// TEXT-BLOCK serialization (unchanged from V1) — the escape hatch for value
// sub-expressions deeper than the outline draws inline.
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

function textBlockToken(groupNode, gid) {
  const parts = [];
  serializeBlock(groupNode, parts);
  const text = parts.map((p) => p.text).join("").replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();
  // _keepParens (V2, #603 round 9): the DISPLAY must keep the ( ) parts — V1's
  // OqlTextBlockChip drops bare parens (#575 r8), which here flattened
  // `((a or b) and (c or d))` into an and/or run that READS as a different query
  // (Jason: "losing load-bearing parens"). Token-gated so V1 keeps its behavior.
  return { t: "textblock", id: gid, _vgroupId: gid, _level: "value", _parts: parts, text, _keepParens: true };
}

export const isEmptyVbrick = (t) => t && t.t === "vbrick" && !t._placeholder
  && (t.value === "" || (t.value == null && !(t.display || t.text || "").trim()));
const hasEmptyValue = (nd) => nd.group ? nd.children.some(hasEmptyValue) : isEmptyVbrick(nd.tok);
let _editingId = null;
const hasIdInSubtree = (nd, id) => id == null ? false
  : (nd.group ? nd.children.some((c) => hasIdInSubtree(c, id)) : (nd.tok && nd.tok.id === id));

// Inline a group to a content-token run. Same as V1's inlineGroup, EXCEPT no paren
// decoration stamping (markParens is gone in V2 — the outline is the grouping mark).
function inlineGroup(groupNode) {
  const { join, operands } = splitOperands(groupNode.children);
  const gid = groupNode.open && groupNode.open.id;
  const level = isValueLevel(groupNode) ? "value" : "filter";
  if (join === "and" && operands.length > 1) {
    if (!hasEmptyValue(groupNode) && !hasIdInSubtree(groupNode, _editingId))
      return [textBlockToken(groupNode, gid)];
    const out = [];
    if (groupNode.open) out.push(groupNode.open);
    operands.forEach((op, i) => {
      if (i) out.push(connCell(op.sep, join, gid, i, level));
      out.push(...inlineNodes(op.nodes));
    });
    if (groupNode.close) out.push(groupNode.close);
    return out;
  }
  const out = [];
  operands.forEach((op, i) => {
    if (i) out.push(connCell(op.sep, join, gid, i, level));
    out.push(...inlineNodes(op.nodes));
  });
  return out;
}
function inlineNodes(nodes) {
  const out = [];
  for (const nd of nodes) {
    if (nd.group) out.push(...inlineGroup(nd));
    else if (!isSpace(nd.tok)) out.push(nd.tok);
  }
  return out;
}

// Absorb the server's literal `(`/`)` text parens into the neighbouring value brick
// (V1 recipe) — V2 then STRIPS the decoration counts, so the absorb just deletes them.
export function absorbValueParens(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const txt = t && t.t === "text" ? (t.text || "").trim() : null;
    if (txt === "(" && tokens[i + 1] && tokens[i + 1].t === "vbrick") continue;
    if (txt === ")" && out.length && out[out.length - 1].t === "vbrick") continue;
    out.push(t);
  }
  return out;
}

// Strip paren decorations a shared token may carry from a V1 render (clone, never mutate).
const stripParenDecor = (toks) => (toks || []).map((t) =>
  (t && (t._pOpen || t._pClose)) ? { ...t, _pOpen: 0, _pClose: 0 } : t);

// Split one line's flat content tokens into the two table cells (V1 contract kept —
// OqlQueryBuilderV2.draftLine uses it too).
export function splitLineCells(tokens) {
  const toks = tokens || [];
  let i = 0;
  while (i < toks.length && (toks[i].t === "col" || toks[i].t === "op")) i += 1;
  if (i > 0 && !toks.slice(i).some((t) => t.t === "col")) {
    const fieldToks = toks.slice(0, i);
    const predTok = fieldToks.find((t) => t.t === "col" && t._predicate);
    return { fieldToks, valueToks: toks.slice(i), fieldConn: false,
      slotPred: predTok ? predTok._predicate : null };
  }
  if (i === 0 && toks.length && toks[0].t === "conn")
    return { fieldToks: [toks[0]], valueToks: toks.slice(1), fieldConn: true, slotPred: null };
  return { fieldToks: [], valueToks: toks, fieldConn: false, slotPred: null };
}

// ---- public entry ----------------------------------------------------------
export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  _editingId = opts.editingId || null;
  let n = 0;

  const lineKeyFor = (flat) => {
    const col = flat.find((t) => t.t === "col" && t.id);
    if (col) return `cl:${col.id}`;
    const vb = flat.find((t) => t.t === "vbrick" && t.id);
    if (vb) return `vb:${vb.id}`;
    const any = flat.find((t) => t.id != null);
    return any ? `x:${any.id}` : null;
  };

  const mkLine = (o) => {
    const toks = o.tokens || [...(o.fieldToks || []), ...(o.valueToks || [])];
    const out = {
      key: (o.key || lineKeyFor(toks) || `${base}_${n}`),
      cols: [],
      depth: 0,
      _indent: 0,
      _level: o.level || 0,
      _lead: o.lead != null ? o.lead : null,
      _leadScope: o.leadScope || "filter",
      _head: o.head || null,
      _noField: !!o.noField,
      items: toks.map((tok) => ({ tok })),
      tokens: toks,
      _fieldToks: o.fieldToks || [],
      _valueToks: o.valueToks || [],
      _fieldConn: false,
      _slotPred: o.slotPred || null,
      _fieldCh: o.fieldCh || 0,
      _predCh: o.predCh || 0,
      // Child-line indent (Jason round 2): children start where the parent header
      // line's content ENDS — 'pred' = at the parent grid's predicate column (group
      // disjuncts, after the field-column "either"); 'value' = at the value column
      // (value-AND arms, after the field+predicate run). _indCh/_indPx accumulate
      // the extra columns of intermediate group grids for deeper nesting.
      _indKind: o.indKind || null,
      _indCh: 0,
      _indPx: 0,
      _disjunctDel: o.disjunctDel || null,
      _hasFieldMenu: false,
    };
    n += 1;
    return out;
  };

  // ONE filter clause → its line(s). A clause whose value is an AND of >1 groups
  // becomes a field-only header line + one value-arm line per AND operand.
  const renderClause = (nodes, level) => {
    const groupNode = nodes.find((nd) => nd.group);
    const lead = nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
    if (!groupNode) {
      const toks = stripParenDecor(absorbValueParens(lead));
      const cells = splitLineCells(toks);
      return [mkLine({ level, ...cellsToLine(cells), tokens: toks })];
    }
    const { join, operands } = splitOperands(groupNode.children);
    if (join === "and" && operands.length > 1) {
      const headToks = stripParenDecor(absorbValueParens(lead));
      const hc = splitLineCells(headToks);
      const cells = cellsToLine(hc);
      // Round 4 (Jason): arms sit at the PREDICATE column, lead chips PEACH.
      // Round 9 (Jason): the predicate word moved BACK UP to the header row (the
      // round-5 swap undone) — the header's pred chip doubles as the turn marker
      // (_slotTail → top-right corner rounding on the "has" chip) and the first
      // arm leads with a blank chip again.
      const out = [mkLine({ level, ...cells, tokens: headToks })];
      out[0]._slotTail = true;
      operands.forEach((op, i) => {
        const valueToks = stripParenDecor(absorbValueParens(inlineNodes(op.nodes)));
        const arm = mkLine({ level: level + 1, lead: i === 0 ? "blank" : join,
          leadScope: "filter", noField: true, indKind: "pred",
          valueToks, tokens: valueToks });
        // per-arm delete (round 8, Jason): the arm's root value node — the vgroup id
        // rides on its paren token, a lone leaf's id on its vbrick. removeNode +
        // the render round-trip dissolve the AND when one arm remains.
        for (const nd of op.nodes) {
          if (nd.group) { if (nd.open && nd.open.id != null) arm._armDel = nd.open.id; break; }
          if (nd.tok && nd.tok.id != null && nd.tok.t === "vbrick") { arm._armDel = nd.tok.id; break; }
        }
        out.push(arm);
      });
      return out;
    }
    const toks = stripParenDecor(absorbValueParens([...lead, ...inlineGroup(groupNode)]));
    const cells = splitLineCells(toks);
    return [mkLine({ level, ...cellsToLine(cells), tokens: toks })];
  };
  const cellsToLine = (cells) => ({
    fieldToks: cells.fieldToks, valueToks: cells.valueToks, slotPred: cells.slotPred,
  });

  // A group of whole FILTERS (or / and) → an "either"/"all of" header line + one
  // (indented, numbered) block per operand. Recurses for arbitrary depth.
  // NB (#603 round 7, Jason): the supported query landscape is now capped at TWO
  // filter levels with level 2 OR-only — SerpInputContainer gates advanced2 behind
  // canRepresentAsGrid, so the "all of" (join=and) branch and any deeper recursion
  // are UNREACHABLE from the tab. Kept as a defensive fallback: if an out-of-shape
  // tree ever slips past the gate, rendering something beats breaking.
  const renderGroup = (groupNode, join, operands, level) => {
    const open = groupNode.open || null;
    const headTokens = (open && open.t === "paren") ? [open] : [];
    const head = mkLine({ level, head: join === "or" ? "either" : "all of",
      noField: true, tokens: headTokens, key: headTokens.length ? null : `${base}_gh${n}` });
    head._tail = "filter";
    const out = [head];
    const groupChildHeads = [];
    operands.forEach((op, i) => {
      const cl = renderOperand(op.nodes, level + 1);
      if (!cl.length) return;
      // Round 9 (Jason): the first disjunct leads with a BLANK chip (round 6's
      // literal "has" dropped along with the value-AND pred swap).
      cl[0]._lead = i === 0 ? "blank" : join;
      cl[0]._leadScope = "filter";
      cl[0]._indKind = "pred";
      // per-disjunct delete: a single-clause operand's trash removes just this
      // alternative (removeDisjunct dissolves the group down to one).
      if (join === "or") {
        const colTok = (cl[0].tokens || []).find((t) => t.t === "col" && t.id != null);
        if (colTok && !cl[0]._head) cl[0]._disjunctDel = colTok.id;
      }
      groupChildHeads.push(cl[0]);
      out.push(...cl);
    });
    // shared mini field/pred column widths across the group's direct clause lines.
    // pw floors at 3 ("and" — #603 round 12): a nested clause's value-ARM lead chips
    // ("and"/blank) size to the GLOBAL pred column (3ch "and" floor), so the mini
    // pred chips ("is") beside/above them must share that floor or the column
    // renders two widths (Jason's round-12 screenshot, column 5).
    let fw = 0, pw = 3;
    for (const l of groupChildHeads) {
      if (l._noField || !(l._fieldToks || []).length) continue;
      let w = 0;
      for (const t of l._fieldToks)
        w += (t._draft && !t._column) ? 5 : (((t._label || t.text || "").trim()) || "select field").length;
      fw = Math.max(fw, w);
      if (l._slotPred) pw = Math.max(pw, String(l._slotPred).trim().length);
    }
    if (fw > 0) {
      for (const l of groupChildHeads) {
        if (l._noField || !(l._fieldToks || []).length) continue;
        l._fieldCh = Math.min(fw, 36);
        l._predCh = Math.min(pw, 14);
      }
    }
    // Deeper descendants (level+2 and below — e.g. a disjunct clause's value-AND
    // arms) sit inside THIS group's mini-grid: add its lead + field columns to
    // their indent. Approximate for rare deep shapes; exact for depth 1-2.
    for (const l of out) {
      if ((l._level || 0) >= level + 2) {
        l._indCh += Math.min(fw, 36) + Math.min(pw, 14);
        // px model of one intermediate mini-grid: lead2 chip pad (10) + lead2
        // margin (gx 2) + field-cell pad (24) + in-cell gap (gx 2) − the
        // pred-inset this grid's own boundary chip carries (r23: 13) = 25. The
        // line's FINAL boundary inset is lead2Indent's trailing −13px; each
        // intermediate grid contributes its own −13 here. (History: r19 removed
        // the stray r15 +5; r20 fixed a +2 gx miscount; r21 added the 5px insets;
        // r23 bumped 5→13 with the full-height spike.)
        l._indPx += 24 + 10 + 4 - 13;
      }
    }
    return out;
  };

  // One operand at any level: a clause-group recurses (renderGroup), a single
  // filter renders via renderClause. Single-operand groups are transparent.
  const renderOperand = (nodes, level) => {
    const groupNode = nodes.find((nd) => nd.group);
    const lead = nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
    if (groupNode && !lead.length && isClauseGroup(groupNode)) {
      const { join, operands } = splitOperands(groupNode.children);
      if (operands.length > 1) return renderGroup(groupNode, join, operands, level);
      if (operands.length === 1) return renderOperand(operands[0].nodes, level);
      return [];
    }
    return renderClause(nodes, level);
  };

  const nodes = parseSeq(tokens);
  while (nodes.length && isChromeNode(nodes[0])) nodes.shift();
  if (!nodes.length) return [];

  const rootOpen = opts.rootId != null ? { id: opts.rootId } : null;
  const { join: rootJoin, operands: filters } = splitOperands(nodes);
  let body;
  if (rootJoin === "or" && filters.length > 1) {
    // root-level OR → ONE top-level item: the "either" group (a single child of the
    // implicit top-level AND — "the first level of numbering is always the AND tree").
    body = renderGroup({ group: true, open: rootOpen, children: nodes, close: null }, "or", filters, 0);
    if (body.length) body[0]._lead = "arrow";
  } else {
    body = [];
    filters.forEach((f, fi) => {
      const fl = renderOperand(f.nodes, 0);
      if (fl.length && fl[0]._lead == null) fl[0]._lead = fi === 0 ? "arrow" : "and";
      body.push(...fl);
    });
  }
  return body;
}
