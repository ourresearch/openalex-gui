import { describe, it, expect } from 'vitest';
import { mapCursor } from '../components/OqlPlayground/oqlRegroup.js';

// oxjob #587 — cursor-preserving mapping for the OQL editor's live regroup. As the user
// types, the buffer is swapped for the server's FULL canonical OQL (`oql`): same grouping,
// order preserved (decision 30); parens/whitespace/aliases change, including the width-aware
// line breaks + 2-space continuation indent (`\n  and …`) — all insignificant to the mapper.
// mapCursor re-places the caret across that swap. The `|` in a comment marks the caret.

describe('mapCursor', () => {
  it('is identity when the text is unchanged', () => {
    const t = 'works where title has (cat)';
    expect(mapCursor(t, t, 5)).toBe(5);
    expect(mapCursor(t, t, t.length)).toBe(t.length);
  });

  it('keeps the caret at the end when appending (parens inserted earlier)', () => {
    // user paused after typing the whole thing; canonical wraps the value in parens.
    const oldT = 'works where title has cat';
    const newT = 'works where title has (cat)';
    expect(mapCursor(oldT, newT, oldT.length)).toBe(newT.length); // caret stays at true end
  });

  it('keeps the caret at the end when inner precedence parens are added', () => {
    // the headline case: mixed and/or gets its precedence made explicit.
    const oldT = 'works where title has (apple and banana or cherry)';
    const newT = 'works where title has ((apple and banana) or cherry)';
    expect(mapCursor(oldT, newT, oldT.length)).toBe(newT.length);
  });

  it('maps a caret sitting in the shared leading region unchanged', () => {
    const oldT = 'works where title has cat';
    const newT = 'works where title has (cat)';
    // caret after "works whe" — well inside the untouched prefix
    expect(mapCursor(oldT, newT, 9)).toBe(9);
  });

  it('maps a caret in the shared trailing region measured from the end', () => {
    const oldT = 'works where title has apple and banana or cherry cake';
    const newT = 'works where title has ((apple and banana) or cherry) cake';
    // caret right before "cake" (4 chars from the end in both)
    const oldPos = oldT.length - 'cake'.length; // start of "cake"
    const newPos = newT.length - 'cake'.length;
    expect(mapCursor(oldT, newT, oldPos)).toBe(newPos);
  });

  it('handles a shrinking alias without running off the end', () => {
    // publication_year -> year; caret at the very end still lands at the new end.
    const oldT = 'works where publication_year is 2020';
    const newT = 'works where year is (2020)';
    expect(mapCursor(oldT, newT, oldT.length)).toBe(newT.length);
  });

  it('anchors a mid-string caret by significant-character count', () => {
    // caret between "app" and "le" inside the first value; regrouping adds parens around
    // the group. The caret should stay just after the 3rd significant char of the middle.
    const oldT = 'works where title has (apple and banana or cherry)';
    const newT = 'works where title has ((apple and banana) or cherry)';
    const oldPos = oldT.indexOf('apple') + 3; // caret after "app"
    const mapped = mapCursor(oldT, newT, oldPos);
    // must land after "app" in the new text too (before "le")
    expect(newT.slice(0, mapped).endsWith('app')).toBe(true);
  });

  it('does not preserve a quoted phrase\'s inner spaces as insignificant boundaries', () => {
    // quotes + inner letters are significant; a caret at end maps to end regardless.
    const oldT = 'works where title has "climate change"';
    const newT = 'works where title has ("climate change")';
    expect(mapCursor(oldT, newT, oldT.length)).toBe(newT.length);
  });

  // --- multi-line canonical (v2: live regroup applies the FULL tidy formatting) --------
  // Real prod shape (2026-07-10): a >80-char query breaks into `and`-led continuation
  // lines with a 2-space indent, e.g.
  //   works where title has ((apple and banana) or cherry)
  //     and year is (2020)
  //     and type is (article)

  const FLAT =
    'works where title has (apple and banana or cherry) and year is 2020 and type is article and is_oa is true';
  const CANON =
    'works where title has ((apple and banana) or cherry)\n' +
    '  and year is (2020)\n' +
    '  and type is (article)\n' +
    '  and open access is (true)';

  it('keeps the caret at the end when the rewrite goes multi-line', () => {
    // the append flow: user just finished typing the flat query; canonical inserts
    // parens, newlines, indent, AND rewrites an alias (is_oa -> open access).
    expect(mapCursor(FLAT, CANON, FLAT.length)).toBe(CANON.length);
  });

  it('maps a caret in the shared prefix unchanged across a multi-line rewrite', () => {
    expect(mapCursor(FLAT, CANON, 9)).toBe(9); // after "works whe"
  });

  it('maps a mid-string caret across inserted newlines + indent by significant chars', () => {
    // caret after "202" inside the year value; new text has a newline + indent before it.
    const oldPos = FLAT.indexOf('2020') + 3;
    const mapped = mapCursor(FLAT, CANON, oldPos);
    expect(CANON.slice(0, mapped).endsWith('202')).toBe(true);
  });

  it('is stable when appending to an already multi-line canonical buffer', () => {
    // post-regroup steady state: the buffer IS multi-line; user keeps typing at the end
    // and the next canonical re-lays it out. Caret must stay at the true end.
    const oldT = CANON + ' and cites 5';
    const newT =
      'works where title has ((apple and banana) or cherry)\n' +
      '  and year is (2020)\n' +
      '  and type is (article)\n' +
      '  and open access is (true)\n' +
      '  and cites (5)';
    expect(mapCursor(oldT, newT, oldT.length)).toBe(newT.length);
  });

  it('maps a caret on a continuation line measured from the end (indent churn earlier)', () => {
    // caret right before "cherry" — inside the shared trailing region of a rewrite that
    // only changed text earlier in the string.
    const oldT = 'works where title has (apple and banana or cherry)\n  and year is (2020)';
    const newT = 'works where title has ((apple and banana) or cherry)\n  and year is (2020)';
    const oldPos = oldT.indexOf('cherry');
    const newPos = newT.indexOf('cherry');
    expect(mapCursor(oldT, newT, oldPos)).toBe(newPos);
  });

  it('clamps an out-of-range caret', () => {
    const oldT = 'works where title has cat';
    const newT = 'works where title has (cat)';
    expect(mapCursor(oldT, newT, 999)).toBe(newT.length);
    expect(mapCursor(oldT, newT, -5)).toBe(0);
  });
});
