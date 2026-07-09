/**
 * oqlRegroup — cursor-preserving mapping for the OQL editor's live regroup (oxjob #587).
 *
 * As the user types, the editor rewrites its buffer to the server's SINGLE-LINE canonical
 * OQL (`/validate` → `oql_oneline`): same grouping/parenthesization, no line breaks. The
 * canonicalizer only ever (a) inserts/removes parentheses, (b) normalizes whitespace/commas,
 * (c) wraps bare values in parens, and (d) normalizes a few tokens (field aliases, e.g.
 * `publication_year` → `year`). Crucially it PRESERVES the user's clause/value ORDER
 * (`sort_operands=False`, charter decision 30) — so the significant, ordered content is
 * invariant and we can re-place the cursor sensibly after swapping the whole document.
 *
 * `mapCursor(oldText, newText, oldPos)` returns where the caret should land in `newText`.
 * Strategy — robust to the dominant "append at the end" flow AND to mid-string paren
 * insertion / token shrink:
 *   1. Longest common PREFIX + longest common SUFFIX (character level). A single localized
 *      edit lives entirely between them.
 *      - caret in the shared prefix  → unchanged offset.
 *      - caret in the shared suffix  → measured back from the end (so appending, and parens
 *        inserted earlier in the line, both keep the caret at its true trailing position).
 *   2. caret in the changed middle → anchor by counting "significant" characters (everything
 *      except parens / commas / whitespace) from the prefix boundary, and re-place after the
 *      same count in the new middle. Best-effort for the rare mid-token edit.
 *
 * Pure, no DOM / CodeMirror deps — unit-tested in src/__tests__/oqlRegroup.test.js
 * (openalex-gui has no component-mount tests; keep logic here, testable).
 */

// Characters that carry no positional "content" — grouping punctuation and whitespace.
// Everything else (letters, digits, quotes, operators, keywords) is "significant" and its
// order is preserved by the order-preserving canonicalizer.
const INSIGNIFICANT = new Set(["(", ")", ",", " ", "\t", "\n", "\r"]);

function countSignificant(str) {
  let n = 0;
  for (const ch of str) if (!INSIGNIFICANT.has(ch)) n++;
  return n;
}

function commonPrefixLen(a, b) {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

// Longest common suffix length, not overlapping the already-claimed prefix of length `p`.
function commonSuffixLen(a, b, p) {
  const max = Math.min(a.length, b.length) - p;
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

/**
 * @param {string} oldText  current editor buffer
 * @param {string} newText  canonical single-line OQL to swap in
 * @param {number} oldPos   caret offset in oldText (0..oldText.length)
 * @returns {number} caret offset in newText (0..newText.length)
 */
export function mapCursor(oldText, newText, oldPos) {
  if (oldText === newText) return oldPos;
  const pos = Math.max(0, Math.min(oldPos, oldText.length));

  const p = commonPrefixLen(oldText, newText);
  const s = commonSuffixLen(oldText, newText, p);

  // caret within the shared leading region
  if (pos <= p) return pos;

  // caret within the shared trailing region — measure from the end so it survives any
  // amount of paren/token churn earlier in the string (this covers the append flow: a
  // caret at end maps to the new end).
  if (pos >= oldText.length - s) return newText.length - (oldText.length - pos);

  // caret in the changed middle — anchor by significant-character count.
  const oldMid = oldText.slice(p, oldText.length - s);
  const newMid = newText.slice(p, newText.length - s);
  const want = countSignificant(oldText.slice(p, pos));

  let seen = 0;
  for (let i = 0; i < newMid.length; i++) {
    if (!INSIGNIFICANT.has(newMid[i])) {
      seen++;
      if (seen === want) return p + i + 1; // just past the want-th significant char
    }
  }
  // ran out of significant chars in the new middle → park at the end of the new middle
  return p + newMid.length;
}
