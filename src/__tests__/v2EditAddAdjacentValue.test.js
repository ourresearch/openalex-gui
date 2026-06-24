import { describe, it, expect } from 'vitest';
import { addAdjacentValue, prependBagValue, setValue } from '../components/OqlPlayground/v2Edit.js';

// oxjob #507 — the per-line `+` menu. AND/OR after a value chip (addAdjacentValue) and
// AND/OR on a value-bag header line (prependBagValue) insert a new value with the chosen
// join, restructuring by standard precedence (NOT > AND > OR) when the join differs from
// the value's existing group.

const simpleClause = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    leaf: { value: 'cancer', display: 'cancer', is_negated: false },
  },
});

// `title.search has (a or b)` — an OR value bag.
const orBag = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'or', children: [
        { node: 'vleaf', id: 'a', value: 'a', display: 'a', negated: false },
        { node: 'vleaf', id: 'b', value: 'b', display: 'b', negated: false },
      ],
    },
  },
});

// `title.search has (a and b)` — an AND value bag.
const andBag = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'and', children: [
        { node: 'vleaf', id: 'a', value: 'a', display: 'a', negated: false },
        { node: 'vleaf', id: 'b', value: 'b', display: 'b', negated: false },
      ],
    },
  },
});

describe('addAdjacentValue — AND/OR after a value chip (#507)', () => {
  it('simple clause + AND promotes to an AND vgroup [cur, empty]', () => {
    const t = simpleClause();
    const res = addAdjacentValue(t, 'c1', 'and');
    expect(res.join).toBe('and');
    expect(t.where.leaf).toBeUndefined();
    const bag = t.where.value;
    expect(bag.node).toBe('vgroup');
    expect(bag.join).toBe('and');
    expect(bag.children.map((c) => c.value)).toEqual(['cancer', '']);
    expect(bag.children[1].id).toBe(res.id);
  });

  it('simple clause + OR promotes to an OR vgroup', () => {
    const t = simpleClause();
    const res = addAdjacentValue(t, 'c1', 'or');
    expect(t.where.value.join).toBe('or');
    expect(res.join).toBe('or');
  });

  it('OR bag, +OR after b appends a flat sibling (same-join run stays flat)', () => {
    const t = orBag();
    const res = addAdjacentValue(t, 'b', 'or');
    const kids = t.where.value.children;
    expect(kids.map((c) => c.id)).toEqual(['a', 'b', res.id]);
    expect(t.where.value.join).toBe('or');
  });

  it('OR bag, +AND on b nests an AND subgroup (precedence: a or (b and _))', () => {
    const t = orBag();
    const res = addAdjacentValue(t, 'b', 'and');
    const kids = t.where.value.children;
    expect(t.where.value.join).toBe('or');
    expect(kids[0].id).toBe('a');
    const sub = kids[1];
    expect(sub.node).toBe('vgroup');
    expect(sub.join).toBe('and');
    expect(sub.children.map((c) => c.id)).toEqual(['b', res.id]);
  });

  it('AND bag, +AND after b appends a flat sibling', () => {
    const t = andBag();
    const res = addAdjacentValue(t, 'b', 'and');
    expect(t.where.value.children.map((c) => c.id)).toEqual(['a', 'b', res.id]);
    expect(t.where.value.join).toBe('and');
  });

  it('AND bag, +OR on b nests an OR subgroup ((a and (b or _)))', () => {
    const t = andBag();
    const res = addAdjacentValue(t, 'b', 'or');
    const sub = t.where.value.children[1];
    expect(sub.join).toBe('or');
    expect(sub.children.map((c) => c.id)).toEqual(['b', res.id]);
  });

  it('typing into the new AND value yields the factored bag', () => {
    const t = simpleClause();
    const res = addAdjacentValue(t, 'c1', 'and');
    setValue(t, res.id, 'therapy');
    expect(t.where.value.children.map((c) => c.value)).toEqual(['cancer', 'therapy']);
  });

  it('returns null for an unknown id', () => {
    expect(addAdjacentValue(simpleClause(), 'nope', 'and')).toBe(null);
  });
});

describe('prependBagValue — AND/OR on a header line, front insert (#507)', () => {
  it('OR bag + OR-front unshifts a sibling at index 0', () => {
    const t = orBag();
    const res = prependBagValue(t, 'c1', 'or');
    const kids = t.where.value.children;
    expect(kids.map((c) => c.id)).toEqual([res.id, 'a', 'b']);
    expect(t.where.value.join).toBe('or');
  });

  it('OR bag + AND-front wraps the whole bag (_ and (a or b))', () => {
    const t = orBag();
    const res = prependBagValue(t, 'c1', 'and');
    const top = t.where.value;
    expect(top.join).toBe('and');
    expect(top.children[0].id).toBe(res.id);
    expect(top.children[1].node).toBe('vgroup');
    expect(top.children[1].join).toBe('or');
    expect(top.children[1].children.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('AND bag + AND-front unshifts a sibling', () => {
    const t = andBag();
    const res = prependBagValue(t, 'c1', 'and');
    expect(t.where.value.children.map((c) => c.id)).toEqual([res.id, 'a', 'b']);
  });

  it('simple clause degrades to a promote', () => {
    const t = simpleClause();
    const res = prependBagValue(t, 'c1', 'or');
    expect(t.where.value.node).toBe('vgroup');
    expect(res.join).toBe('or');
  });

  it('returns null for a non-clause id', () => {
    expect(prependBagValue(orBag(), 'vg', 'or')).toBe(null);
  });
});
