import { describe, it, expect } from 'vitest';
import {
  isRefinementRowFor,
  rowValues,
  makeRefinementRow,
  selectedValues,
  toggleRefinementValue,
  setRefinementValue,
  setRefinementValues,
  removeRefinement,
} from '@/components/Oql/refinements';

// oxjob #528 — the stats-widget "refine results" model: a facet click adds a
// TOP-LEVEL AND clause to filter_rows (OR within a facet, AND across facets),
// never splicing into the user's authored nested boolean tree.

const leaf = (column_id, value, extra = {}) => ({ column_id, value, operator: 'is', ...extra });

describe('makeRefinementRow', () => {
  it('0 values → null (caller drops the row)', () => {
    expect(makeRefinementRow('type', [])).toBeNull();
    expect(makeRefinementRow('type', ['', null])).toBeNull();
  });
  it('1 value → a bare leaf', () => {
    expect(makeRefinementRow('type', ['article'])).toEqual(leaf('type', 'article'));
  });
  it('2+ values → an OR group of leaves (OR-within-facet)', () => {
    expect(makeRefinementRow('type', ['article', 'review'])).toEqual({
      join: 'or',
      filters: [leaf('type', 'article'), leaf('type', 'review')],
    });
  });
});

describe('isRefinementRowFor', () => {
  it('matches a plain is-leaf on the column', () => {
    expect(isRefinementRowFor(leaf('type', 'article'), 'type')).toBe(true);
  });
  it('matches an OR-group all on the column', () => {
    expect(isRefinementRowFor(makeRefinementRow('type', ['a', 'b']), 'type')).toBe(true);
  });
  it('does NOT match a negated leaf (include-only v1)', () => {
    expect(isRefinementRowFor(leaf('type', 'article', { is_negated: true }), 'type')).toBe(false);
  });
  it('does NOT match a different column', () => {
    expect(isRefinementRowFor(leaf('type', 'article'), 'publication_year')).toBe(false);
  });
  it('does NOT match a different operator', () => {
    expect(isRefinementRowFor({ column_id: 'type', value: 'a', operator: 'is not' }, 'type')).toBe(false);
  });
  it('does NOT match an AND group (user-authored structure)', () => {
    const andGroup = { join: 'and', filters: [leaf('type', 'a'), leaf('type', 'b')] };
    expect(isRefinementRowFor(andGroup, 'type')).toBe(false);
  });
  it('does NOT match a mixed-column OR group', () => {
    const mixed = { join: 'or', filters: [leaf('type', 'a'), leaf('language', 'en')] };
    expect(isRefinementRowFor(mixed, 'type')).toBe(false);
  });
});

describe('selectedValues', () => {
  it('returns [] when the column is absent', () => {
    expect(selectedValues([leaf('language', 'en')], 'type')).toEqual([]);
  });
  it('returns the single value for a leaf', () => {
    expect(selectedValues([leaf('type', 'article')], 'type')).toEqual(['article']);
  });
  it('returns all values for an OR group', () => {
    expect(selectedValues([makeRefinementRow('type', ['a', 'b'])], 'type')).toEqual(['a', 'b']);
  });
});

describe('toggleRefinementValue', () => {
  it('adds a value to an empty query as a new top-level leaf', () => {
    expect(toggleRefinementValue([], { columnId: 'type', value: 'article' })).toEqual([
      leaf('type', 'article'),
    ]);
  });
  it('a second value on the same facet ORs (the row becomes an OR group)', () => {
    const after1 = toggleRefinementValue([], { columnId: 'type', value: 'article' });
    const after2 = toggleRefinementValue(after1, { columnId: 'type', value: 'review' });
    expect(after2).toEqual([makeRefinementRow('type', ['article', 'review'])]);
  });
  it('a value on a DIFFERENT facet ANDs (a separate top-level row)', () => {
    const rows = toggleRefinementValue([leaf('type', 'article')], {
      columnId: 'open_access.is_oa',
      value: 'true',
    });
    expect(rows).toEqual([leaf('type', 'article'), leaf('open_access.is_oa', 'true')]);
  });
  it('toggling an existing value off removes it; last one removes the row', () => {
    const both = [makeRefinementRow('type', ['article', 'review'])];
    const oneLeft = toggleRefinementValue(both, { columnId: 'type', value: 'review' });
    expect(oneLeft).toEqual([leaf('type', 'article')]); // OR group collapses to a leaf
    const none = toggleRefinementValue(oneLeft, { columnId: 'type', value: 'article' });
    expect(none).toEqual([]); // row dropped entirely
  });
  it('NEVER mutates the input array', () => {
    const input = [leaf('type', 'article')];
    const snapshot = JSON.parse(JSON.stringify(input));
    toggleRefinementValue(input, { columnId: 'type', value: 'review' });
    expect(input).toEqual(snapshot);
  });
  it('leaves an authored nested boolean tree untouched, ANDs the facet onto it', () => {
    // (title.search:covid OR title.search:pandemic) — a single wrapped OR row.
    const authored = {
      join: 'or',
      filters: [leaf('title.search', 'covid'), leaf('title.search', 'pandemic')],
    };
    const rows = toggleRefinementValue([authored], { columnId: 'open_access.is_oa', value: 'true' });
    expect(rows).toEqual([authored, leaf('open_access.is_oa', 'true')]);
    expect(rows[0]).toBe(authored); // same reference — not rewritten
  });
});

describe('setRefinementValue (boolean/range facets)', () => {
  it('replaces any existing simple row for the column', () => {
    const start = [leaf('publication_year', '2010-2015')];
    const next = setRefinementValue(start, { columnId: 'publication_year', value: '2020-' });
    expect(next).toEqual([leaf('publication_year', '2020-')]);
  });
  it('a null/empty value clears the column', () => {
    const start = [leaf('publication_year', '2010-2015'), leaf('type', 'article')];
    const next = setRefinementValue(start, { columnId: 'publication_year', value: null });
    expect(next).toEqual([leaf('type', 'article')]);
  });
});

describe('setRefinementValues (multi-select "More…" dialog)', () => {
  it('replaces the column selection with exactly the given values', () => {
    const start = [makeRefinementRow('type', ['article'])];
    const next = setRefinementValues(start, { columnId: 'type', values: ['review', 'book'] });
    expect(next).toEqual([makeRefinementRow('type', ['review', 'book'])]);
  });
  it('an empty list clears the column', () => {
    const start = [leaf('type', 'article'), leaf('language', 'en')];
    expect(setRefinementValues(start, { columnId: 'type', values: [] })).toEqual([leaf('language', 'en')]);
  });
  it('preserves other facets (AND-across)', () => {
    const start = [leaf('language', 'en')];
    const next = setRefinementValues(start, { columnId: 'type', values: ['article'] });
    expect(next).toEqual([leaf('language', 'en'), leaf('type', 'article')]);
  });
});

describe('removeRefinement', () => {
  it('drops only the named column, keeping the rest', () => {
    const start = [leaf('type', 'article'), leaf('open_access.is_oa', 'true')];
    expect(removeRefinement(start, { columnId: 'type' })).toEqual([leaf('open_access.is_oa', 'true')]);
  });
  it('leaves an authored AND group on the same column untouched', () => {
    const andGroup = { join: 'and', filters: [leaf('type', 'a'), leaf('type', 'b')] };
    expect(removeRefinement([andGroup], { columnId: 'type' })).toEqual([andGroup]);
  });
});

describe('rowValues', () => {
  it('leaf → [value]', () => expect(rowValues(leaf('type', 'article'))).toEqual(['article']));
  it('OR group → all child values', () =>
    expect(rowValues(makeRefinementRow('type', ['a', 'b']))).toEqual(['a', 'b']));
});
