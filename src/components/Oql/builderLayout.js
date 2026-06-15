// Builder line-layout helpers (oxjob #428). The no-code builder intentionally
// DIVERGES from `format_oql`'s width-based wrapping: every filter gets its own
// line, always (Jason, 2026-06-15). These pure transforms run client-side over
// the server's `oql_render_v2` line/token projection.

// Split one display line so each filter clause is on its own line. A `conn`
// token (` and `/` or `) is CLAUSE-level when the next meaningful token starts a
// new clause — a `col` field, a `(` group, or `not ` chrome — rather than
// another value (`vbrick`). The connector leads the new line, matching the OQL
// pane's leading-connector convention. Value-OR connectors (between `vbrick`s,
// e.g. `title contains (a or b)`) stay inline: that whole group is ONE filter.
export function splitClauses(line) {
  const toks = line.tokens || [];
  const nextMeaningful = (i) => {
    for (let j = i + 1; j < toks.length; j += 1) {
      const t = toks[j];
      if (t.t === "text" && !(t.text || "").trim()) continue;
      return t;
    }
    return null;
  };
  const segs = [];
  let buf = [];
  toks.forEach((tok, i) => {
    if (tok.t === "conn" && buf.length) {
      const next = nextMeaningful(i);
      // a clause-level connector is followed by a new filter's opening token — any
      // non-value, OR a standalone boolean phrase brick (a vbrick that is its own
      // filter, not a continuation value). (oxjob #428 boolean-filter fix.)
      if (next && (next.t !== "vbrick" || next.bool_phrase)) { segs.push(buf); buf = [tok]; return; }
    }
    buf.push(tok);
  });
  if (buf.length) segs.push(buf);
  if (segs.length <= 1) return [line];
  return segs.map((tokens, k) => ({
    ...line, key: `${line.key}~${k}`, tokens, _removeId: null, _hasFieldMenu: false,
  }));
}
