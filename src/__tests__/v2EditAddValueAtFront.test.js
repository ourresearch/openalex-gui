import { describe, it, expect } from 'vitest';
import { addValueAtFront, setValue } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #475 D3 — the join-chip menu's "add value" inserts at the FRONT of the value group
// (where the user's attention is), not the end. addValueAtFront unshifts an empty vleaf at
// index 0 of the group addressed by its id; the empty leaf is transient (stripped on
// round-trip via vFilled) and commits once the user types.

// `title.search has any (apple or banana)` — a flat value group addressed by `vg`.
const flatGroupTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'or', children: [
        { node: 'vleaf', id: 'apple', value: 'apple', display: 'apple', negated: false },
        { node: 'vleaf', id: 'banana', value: 'banana', display: 'banana', negated: false },
      ],
    },
  },
});

describe('addValueAtFront — value group front insert (#475 D3)', () => {
  it('unshifts an empty vleaf at index 0 and returns its id + the group join', () => {
    const t = flatGroupTree();
    const res = addValueAtFront(t, 'vg');
    expect(res).toBeTruthy();
    expect(res.join).toBe('or');
    const kids = t.where.value.children;
    expect(kids.map((c) => c.id)).toEqual([res.id, 'apple', 'banana']);
    expect(kids[0].value).toBe('');
  });

  it('typing "cherry" yields any (cherry or apple or banana) in the OQO — front order kept', () => {
    const t = flatGroupTree();
    const res = addValueAtFront(t, 'vg');
    setValue(t, res.id, 'cherry');
    const rows = v2FilterRows(t);
    expect(rows[0].filters.map((f) => f.value)).toEqual(['cherry', 'apple', 'banana']);
  });

  it('abandoning (no text) leaves the empty leaf, which v2ToOqo strips', () => {
    const t = flatGroupTree();
    addValueAtFront(t, 'vg');
    const rows = v2FilterRows(t);
    expect(rows[0].filters.map((f) => f.value)).toEqual(['apple', 'banana']);
  });

  it('returns null when the id is not a vgroup (a sole leaf / clause id)', () => {
    const t = flatGroupTree();
    expect(addValueAtFront(t, 'apple')).toBe(null);
    expect(addValueAtFront(t, 'c1')).toBe(null);
  });
});
