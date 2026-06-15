import { describe, it, expect } from 'vitest';
import { toggleNeg } from '../components/OqlPlayground/v2Edit.js';

// oxjob #467 — the OqlTextChip `not` affordance toggles negation BOTH ways
// (on and off) by emitting `toggle-neg`, which the builder maps to edit.toggleNeg
// addressed by the chip's tok.id. toggleNeg has two paths: a factored value leaf
// (vleaf.negated) and a simple clause's scalar (clause.leaf.is_negated). These
// assert both flip and are self-inverse — the logic the chip's affordance relies on.

// `title.search contains (a or b)` — factored value vgroup; each value is a vleaf
// addressed by its own id (what the text chip's tok.id is in the factored case).
const valueGroupTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'contains',
    value: {
      node: 'vgroup', id: 'vg1', join: 'or', children: [
        { node: 'vleaf', id: 'v1', value: 'a', display: 'a', negated: false },
        { node: 'vleaf', id: 'v2', value: 'b', display: 'b', negated: false },
      ],
    },
  },
});

// `publication_year is 2020` — a simple clause; the scalar lives on clause.leaf,
// addressed by the clause id (what the text chip's tok.id is in the simple case).
const simpleClauseTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'publication_year', operator: 'is',
    leaf: { column_id: 'publication_year', value: '2020', operator: 'is', is_negated: false },
  },
});

describe('toggleNeg — value leaf (vleaf)', () => {
  it('negates the addressed leaf only, leaving its sibling untouched', () => {
    const t = valueGroupTree();
    toggleNeg(t, 'v1');
    expect(t.where.value.children[0].negated).toBe(true);
    expect(t.where.value.children[1].negated).toBe(false);
  });

  it('is self-inverse (toggling twice restores the original)', () => {
    const t = valueGroupTree();
    toggleNeg(t, 'v1');
    toggleNeg(t, 'v1');
    expect(t.where.value.children[0].negated).toBe(false);
  });
});

describe('toggleNeg — simple clause leaf', () => {
  it('flips is_negated on the clause leaf', () => {
    const t = simpleClauseTree();
    toggleNeg(t, 'c1');
    expect(t.where.leaf.is_negated).toBe(true);
  });

  it('is self-inverse', () => {
    const t = simpleClauseTree();
    toggleNeg(t, 'c1');
    toggleNeg(t, 'c1');
    expect(t.where.leaf.is_negated).toBe(false);
  });
});

describe('toggleNeg — unknown id', () => {
  it('is a no-op (no throw, tree unchanged)', () => {
    const t = valueGroupTree();
    expect(() => toggleNeg(t, 'nope')).not.toThrow();
    expect(t.where.value.children.every((c) => !c.negated)).toBe(true);
  });
});
