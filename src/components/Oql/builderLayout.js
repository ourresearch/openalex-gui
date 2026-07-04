// Builder line-layout (oxjob #428; rewritten for the 2D indent model in #523,
// superseding #507's rigid column grid). The no-code builder DIVERGES from the
// server's char-based `format_oql` wrapping: it re-derives every line break
// CLIENT-SIDE from the query's group structure so it can use the *viewport* width
// (flex-wrap) instead of a fixed 80-col text wrap.
//
// THE LAYOUT MODEL (oxjob #523, Jason 2026-06-26): the two boolean operators map to
// the two screen axes — AND = rows (down), OR = columns (right) — but rendered as a
// SIMPLE INDENT (not the old fixed-column grid, and no paren glyphs except one case):
//
//   FILTER scope (top level): each filter is its OWN row, flush-left, with NO leading
//   connector and NO indent — a newline reads as AND. OR-ed filters (rare) SHARE one
//   row, joined by `or`. Filters never indent.
//
//   VALUE scope (inside one filter): the field+op plus the value's FIRST OR-group sit
//   inline on row 1; each further AND-group drops to its own row with a small (~1ch)
//   indent and a leading `&`. OR values stay inline on their row. The ONE allowed extra
//   level — an AND sub-group inside an OR row (`pie or (tart and pastry)`) — is shown
//   inline WITH parens (the only place the builder draws parens).
//
// Hero shape — `title has ((cancer or tumor) and (therapy or treatment) and (child or
// pediatric))` (product-of-sums, ~46% of real SR queries):
//
//   title has cancer or tumor or neoplasm
//     & therapy or treatment
//     & child or pediatric
//
// Two AND-ed FILTERS (no indent, no connector — newline = AND):
//
//   title has apple or banana
//   year is 2020
//
// We work over the server's `oql_render_v2` token stream (enriched by enrichToken).
// Parens in the stream mark group boundaries (we parse the nesting) and are re-emitted
// ONLY for the one in-column AND sub-group. The representable-shape gate
// (representableShape.js) guarantees the tree never nests deeper than this can show.
// Each output line carries:
//   { key, cols, items, tokens, depth, _indent, _groupSpan, _dot, ... }
//   - cols    : always [] now (the #507 structural column grid is gone).
//   - tokens  : the CONTENT tokens (field/op/value/inline-conn/paren). A value-
//               continuation row leads with its `&` connector token. Drives the
//               v-for + selection/drag lookups.
//   - items   : tokens wrapped as { tok } (kept for template compatibility).
//   - _indent : 0 for a filter / first value row; 1 for a value-continuation row
//               (the small left pad). depth stays 0.
//
// DUAL-TOLERANCE (deploy-order safety): the layout still accepts the legacy
// keyword stream — a `groupkw` (`all (`/`any (`) opener and `comma` separators —
// by reading the group's join off the opener and treating commas like `conn`s.
// The producing paths (treeToTokens / the draft path) emit only the infix tokens.

const isOpen = (t) =>
  t && ((t.t === "groupkw") || (t.t === "paren" && (t.text || "").trim() === "("));
const isClose = (t) => t && t.t === "paren" && (t.text || "").trim() === ")";
const isSpace = (t) => t && t.t === "text" && !(t.text || "").trim();
// An item SEPARATOR within a group — the infix `conn` (and/or) connector, or a
// legacy `comma` token (back-compat).
const isSep = (t) => t && (t.t === "conn" || t.t === "comma");
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
        i += 1; // consume the opener (`(` or a legacy groupkw)
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

// The join word of a legacy groupkw opener ("all (" → and, "any (" → or).
const groupkwJoin = (openTok) =>
  openTok && openTok.t === "groupkw"
    ? (openTok.label || ((openTok.text || "").trim().toLowerCase().startsWith("any") ? "or" : "and"))
    : null;

// Split a group's children into OPERANDS at the connector separators. Returns
// { join, operands } where each operand is { nodes, sep } — `sep` is the `conn`
// token that PRECEDED this operand (null for operand 0), used to render its
// column connector cell (it carries the group's id + join label). Pure-space
// nodes are dropped. `join` is the group's connector word (from a conn/comma
// separator, falling back to a legacy groupkw opener).
function splitOperands(children, openTok) {
  const operands = [];
  let cur = null;
  let pendingSep = null;
  let join = groupkwJoin(openTok);
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
// `&`/`or`/`not`-joined string with each language feature (parens, the connectors, `not`)
// flagged `op:true` so the chip can BOLD it. Returns `[{ text, op }]` parts whose
// concatenation is the editable raw text (`(nicotine & vaping)`); `&` for AND matches the
// builder's connector glyph (valueExpr parses `&` back). Recurses for arbitrary nesting.
function serializeBlock(nd, parts) {
  if (nd.group) {
    const { join, operands } = splitOperands(nd.children, nd.open);
    parts.push({ text: "(", op: true });
    operands.forEach((op, i) => {
      if (i) parts.push({ text: join === "and" ? " & " : ` ${join} `, op: true });
      op.nodes.forEach((c) => serializeBlock(c, parts));
    });
    parts.push({ text: ")", op: true });
    return;
  }
  if (isSpace(nd.tok)) return;
  const tk = nd.tok;
  if (tk.t === "conn") { parts.push({ text: tk.label === "and" ? " & " : ` ${tk.label} `, op: true }); return; }
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
// placeholder (which has its own chip + picker). Used to keep a mid-edit AND sub-group EXPANDED.
// Empty = a transient blank box (`value: ""`). A `value: null` brick with display
// text is the NULL SENTINEL (`unknown`, #554) — a real chip, not an empty box.
const isEmptyVbrick = (t) => t && t.t === "vbrick" && !t._placeholder
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
// (the opener is an actual `(` / legacy groupkw token): the SYNTHETIC root group's opener is a
// bare `{id}` (no `.t`) so it stays bare, matching OQL's bare top level; and the row-spanning
// outer value-AND is never inlined here (renderFilter splits it into rows itself, so each
// per-row OR-group still gets its own parens while the undrawable outer wrapper is omitted).
// Clones the edge tokens so a shared stream token is never mutated.
function markParens(out, groupNode) {
  const open = groupNode && groupNode.open;
  const isRealOpener = open && (open.t === "paren" || open.t === "groupkw");
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
  const { join, operands } = splitOperands(groupNode.children, groupNode.open);
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
    const opToks = inlineNodes(op.nodes);
    out.push(...opToks);
    // Persistent add-value "+" for a filter followed by an OR-ed sibling on the same row
    // (#523 round 2): a non-terminal filter has no line-end to host the usual hover "+", so
    // it gets an explicit pale-periwinkle "+" chip right after its value — the only way to
    // add values to it. The terminal filter relies on the line-end hover "+".
    if (level === "filter" && i < operands.length - 1) {
      const lastV = [...opToks].reverse().find((t) => t.t === "vbrick" && t.id != null);
      if (lastV) out.push({ t: "addplus", _valueId: lastV.id });
    }
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
export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  _editingId = opts.editingId || null; // keep a mid-edit AND sub-group expanded (#523 Phase 4)
  let n = 0;

  // A line: { cols:[], content:[tok], _indent }. `cols` stays empty (the #507 column
  // grid is gone); `_indent` (0|1) is the small left pad for a value-continuation row.
  const line = (content, indent = 0) => ({ cols: [], content, _indent: indent });

  // Render ONE top-level filter operand → its line(s). The operand is either a single
  // filter (lead [col, op] + a value group) or an OR-group of whole filters (→ one
  // inline row, `A or B`).
  const renderFilter = (nodes) => {
    const groupNode = nodes.find((nd) => nd.group);
    const lead = nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
    // filter-scope OR among whole clauses (no own lead) → inline the clauses on one row. No
    // single add-row target here (which of the OR-ed filters would it extend? — ambiguous).
    if (groupNode && !lead.length && isClauseGroup(groupNode)) return [line(inlineGroup(groupNode))];
    let out;
    if (!groupNode) {
      out = [line(lead)]; // simple/atomic clause (year is 2020)
    } else {
      const { join, operands } = splitOperands(groupNode.children, groupNode.open);
      // value = AND of OR-groups → field+op + first OR-group inline, each further AND
      // operand on its own indented `& …` row. (AND = rows.) Otherwise (OR / single
      // value) the whole value inlines on the field's line. (OR = columns.)
      if (join === "and" && operands.length > 1) {
        const gid = groupNode.open && groupNode.open.id;
        const level = isValueLevel(groupNode) ? "value" : "filter";
        out = [line([...lead, ...inlineNodes(operands[0].nodes)])];
        for (let i = 1; i < operands.length; i++) {
          out.push(line([connCell(operands[i].sep, join, gid, i, level), ...inlineNodes(operands[i].nodes)], 1));
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
    const tokens = ln.content;
    const out = {
      key: lineKeyFor(tokens) || `${base}_${n}`,
      cols: ln.cols,           // always [] now (the #507 column grid is gone)
      depth: ln.cols.length,
      _indent: ln._indent || 0, // 0 = filter / first value row; 1 = value-continuation row
      // Filter-scope leading chip (#523 round 2): "arrow" (→) on the first filter row, "and"
      // (a pale-peach `&`) on each subsequent filter row; null on value-continuation rows.
      _lead: ln._lead || null,
      _addRow: ln._addRow || false, // the two-button add-row line (#523 Phase 4)
      items: tokens.map((tok) => ({ tok })),
      tokens,
      _groupSpan: null,
      _removeId: null,
      _removeDraftId: opts.removeDraftId || null,
      _hasFieldMenu: false,
      _dot: false,
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
  const { join: rootJoin, operands: filters } = splitOperands(nodes, rootOpen);
  let bodyLines;
  if (rootJoin === "or" && filters.length > 1) {
    // filter-scope OR at the top → all filters share ONE row, joined by `or`. As the very
    // first row it leads with the `→` arrow chip (#523 round 2).
    const ln = line(inlineGroup({ group: true, open: rootOpen, children: nodes, close: null }));
    ln._lead = "arrow";
    bodyLines = [ln];
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
