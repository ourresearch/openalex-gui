import { describe, it, expect } from 'vitest';
import { negateGroup, addValue } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #428 Issue B — the paren-block `[not]` toolbar mutates the v2 tree; these
// assert the resulting OQO filter_rows (what the server re-renders from). A clause
// group negates via the NNF wrapper shape; a value vgroup negates via De Morgan.

// --- fixtures: minimal oql_render_v2-shaped trees ---------------------------
const clauseGroupTree = () => ({
  where: {
    node: 'group', id: 'g1', join: 'or', negated: false, paren: true, implicit: false,
    children: [
      { node: 'clause', id: 'c1', column_id: 'type', operator: 'is',
        leaf: { column_id: 'type', value: 'types/article', operator: 'is' } },
      { node: 'clause', id: 'c2', column_id: 'language', operator: 'is',
        leaf: { column_id: 'language', value: 'en', operator: 'is' } },
    ],
  },
});

// `title.search has (a or b)` — a factored value vgroup
const valueGroupTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg1', join: 'or', children: [
        { node: 'vleaf', id: 'v1', value: 'a', display: 'a', negated: false },
        { node: 'vleaf', id: 'v2', value: 'b', display: 'b', negated: false },
      ],
    },
  },
});

describe('negateGroup — clause group (NNF wrapper)', () => {
  it('negating sets is_negated on the group filter, preserving join + children', () => {
    const t = clauseGroupTree();
    negateGroup(t, 'g1');
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].is_negated).toBe(true);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters.map((f) => f.column_id)).toEqual(['type', 'language']);
  });

  it('re-negating via the inner paren id un-negates (toggle off)', () => {
    const t = clauseGroupTree();
    negateGroup(t, 'g1');                 // -> outer negated wraps inner plain group
    const inner = t.where.children[0];    // the paren token would carry this id
    expect(t.where.negated).toBe(true);
    negateGroup(t, inner.id);            // clicking the paren `[not]` again
    const rows = v2FilterRows(t);
    expect(rows[0].is_negated).toBeFalsy();
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters.map((f) => f.column_id)).toEqual(['type', 'language']);
  });

  it('negating via the outer id (the `not` chrome) toggles off too', () => {
    const t = clauseGroupTree();
    negateGroup(t, 'g1');
    negateGroup(t, t.where.id);          // outer negated group id = the `not` chrome
    const rows = v2FilterRows(t);
    expect(rows[0].is_negated).toBeFalsy();
  });
});

describe('negateGroup — value vgroup (De Morgan)', () => {
  it('flips the join and negates each leaf', () => {
    const t = valueGroupTree();
    negateGroup(t, 'vg1');
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('and');           // or -> and
    expect(rows[0].filters).toHaveLength(2);
    expect(rows[0].filters.every((f) => f.is_negated)).toBe(true);
  });

  it('is self-inverse (clicking twice returns the original)', () => {
    const t = valueGroupTree();
    negateGroup(t, 'vg1');
    negateGroup(t, 'vg1');
    const rows = v2FilterRows(t);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters.every((f) => !f.is_negated)).toBe(true);
  });
});

describe('addValue — addressed by a vgroup id', () => {
  it('appends an empty sibling leaf to the value group', () => {
    const t = valueGroupTree();
    const nid = addValue(t, 'vg1');
    expect(nid).toBeTruthy();
    expect(t.where.value.children).toHaveLength(3);
    expect(t.where.value.children[2].value).toBe('');
  });
});
