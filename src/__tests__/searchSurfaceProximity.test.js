import { describe, it, expect } from 'vitest';
import { searchSurfaceToFilter } from '../components/OqlPlayground/oqoTree.js';

// oxjob #514 — the no-code builder accepts the friendly list-proximity surface
// `within N (a, b, ...)` and encodes it to the canonical `~`-string value the engine
// executes (binary #355 / K-ary #514). These encodings are the INVERSE of the backend
// `_render_term` (query_translation/oql_lang.py): rendering the resulting OQO back must
// reproduce the typed surface, so the chip round-trips. Stemming is per-leaf and carried by
// the column (all-bare operands -> .search; any quoted -> .search.exact).

describe('searchSurfaceToFilter — proximity surfaces (#514)', () => {
  it('encodes an exact list proximity: within N ("A", "B") -> .search.exact "A"~N~"B"', () => {
    expect(searchSurfaceToFilter('within 3 ("smart", "phone")', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart"~3~"phone"' });
  });

  it('encodes a stemmed list proximity: within N (a, b) -> .search "a"~N~"b"', () => {
    expect(searchSurfaceToFilter('within 3 (smart, phone)', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: '"smart"~3~"phone"' });
  });

  it('encodes multi-word frozen operands: within N ("A B", "C D") -> "A B"~N~"C D"', () => {
    expect(searchSurfaceToFilter('within 5 ("machine learning", "neural network")', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"machine learning"~5~"neural network"' });
  });

  it('encodes K-ary (3+ operands): within N ("a", "b", "c") -> "a"~N~"b"~"c"', () => {
    expect(searchSurfaceToFilter('within 3 ("foo", "bar", "baz")', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"foo"~3~"bar"~"baz"' });
  });

  it('is case-insensitive on the keyword and tolerant of spacing', () => {
    expect(searchSurfaceToFilter('WITHIN 1 (a, b)', 'abstract.search'))
      .toEqual({ column_id: 'abstract.search', value: '"a"~1~"b"' });
    expect(searchSurfaceToFilter('within 2("x","y")', 'abstract.search'))
      .toEqual({ column_id: 'abstract.search.exact', value: '"x"~2~"y"' });
  });

  it('routes against whatever search base the filter is on (keeps the base)', () => {
    expect(searchSurfaceToFilter('within 4 ("a", "b")', 'fulltext.search'))
      .toEqual({ column_id: 'fulltext.search.exact', value: '"a"~4~"b"' });
    // already-.exact base normalizes to the same base
    expect(searchSurfaceToFilter('within 4 ("a", "b")', 'fulltext.search.exact'))
      .toEqual({ column_id: 'fulltext.search.exact', value: '"a"~4~"b"' });
  });

  it('still passes through the raw "..."~N tilde forms unchanged (binary + K-ary)', () => {
    expect(searchSurfaceToFilter('"smart phone"~3', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart phone"~3' });
    expect(searchSurfaceToFilter('"a"~3~"b"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"a"~3~"b"' });
    expect(searchSurfaceToFilter('"a"~3~"b"~"c"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"a"~3~"b"~"c"' });
  });

  it('still handles the non-proximity forms (near phrase / quoted / bare)', () => {
    expect(searchSurfaceToFilter('near "whopper junior"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: '"whopper junior"' });
    expect(searchSurfaceToFilter('"smart phone"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart phone"' });
    expect(searchSurfaceToFilter('cat', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: 'cat' });
  });

  it('a one-operand list is NOT proximity — falls through (needs 2+ operands)', () => {
    // `within 3 ("only")` has one operand: not encoded as proximity here (the backend
    // rejects it with OQL_PROXIMITY_NEEDS_OPERANDS). The builder leaves it as plain text.
    const r = searchSurfaceToFilter('within 3 ("only")', 'display_name.search');
    expect(r.value).not.toMatch(/~/);
  });
});
