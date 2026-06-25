import { describe, it, expect } from 'vitest';
import { addOuterAdjacentValue, setValue } from '../components/OqlPlayground/v2Edit.js';

// oxjob #507 — the per-line arrow (↧). Adds a term with the OPPOSITE conjunction, which wraps
// the WHOLE line-group in a new precedence level (vs. addAdjacentValue, which nests only the
// single clicked value). So `(a or b)` + AND-on-the-line → `((a or b) and _)`, not `a or (b and _)`.

const simpleClause = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    leaf: { value: 'cancer', display: 'cancer', is_negated: false },
  },
});

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

// `title has ((a and b) or c)` — a nested AND group inside an OR bag; the inner AND group is
// the "line" the user sees (`a & b`).
const nestedAndInOr = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'outer', join: 'or', children: [
        { node: 'vgroup', id: 'inner', join: 'and', children: [
          { node: 'vleaf', id: 'a', value: 'a', display: 'a', negated: false },
          { node: 'vleaf', id: 'b', value: 'b', display: 'b', negated: false },
        ] },
        { node: 'vleaf', id: 'c', value: 'c', display: 'c', negated: false },
      ],
    },
  },
});

describe('addOuterAdjacentValue — the per-line arrow / opposite conjunction (#507)', () => {
  it('simple clause behaves like addAdjacentValue (2-child group)', () => {
    const t = simpleClause();
    const res = addOuterAdjacentValue(t, 'c1', 'and');
    expect(t.where.value.node).toBe('vgroup');
    expect(t.where.value.join).toBe('and');
    expect(t.where.value.children.map((c) => c.value)).toEqual(['cancer', '']);
    expect(res.join).toBe('and');
  });

  it('OR bag + AND wraps the WHOLE bag: ((a or b) and _)', () => {
    const t = orBag();
    const res = addOuterAdjacentValue(t, 'b', 'and');
    const top = t.where.value;
    expect(top.node).toBe('vgroup');
    expect(top.join).toBe('and');
    // first child is the original OR group untouched
    expect(top.children[0].id).toBe('vg');
    expect(top.children[0].join).toBe('or');
    expect(top.children[0].children.map((c) => c.id)).toEqual(['a', 'b']);
    // second child is the new empty value
    expect(top.children[1].id).toBe(res.id);
    expect(top.children[1].value).toBe('');
  });

  it('OR bag + OR (same join) just appends a flat sibling', () => {
    const t = orBag();
    const res = addOuterAdjacentValue(t, 'b', 'or');
    expect(t.where.value.id).toBe('vg');
    expect(t.where.value.children.map((c) => c.id)).toEqual(['a', 'b', res.id]);
  });

  it('nested AND group + OR wraps the INNER AND group, leaving the outer OR intact', () => {
    const t = nestedAndInOr();
    const res = addOuterAdjacentValue(t, 'b', 'or'); // b lives in the inner AND group
    const outer = t.where.value;
    expect(outer.id).toBe('outer');
    expect(outer.join).toBe('or');
    // the inner AND group got replaced by a new OR wrapper holding it + the new value
    const wrapper = outer.children[0];
    expect(wrapper.node).toBe('vgroup');
    expect(wrapper.join).toBe('or');
    expect(wrapper.children[0].id).toBe('inner');
    expect(wrapper.children[0].join).toBe('and');
    expect(wrapper.children[1].id).toBe(res.id);
    expect(outer.children[1].id).toBe('c');
  });

  it('typing into the new value fills it', () => {
    const t = orBag();
    const res = addOuterAdjacentValue(t, 'b', 'and');
    setValue(t, res.id, 'mouse');
    expect(t.where.value.children[1].value).toBe('mouse');
  });

  it('returns null for an unknown id', () => {
    expect(addOuterAdjacentValue(simpleClause(), 'nope', 'and')).toBe(null);
  });
});
