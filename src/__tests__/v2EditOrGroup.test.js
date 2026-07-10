import { describe, it, expect } from 'vitest';
import { orDraftOntoRow, removeDisjunct } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';
import { treeRepresentable } from '../components/Oql/representableShape.js';

// oxjob #595 — the ghost `or…` create/extend flow for filter-level or-groups, and the
// per-disjunct delete. These lock the MODEL guarantees: wrap-in-place at fold time only,
// top-level-rows-only (never a shape orRowsOk bounces to the OQL tab), append-to-existing
// group, and dissolve-on-last-disjunct.

const clause = (id, column_id, value) => ({
  node: 'clause', id, column_id, operator: 'has',
  value: {
    node: 'vgroup', id: `${id}vg`, join: 'or',
    children: [{ node: 'vleaf', id: `${id}v1`, value, display: value, negated: false }],
  },
});

// a COMPLETED draft, as makeDraft + draftSetField + a typed value leave it
const draft = (id = 'd1') => ({
  node: 'clause', id, draft: true, column_id: 'default.search', column: 'keyword',
  operator: 'is', clause_kind: 'other', unary: false, numeric: false,
  value: {
    node: 'vgroup', id: `${id}vg`, join: 'or',
    children: [{ node: 'vleaf', id: `${id}v1`, value: 'biology', display: 'biology', negated: false }],
  },
});

// `title has (climate) and year is (2020)` — two flat filters under the implicit root
const twoFilterTree = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and',
    children: [clause('c1', 'title.search', 'climate'), clause('c2', 'year', '2020')],
  },
});

// a single bare filter — `where` IS the clause, no implicit group
const bareClauseTree = () => ({ where: clause('c1', 'title.search', 'climate') });

// an existing 2-disjunct or-group as the first root row
const groupTree = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and',
    children: [
      { node: 'group', id: 'g1', join: 'or', paren: true,
        children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] },
      clause('c2', 'year', '2020'),
    ],
  },
});

describe('orDraftOntoRow — the ghost `or…` fold', () => {
  it('wraps a top-level clause into a fresh or-group with the draft as disjunct 2', () => {
    const tree = twoFilterTree();
    expect(orDraftOntoRow(tree, 'c1', draft())).toBe(true);
    const g = tree.where.children[0];
    expect(g.node).toBe('group');
    expect(g.join).toBe('or');
    expect(g.paren).toBe(true);
    expect(g.children.map((c) => c.id)).toEqual(['c1', 'd1']);
    // the draft clause is a real committed clause now (value subtree carried over)
    expect(g.children[1].column_id).toBe('default.search');
    expect(g.children[1].value.children[0].value).toBe('biology');
    // the sibling filter is untouched
    expect(tree.where.children[1].id).toBe('c2');
    // gate safety: the produced shape renders as or-rows, never bounces to OQL
    expect(treeRepresentable(tree).ok).toBe(true);
    // OQO round-trip: row 0 is a flat or-group
    const rows = v2FilterRows(tree);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters).toHaveLength(2);
  });

  it('wraps a BARE `where` clause (single-filter query, no implicit group)', () => {
    const tree = bareClauseTree();
    expect(orDraftOntoRow(tree, 'c1', draft())).toBe(true);
    expect(tree.where.node).toBe('group');
    expect(tree.where.join).toBe('or');
    expect(tree.where.children.map((c) => c.id)).toEqual(['c1', 'd1']);
    expect(treeRepresentable(tree).ok).toBe(true);
  });

  it('appends the draft to an EXISTING or-group (the extend case)', () => {
    const tree = groupTree();
    expect(orDraftOntoRow(tree, 'g1', draft())).toBe(true);
    const g = tree.where.children[0];
    expect(g.id).toBe('g1');
    expect(g.children.map((c) => c.id)).toEqual(['c1', 'c3', 'd1']);
    expect(treeRepresentable(tree).ok).toBe(true);
  });

  it('extends a bare top-level or-group (`where` IS the group)', () => {
    const tree = { where: { node: 'group', id: 'g1', join: 'or', paren: true,
      children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] } };
    expect(orDraftOntoRow(tree, 'g1', draft())).toBe(true);
    expect(tree.where.children).toHaveLength(3);
    expect(treeRepresentable(tree).ok).toBe(true);
  });

  it('refuses a clause NESTED in a subclause group (would bounce to the OQL tab)', () => {
    const tree = {
      where: {
        node: 'group', id: 'w', implicit: true, join: 'and',
        children: [
          { node: 'group', id: 'ga', join: 'and', paren: true,
            children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] },
        ],
      },
    };
    expect(orDraftOntoRow(tree, 'c1', draft())).toBe(false);
    // the tree is untouched — no wrap happened on the failure path
    expect(tree.where.children[0].id).toBe('ga');
    expect(tree.where.children[0].children).toHaveLength(2);
  });

  it('refuses an AND-joined group target', () => {
    const tree = {
      where: {
        node: 'group', id: 'w', implicit: true, join: 'and',
        children: [
          { node: 'group', id: 'ga', join: 'and', paren: true,
            children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] },
        ],
      },
    };
    expect(orDraftOntoRow(tree, 'ga', draft())).toBe(false);
    expect(tree.where.children[0].children).toHaveLength(2);
  });

  it('returns false for an unknown target id', () => {
    const tree = twoFilterTree();
    expect(orDraftOntoRow(tree, 'nope', draft())).toBe(false);
  });
});

describe('removeDisjunct — per-disjunct delete', () => {
  const threeGroupTree = () => ({
    where: {
      node: 'group', id: 'w', implicit: true, join: 'and',
      children: [
        { node: 'group', id: 'g1', join: 'or', paren: true,
          children: [clause('c1', 'title.search', 'climate'),
                     clause('c3', 'default.search', 'ocean'),
                     clause('c4', 'default.search', 'reef')] },
        clause('c2', 'year', '2020'),
      ],
    },
  });

  it('3 → 2: the group survives with the other disjuncts', () => {
    const tree = threeGroupTree();
    removeDisjunct(tree, 'c3');
    const g = tree.where.children[0];
    expect(g.id).toBe('g1');
    expect(g.children.map((c) => c.id)).toEqual(['c1', 'c4']);
    expect(treeRepresentable(tree).ok).toBe(true);
  });

  it('2 → 1: the group DISSOLVES — the survivor takes its slot (no single-child wrapper)', () => {
    const tree = groupTree();
    removeDisjunct(tree, 'c3');
    expect(tree.where.children[0].node).toBe('clause');
    expect(tree.where.children[0].id).toBe('c1');
    expect(tree.where.children[1].id).toBe('c2');
    const rows = v2FilterRows(tree);
    expect(rows).toHaveLength(2);
    expect(rows[0].join).toBeUndefined();
  });

  it('2 → 1 on a bare `where` group: the survivor becomes the whole where', () => {
    const tree = { where: { node: 'group', id: 'g1', join: 'or', paren: true,
      children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] } };
    removeDisjunct(tree, 'c1');
    expect(tree.where.node).toBe('clause');
    expect(tree.where.id).toBe('c3');
  });

  it('never dissolves a NEGATED group (that would drop the NOT)', () => {
    const tree = { where: { node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'group', id: 'g1', join: 'or', paren: true, negated: true,
        children: [clause('c1', 'title.search', 'climate'), clause('c3', 'default.search', 'ocean')] },
    ] } };
    removeDisjunct(tree, 'c3');
    const g = tree.where.children[0];
    expect(g.node).toBe('group');
    expect(g.negated).toBe(true);
    expect(g.children).toHaveLength(1);
  });
});
