// Builder line-layout (oxjob #428, rebuilt for the and/or-precedence redesign in
// oxjob #507). The no-code builder DIVERGES from the server's char-based
// `format_oql` wrapping: it re-derives every line break CLIENT-SIDE from the
// query's group structure so it can use the *viewport* width (flex-wrap in the
// browser) instead of a fixed 80-col text wrap.
//
// THE LAYOUT MODEL (oxjob #507; rev-2 line-break rule, Jason 2026-06-24):
//
//   ALL-OR-NOTHING BREAKING. A group is laid out on ONE line if every operand is
//   a LEAF (a plain value, no sub-group) — regardless of whether the join is AND
//   or OR. The moment a group contains ANY sub-group (a "subclass"), the WHOLE
//   group breaks: every operand gets its own line — leaves included, no
//   partial-inlining — and each sub-group operand recurses by the same rule.
//   Grouping is shown by a RIGID FILLER-COLUMN GRID instead of paren glyphs:
//   every broken nesting level is a fixed structural column, and the
//   meaning-carrying term always lands in the same column because absent
//   connectors are held open with SPACER cells. No parentheses are drawn.
//
// Why all-or-nothing (the rev-1 partial-inline rule was dropped): a line like
// `foo or bar` next to a broken `or (baz and qux)` reads as TWO logical units when
// there are really THREE (foo, bar, the subclass). Breaking every operand once any
// of them breaks makes the operand count read true.
//
// Dominant "hero" shape — `(cancer or tumor) and (therapy or treatment) and
// (child or pediatric)` (a product-of-sums, ~46% of real SR queries). The outer
// AND has sub-group operands → it breaks; each operand is an all-leaf OR → inline:
//
//   title & abstract has        <- field header (the value bag breaks vertical)
//   --  cancer or tumor or neoplasm
//   &   therapy or treatment
//   &   child or pediatric
//
// "Crossgrain" sum-of-products — `((cancer and therapy) or (tumor and treatment))`.
// Outer OR has sub-group operands → it breaks; each operand is an all-leaf AND →
// inline (the rev-1 model gave this a 2-deep column grid; rev-2 inlines it):
//
//   title & abstract has
//   --  cancer & therapy
//   or  tumor & treatment
//
// Worked mixed case — `title has (foo or bar or (baz and qux))`. Outer OR has a
// subclass → every operand breaks; the all-leaf `baz and qux` subclass inlines on
// its own operand line. The deeper column grid only appears for a subclass that
// itself contains a subclass:
//
//   title has
//   --  foo
//   or  bar
//   or  baz & qux
//
// Rules that produce this:
//   1. A group is INLINE iff all operands are leaves (no sub-group) AND it is not a
//      clause-group (a list of filters always stacks). Otherwise it is VERTICAL:
//      every operand on its own line(s), no coalescing.
//   2. A VERTICAL group contributes one structural COLUMN: operand 0 gets a
//      spacer in that column; operands 1+ get the connector (&/or) on their first
//      line and a spacer on any continuation lines. The column is shared by all
//      the group's operands, so terms align.
//   3. A SINGLE-operand group is TRANSPARENT — it adds no column (no siblings to
//      align against).
//   4. The leading entity chrome (`works`, `where`) is DISCARDED — the subject-entity
//      selector lives in the toolbar now (oxjob #507), so the canvas is a pure list of
//      filters. The first filter still leads flush-left: if its line opened with a
//      spacer (operand 0 of the top group), that spacer is dropped.
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
// `cont:true` marks a CONTINUATION spacer — one added to hold a column open across
// an operand's own wrap/continuation lines (j>0 in prefix). It is pure indentation,
// NOT the slot of an omitted leading conjunction, so it NEVER renders an arrow (the
// trailing-elision pass blanks it unconditionally). Only an operand-0 FIRST-line
// spacer is the omitted-conjunction slot that can earn a `→`. (Jason 2026-06-24 #507.)
// An operand-0 spacer (the omitted-leading-conjunction slot — the `→` arrow) carries its
// group's id + join so the arrow is CLICKABLE: clicking it reverses that group's conjunction
// (`toggleJoin` — no `_opIndex`, so onConnCellClick flips the whole single-join group). The
// arrow "stands in for" the conjunction English drops on a list's leading item, so flipping it
// flips that same conjunction. Continuation spacers (`_cont`) carry nothing — pure indent.
// (Jason 2026-06-24 #507.)
const spacerCell = (cont = false, groupId = null, join = null) =>
  ({ t: "spacer", _cont: cont, id: groupId, label: join });
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

// Is this parsed group node rendered INLINE (operands on one line) or VERTICAL
// (each operand its own line)? Mirrors rule 1 above (rev-2 all-or-nothing rule).
//   - clause-group (any operand carries a `col`) → vertical (filters always stack)
//   - contains any sub-group (a subclass) → vertical (the whole group breaks)
//   - all operands are leaves (AND or OR) → inline
function isVerticalGroup(groupNode) {
  const { operands } = splitOperands(groupNode.children, groupNode.open);
  if (operands.length <= 1) return false; // single operand → transparent/inline
  const isClauseGroup = operands.some((o) =>
    o.nodes.some((n) => !n.group && n.tok.t === "col"));
  if (isClauseGroup) return true;
  if (operands.some((o) => o.nodes.some((n) => n.group))) return true; // has a subclass
  return false; // all-leaf group (AND or OR) → inline
}

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
      // A vertical bag breaks fully (rev-2): the field header sits on its own line
      // and every operand stacks below it (no leaf-run rides the header — that was
      // the rev-1 partial-inline, now dropped).
      const body = renderGroupBody(groupNode);
      if (!lead.length) return body;
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
    const out = [];
    // Prefix this group's structural column onto an operand's already-rendered
    // lines: the FIRST line carries the spacer (operand 0) or the connector cell
    // (operands 1+); continuation lines carry a spacer to hold the column open.
    const prefix = (sub, opIndex, sep) => {
      sub.forEach((ln, j) => {
        const cell = j === 0
          ? (opIndex === 0 ? spacerCell(false, groupId, join) : connCell(sep, join, groupId, opIndex))
          : spacerCell(true); // continuation line: pure indent, never an arrow
        ln.cols.unshift(cell);
      });
      out.push(...sub);
    };
    // rev-2: every operand stacks on its own line(s) — no leaf-run coalescing.
    operands.forEach((op, i) => prefix(renderOperand(op.nodes), i, op.sep));
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
  // Discard the leading entity chrome (`works`, `where`): the subject-entity selector
  // lives in the toolbar now (oxjob #507), so the canvas is a pure list of filters.
  let hadChrome = false;
  while (nodes.length && isChromeNode(nodes[0])) { nodes.shift(); hadChrome = true; }

  // The body is the implicit top-level group. Wrap it in a synthetic group node so
  // renderGroupBody handles the bare-root AND/OR uniformly (the root's connector
  // tokens carry the root group id, so splitOperands recovers it).
  const bodyLines = nodes.length
    ? renderGroupBody({ group: true, open: null, children: nodes, close: null })
    : [];

  // The first filter used to ride the `works where` line with operand 0's leading
  // spacer dropped. The chrome is gone now, but keep that flush-left behavior so the
  // first filter pulls left (only when chrome was present, to leave chrome-less
  // sub-renders — drafts, transient previews — exactly as before).
  if (hadChrome && bodyLines.length) {
    const first = bodyLines[0];
    if (first.cols.length && first.cols[0].t === "spacer") first.cols.shift();
  }

  // Spacer→blank elision. A spacer renders a `→` ONLY when it is the slot of an
  // OMITTED LEADING CONJUNCTION — i.e. an operand-0 first-line spacer holding its
  // group's connector column open for the `&`/`or` on later lines (English drops the
  // conjunction on the leading item: "apple and banana", not "and apple and banana",
  // so n items carry only n-1 connectors and the leader's slot is blank-but-aligned).
  // Two kinds of spacer are NOT that slot and always render blank (pure indent,
  // `_blank`; same width, no chip):
  //   - CONTINUATION spacers (`_cont`): an operand's own wrap/continuation lines.
  //     Indent is indent — never an arrow, even when an OUTER group has a connector
  //     below in the same column (Jason 2026-06-24 #507; was the surplus-arrow bug).
  //   - operand-0 slots whose column has NO connector below them at all (a vertical
  //     group always has one, but keep the guard for degenerate/leaf-only columns).
  // Column position is consistent across lines (outermost group at index 0, since
  // each group unshifts its cell onto the front).
  const lastConnAtCol = [];
  bodyLines.forEach((ln, li) => {
    ln.cols.forEach((cell, ci) => { if (cell.t === "conn") lastConnAtCol[ci] = li; });
  });
  bodyLines.forEach((ln, li) => {
    ln.cols.forEach((cell, ci) => {
      if (cell.t !== "spacer") return;
      if (cell._cont || !(lastConnAtCol[ci] > li)) cell._blank = true;
    });
  });

  // Arrow SHAPE (Jason 2026-06-24 #507). A non-blank operand-0 spacer (the `→` slot) draws as:
  //   - a "ray" (solid dot + a line running to the right edge) when it STARTS its line — "this
  //     is where the line of values begins"; OR
  //   - a "tee" (a full-width cross-line + a stem dropping to the bottom edge) when a CONNECTOR
  //     cell sits immediately to its left — a deeper-nested operand-0 slot that joins three
  //     things: the connector on its left, the value on its right, and the connector below it.
  bodyLines.forEach((ln) => {
    ln.cols.forEach((cell, ci) => {
      if (cell.t !== "spacer" || cell._blank) return;
      const left = ci > 0 ? ln.cols[ci - 1] : null;
      cell._tee = !!(left && left.t === "conn");
    });
  });

  return bodyLines.map(finalize);
}
