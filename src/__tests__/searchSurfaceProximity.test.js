import { describe, it, expect } from 'vitest';
import { searchSurfaceToFilter } from '../components/OqlPlayground/oqoTree.js';

// oxjob #514 — the no-code builder accepts the friendly `within N words` proximity
// surface and encodes it to the canonical `"phrase"~N` value the engine already
// executes (#355). These encodings are the INVERSE of the backend `_render_term`
// (query_translation/oql_lang.py): rendering the resulting OQO back must reproduce
// the typed surface, so the chip round-trips. Exactness is carried by the column
// (.search = stemmed, .search.exact = exact), so a stemmed proximity keeps `near`.

describe('searchSurfaceToFilter — proximity surfaces (#514)', () => {
  it('encodes an exact proximity phrase: "P" within N words -> .search.exact "P"~N', () => {
    expect(searchSurfaceToFilter('"smart phone" within 3 words', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart phone"~3' });
  });

  it('encodes a stemmed proximity phrase: near "P" within N words -> .search "P"~N', () => {
    expect(searchSurfaceToFilter('near "smart phone" within 3 words', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: '"smart phone"~3' });
  });

  it('encodes binary proximity: "A" within N words of "B" -> .search.exact "A"~N~"B"', () => {
    expect(searchSurfaceToFilter('"machine learning" within 5 words of "neural network"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"machine learning"~5~"neural network"' });
  });

  it('accepts singular "word" and is case-insensitive on the keywords', () => {
    expect(searchSurfaceToFilter('"a b" WITHIN 1 WORD', 'abstract.search'))
      .toEqual({ column_id: 'abstract.search.exact', value: '"a b"~1' });
    expect(searchSurfaceToFilter('NEAR "x y" Within 2 Words', 'abstract.search'))
      .toEqual({ column_id: 'abstract.search', value: '"x y"~2' });
  });

  it('routes against whatever search base the filter is on (keeps the base)', () => {
    expect(searchSurfaceToFilter('"a b" within 4 words', 'fulltext.search'))
      .toEqual({ column_id: 'fulltext.search.exact', value: '"a b"~4' });
    // already-.exact base normalizes to the same base
    expect(searchSurfaceToFilter('"a b" within 4 words', 'fulltext.search.exact'))
      .toEqual({ column_id: 'fulltext.search.exact', value: '"a b"~4' });
  });

  it('still passes through the raw "...""~N tilde forms unchanged', () => {
    expect(searchSurfaceToFilter('"smart phone"~3', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart phone"~3' });
    expect(searchSurfaceToFilter('"a"~3~"b"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"a"~3~"b"' });
  });

  it('still handles the non-proximity forms (near phrase / quoted / bare / wildcard)', () => {
    expect(searchSurfaceToFilter('near "whopper junior"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: '"whopper junior"' });
    expect(searchSurfaceToFilter('"smart phone"', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search.exact', value: '"smart phone"' });
    expect(searchSurfaceToFilter('cat', 'display_name.search'))
      .toEqual({ column_id: 'display_name.search', value: 'cat' });
  });

  it('does NOT treat a `within` phrase without quotes as proximity (needs quotes)', () => {
    // bare text falls through to the plain stemmed branch as a literal search
    const r = searchSurfaceToFilter('foo within 3 words', 'display_name.search');
    expect(r.column_id).toBe('display_name.search');
    expect(r.value).toBe('foo within 3 words');
  });
});
