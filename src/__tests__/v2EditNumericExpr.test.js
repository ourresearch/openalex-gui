import { describe, it, expect } from 'vitest';
import {
  numericFiltersToOqo, applyNumericExpr, draftToFilter, draftComplete, makeDraft,
} from '../components/OqlPlayground/v2Edit.js';

// oxjob #527 — turning a parsed numeric expression ([{op, values}]) into the builder's
// two forms: an OQO filter (numericFiltersToOqo, folded by draftToFilter on a new-filter
// draft) and an in-tree mutation of a committed clause (applyNumericExpr, which spawns
// AND-sibling rows for a range).

const COL = 'publication_year';
const simpleClause = () => ({
  node: 'clause', id: 'c1', column_id: COL, column: 'year', operator: 'is',
  leaf: { column_id: COL, value: 2020, operator: 'is' },
});

describe('numericFiltersToOqo', () => {
  it('a single comparison -> a leaf', () => {
    expect(numericFiltersToOqo([{ op: '>=', values: [2000] }], COL))
      .toEqual({ column_id: COL, value: 2000, operator: '>=' });
  });
  it('a value list -> an OR branch of equalities', () => {
    expect(numericFiltersToOqo([{ op: 'is', values: [2020, 2011] }], COL)).toEqual({
      join: 'or',
      filters: [
        { column_id: COL, value: 2020, operator: 'is' },
        { column_id: COL, value: 2011, operator: 'is' },
      ],
    });
  });
  it('a range (two filters) -> an AND group the server flattens into rows', () => {
    expect(numericFiltersToOqo([{ op: '>=', values: [2000] }, { op: '<=', values: [2020] }], COL)).toEqual({
      join: 'and',
      filters: [
        { column_id: COL, value: 2000, operator: '>=' },
        { column_id: COL, value: 2020, operator: '<=' },
      ],
    });
  });
});

describe('applyNumericExpr — committed clause', () => {
  it('a single comparison mutates the clause in place (no new row)', () => {
    const tree = { where: simpleClause() };
    expect(applyNumericExpr(tree, 'c1', [{ op: '>=', values: [2000] }])).toBe(true);
    expect(tree.where.node).toBe('clause');
    expect(tree.where.operator).toBe('>=');
    expect(tree.where.leaf).toEqual({ column_id: COL, value: 2000, operator: '>=' });
  });

  it('a value list converts the clause to a factored OR vgroup', () => {
    const tree = { where: simpleClause() };
    applyNumericExpr(tree, 'c1', [{ op: 'is', values: [2020, 2011] }]);
    expect(tree.where.leaf).toBeUndefined();
    expect(tree.where.value.node).toBe('vgroup');
    expect(tree.where.value.join).toBe('or');
    expect(tree.where.value.children.map((v) => v.value)).toEqual([2020, 2011]);
  });

  it('a range on a sole clause wraps it + a sibling into an implicit AND group', () => {
    const tree = { where: simpleClause() };
    applyNumericExpr(tree, 'c1', [{ op: '>=', values: [2000] }, { op: '<=', values: [2020] }]);
    expect(tree.where.node).toBe('group');
    expect(tree.where.join).toBe('and');
    expect(tree.where.children).toHaveLength(2);
    expect(tree.where.children[0].id).toBe('c1');
    expect(tree.where.children[0].leaf).toMatchObject({ value: 2000, operator: '>=' });
    expect(tree.where.children[1].leaf).toMatchObject({ column_id: COL, value: 2020, operator: '<=' });
  });

  it('a range on a clause already inside a group inserts the sibling right after it', () => {
    const other = { node: 'clause', id: 'cX', column_id: 'type', operator: 'is',
      leaf: { column_id: 'type', value: 'article', operator: 'is' } };
    const tree = { where: { node: 'group', id: 'g', join: 'and', implicit: true, children: [simpleClause(), other] } };
    applyNumericExpr(tree, 'c1', [{ op: '>=', values: [2000] }, { op: '<=', values: [2020] }]);
    expect(tree.where.children.map((c) => c.id).slice(0, 2)).toEqual(['c1', expect.any(String)]);
    expect(tree.where.children).toHaveLength(3);
    expect(tree.where.children[1].leaf).toMatchObject({ value: 2020, operator: '<=' });
    expect(tree.where.children[2].id).toBe('cX'); // unrelated filter preserved after the inserted sibling
  });
});

describe('draft fold honors _numericFilter', () => {
  it('draftComplete is true once a numeric expression is parsed onto the draft', () => {
    const d = makeDraft();
    d.column_id = COL;
    expect(draftComplete(d)).toBe(false); // empty value, no parse yet
    d._numericFilter = numericFiltersToOqo([{ op: '>=', values: [2000] }, { op: '<=', values: [2020] }], COL);
    expect(draftComplete(d)).toBe(true);
  });
  it('draftToFilter returns the pre-built numeric OQO verbatim', () => {
    const d = makeDraft();
    d.column_id = COL;
    d._numericFilter = numericFiltersToOqo([{ op: 'is', values: [2020, 2011] }], COL);
    expect(draftToFilter(d)).toEqual({
      join: 'or',
      filters: [
        { column_id: COL, value: 2020, operator: 'is' },
        { column_id: COL, value: 2011, operator: 'is' },
      ],
    });
  });
});
