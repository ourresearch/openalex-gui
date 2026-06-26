import { describe, it, expect } from 'vitest';
import { addAndRow, setValue } from '../components/OqlPlayground/v2Edit.js';

// oxjob #523 Phase 4 — the bottom-edge "& +" add-row target and ⇧Enter (AND=down). addAndRow
// AND-s a NEW empty value with the ENTIRE existing value, producing a new top-level value row
// (a new AND operand), as opposed to addAdjacentValue which tight-binds to ONE neighbour.

const simpleClause = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    leaf: { value: 'apple', display: 'apple', is_negated: false },
  },
});

// `title.search has (apple or banana)` — an OR value bag (one row, two OR terms).
const orBag = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'or', children: [
        { node: 'vleaf', id: 'a', value: 'apple', display: 'apple', negated: false },
        { node: 'vleaf', id: 'b', value: 'banana', display: 'banana', negated: false },
      ],
    },
  },
});

// `title.search has (apple and banana)` — already a top-level AND bag (two rows).
const andBag = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'and', children: [
        { node: 'vleaf', id: 'a', value: 'apple', display: 'apple', negated: false },
        { node: 'vleaf', id: 'b', value: 'banana', display: 'banana', negated: false },
      ],
    },
  },
});

// `title.search has apple` stored FACTORED as a single vleaf (not a `leaf`).
const singleFactored = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: { node: 'vleaf', id: 'a', value: 'apple', display: 'apple', negated: false },
  },
});

describe('addAndRow — append a top-level AND row to a clause value (#523)', () => {
  it('OR bag → wraps the WHOLE group: ((apple or banana) and _)', () => {
    const t = orBag();
    const res = addAndRow(t, 'c1');
    expect(res.join).toBe('and');
    const top = t.where.value;
    expect(top.node).toBe('vgroup');
    expect(top.join).toBe('and');
    // first operand is the original OR group untouched (same id), second is the new empty row.
    expect(top.children[0].id).toBe('vg');
    expect(top.children[0].join).toBe('or');
    expect(top.children[0].children.map((c) => c.id)).toEqual(['a', 'b']);
    expect(top.children[1].id).toBe(res.id);
    expect(top.children[1].value).toBe('');
  });

  it('simple clause → promotes: (apple and _)', () => {
    const t = simpleClause();
    const res = addAndRow(t, 'c1');
    expect(t.where.leaf).toBeUndefined();
    const top = t.where.value;
    expect(top.node).toBe('vgroup');
    expect(top.join).toBe('and');
    expect(top.children[0].value).toBe('apple');
    expect(top.children[1].id).toBe(res.id);
    expect(top.children[1].value).toBe('');
  });

  it('single factored vleaf → wraps: (apple and _)', () => {
    const t = singleFactored();
    const res = addAndRow(t, 'c1');
    const top = t.where.value;
    expect(top.join).toBe('and');
    expect(top.children[0].id).toBe('a');
    expect(top.children[1].id).toBe(res.id);
  });

  it('AND bag → flat append (apple and banana and _)', () => {
    const t = andBag();
    const res = addAndRow(t, 'c1');
    expect(t.where.value.id).toBe('vg'); // same group, not re-wrapped
    expect(t.where.value.join).toBe('and');
    expect(t.where.value.children.map((c) => c.id)).toEqual(['a', 'b', res.id]);
  });

  it('typing into the new AND row yields (apple or banana) and pie', () => {
    const t = orBag();
    const res = addAndRow(t, 'c1');
    setValue(t, res.id, 'pie');
    const top = t.where.value;
    expect(top.join).toBe('and');
    expect(top.children[0].children.map((c) => c.value)).toEqual(['apple', 'banana']);
    expect(top.children[1].value).toBe('pie');
  });

  it('returns null for an unknown id or a non-clause id', () => {
    expect(addAndRow(orBag(), 'nope')).toBe(null);
    expect(addAndRow(orBag(), 'vg')).toBe(null); // a vgroup id, not a clause
  });
});
