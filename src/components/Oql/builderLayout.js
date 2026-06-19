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
//   - leaf value-bags (`any (a, b, c)`) flow & wrap to the viewport.
//
// We work over the server's `oql_render_v2` token stream (already enriched with
// kinds/ids/display) rather than the v2 tree, so all of `enrichToken`'s work is
// reused — but we IGNORE the server's line boundaries/indent and re-derive them
// here. A leaf value-group is emitted as a single `{ grp: [...] }` item so the
// template can wrap it in its own flex box (wrap-continuation hangs under the
// `(`); everything else is a `{ tok }` item.
//
// TOKEN MODEL (OQL decision 32, 2026-06-18 — `any`/`all` is canonical, oxjob #475):
// the server no longer emits infix `and`/`or` connectors or a bare open `(`.
// A boolean group now opens with a `groupkw` token (`text:"all ("`/`"any ("`,
// `label:"and"/"or"`) and separates its items with `comma` tokens; it closes
// with a plain `paren` `)`. The builder turns each `groupkw` into ONE `joinkw` chip
// that carries the keyword + the open paren (the clickable all/any control, `all (`,
// 2× the paren width) and DROPS the commas — the value chips are already visually
// distinct, and the lone all/any chip now expresses the join (replacing the old leading
// `and`/`or` per-line convention + its first-item `dot` placeholder, both retired).

const isOpen = (t) =>
  t && ((t.t === "groupkw") || (t.t === "paren" && (t.text || "").trim() === "("));
const isClose = (t) => t && t.t === "paren" && (t.text || "").trim() === ")";
const isSpace = (t) => t && t.t === "text" && !(t.text || "").trim();
// An item SEPARATOR within a group — the `comma` token (decision 32), or a legacy
// `conn` (and/or) still emitted by some local draft paths. Plays the structural
// role the connector used to: it marks where one item ends and the next begins.
const isSep = (t) => t && (t.t === "comma" || t.t === "conn");
// "chrome" = a keyword brick (the entity selector / `where`) or whitespace — i.e.
// a token that carries NO clause content. A run made only of chrome (e.g. the
// leading `works where`) should ride up onto the next group's opening `(` line
// rather than getting its own line, so we never strand an empty open paren.
const isChromeNode = (n) => n && !n.group && (n.tok.t === "kw" || isSpace(n.tok));

// Convert a group's OPEN token to its display token(s). A `groupkw` ("all ("/"any (")
// becomes a single `joinkw` all/any chip that CARRIES its own open paren — `all (` / `any (`
// on one block (Jason 2026-06-18), the keyword bold and the `(` riding with it. A legacy
// bare paren `(` passes through unchanged.
const splitOpen = (openTok) => {
  if (openTok.t === "groupkw") {
    const join = openTok.label
      || ((openTok.text || "").trim().toLowerCase().startsWith("any") ? "or" : "and");
    // Carry the group's decimal address (#487) onto the join chip so the gutter can
    // number a group's open line and hovering the `all (`/`any (` control resolves to
    // the group node. A fused value-root join (e.g. the `all` in `full text has all (`)
    // has no addr on the server groupkw, so this is simply undefined there.
    return [{ t: "joinkw", id: openTok.id, addr: openTok.addr, text: `${join === "or" ? "any" : "all"} (`, label: join }];
  }
  return [openTok];
};

// ---- parse the flat token stream into a node tree --------------------------
// node = { tok } | { group: true, open, children: node[], close }
function parseSeq(tokens) {
  let i = 0;
  const walk = () => {
    const nodes = [];
    while (i < tokens.length) {
      const tok = tokens[i];
      if (isOpen(tok)) {
        i += 1; // consume the opener (groupkw or `(`)
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
// (col/op) — i.e. a pure `any (value, value …)` bag. A *clause* group (parens
// around `col op value` clauses) is NOT leaf — it explodes so each clause keeps
// its own line.
const isLeafValueGroup = (node) =>
  !node.children.some((n) => n.group) &&
  !node.children.some((n) => !n.group && (n.tok.t === "col" || n.tok.t === "op"));

const meaningful = (items) => items.some((it) => it.grp || !isSpace(it.tok));

// Drop trailing separator/space NODES off `run` (mutating it). Unlike the retired
// leading-connector convention, the separators are DISCARDED — items no longer
// carry a leading `and`/`or`; the group's single all/any chip expresses the join.
function dropTrailingSep(run) {
  while (run.length) {
    const last = run[run.length - 1];
    if (last.group || (!isSep(last.tok) && !isSpace(last.tok))) break;
    run.pop();
  }
}

// Is `nodes[k]` (a separator) a CLAUSE-level boundary — one that separates whole
// filters, so the next filter starts a new line? True when the next meaningful
// node opens a new clause: a field (`col`), `not ` clause chrome, or a standalone
// boolean phrase brick. A separator between values (next is a plain `vbrick`) or
// before a value group stays inline. (Sibling value-GROUPS are isolated separately,
// via the group branch in layoutGroupBody, so they're intentionally excluded here.)
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
// Each line: { key, depth, items, tokens, _groupSpan }. `items` drives the
// layout/wrap boxes; `tokens` is the flat list kept for row-trash / field-menu /
// index lookups AND template rendering. `_groupSpan` ([startIdx, endIdx]) is set on
// the open-`(` and close-`)` lines of each paren group — the builder highlights a
// whole block on hover (oxjob #428). Pairing relies on balanced, properly-nested
// emit order, so an index stack suffices.
export function layoutLines(tokens, opts = {}) {
  const base = opts.key || "s";
  const out = [];
  let n = 0;
  const openStack = [];
  // A line key derived from the STABLE node id of the line's anchor token, so a line keeps
  // its identity across edits (a moved/added/removed row re-renders at a new POSITION but
  // the same key) — which lets a <TransitionGroup> SLIDE rows instead of teardown/rebuild
  // (oxjob #475). Reconciliation (reconcileIds) keeps the underlying ids stable for
  // survivors. Group open/close lines key off the group id + role (so the matching `(`/`)`
  // don't collide); a clause keys off its `col`; a bare values line off its first value;
  // a chrome line (`works where`) off any token id. Falls back to the positional key when
  // a token has no id (e.g. unit-test fixtures) so keys stay unique either way.
  const lineKeyFor = (flat, meta) => {
    if (meta.openGroup || meta.closeGroup) {
      const g = flat.find((t) => (t.t === "paren" || t.t === "joinkw") && t.id);
      if (g) return `${meta.openGroup ? "go" : "gc"}:${g.id}`;
    }
    const col = flat.find((t) => t.t === "col" && t.id);
    if (col) return `cl:${col.id}`;
    const vb = flat.find((t) => t.t === "vbrick" && t.id);
    if (vb) return `vb:${vb.id}`;
    const any = flat.find((t) => t.id != null);
    return any ? `x:${any.id}` : null;
  };
  const emit = (depth, items, meta = {}) => {
    const idx = out.length;
    const flat = items.flatMap((it) => (it.grp ? it.grp : [it.tok]));
    out.push({
      key: lineKeyFor(flat, meta) || `${base}_${n}`, depth, items, tokens: flat, _groupSpan: null,
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

  // Lay out the BODY of a group (or the top level): each child GROUP on its own line;
  // bare-value/clause runs split at clause-level separators; a clause's *value* group
  // (preceded by op/col) stays attached to its clause.
  const layoutGroupBody = (children, depth) => {
    let run = []; // accumulating NODES for the current clause / flow line
    let prevTok = null; // last meaningful token node seen (not a group, not a separator)
    const flush = () => {
      if (run.length) layoutClause(run, depth);
      run = [];
      prevTok = null;
    };
    for (let k = 0; k < children.length; k += 1) {
      const node = children[k];
      if (node.group) {
        // A clause's VALUE group rides up onto its clause's lead line so the open paren
        // sits next to the property (`title/abstract has all (`), never stranded on its
        // own line. The preceding token is the operator — or, now the predicate is folded
        // INTO the property chip (#467, op token dropped), the `col` itself.
        if (prevTok && (prevTok.t === "op" || prevTok.t === "col")) {
          run.push(node); // clause value (`has all ( … )`) — keep with its clause
          prevTok = null;
        } else {
          dropTrailingSep(run); // discard the comma separating it from the prior item
          if (run.length && run.every(isChromeNode)) {
            // only leading chrome remains (e.g. `works where`) — let it lead the group's
            // `(` line: `works where all (` (Jason 2026-06-15: no stranded open-paren line).
            layoutClause([...run, node], depth);
            run = [];
            prevTok = null;
          } else {
            flush(); // emit any preceding bare values first
            layoutClause([node], depth); // sibling group → own line
          }
        }
      } else if (isSep(node.tok) && clauseBoundaryAhead(children, k)) {
        flush(); // the separator ends this clause; the next clause starts a fresh line
      } else if (isSep(node.tok)) {
        // separator between values (stays inline) — dropped from the display run.
      } else {
        run.push(node);
        if (!isSpace(node.tok)) prevTok = node.tok;
      }
    }
    flush();
  };

  // Lay out ONE clause / flow run: its atoms flow on a line; a leaf value-group is appended
  // inline (its own wrap box); a block group ends the lead line with `( all`/`( any`, explodes
  // its children one level deeper, and closes with `)` on its own line.
  const layoutClause = (nodes, depth) => {
    let run = []; // items: { tok } | { grp }
    const flush = () => {
      if (meaningful(run)) emit(depth, run);
      run = [];
    };
    for (const node of nodes) {
      if (!node.group) {
        if (isSep(node.tok)) continue; // separators aren't displayed
        run.push({ tok: node.tok });
      } else if (isLeafValueGroup(node)) {
        const inner = node.children.filter((c) => !isSep(c.tok)).map((c) => c.tok);
        run.push({ grp: [...splitOpen(node.open), ...inner, ...(node.close ? [node.close] : [])] });
      } else {
        run.push(...splitOpen(node.open).map((tok) => ({ tok }))); // `( all` lead chips
        emit(depth, run, { openGroup: true }); // lead line ends with the open paren + join chip
        run = [];
        layoutGroupBody(node.children, depth + 1);
        if (node.close) emit(depth, [{ tok: node.close }], { closeGroup: true }); // `)` on its own line
      }
    }
    flush();
  };

  const nodes = parseSeq(tokens);
  // Entity chrome (`works where`): when the body is wrapped in a top-level all/any GROUP, the
  // chrome leads that group's open line — `works where all (` on line 1 (Jason 2026-06-18). For
  // a bare single filter (no wrapper group), the chrome still gets its OWN line so the lone
  // filter starts fresh below it (the #428 divergence). Peel only in the no-wrapper case; in the
  // wrapper case leave the chrome in the stream so layoutGroupBody merges it onto the `( ` line.
  const lead = [];
  while (nodes.length && isChromeNode(nodes[0])) lead.push(nodes.shift());
  if (lead.length) {
    if (nodes.length && nodes[0].group) nodes.unshift(...lead); // wrapper → chrome leads the open line
    else emit(0, lead.map((nd) => ({ tok: nd.tok })));          // bare filter → chrome on its own line
  }
  layoutGroupBody(nodes, 0);
  return out;
}
