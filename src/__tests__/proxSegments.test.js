import { describe, it, expect } from 'vitest';
import { proxSegments } from '../components/Oql/proxSegments.js';

// oxjob #514 — render the readable proximity surface form (with bolded structural
// keywords) from a committed value + column. The segments concatenate back to the full
// surface string (so the chip can reuse it as the edit-input text), and the bold spans
// are exactly the structural operators `near` / `within N words` / `of`. This is the
// inverse of searchSurfaceToFilter and a port of the backend `_render_term`.

const join = (segs) => segs.map((s) => s.text).join('');
const bolded = (segs) => segs.filter((s) => s.bold).map((s) => s.text.trim()).join('|');

describe('proxSegments (#514)', () => {
  it('exact proximity: "P"~N on .search.exact -> "P" within N words', () => {
    const segs = proxSegments('"smart phone"~3', 'display_name.search.exact');
    expect(join(segs)).toBe('"smart phone" within 3 words');
    expect(bolded(segs)).toBe('within 3 words');
  });

  it('stemmed proximity: "P"~N on .search -> near "P" within N words', () => {
    const segs = proxSegments('"smart phone"~3', 'display_name.search');
    expect(join(segs)).toBe('near "smart phone" within 3 words');
    expect(bolded(segs)).toBe('near|within 3 words');
  });

  it('binary proximity: "A"~N~"B" -> "A" within N words of "B"', () => {
    const segs = proxSegments('"machine learning"~5~"neural network"', 'display_name.search.exact');
    expect(join(segs)).toBe('"machine learning" within 5 words of "neural network"');
    expect(bolded(segs)).toBe('within 5 words of');
  });

  it('stemmed adjacent phrase: quoted "P" on .search -> near "P"', () => {
    const segs = proxSegments('"whopper junior"', 'display_name.search');
    expect(join(segs)).toBe('near "whopper junior"');
    expect(bolded(segs)).toBe('near');
  });

  it('uses singular "word" for N == 1', () => {
    expect(bolded(proxSegments('"a b"~1', 'abstract.search.exact'))).toBe('within 1 word');
  });

  it('treats an unknown / non-search column as exact (never prepends near)', () => {
    const segs = proxSegments('"a b"~3', '');
    expect(join(segs)).toBe('"a b" within 3 words');
    expect(bolded(segs)).toBe('within 3 words');
  });

  it('returns null for plain values and for exact quoted phrases (no operator to bold)', () => {
    expect(proxSegments('cat', 'display_name.search')).toBeNull();
    expect(proxSegments('"smart phone"', 'display_name.search.exact')).toBeNull(); // exact phrase, no near
    expect(proxSegments(42, 'publication_year')).toBeNull();
    expect(proxSegments(null, 'display_name.search')).toBeNull();
  });
});
