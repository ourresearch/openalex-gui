import { describe, it, expect } from 'vitest';
import { toggleJoin } from '../components/OqlPlayground/v2Edit.js';

// oxjob #475 — the join menu on each group's `(` paren flips that group's join. toggleJoin
// must reach BOTH a nested vgroup/group (via locate) AND the implicit top-level `where` group,
// which locate() skips (it recurses straight into the group's children). The top-level join is
// user-toggleable (a top-level OR wraps the body in a cross-field group), so it must flip.

const tree = () => ({
  where: {
    node: 'group', id: 'w', join: 'and', negated: false, paren: false, implicit: true,
    children: [
      {
        node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
        value: {
          node: 'vgroup', id: 'vg1', join: 'or', children: [
            { node: 'vleaf', id: 'v1', value: 'a', display: 'a', negated: false },
            { node: 'vleaf', id: 'v2', value: 'b', display: 'b', negated: false },
          ],
        },
      },
      { node: 'clause', id: 'c2', column_id: 'type', operator: 'is', leaf: { value: 'article' } },
    ],
  },
});

describe('toggleJoin', () => {
  it('flips a nested value vgroup and is self-inverse', () => {
    const t = tree();
    toggleJoin(t, 'vg1');
    expect(t.where.children[0].value.join).toBe('and');
    toggleJoin(t, 'vg1');
    expect(t.where.children[0].value.join).toBe('or');
  });

  it('flips the implicit top-level where group (the outer all/any block)', () => {
    const t = tree();
    toggleJoin(t, 'w');
    expect(t.where.join).toBe('or');
    toggleJoin(t, 'w');
    expect(t.where.join).toBe('and');
  });

  it('no-ops on an unknown id', () => {
    const t = tree();
    toggleJoin(t, 'nope');
    expect(t.where.join).toBe('and');
    expect(t.where.children[0].value.join).toBe('or');
  });
});
