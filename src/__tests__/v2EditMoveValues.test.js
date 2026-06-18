import { describe, it, expect } from 'vitest';
import { moveValues } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #475 — chip-level drag-and-drop. moveValues() moves a SET of value chips
// (vleaves) into a target value list at an index — the "reverse of dragging rows"
// (a vertical insertion line between chips). The server re-canonicalizes joins/parens
// on the next render, so moveValues only needs to produce a valid tree. These lock:
// same-list reorder + index-fix, cross-list move, multi-move doc-order, sole-value
// target promotion, sole-value source removal, and gating/guards.

const vl = (id) => ({ node: 'vleaf', id, value: id, display: id });

// `title.search has (apple or pear or plum)         (c1 / list v1)
//  and abstract.search has (banana or cherry)        (c2 / list v2)
//  and fulltext.search has carrot`                    (c3 / SOLE value, no vgroup)
const fixture = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'title.search', operator: 'matches',
        value: { node: 'vgroup', id: 'v1', join: 'or', children: [vl('apple'), vl('pear'), vl('plum')] } },
      { node: 'clause', id: 'c2', column_id: 'abstract.search', operator: 'matches',
        value: { node: 'vgroup', id: 'v2', join: 'or', children: [vl('banana'), vl('cherry')] } },
      { node: 'clause', id: 'c3', column_id: 'fulltext.search', operator: 'matches',
        value: vl('carrot') },
    ],
  },
});

const vids = (vg) => vg.children.map((c) => c.id);
const vvals = (vg) => vg.children.map((c) => c.value);   // a leaf-sourced vleaf gets a fresh id
const clause = (t, id) => t.where.children.find((c) => c.id === id);

describe('moveValues — same-list reorder (#475)', () => {
  it('moves a later chip to the front (index 0)', () => {
    const t = fixture();
    expect(moveValues(t, ['plum'], 'v1', 0)).toBe(true);
    expect(vids(clause(t, 'c1').value)).toEqual(['plum', 'apple', 'pear']);
  });

  it('applies the index-fix moving forward within the same list', () => {
    const t = fixture();
    // move apple (idx 0) to "after plum" — caller passes targetIndex 3; after the removal
    // of apple the real end slot is 2, so the result is [pear, plum, apple].
    expect(moveValues(t, ['apple'], 'v1', 3)).toBe(true);
    expect(vids(clause(t, 'c1').value)).toEqual(['pear', 'plum', 'apple']);
  });
});

describe('moveValues — cross-list moves (#475)', () => {
  it('moves a chip into another filter’s value list', () => {
    const t = fixture();
    expect(moveValues(t, ['apple'], 'v2', 1)).toBe(true);
    expect(vids(clause(t, 'c1').value)).toEqual(['pear', 'plum']);
    expect(vids(clause(t, 'c2').value)).toEqual(['banana', 'apple', 'cherry']);
  });

  it('multi-move preserves document order regardless of selection order', () => {
    const t = fixture();
    // select plum then apple (reverse doc order); they re-land apple-before-plum.
    expect(moveValues(t, ['plum', 'apple'], 'v2', 2)).toBe(true);
    expect(vids(clause(t, 'c1').value)).toEqual(['pear']);
    expect(vids(clause(t, 'c2').value)).toEqual(['banana', 'cherry', 'apple', 'plum']);
  });
});

describe('moveValues — sole-value clause promotion + source removal (#475)', () => {
  it('promotes a single-value target clause to a list and drops the chip in', () => {
    const t = fixture();
    expect(moveValues(t, ['apple'], 'c3', 0)).toBe(true);
    const c3 = clause(t, 'c3');
    expect(c3.value.node).toBe('vgroup');
    expect(vids(c3.value)).toEqual(['apple', 'carrot']);
    expect(vids(clause(t, 'c1').value)).toEqual(['pear', 'plum']);
  });

  it('removes a clause whose SOLE value was dragged away', () => {
    const t = fixture();
    expect(moveValues(t, ['carrot'], 'v1', 3)).toBe(true);
    expect(vids(clause(t, 'c1').value)).toEqual(['apple', 'pear', 'plum', 'carrot']);
    expect(t.where.children.map((c) => c.id)).toEqual(['c1', 'c2']); // c3 gone
  });
});

// Real server shape: a SIMPLE (single-value) clause stores its scalar on `leaf` (no `value`
// vgroup), and its value chip carries the CLAUSE id. moveValues must drag such a value AND
// accept such a clause as a promote-on-drop target. `(2018 or 2019)`-list + a `cited is 5` leaf.
const mixedShapes = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'publication_year', operator: 'is',
        value: { node: 'vgroup', id: 'v1', join: 'or', children: [vl('2018'), vl('2019')] } },
      { node: 'clause', id: 'c2', column_id: 'cited_by_count', operator: 'is',
        leaf: { column_id: 'cited_by_count', value: 5 } },
    ],
  },
});

describe('moveValues — simple (leaf-shape) clauses (#475)', () => {
  it('drags a simple clause’s sole value into a list (and drops the empty clause)', () => {
    const t = mixedShapes();
    expect(moveValues(t, ['c2'], 'v1', 2)).toBe(true);   // value id === clause id for a leaf clause
    expect(vvals(clause(t, 'c1').value)).toEqual(['2018', '2019', 5]);
    expect(t.where.children.map((c) => c.id)).toEqual(['c1']); // c2 emptied → removed
  });

  it('promotes a simple (leaf) clause target and drops a list value into it', () => {
    const t = mixedShapes();
    expect(moveValues(t, ['2018'], 'c2', 0)).toBe(true);
    const c2 = clause(t, 'c2');
    expect(c2.value.node).toBe('vgroup');
    expect(vvals(c2.value)).toEqual(['2018', 5]);         // promoted, dropped chip before the old scalar
    expect(c2.leaf).toBeUndefined();
    expect(vids(clause(t, 'c1').value)).toEqual(['2019']);
  });
});

describe('moveValues — gating + guards (#475)', () => {
  it('rejects an empty selection', () => {
    expect(moveValues(fixture(), [], 'v1', 0)).toBe(false);
  });

  it('rejects dropping into one of the dragged chips', () => {
    expect(moveValues(fixture(), ['apple'], 'apple', 0)).toBe(false);
  });

  it('rejects a clause-list (group) target — values can’t live among filters', () => {
    expect(moveValues(fixture(), ['apple'], 'w', 0)).toBe(false);
  });

  it('rejects an unknown target', () => {
    expect(moveValues(fixture(), ['apple'], 'ghost', 0)).toBe(false);
  });

  it('produces a valid round-tripping OQO after a cross-list move', () => {
    const t = fixture();
    moveValues(t, ['apple'], 'v2', 2);
    const rows = v2FilterRows(t);
    expect(rows.length).toBe(3); // still three filters, all valid
  });
});
