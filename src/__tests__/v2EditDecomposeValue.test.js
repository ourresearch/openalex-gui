import { describe, it, expect } from 'vitest';
import { decomposeValue, makeDraft, draftSetField } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #507 Phase 5 + 6 — decomposeValue turns a value chip's typed boolean text
// into the matching value tree, then v2ToOqo emits the canonical filter. We assert
// the resulting OQO (what a swap render sends) rather than internal node ids.

// `title.search has cancer` as a SIMPLE clause (sole value carries the clause id).
const simpleClause = () => ({
  where: { node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
           leaf: { column_id: 'title.search', value: 'cancer' } },
});

// `title.search has (cancer or tumor)` — a FACTORED clause (value vgroup of vleaves).
const factoredClause = () => ({
  where: { node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: { node: 'vgroup', id: 'vg', join: 'or', children: [
      { node: 'vleaf', id: 'v1', value: 'cancer', display: 'cancer', negated: false },
      { node: 'vleaf', id: 'v2', value: 'tumor', display: 'tumor', negated: false },
    ] } },
});

describe('decomposeValue — simple clause', () => {
  it('returns false for a single plain value (caller falls back to setValue)', () => {
    const t = simpleClause();
    expect(decomposeValue(t, 'c1', 'cancer', {}, [])).toBe(false);
    expect(decomposeValue(t, 'c1', 'machine learning', {}, [])).toBe(false);
  });

  it('"a or b or c" splits into a flat OR branch', () => {
    const t = simpleClause();
    expect(decomposeValue(t, 'c1', 'cancer or tumor or neoplasm', {}, [])).toBe(true);
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters.map((f) => f.value)).toEqual(['cancer', 'tumor', 'neoplasm']);
  });

  it('"a and b" splits into an AND branch', () => {
    const t = simpleClause();
    expect(decomposeValue(t, 'c1', 'foo and bar', {}, [])).toBe(true);
    const rows = v2FilterRows(t);
    expect(rows[0].join).toBe('and');
    expect(rows[0].filters.map((f) => f.value)).toEqual(['foo', 'bar']);
  });

  it('parenthesized "(a or b) and c" builds the nested precedence tree (Phase 6)', () => {
    const t = simpleClause();
    expect(decomposeValue(t, 'c1', '(cancer or tumor) and therapy', {}, [])).toBe(true);
    const rows = v2FilterRows(t);
    expect(rows[0].join).toBe('and');
    const [orBranch, leaf] = rows[0].filters;
    expect(orBranch.join).toBe('or');
    expect(orBranch.filters.map((f) => f.value)).toEqual(['cancer', 'tumor']);
    expect(leaf.value).toBe('therapy');
  });

  it('"a and not b" carries negation to the leaf', () => {
    const t = simpleClause();
    expect(decomposeValue(t, 'c1', 'a and not b', {}, [])).toBe(true);
    const rows = v2FilterRows(t);
    const [a, b] = rows[0].filters;
    expect(a.is_negated).toBeFalsy();
    expect(b.value).toBe('b');
    expect(b.is_negated).toBe(true);
  });

  it('numeric column coerces each split value to a Number', () => {
    const t = { where: { node: 'clause', id: 'c1', column_id: 'publication_year', operator: 'is',
                         leaf: { column_id: 'publication_year', value: 2020 } } };
    expect(decomposeValue(t, 'c1', '2020 or 2021', { numeric: true }, [])).toBe(true);
    const rows = v2FilterRows(t);
    expect(rows[0].filters.map((f) => f.value)).toEqual([2020, 2021]);
  });
});

describe('decomposeValue — factored clause (vleaf in a vgroup)', () => {
  it('typing "a or b" into a vleaf of an OR group flattens the siblings in place', () => {
    const t = factoredClause();
    // re-type the FIRST value (v1) as "lung or breast" — same join (or) → flatten
    expect(decomposeValue(t, 'v1', 'lung or breast', {}, [])).toBe(true);
    const vg = t.where.value;
    expect(vg.join).toBe('or');
    expect(vg.children.map((c) => c.value)).toEqual(['lung', 'breast', 'tumor']);
  });

  it('typing "a and b" into a vleaf of an OR group nests an AND subgroup at that slot', () => {
    const t = factoredClause();
    expect(decomposeValue(t, 'v1', 'lung and small-cell', {}, [])).toBe(true);
    const vg = t.where.value;
    expect(vg.children[0].node).toBe('vgroup');
    expect(vg.children[0].join).toBe('and');
    expect(vg.children[0].children.map((c) => c.value)).toEqual(['lung', 'small-cell']);
    expect(vg.children[1].value).toBe('tumor');
    // and the canonical OQO is ((lung and small-cell) or tumor)
    const rows = v2FilterRows(t);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters[0].join).toBe('and');
  });
});

describe('decomposeValue — drafts', () => {
  it('decomposes a draft value box, folding into a valid OQO', () => {
    const d = makeDraft();
    draftSetField(d, { column_id: 'title.search', column: 'title', kind: 'other', op: 'has' });
    const vleafId = d.value.children[0].id;       // the single empty value box
    const drafts = [d];
    expect(decomposeValue({ where: null }, vleafId, 'cancer or tumor', {}, drafts)).toBe(true);
    expect(d.value.join).toBe('or');
    expect(d.value.children.map((c) => c.value)).toEqual(['cancer', 'tumor']);
  });
});
