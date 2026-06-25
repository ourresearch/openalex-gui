import { describe, it, expect } from 'vitest';
import { proxSegments } from '../components/Oql/proxSegments.js';

// oxjob #514 — render the readable proximity surface form (with the bolded structural
// operator) from a committed value + column. The ONE proximity surface is the leading list
// form `within N (a, b, ...)`. The segments concatenate back to the full surface string (so
// the chip can reuse it as the edit-input text), and the bold span is exactly the `within N`
// operator (or `near`). This is the inverse of searchSurfaceToFilter and a port of the
// backend `_render_term`.

const join = (segs) => segs.map((s) => s.text).join('');
const bolded = (segs) => segs.filter((s) => s.bold).map((s) => s.text.trim()).join('|');

describe('proxSegments (#514)', () => {
  it('exact list proximity: "A"~N~"B" on .search.exact -> within N ("A", "B")', () => {
    const segs = proxSegments('"smart"~3~"phone"', 'display_name.search.exact');
    expect(join(segs)).toBe('within 3 ("smart", "phone")');
    expect(bolded(segs)).toBe('within 3');
  });

  it('stemmed list proximity: "a"~N~"b" on .search -> within N (a, b)', () => {
    const segs = proxSegments('"smart"~3~"phone"', 'display_name.search');
    expect(join(segs)).toBe('within 3 (smart, phone)');
    expect(bolded(segs)).toBe('within 3');
  });

  it('multi-word frozen operands: within N ("machine learning", "neural network")', () => {
    const segs = proxSegments('"machine learning"~5~"neural network"', 'display_name.search.exact');
    expect(join(segs)).toBe('within 5 ("machine learning", "neural network")');
    expect(bolded(segs)).toBe('within 5');
  });

  it('K-ary (3 operands): "a"~N~"b"~"c" -> within N ("a", "b", "c")', () => {
    const segs = proxSegments('"foo"~3~"bar"~"baz"', 'display_name.search.exact');
    expect(join(segs)).toBe('within 3 ("foo", "bar", "baz")');
    expect(bolded(segs)).toBe('within 3');
  });

  it('single-phrase slop "P"~N (OXURL-origin) renders the equivalent list form', () => {
    const segs = proxSegments('"smart phone"~3', 'display_name.search.exact');
    expect(join(segs)).toBe('within 3 ("smart", "phone")');
    expect(bolded(segs)).toBe('within 3');
  });

  it('stemmed adjacent phrase: quoted "P" on .search -> near "P"', () => {
    const segs = proxSegments('"whopper junior"', 'display_name.search');
    expect(join(segs)).toBe('near "whopper junior"');
    expect(bolded(segs)).toBe('near');
  });

  it('treats an unknown / non-search column as exact (operands stay quoted)', () => {
    const segs = proxSegments('"a"~3~"b"', '');
    expect(join(segs)).toBe('within 3 ("a", "b")');
    expect(bolded(segs)).toBe('within 3');
  });

  it('returns null for plain values and for exact quoted phrases (no operator to bold)', () => {
    expect(proxSegments('cat', 'display_name.search')).toBeNull();
    expect(proxSegments('"smart phone"', 'display_name.search.exact')).toBeNull(); // exact phrase, no near
    expect(proxSegments(42, 'publication_year')).toBeNull();
    expect(proxSegments(null, 'display_name.search')).toBeNull();
  });
});
