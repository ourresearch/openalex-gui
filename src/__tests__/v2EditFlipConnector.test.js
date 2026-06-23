import { describe, it, expect } from 'vitest';
import { flipConnector } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #507 Phase 3 — flipConnector flips ONE connector and lets precedence
// (NOT > AND > OR) restructure the single-join group LOCALLY. We assert the
// resulting canonical OQO (what a swap render would send).

const valueGroup = (join, vals) => ({
  where: { node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: { node: 'vgroup', id: 'vg', join,
      children: vals.map((v, i) => ({ node: 'vleaf', id: `v${i}`, value: v, display: v, negated: false })) } },
});

describe('flipConnector — value vgroup', () => {
  it('a or b or c, flip the connector before c (opIndex 2) → a or (b and c)', () => {
    const t = valueGroup('or', ['a', 'b', 'c']);
    expect(flipConnector(t, 'vg', 2)).toBe(true);
    const row = v2FilterRows(t)[0];
    expect(row.join).toBe('or');
    expect(row.filters[0].value).toBe('a');
    expect(row.filters[1].join).toBe('and');
    expect(row.filters[1].filters.map((f) => f.value)).toEqual(['b', 'c']);
  });

  it('a or b or c, flip the connector before b (opIndex 1) → (a and b) or c', () => {
    const t = valueGroup('or', ['a', 'b', 'c']);
    expect(flipConnector(t, 'vg', 1)).toBe(true);
    const row = v2FilterRows(t)[0];
    expect(row.join).toBe('or');
    expect(row.filters[0].join).toBe('and');
    expect(row.filters[0].filters.map((f) => f.value)).toEqual(['a', 'b']);
    expect(row.filters[1].value).toBe('c');
  });

  it('a and b and c, flip the connector before c (opIndex 2) → (a and b) or c', () => {
    const t = valueGroup('and', ['a', 'b', 'c']);
    expect(flipConnector(t, 'vg', 2)).toBe(true);
    const row = v2FilterRows(t)[0];
    expect(row.join).toBe('or');
    expect(row.filters[0].join).toBe('and');
    expect(row.filters[0].filters.map((f) => f.value)).toEqual(['a', 'b']);
    expect(row.filters[1].value).toBe('c');
  });

  it('a or b (2 operands), flip opIndex 1 → a and b (whole-group flip)', () => {
    const t = valueGroup('or', ['a', 'b']);
    expect(flipConnector(t, 'vg', 1)).toBe(true);
    const row = v2FilterRows(t)[0];
    expect(row.join).toBe('and');
    expect(row.filters.map((f) => f.value)).toEqual(['a', 'b']);
  });

  it('a or b or c or d, flip the connector before c → a or (b and c) or d', () => {
    const t = valueGroup('or', ['a', 'b', 'c', 'd']);
    expect(flipConnector(t, 'vg', 2)).toBe(true);
    const row = v2FilterRows(t)[0];
    expect(row.join).toBe('or');
    expect(row.filters.map((f) => (f.join ? `(${f.filters.map((x) => x.value).join(' and ')})` : f.value)))
      .toEqual(['a', '(b and c)', 'd']);
  });

  it('out-of-range opIndex is a no-op (returns false)', () => {
    const t = valueGroup('or', ['a', 'b', 'c']);
    expect(flipConnector(t, 'vg', 0)).toBe(false);
    expect(flipConnector(t, 'vg', 3)).toBe(false);
    expect(flipConnector(t, 'vg', null)).toBe(false);
  });
});

describe('flipConnector — expr group (filters)', () => {
  const filtersRoot = () => ({
    where: { node: 'group', id: 'root', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'type', operator: 'is', leaf: { column_id: 'type', value: 'article' } },
      { node: 'clause', id: 'c2', column_id: 'publication_year', operator: 'is', leaf: { column_id: 'publication_year', value: 2020 } },
      { node: 'clause', id: 'c3', column_id: 'is_oa', operator: 'is', leaf: { column_id: 'is_oa', value: true } },
    ] },
  });

  it('type and year and is_oa, flip connector before is_oa → (type and year) or is_oa', () => {
    const t = filtersRoot();
    expect(flipConnector(t, 'root', 2)).toBe(true);
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);              // top-level OR wraps into one cross-field row
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters[0].join).toBe('and');
    expect(rows[0].filters[0].filters.map((f) => f.column_id)).toEqual(['type', 'publication_year']);
    expect(rows[0].filters[1].column_id).toBe('is_oa');
  });
});
