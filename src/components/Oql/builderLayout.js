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

// Inline a group to a content-token run (oxjob #523 indent model). OR operands are
// joined by `or`; an AND sub-group (the ONE allowed extra level — `pie or (tart and
// pastry)`) is wrapped in VISIBLE parens (the one place the builder shows parens —
// elsewhere the row/indent structure carries the grouping). A single-operand group is
// transparent. Recurses for nested sub-groups. The gate bounds nesting so an inlined
// AND is all-leaves and nothing nests deeper than this.
function inlineGroup(groupNode) {
  const { join, operands } = splitOperands(groupNode.children, groupNode.open);
  const gid = groupNode.open && groupNode.open.id;
  const level = isValueLevel(groupNode) ? "value" : "filter";
  const paren = join === "and" && operands.length > 1; // an inline AND group → the paren level
  const out = [];
  if (paren) out.push({ t: "paren", id: gid, text: "(" });
  operands.forEach((op, i) => {
    if (i) out.push(connCell(op.sep, join, gid, i, level));
    out.push(...inlineNodes(op.nodes));
  });
  if (paren) out.push({ t: "paren", id: gid, text: ")" });
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
    // filter-scope OR among whole clauses (no own lead) → inline the clauses on one row.
    if (groupNode && !lead.length && isClauseGroup(groupNode)) return [line(inlineGroup(groupNode))];
    if (!groupNode) return [line(lead)]; // simple/atomic clause (year is 2020)
    const { join, operands } = splitOperands(groupNode.children, groupNode.open);
    // value = AND of OR-groups → field+op + first OR-group inline, each further AND
    // operand on its own indented `& …` row. (AND = rows.) Otherwise (OR / single
    // value) the whole value inlines on the field's line. (OR = columns.)
    if (join === "and" && operands.length > 1) {
      const gid = groupNode.open && groupNode.open.id;
      const level = isValueLevel(groupNode) ? "value" : "filter";
      const out = [line([...lead, ...inlineNodes(operands[0].nodes)])];
      for (let i = 1; i < operands.length; i++) {
        out.push(line([connCell(operands[i].sep, join, gid, i, level), ...inlineNodes(operands[i].nodes)], 1));
      }
      return out;
    }
    return [line([...lead, ...inlineGroup(groupNode)])];
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
    // filter-scope OR at the top → all filters share ONE row, joined by `or`.
    bodyLines = [line(inlineGroup({ group: true, open: rootOpen, children: nodes, close: null }))];
  } else {
    // AND-ed (or single) filters → each filter its own row(s), no inter-filter conn/indent.
    bodyLines = [];
    for (const f of filters) bodyLines.push(...renderFilter(f.nodes));
  }
  return bodyLines.map(finalize);
}
