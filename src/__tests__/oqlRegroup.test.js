import { describe, it, expect } from 'vitest';
import { mapCursor } from '../components/OqlPlayground/oqlRegroup.js';

// oxjob #587 — cursor-preserving mapping for the OQL editor's live regroup. As the user
// types, the buffer is swapped for the server's single-line canonical OQL (`oql_oneline`):
// same grouping, order preserved (decision 30), only parens/whitespace/aliases change.
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

  it('clamps an out-of-range caret', () => {
    const oldT = 'works where title has cat';
    const newT = 'works where title has (cat)';
    expect(mapCursor(oldT, newT, 999)).toBe(newT.length);
    expect(mapCursor(oldT, newT, -5)).toBe(0);
  });
});
