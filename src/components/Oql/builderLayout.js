// Builder line-layout (oxjob #428, rebuilt for the and/or-precedence redesign in
// oxjob #507). The no-code builder DIVERGES from the server's char-based
// `format_oql` wrapping: it re-derives every line break CLIENT-SIDE from the
// query's group structure so it can use the *viewport* width (flex-wrap in the
// browser) instead of a fixed 80-col text wrap.
//
// THE LAYOUT MODEL (oxjob #507, design locked + mockups approved 2026-06-23):
//
//   AND → vertical, OR → horizontal.
//   Each AND operand gets its own line; OR synonyms stay inline on one line.
//   Grouping is shown by a RIGID FILLER-COLUMN GRID instead of paren glyphs:
//   every nesting level is a fixed structural column, and the meaning-carrying
//   term always lands in the same column because absent connectors are held open
//   with SPACER cells. No parentheses are drawn — the columns carry the structure.
//
// Worked example — `title/abstract has ((cancer and therapy) or (tumor and
// treatment))` (a "crossgrain" sum-of-products, the hard nested case). `--` is a
// spacer cell, `&`/`or` are connector cells; content follows the column prefix:
//
//   works where title & abstract has        <- field header (the value breaks vertical)
//   --  --  cancer
//   --  &   therapy
//   or  --  tumor
//   --  &   treatment
//
// And the dominant "hero" shape — `(cancer or tumor) and (therapy or treatment)
// and (child or pediatric)` (a product-of-sums, ~46% of real SR queries):
//
//   works where title & abstract has
//   --  cancer or tumor or neoplasm        <- first AND operand (its OR synonyms inline)
//   &   therapy or treatment
//   &   child or pediatric
//
// Rules that produce this (all verified against evidence/mockups.html in #507):
//   1. A group with join AND is ALWAYS vertical (each operand its own line). A
//      group with join OR is INLINE (synonyms on one line) UNLESS it contains a
//      sub-group (crossgrain) or is a clause-group (filters), which go vertical.
//      A vertical OR-crossgrain group PARTIAL-INLINES: only its sub-group operands
//      break onto their own line(s); runs of consecutive leaf synonyms stay inline
//      on one line, and a leading leaf-run rides the field-header line.
//   2. A VERTICAL group contributes one structural COLUMN: operand 0 gets a
//      spacer in that column; operands 1+ get the connector (&/or) on their first
//      line and a spacer on any continuation lines. The column is shared by all
//      the group's operands, so terms align.
//   3. A SINGLE-operand group is TRANSPARENT — it adds no column (no siblings to
//      align against).
//   4. The entity chrome (`works where`) rides the FIRST emitted line, not its own
//      line (#507 Phase 4: no bare WHERE). If that first line led with a spacer
//      (operand 0 of the top group), the spacer is dropped so the first filter
//      pulls up flush onto the where line.
//   5. AND connector renders as `&`, OR as `or` (the chip handles the glyph).
//
// We work over the server's `oql_render_v2` token stream (already enriched with
// kinds/ids/display by enrichToken) — same input as before — but produce a
// column model instead of the old depth-indented explode-on-parens model. Parens
// in the stream mark group boundaries (we parse the nesting from them) but are
// NEVER emitted as visible chips. Each output line carries:
//   { key, cols, items, tokens, depth, _groupSpan, _dot, ... }
//   - cols   : the structural column cells (spacer / connector), left→right.
//   - tokens : the CONTENT tokens (field/op/value/inline-conn), no parens, no
//              leading column cell. Drives the v-for + selection/drag lookups.
//   - items  : tokens wrapped as { tok } (kept for template compatibility).
//   - depth  : cols.length (kept for any remaining depth-based styling).
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

// Cell builders for the structural column prefix.
const spacerCell = () => ({ t: "spacer" });
// `opIndex` is the index of the operand this connector PRECEDES within its group
// (1..n-1) — it lets the connector-as-unit editing flip exactly THIS connector and
// let precedence restructure the group (oxjob #507 Phase 3, v2Edit.flipConnector).
const connCell = (sepTok, join, groupId, opIndex) => ({
  t: "conn",
  id: (sepTok && sepTok.id != null) ? sepTok.id : groupId,
  text: ` ${(sepTok && sepTok.label) || join} `,
  label: (sepTok && sepTok.label) || join,
  _col: true,
  _opIndex: opIndex,
});

// Is this parsed group node rendered INLINE (synonyms on one line) or VERTICAL
// (each operand its own line)? Mirrors rule 1 above.
//   - clause-group (any operand carries a `col`) → vertical (filters stack)
//   - join AND → vertical
//   - OR containing a sub-group (crossgrain) → vertical
//   - OR of plain leaves → inline
function isVerticalGroup(groupNode) {
  const { join, operands } = splitOperands(groupNode.children, groupNode.open);
  if (operands.length <= 1) return false; // single operand → transparent/inline
  const isClauseGroup = operands.some((o) =>
    o.nodes.some((n) => !n.group && n.tok.t === "col"));
  if (isClauseGroup) return true;
  if (join === "and") return true;
  if (operands.some((o) => o.nodes.some((n) => n.group))) return true; // crossgrain
  return false;
}

// A vertical OR group that should PARTIAL-INLINE (oxjob #507 follow-up): join is
// OR and it's NOT a clause-group (filters). Such a group breaks out only its
// SUB-GROUP operands onto their own line(s) — runs of consecutive leaf synonyms
// stay inline on one line (design rule 1: "OR synonyms stay inline"). A leaf needs
// no structural break; only a sub-group needs the column grid to show its
// paren-free boundary. AND groups and clause-groups stack every operand instead.
const orCoalesces = (join, operands) =>
  join === "or" &&
  !operands.some((o) => o.nodes.some((n) => !n.group && n.tok.t === "col"));

// Flatten an INLINE group to a content-token run with NO parens: the operand
// values interleaved with connector cells (`or`/`&`). Inline groups have only
// leaf operands by construction (rule 1), but we recurse defensively so a stray
// nested inline group still flattens rather than dropping tokens.
function inlineContent(groupNode) {
  const { join, operands } = splitOperands(groupNode.children, groupNode.open);
  const out = [];
  operands.forEach((op, i) => {
    if (i) out.push(connCell(op.sep, join, groupNode.open && groupNode.open.id, i));
    for (const n of op.nodes) {
      if (n.group) out.push(...inlineContent(n));
      else if (!isSpace(n.tok)) out.push(n.tok);
    }
  });
  return out;
}

// ---- public entry ----------------------------------------------------------
// Turn a flat enriched token stream (the whole WHERE) into column-model display
// lines. See the file header for the line shape.
export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  let n = 0;

  // A line: { cols:[cell], content:[tok], _src:[tok for key] }. Built bottom-up.
  const line = (content) => ({ cols: [], content });

  // Render ONE operand (a run of content nodes, possibly ending in a group) to
  // lines. Cases:
  //   - no group               → one content line (clause scalar / unary / bare value)
  //   - lead content + group   → a clause with a value-bag:
  //         inline bag  → one line: field/op + inlined bag
  //         vertical bag→ header line (field/op) + the bag's operand lines below
  //   - group only (no lead)   → a nested group operand (clause-group / value sub-bag):
  //         inline → one line; vertical → its operand lines (no header)
  const renderOperand = (nodes) => {
    const groupNode = nodes.find((nd) => nd.group);
    const lead = nodes.filter((nd) => !nd.group && !isSpace(nd.tok)).map((nd) => nd.tok);
    if (!groupNode) return [line(lead)];
    if (isVerticalGroup(groupNode)) {
      const body = renderGroupBody(groupNode);
      if (!lead.length) return body;
      // A vertical OR bag whose FIRST operand is a leaf-run: its synonyms ride the
      // field-header line (like a pure inline OR bag — shape 3), and only the
      // sub-group(s) break below. Merge by dropping body[0]'s leading spacer and
      // prepending the header. AND bags, and OR bags whose first operand is itself
      // a sub-group (shape 4), keep the header on its own line.
      const { join, operands } = splitOperands(groupNode.children, groupNode.open);
      const firstIsLeafRun = orCoalesces(join, operands)
        && operands.length > 1
        && !operands[0].nodes.some((n) => n.group);
      if (firstIsLeafRun && body.length) {
        const head = body[0];
        if (head.cols.length && head.cols[0].t === "spacer") head.cols.shift();
        head.content = [...lead, ...head.content];
        return body;
      }
      return [line(lead), ...body]; // field header, then operands
    }
    const inlined = inlineContent(groupNode);
    return [line([...lead, ...inlined])];
  };

  // Render the BODY of a VERTICAL group: stack each operand on its own line(s),
  // prefixing this group's structural column (rule 2). A single-operand group is
  // transparent — it adds no column (rule 3).
  const renderGroupBody = (groupNode) => {
    const groupId = groupNode.open && groupNode.open.id;
    const { join, operands } = splitOperands(groupNode.children, groupNode.open);
    if (operands.length === 1) return renderOperand(operands[0].nodes);
    const coalesce = orCoalesces(join, operands);
    const out = [];
    // Prefix this group's structural column onto an operand's already-rendered
    // lines: the FIRST line carries the spacer (operand 0) or the connector cell
    // (operands 1+); continuation lines carry a spacer to hold the column open.
    const prefix = (sub, opIndex, sep) => {
      sub.forEach((ln, j) => {
        const cell = j === 0
          ? (opIndex === 0 ? spacerCell() : connCell(sep, join, groupId, opIndex))
          : spacerCell();
        ln.cols.unshift(cell);
      });
      out.push(...sub);
    };
    let i = 0;
    while (i < operands.length) {
      if (coalesce && !operands[i].nodes.some((n) => n.group)) {
        // A maximal run of consecutive LEAF operands collapses to one inline line
        // (OR synonyms stay together); the run's first connector becomes the
        // column cell, the rest stay inline (each still carrying its own _opIndex
        // so connector-flip editing addresses the right operand).
        const start = i;
        const toks = [];
        while (i < operands.length && !operands[i].nodes.some((n) => n.group)) {
          if (i > start) toks.push(connCell(operands[i].sep, join, groupId, i));
          for (const n of operands[i].nodes) if (!isSpace(n.tok)) toks.push(n.tok);
          i += 1;
        }
        prefix([line(toks)], start, operands[start].sep);
      } else {
        prefix(renderOperand(operands[i].nodes), i, operands[i].sep);
        i += 1;
      }
    }
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

  // Finalize a {cols, content} line into the public line shape.
  const finalize = (ln) => {
    const tokens = ln.content;
    const out = {
      key: lineKeyFor([...ln.cols, ...tokens]) || `${base}_${n}`,
      cols: ln.cols,
      depth: ln.cols.length,
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
  // Peel the leading entity chrome (`works`, `where`) so it can ride the first
  // content line rather than getting its own (oxjob #507 Phase 4).
  const chrome = [];
  while (nodes.length && isChromeNode(nodes[0])) chrome.push(nodes.shift().tok);

  // The body is the implicit top-level group. Wrap it in a synthetic group node so
  // renderGroupBody handles the bare-root AND/OR uniformly (the root's connector
  // tokens carry the root group id, so splitOperands recovers it).
  const bodyLines = nodes.length
    ? renderGroupBody({ group: true, open: null, children: nodes, close: null })
    : [];

  // Attach the chrome to the first line; drop its leading spacer (operand 0 of the
  // top group rode the where line) so the first filter pulls flush to `works where`.
  if (chrome.length) {
    if (bodyLines.length) {
      const first = bodyLines[0];
      if (first.cols.length && first.cols[0].t === "spacer") first.cols.shift();
      first.content = [...chrome, ...first.content];
    } else {
      bodyLines.push(line(chrome));
    }
  }

  // Trailing-spacer elision (Jason 2026-06-23): a spacer cell is only load-bearing
  // if it holds its column open for a CONNECTOR on a LATER line — once a column has
  // no more connectors below, its remaining spacers are pure indentation, not
  // structure, so they render as blank whitespace (mark `_blank`; same width, no
  // chip). Column position is consistent across lines (outermost group at index 0,
  // since each group unshifts its cell onto the front). For each column, find the
  // last line carrying a connector there; any spacer at or below that line is blank.
  const lastConnAtCol = [];
  bodyLines.forEach((ln, li) => {
    ln.cols.forEach((cell, ci) => { if (cell.t === "conn") lastConnAtCol[ci] = li; });
  });
  bodyLines.forEach((ln, li) => {
    ln.cols.forEach((cell, ci) => {
      if (cell.t === "spacer" && !(lastConnAtCol[ci] > li)) cell._blank = true;
    });
  });

  return bodyLines.map(finalize);
}
