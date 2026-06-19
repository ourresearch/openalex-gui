// Decimal margin numbers for the OQL no-code builder (oxjob #487, Part 1).
//
// #474 shipped (server-side, in prod) a decimal ADDRESSING scheme over the
// canonical OQL tree — `0`, `1`, `3.1`, `4.1.2` — and tags every rendered token
// with `tok.addr` (a display-ready dotted string) for the nodes it addresses.
// This module derives, for one laid-out builder line (a `displayLine` from
// builderLayout.js), the single decimal address that line REPRESENTS, so the
// gutter mirrors the tree instead of showing a dumb sequential counter.
//
// Grounding (see oql_render_v2.py `render_v2` / `address_index`): a token carries
// `addr` iff its node is addressed —
//   * a clause's `col`/`op`/`vbrick` tokens → the clause addr (`1`, `4`); a simple
//     clause's value brick rides `.1` (`1.1`); a boolean is atomic (`2`).
//   * a factored value brick (`vleaf`) → its own value addr (`4.1.2`).
//   * a group's open chip (`joinkw`, carried over from the server `groupkw` by
//     builderLayout's splitOpen) → the group addr (`3`, `4.1`); its close `)` and
//     the commas also carry it.
//   * the implicit ROOT group, the entity, and `where` chrome are UNADDRESSED —
//     no token carries `0`, so the root open line is recognised structurally.
//
// The line's "owning" address is the address of the node it leads with: a clause
// line owns its clause addr (the `col`); a group's open line owns the group addr
// (the `joinkw`); a boolean line owns the clause addr (the `vbrick`). A pure
// close-paren line, a chrome-only line, and an uncommitted draft/transient line
// (no `tok.addr` yet) own NOTHING → no number.

// A group OPENER on a laid-out line: builderLayout turns the server `groupkw` into
// a `joinkw` chip (which we taught to carry `addr`); a legacy bare `(` may also
// appear. The matching close is always a plain `paren` `)` — never an opener.
const isOpenTok = (t) =>
  t && (t.t === "joinkw" || t.t === "groupkw"
    || (t.t === "paren" && (t.text || "").trim() === "("));

const isEntityTok = (t) => t && t.t === "kw" && t._entity;

// The line's "owner" token — the one whose address the line represents. Priority:
// the clause field (`col`) leads a clause line; a group's open chip (`joinkw`)
// leads a group's open line; a value brick (`vbrick`) leads a boolean / bare-value
// line. Parens, commas, operators and chrome are never owners.
function ownerToken(tokens) {
  return (tokens || []).find((t) => t.t === "col")
    || (tokens || []).find((t) => isOpenTok(t))
    || (tokens || []).find((t) => t.t === "vbrick")
    || null;
}

// The decimal address to paint in the gutter for one laid-out builder line, or
// `null` when the line gets no number (close-paren line, chrome-only line, draft).
export function lineAddr(line) {
  const tokens = (line && line.tokens) || [];
  // The implicit ROOT group's open line — `works where all (` — merges the entity
  // chrome onto the group's open chip. The root group is unaddressed server-side
  // (its head is the conjunction `0`, not a node), so no token carries `0`; we
  // recognise it as "entity + an open chip on the same line" and paint `0`. A
  // single-filter query has no root group (the chrome rides its own line with no
  // opener) → that line stays unnumbered, and the lone filter is `1`. (D3.)
  if (tokens.some(isEntityTok) && tokens.some(isOpenTok)) return "0";
  const owner = ownerToken(tokens);
  return (owner && owner.addr != null) ? String(owner.addr) : null;
}
