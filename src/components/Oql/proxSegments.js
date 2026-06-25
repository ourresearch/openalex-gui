// Proximity-operator surface rendering + bolding for a committed search value chip
// (oxjob #514). The chip stores the CANONICAL value (`"phrase"~N`, `"A"~N~"B"`, or a
// stemmed `"phrase"`) plus its column (`.search` = stemmed, `.search.exact` = exact).
// We render the human surface form — the inverse of `searchSurfaceToFilter` and a port of
// the backend `_render_term` (elastic-api query_translation/oql_lang.py) — and bold the
// STRUCTURAL keywords (`near` / `within N words` / `of`), the same visual treatment as
// `not`. Surface forms (by column):
//   .search (stemmed):       near "phrase"  |  near "phrase" within N words
//   .search.exact (exact):   "phrase" within N words  |  "A" within N words of "B"
// Driving the bold off the COMMITTED value+column (not the raw typed prefix) is what makes
// it survive the OQL⇄OQO⇄OQL round-trip — the value chip shows the same proximity operator
// after a reload that the user typed, and editing the chip shows the same readable form
// `searchSurfaceToFilter` parses back. Returns an ordered [{ text, bold }] segment list
// (the chip renders plain text + `.kwpfx` bold spans); the segments concatenate back to the
// full surface string (so it doubles as the edit-input text). Returns null when the value
// carries no proximity / `near` operator (the chip then shows its plain value verbatim).

const BINARY_RE = /^"([^"]*)"~(\d+)~"([^"]*)"$/;   // "A"~N~"B"   (binary, exact-only)
const SINGLE_RE = /^"(.+)"~(\d+)$/;                // "phrase"~N  (single-phrase slop)
const PHRASE_RE = /^"(.*)"$/;                      // "phrase"    (a quoted phrase, no slop)

const units = (n) => (n === "1" ? "word" : "words");

export function proxSegments(value, column) {
  const v = String(value == null ? "" : value);
  const col = String(column == null ? "" : column);
  // Only `.search` is stemmed; `.search.exact` (and an unknown column) is treated as exact,
  // so we never wrongly prepend `near` to an exact value.
  const stemmed = col.endsWith(".search") && !col.endsWith(".search.exact");

  // binary proximity: "A" within N words of "B"  (bold the whole connector)
  const bin = v.match(BINARY_RE);
  if (bin) {
    return [
      { text: `"${bin[1]}"` },
      { text: ` within ${bin[2]} ${units(bin[2])} of `, bold: true },
      { text: `"${bin[3]}"` },
    ];
  }

  // single-phrase proximity: "phrase" within N words  (prefixed by `near ` when stemmed)
  const single = v.match(SINGLE_RE);
  if (single) {
    const segs = [{ text: `"${single[1]}"` }, { text: ` within ${single[2]} ${units(single[2])}`, bold: true }];
    return stemmed ? [{ text: "near ", bold: true }, ...segs] : segs;
  }

  // stemmed adjacent phrase: near "phrase"  (the `near` operator with no slop). Exact-column
  // quoted phrases carry no operator to bold, so we leave them to the chip's plain rendering.
  if (stemmed && PHRASE_RE.test(v)) {
    return [{ text: "near ", bold: true }, { text: v }];
  }
  return null;
}
