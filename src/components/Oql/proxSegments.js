// Proximity-operator surface rendering + bolding for a committed search value chip
// (oxjob #514). The chip stores the CANONICAL value (a `~`-string: `"A"~N~"B"` binary,
// `"A"~N~"B"~"C"...` K-ary, or the OXURL-origin single-phrase `"phrase"~N`) plus its column
// (`.search` = stemmed, `.search.exact` = exact). We render the human surface form — the
// inverse of `searchSurfaceToFilter` and a port of the backend `_render_term` (elastic-api
// query_translation/oql_lang.py) — and bold the STRUCTURAL operator (`within N` / `stemmed`),
// the same visual treatment as `not`. The ONE proximity surface is the leading list form:
//   .search (stemmed):       within N (a, b, ...)        |  stemmed "phrase"
//   .search.exact (exact):   within N ("a", "b", ...)
// Operands render bare on a stemmed column, quoted on an exact column — reconstructing the
// input quoting. Driving the bold off the COMMITTED value+column (not the raw typed prefix)
// is what makes it survive the OQL⇄OQO⇄OQL round-trip — the chip shows the same proximity
// operator after a reload that the user typed, and editing the chip shows the same readable
// form `searchSurfaceToFilter` parses back. Returns an ordered [{ text, bold }] segment list
// (the chip renders plain text + `.kwpfx` bold spans); the segments concatenate back to the
// full surface string (so it doubles as the edit-input text). Returns null when the value
// carries no proximity / `stemmed` operator (the chip then shows its plain value verbatim).

const LIST_RE = /^"[^"]*"~(\d+)(?:~"[^"]*")+$/; // "A"~N~"B"[~"C"...]  binary + K-ary list
const SINGLE_RE = /^"(.+)"~(\d+)$/;             // "phrase"~N  single-phrase slop (OXURL-origin)

// Every quoted run in the `~`-string is one operand, in order.
function operandsOf(value) {
  const ops = [];
  const re = /"([^"]*)"/g;
  let m;
  while ((m = re.exec(value)) !== null) ops.push(m[1]);
  return ops;
}

export function proxSegments(value, column) {
  const v = String(value == null ? "" : value);
  const col = String(column == null ? "" : column);
  // Only `.search` is stemmed; `.search.exact` (and an unknown column) is treated as exact,
  // so operands render quoted (frozen) rather than bare.
  const stemmed = col.endsWith(".search") && !col.endsWith(".search.exact");
  const renderOps = (ops) => ops.map((op) => (stemmed ? op : `"${op}"`)).join(", ");

  // list / binary proximity: within N (a, b, ...) — bold the `within N` operator.
  const lst = v.match(LIST_RE);
  if (lst) {
    return [{ text: `within ${lst[1]} `, bold: true }, { text: `(${renderOps(operandsOf(v))})` }];
  }

  // single-phrase slop "phrase"~N (OXURL-origin only — the suffix form was removed): render
  // the equivalent list form by splitting the phrase into operands (matches `_render_term`).
  const single = v.match(SINGLE_RE);
  if (single) {
    const ops = single[1].split(/\s+/).filter(Boolean);
    return [{ text: `within ${single[2]} `, bold: true }, { text: `(${renderOps(ops)})` }];
  }

  // NOTE deliberately NO `stemmed "phrase"` branch here (#560 Phase 3): a quoted value +
  // a `.search` column does NOT imply a stemmed phrase. In a FACTORED clause the clause
  // column is the stemmed BASE for the whole value group even when an individual value is
  // exact — per-value exactness lives in the value's own surface form, which the server
  // bakes into the vleaf `display` (`stemmed "…"` vs `"…"`). Deriving `stemmed` from
  // (value, column) here relabeled exact phrases in or-groups. The `~`-string branches
  // above are safe: that shape is unambiguous whatever the column. Stemmed bolding is
  // display-driven — see surfaceSegments.
  return null;
}

// A baked display surface -> bold segmentation. The server renders the canonical readable
// value surface into the vleaf `display` (factored clauses) / the value segment text
// (simple clauses): `stemmed "…"`, `within N (…)`, `"…"`, or a bare term. We only find the
// structural operator to bold — never reconstruct the surface from (value, column), which
// mislabels per-value exactness (#560 Phase 3, see the note in proxSegments). Returns an
// ordered [{ text, bold }] list, or null when the surface carries no operator (the chip
// then renders it plain). Segments concatenate back to the input string.
export function surfaceSegments(surface) {
  const d = String(surface == null ? "" : surface);
  let m = d.match(/^(within\s+\d+\s*)\(.*\)$/is);
  if (m) return [{ text: m[1], bold: true }, { text: d.slice(m[1].length) }];
  m = d.match(/^(stemmed\s+)".*"$/is);
  if (m) return [{ text: m[1], bold: true }, { text: d.slice(m[1].length) }];
  return null;
}
