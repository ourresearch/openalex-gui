// Builder line-layout (oxjob #428). The no-code builder DIVERGES from the
// server's char-based `format_oql` wrapping: it re-derives every line break
// CLIENT-SIDE from the query's paren structure so it can use the *viewport*
// width (flex-wrap in the browser) instead of a fixed 80-col text wrap. One
// invariant drives everything (agreed with Jason 2026-06-15):
//
//   A group renders each child GROUP on its own line (recursively); its bare
//   VALUES render as one flowing/wrapping line. A group with no child-groups is
//   just that single value-line.
//
// Consequences that fall out of the one rule:
//   - <= 1 open paren per line (no subclause inlined with its parent);
//   - every filter on its own line;
//   - leaf value-bags (`(a or b or c)`) flow & wrap to the viewport.
//
// We work over the server's `oql_render_v2` token stream (already enriched with
// kinds/ids/display) rather than the v2 tree, so all of `enrichToken`'s work is
// reused — but we IGNORE the server's line boundaries/indent and re-derive them
// here. A leaf value-group is emitted as a single `{ grp: [...] }` item so the
// template can wrap it in its own flex box (wrap-continuation hangs under the
// `(`); everything else is a `{ tok }` item.

const isOpen = (t) => t && t.t === "paren" && (t.text || "").trim() === "(";
const isClose = (t) => t && t.t === "paren" && (t.text || "").trim() === ")";
const isSpace = (t) => t && t.t === "text" && !(t.text || "").trim();
// "chrome" = a keyword brick (the entity selector / `where`) or whitespace — i.e.
// a token that carries NO clause content. A run made only of chrome (e.g. the
// leading `works where`) should ride up onto the next group's opening `(` line
// rather than getting its own line, so we never strand an empty open paren.
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
        i += 1; // consume (
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

// A LEAF value-group flows inline: no child group AND no clause innards
// (col/op) — i.e. a pure `(value or value …)` bag. A *clause* group (parens
// around `col op value` clauses) is NOT leaf — it explodes so each clause keeps
// its own line.
const isLeafValueGroup = (node) =>
  !node.children.some((n) => n.group) &&
  !node.children.some((n) => !n.group && (n.tok.t === "col" || n.tok.t === "op"));

const meaningful = (items) => items.some((it) => it.grp || !isSpace(it.tok));

// Pop trailing connector/space NODES off `run` (mutating it) and return them in
// order. layout emits them at the START of the next line — the builder's LEADING-
// connector convention (Jason 2026-06-17, #475): each non-first item in a group
// reads `and`/`or` then its content, and the first item gets a `dot` placeholder
// (markDot) so every sibling lines up on the same left margin.
function takeTrailingConnNodes(run) {
  const lead = [];
  while (run.length) {
    const last = run[run.length - 1];
    if (last.group || (last.tok.t !== "conn" && !isSpace(last.tok))) break;
    lead.unshift(run.pop());
  }
  return lead;
}

// Is `nodes[k]` a CLAUSE-level connector — one that separates whole filters,
// so the next filter starts a new line? True when the next meaningful node opens
// a new clause: a field (`col`), `not ` clause chrome, or a standalone boolean
// phrase brick. A connector between values (next is a plain `vbrick`) or before
// a value group stays inline. (Sibling value-GROUPS are isolated separately, via
// the group branch in layoutGroupBody, so they're intentionally excluded here.)
function clauseBoundaryAhead(nodes, k) {
  for (let j = k + 1; j < nodes.length; j += 1) {
    const n = nodes[j];
    if (!n.group && isSpace(n.tok)) continue;
    if (n.group) return false;
    const t = n.tok;
    if (t.t === "col") return true;
    if (t.t === "kw" && t.label === "not") return true;
    if (t.t === "vbrick" && t.bool_phrase) return true;
    return false;
  }
  return false;
}

// ---- public entry ----------------------------------------------------------
// Turn a flat enriched token stream (the whole WHERE) into display lines.
// Each line: { key, depth, items, tokens, _groupSpan, _dot }. `items` drives the
// layout/wrap boxes; `tokens` is the flat list kept for row-trash / field-menu /
// index lookups AND template rendering. `_groupSpan` ([startIdx, endIdx]) is set on
// the open-`(` and close-`)` lines of each paren group — the builder highlights a
// whole block on hover (oxjob #428). `_dot` marks the FIRST item line of a multi-item
// group (a leading `dot` placeholder so the first child aligns under its `and`/`or`-led
// siblings, #475). Pairing relies on balanced, properly-nested emit order, so an index
// stack suffices. The two layout passes are NESTED here so they share `out` + the
// first-item marker (oxjob #475 — connectors now LEAD their lines).
export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  const out = [];
  let n = 0;
  const openStack = [];
  const emit = (depth, items, meta = {}) => {
    const idx = out.length;
    const flat = items.flatMap((it) => (it.grp ? it.grp : [it.tok]));
    out.push({
      key: `${base}_${n}`, depth, items, tokens: flat, _groupSpan: null,
      _removeId: null, _removeDraftId: opts.removeDraftId || null, _hasFieldMenu: false,
      _dot: false,
    });
    if (meta.openGroup) openStack.push(idx);
    if (meta.closeGroup && openStack.length) {
      const start = openStack.pop();
      const span = [start, idx];
      out[start]._groupSpan = span;
      out[idx]._groupSpan = span;
    }
    n += 1;
    return idx;
  };
  // Prepend an invisible `dot` placeholder to a first-item line (markDot) — it occupies
  // the same hanging-indent column a sibling's leading `and`/`or` would, so the first
  // child no longer juts out to the left of its siblings (Jason 2026-06-17, #475). Done
  // AFTER the line is emitted (its index is known), mutating items/tokens only — never
  // re-indexing lines, so `_groupSpan` stays valid.
  const markDot = (idx) => {
    const ln = out[idx];
    if (!ln || ln._dot) return;
    ln._dot = true;
    ln.items = [{ tok: { t: "dot" } }, ...ln.items];
    ln.tokens = [{ t: "dot" }, ...ln.tokens];
  };

  // Lay out the BODY of a group (or the top level — an implicit AND of filters): each
  // child GROUP on its own line; bare-value/clause runs split at clause-level connectors;
  // a clause's *value* group (preceded by op/col) stays attached to its clause. Tracks the
  // first emitted line of each ITEM so it can dot the first when there are ≥2.
  const layoutGroupBody = (children, depth) => {
    let run = []; // accumulating NODES for the current clause / flow line
    let prevTok = null; // last meaningful token node seen (not a group, not space)
    const itemStarts = []; // out-index of the FIRST line of each item in this body
    const layoutItem = (nodes) => {
      const start = out.length;
      layoutClause(nodes, depth);
      if (out.length > start) itemStarts.push(start);
    };
    const flush = () => {
      if (run.length) layoutItem(run);
      run = [];
      prevTok = null;
    };
    for (let k = 0; k < children.length; k += 1) {
      const node = children[k];
      if (node.group) {
        // A clause's VALUE group rides up onto its clause's lead line so the open paren
        // sits next to the property (`title/abstract has (`), never stranded on its own
        // line. The preceding token is the operator — or, now the predicate is folded INTO
        // the property chip (#467, op token dropped), the `col` itself.
        if (prevTok && (prevTok.t === "op" || prevTok.t === "col")) {
          run.push(node); // clause value (`has ( … )`) — keep with its clause
          prevTok = null;
        } else {
          const lead = takeTrailingConnNodes(run); // its leading `and`/`or`
          if (run.length && run.every(isChromeNode)) {
            // only leading chrome remains (e.g. `works where`) — let it lead the group's
            // `(` line: `works where (` (Jason 2026-06-15: no stranded open-paren line).
            layoutItem([...run, ...lead, node]);
            run = [];
            prevTok = null;
          } else {
            flush(); // emit any preceding bare values first
            layoutItem([...lead, node]); // sibling group → own line
          }
        }
      } else if (node.tok.t === "conn" && clauseBoundaryAhead(children, k)) {
        flush();
        run = [node]; // the connector LEADS the new clause line
        prevTok = node.tok;
      } else {
        run.push(node);
        if (!isSpace(node.tok)) prevTok = node.tok;
      }
    }
    flush();
    // Multi-item group → dot the first item so it aligns under its `and`/`or` siblings.
    if (itemStarts.length >= 2) markDot(itemStarts[0]);
  };

  // Lay out ONE clause / flow run: its atoms flow on a line; a leaf value-group is appended
  // inline (its own wrap box); a block group ends the lead line with `(`, explodes its
  // children one level deeper, and closes with `)` on its own line.
  const layoutClause = (nodes, depth) => {
    let run = []; // items: { tok } | { grp }
    const flush = () => {
      if (meaningful(run)) emit(depth, run);
      run = [];
    };
    for (const node of nodes) {
      if (!node.group) {
        run.push({ tok: node.tok });
      } else if (isLeafValueGroup(node)) {
        run.push({ grp: [node.open, ...node.children.map((n) => n.tok), node.close] });
      } else {
        run.push({ tok: node.open });
        emit(depth, run, { openGroup: true }); // lead line ends with `(`
        run = [];
        layoutGroupBody(node.children, depth + 1);
        emit(depth, [{ tok: node.close }], { closeGroup: true }); // `)` on its own line
      }
    }
    flush();
  };

  const nodes = parseSeq(tokens);
  // Entity chrome (`works where`) gets its OWN line, so the first filter/group starts fresh
  // on the next line — a deliberate divergence from OQL's "first clause shares the works-where
  // line" (Jason 2026-06-16). Peels the leading chrome run (entity kw + `where`); a stream
  // that doesn't begin with chrome (a bare clause/group) is unaffected.
  const lead = [];
  while (nodes.length && isChromeNode(nodes[0])) lead.push(nodes.shift());
  if (lead.length) emit(0, lead.map((nd) => ({ tok: nd.tok })));
  layoutGroupBody(nodes, 0);
  return out;
}
