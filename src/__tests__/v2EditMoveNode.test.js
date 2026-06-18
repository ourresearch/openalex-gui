import { describe, it, expect } from 'vitest';
import { moveNode } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #475 — drag-and-drop logical rows. moveNode() reorders a logical row (an expr
// clause/group, or a value-bag vgroup) among the children of a target container. The
// server re-canonicalizes joins/parens/dots on the next render, so moveNode only needs
// to produce a valid tree. These lock the model: same-parent reorder index-fix,
// cross-parent (cross-level) move, type-compatibility gating, descendant guard, and
// prune of an emptied container.

// `type is article and year is 2020 and is_oa is true` — three flat top-level filters.
const threeFilters = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'type', operator: 'is',
        leaf: { column_id: 'type', value: 'article' } },
      { node: 'clause', id: 'c2', column_id: 'publication_year', operator: 'is',
        leaf: { column_id: 'publication_year', value: 2020 } },
      { node: 'clause', id: 'c3', column_id: 'open_access.is_oa', operator: 'is',
        leaf: { column_id: 'open_access.is_oa', value: true } },
    ],
  },
});

// `(c1 and c2) and c3` — an explicit clause-group `g` plus a flat sibling.
const nestedGroup = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'group', id: 'g', join: 'and', paren: true, children: [
        { node: 'clause', id: 'c1', column_id: 'type', operator: 'is',
          leaf: { column_id: 'type', value: 'article' } },
        { node: 'clause', id: 'c2', column_id: 'publication_year', operator: 'is',
          leaf: { column_id: 'publication_year', value: 2020 } },
      ] },
      { node: 'clause', id: 'c3', column_id: 'language', operator: 'is',
        leaf: { column_id: 'language', value: 'en' } },
    ],
  },
});

// `title_and_abstract.search has ((apple and pear) and (banana or cherry))
//  and fulltext.search has (carrot or vegetable)` — c1 has an OUTER value list `v1`
// holding two NESTED bags (vA, vB); c2's value list `v2` holds loose values. The
// draggable value-bag is a nested vgroup (vA/vB) that is a CHILD of another vgroup.
const nestedValueBags = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'title_and_abstract.search', operator: 'matches',
        value: { node: 'vgroup', id: 'v1', join: 'and', children: [
          { node: 'vgroup', id: 'vA', join: 'and', children: [
            { node: 'vleaf', id: 'apple', value: 'apple', display: 'apple' },
            { node: 'vleaf', id: 'pear', value: 'pear', display: 'pear' },
          ] },
          { node: 'vgroup', id: 'vB', join: 'or', children: [
            { node: 'vleaf', id: 'banana', value: 'banana', display: 'banana' },
            { node: 'vleaf', id: 'cherry', value: 'cherry', display: 'cherry' },
          ] },
        ] } },
      { node: 'clause', id: 'c2', column_id: 'fulltext.search', operator: 'matches',
        value: { node: 'vgroup', id: 'v2', join: 'or', children: [
          { node: 'vleaf', id: 'carrot', value: 'carrot', display: 'carrot' },
          { node: 'vleaf', id: 'vegetable', value: 'vegetable', display: 'vegetable' },
        ] } },
    ],
  },
});

const ids = (arr) => arr.map((c) => c.id);

describe('moveNode — same-parent reorder (#475)', () => {
  it('moves a later filter to the front (index 0)', () => {
    const t = threeFilters();
    expect(moveNode(t, 'c3', 'w', 0)).toBe(true);
    expect(ids(t.where.children)).toEqual(['c3', 'c1', 'c2']);
  });

  it('applies the index-fix when moving forward within the same array', () => {
    const t = threeFilters();
    // move c1 (idx 0) to "between c2 and c3" — caller passes targetIndex 2; after the
    // removal of c1 the real slot is 1, so the result is [c2, c1, c3].
    expect(moveNode(t, 'c1', 'w', 2)).toBe(true);
    expect(ids(t.where.children)).toEqual(['c2', 'c1', 'c3']);
  });

  it('moves to the end', () => {
    const t = threeFilters();
    expect(moveNode(t, 'c1', 'w', 3)).toBe(true);
    expect(ids(t.where.children)).toEqual(['c2', 'c3', 'c1']);
  });
});

describe('moveNode — cross-level filter moves (#475)', () => {
  it('moves a clause-group member OUT to the top level', () => {
    const t = nestedGroup();
    // c2 leaves group g, lands at end of the top-level list
    expect(moveNode(t, 'c2', 'w', 2)).toBe(true);
    expect(ids(t.where.children)).toEqual(['g', 'c3', 'c2']);
    const g = t.where.children.find((c) => c.id === 'g');
    expect(ids(g.children)).toEqual(['c1']);   // c1 stays in g
  });

  it('moves a top-level filter INTO a clause-group', () => {
    const t = nestedGroup();
    expect(moveNode(t, 'c3', 'g', 1)).toBe(true);
    const g = t.where.children.find((c) => c.id === 'g');
    expect(ids(g.children)).toEqual(['c1', 'c3', 'c2']);
    expect(ids(t.where.children)).toEqual(['g']);   // c3 left the top level
  });
});

describe('moveNode — value-bag moves (#475)', () => {
  it('reorders a nested bag within its own value list (vB before vA)', () => {
    const t = nestedValueBags();
    expect(moveNode(t, 'vB', 'v1', 0)).toBe(true);
    expect(ids(t.where.children[0].value.children)).toEqual(['vB', 'vA']);
  });

  it('moves a nested bag into another filter’s value list', () => {
    const t = nestedValueBags();
    expect(moveNode(t, 'vB', 'v2', 2)).toBe(true);
    const v1 = t.where.children[0].value;
    const v2 = t.where.children[1].value;
    expect(ids(v1.children)).toEqual(['vA']);                 // vB left v1
    expect(ids(v2.children)).toEqual(['carrot', 'vegetable', 'vB']);  // vB joined v2
  });
});

describe('moveNode — gating + guards (#475)', () => {
  it('rejects dropping a filter into a value list (filters can’t go inside filters)', () => {
    const t = nestedValueBags();
    expect(moveNode(t, 'c1', 'v2', 0)).toBe(false);
  });

  it('rejects dropping a value-bag into a clause list', () => {
    const t = nestedValueBags();
    expect(moveNode(t, 'vA', 'w', 0)).toBe(false);
  });

  it('rejects dropping a node into its own subtree', () => {
    const t = nestedGroup();
    expect(moveNode(t, 'g', 'g', 0)).toBe(false);   // g into itself
  });

  it('rejects an unknown node or target', () => {
    const t = threeFilters();
    expect(moveNode(t, 'ghost', 'w', 0)).toBe(false);
    expect(moveNode(t, 'c1', 'ghost', 0)).toBe(false);
  });

  it('produces a valid round-tripping OQO after a reorder', () => {
    const t = threeFilters();
    moveNode(t, 'c3', 'w', 0);
    const rows = v2FilterRows(t);
    expect(rows.map((r) => r.column_id)).toEqual(['open_access.is_oa', 'type', 'publication_year']);
  });
});
