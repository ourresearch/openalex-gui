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
  hasSelectedValue,
  sameValue,
  selectedRange,
  setRangeRefinement,
} from '@/components/Oql/refinements';

// oxjob #1232: OQL has no range literal, so the Year slider writes `>=` / `<=` clauses,
// the same shape the API echoes for ?filter=publication_year:2022-2025.
describe('year ranges (the Year slider)', () => {
  const Y = 'publication_year';
  const bound = (operator, value) => ({ column_id: Y, value, operator });
  const set = (rows, lo, hi) => setRangeRefinement(rows, { columnId: Y, lo, hi });

  it('a closed range is two endpoint clauses, never a dash value', () => {
    const rows = set([], 2022, 2025);
    expect(rows).toEqual([bound('>=', 2022), bound('<=', 2025)]);
    expect(rows.some((r) => String(r.value).includes('-'))).toBe(false);
  });
  it('since / until are one clause each', () => {
    expect(set([], 2003, null)).toEqual([bound('>=', 2003)]);
    expect(set([], null, 2010)).toEqual([bound('<=', 2010)]);
  });
  it('one year is a single `is` leaf', () => {
    expect(set([], 2020, 2020)).toEqual([bound('is', 2020)]);
  });
  it('the full range clears every year clause and keeps the rest', () => {
    const type = leaf('type', 'article');
    expect(set([type, bound('>=', 2022), bound('<=', 2025)], null, null)).toEqual([type]);
  });
  it('a new range replaces the old one, including a typed strict bound or year', () => {
    const start = [leaf('type', 'article'), bound('>', 2019), bound('<=', 2025), leaf(Y, 2021)];
    expect(set(start, 2015, 2018)).toEqual([leaf('type', 'article'), bound('>=', 2015), bound('<=', 2018)]);
  });
  it('leaves negated or nested year clauses alone (they are the user\'s)', () => {
    const negated = { ...bound('>=', 2000), is_negated: true };
    const nested = { join: 'or', filters: [bound('>=', 2020), leaf('type', 'review')] };
    expect(set([negated, nested], 2022, null)).toEqual([negated, nested, bound('>=', 2022)]);
  });
  it('reads back what it writes, so the handles restore', () => {
    expect(selectedRange(set([], 2022, 2025), Y)).toEqual({ lo: 2022, hi: 2025 });
    expect(selectedRange(set([], 2003, null), Y)).toEqual({ lo: 2003, hi: null });
    expect(selectedRange(set([], null, 2010), Y)).toEqual({ lo: null, hi: 2010 });
    expect(selectedRange(set([], 2020, 2020), Y)).toEqual({ lo: 2020, hi: 2020 });
    expect(selectedRange([leaf('type', 'article')], Y)).toBeNull();
  });
  it('reads the API echo: no operator means `is`, strict bounds move one year', () => {
    expect(selectedRange([{ column_id: Y, value: 2022 }], Y)).toEqual({ lo: 2022, hi: 2022 });
    expect(selectedRange([bound('>', 2019), bound('<', 2024)], Y)).toEqual({ lo: 2020, hi: 2023 });
    expect(selectedRange([makeRefinementRow(Y, [2018, 2021])], Y)).toEqual({ lo: 2018, hi: 2021 });
  });
});

// oxjob #1744: the facets' "More…" dialog keeps its own list seeded from the echo, so it
// compares with the same rule.
describe('sameValue', () => {
  it('ignores case, so an echoed id matches its facet row', () => {
    expect(sameValue('T10643', 't10643')).toBe(true);
    expect(sameValue('t10643', 't10644')).toBe(false);
    expect(['T10643'].some((v) => sameValue(v, 't10643'))).toBe(true);
  });
});

// oxjob #1745: the API echoes ids upper-case, facets carry them lower-case.
describe('ids match ignoring case', () => {
  const echoed = [{ column_id: 'primary_topic.id', value: 'T10643' }];
  it('a facet value is selected when the echoed row has it in another case', () => {
    expect(hasSelectedValue(echoed, 'primary_topic.id', 't10643')).toBe(true);
    expect(hasSelectedValue(echoed, 'primary_topic.id', 't99999')).toBe(false);
  });
  it('toggling it off removes it instead of adding a duplicate', () => {
    expect(toggleRefinementValue(echoed, { columnId: 'primary_topic.id', value: 't10643' })).toEqual([]);
  });
});

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

// oxjob #1942: the API echoes a collection filter as its own operator, so in OQL mode a
// facet pick ANDs with the collection instead of joining it (the classic `?filter=`
// dialog wrote `col_x|t1`, which the API refuses).
describe('a collection row is never a facet selection', () => {
  const col = { column_id: 'topics.id', value: 'col_F9K8x52ngn', operator: 'in collection' };
  it('is not listed as selected', () => {
    expect(selectedValues([col], 'topics.id')).toEqual([]);
  });
  it('More… dialog picks go in their own row', () => {
    const next = setRefinementValues([col], { columnId: 'topics.id', values: ['t1', 't2'] });
    expect(next).toEqual([col, makeRefinementRow('topics.id', ['t1', 't2'])]);
  });
  it('a row click adds its own row', () => {
    expect(toggleRefinementValue([col], { columnId: 'topics.id', value: 't1' }))
      .toEqual([col, leaf('topics.id', 't1')]);
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
