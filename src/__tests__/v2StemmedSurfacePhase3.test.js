import { describe, it, expect } from 'vitest';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';
import { searchSurfaceToFilter } from '../components/OqlPlayground/oqoTree.js';
import * as edit from '../components/OqlPlayground/v2Edit.js';

// oxjob #560 Phase 3 — the "stemmed" prefix leaked onto quoted (exact) phrases.
//
// Root cause: in a FACTORED clause the clause column is the group's stemmed BASE
// (`title_and_abstract.search`) for every value, even an exact one — per-value
// exactness lives only in the value's SURFACE form, which the server bakes into the
// vleaf `display` (`stemmed "bar baz"` = stemmed, `"bar baz"` = exact). The client
// derived surfaces AND rebuilt OQO off (value, column), so an exact `"bar baz"` in an
// or-group rendered `stemmed "bar baz"` — and the same confusion silently flipped
// exactness on OQO rebuilds in both directions.

// A server-reseeded factored clause: `title/abstract has (foo or <phrase>)`.
const factored = (phraseLeaf) => ({
  where: {
    node: 'clause', id: 'c1', clause_kind: 'text',
    column_id: 'title_and_abstract.search', column: 'title/abstract', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'or', children: [
        { node: 'vleaf', id: 'a', value: 'foo', display: 'foo', negated: false },
        phraseLeaf,
      ],
    },
  },
});

describe('#560 Phase 3 — OQO rebuild routes off the baked display surface', () => {
  it('an EXACT phrase in an or-group stays exact (value `"bar baz"`, display `"bar baz"`)', () => {
    const rows = v2FilterRows(factored(
      { node: 'vleaf', id: 'b', value: '"bar baz"', display: '"bar baz"', negated: false }));
    expect(rows[0].filters.map((f) => f.column_id)).toEqual(
      ['title_and_abstract.search', 'title_and_abstract.search.exact']);
    expect(rows[0].filters[1].value).toBe('"bar baz"');
  });

  it('a STEMMED phrase in an or-group stays stemmed (same value, display `stemmed "bar baz"`)', () => {
    const rows = v2FilterRows(factored(
      { node: 'vleaf', id: 'b', value: '"bar baz"', display: 'stemmed "bar baz"', negated: false }));
    expect(rows[0].filters.map((f) => f.column_id)).toEqual(
      ['title_and_abstract.search', 'title_and_abstract.search']);
    expect(rows[0].filters[1].value).toBe('"bar baz"');
  });

  it('a bare token on an .exact clause keeps exactness via its quoted display (`"zzz"`)', () => {
    const rows = v2FilterRows({
      where: {
        node: 'clause', id: 'c1', clause_kind: 'text',
        column_id: 'title_and_abstract.search.exact', column: 'title/abstract', operator: 'has',
        value: {
          node: 'vgroup', id: 'vg', join: 'or', children: [
            { node: 'vleaf', id: 'a', value: 'zzz', display: '"zzz"', negated: false },
            { node: 'vleaf', id: 'b', value: '"apple"~5~"banana"', display: 'within 5 ("apple", "banana")', negated: false },
          ],
        },
      },
    });
    expect(rows[0].filters.map((f) => f.column_id)).toEqual(
      ['title_and_abstract.search.exact', 'title_and_abstract.search.exact']);
    expect(rows[0].filters[0].value).toBe('zzz');
    expect(rows[0].filters[1].value).toBe('"apple"~5~"banana"');
  });

  it('draftToFilter routes a popped-in committed value off its display too', () => {
    const d = edit.makeDraft();
    edit.draftSetField(d, { column_id: 'title_and_abstract.search', column: 'title/abstract', kind: 'search', op: 'has' });
    d.value.children = [
      { node: 'vleaf', id: 'a', value: '"bar baz"', display: 'stemmed "bar baz"', negated: false },
      { node: 'vleaf', id: 'b', value: '"bar baz"', display: '"bar baz"', negated: false },
    ];
    const f = edit.draftToFilter(d);
    expect(f.filters.map((x) => x.column_id)).toEqual(
      ['title_and_abstract.search', 'title_and_abstract.search.exact']);
  });
});

describe('#560 Phase 3 — an unbalanced leading quote auto-closes as an exact phrase', () => {
  it('`"bar baz` (Enter before the closing quote) -> .search.exact `"bar baz"`', () => {
    expect(searchSurfaceToFilter('"bar baz', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search.exact', value: '"bar baz"' });
  });

  it('single unbalanced token `"bar` -> exact bare token', () => {
    expect(searchSurfaceToFilter('"bar', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search.exact', value: 'bar' });
  });

  it('`stemmed "bar baz` auto-closes on the stemmed column', () => {
    expect(searchSurfaceToFilter('stemmed "bar baz', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search', value: '"bar baz"' });
  });

  it('a lone `"` still falls through to a stemmed literal (nothing to close)', () => {
    expect(searchSurfaceToFilter('"', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search', value: '"' });
  });

  it('balanced forms are untouched', () => {
    expect(searchSurfaceToFilter('"bar baz"', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search.exact', value: '"bar baz"' });
    expect(searchSurfaceToFilter('stemmed "bar baz"', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search', value: '"bar baz"' });
    expect(searchSurfaceToFilter('bar', 'title_and_abstract.search')).toEqual(
      { column_id: 'title_and_abstract.search', value: 'bar' });
  });
});
