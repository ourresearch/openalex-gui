import { describe, it, expect } from 'vitest';
import { setColumn } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #467 / #428 — the locked FIELD chip lets a SEARCH filter be re-pointed to a
// sibling search surface (title <-> abstract <-> full text) WITHOUT retyping the
// value: the chip emits `change-field(newColumnId)`, the builder maps it to
// edit.setColumn(tree, clauseId, newColumnId). setColumn swaps only the search BASE
// and preserves each value's own `.search`/`.search.exact` surface suffix. These
// assert the two clause flavors (simple leaf, factored vgroup) re-point correctly,
// that the per-value suffixes survive into the rebuilt OQO, and the no-op guards.

// `title.search contains "exact phrase"` — a SIMPLE clause; the scalar + its exact
// surface live on clause.leaf (the leaf column carries the `.search.exact` suffix).
const simpleExactTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'contains',
    column: 'Title',
    leaf: { column_id: 'title.search.exact', value: 'climate change', operator: 'contains' },
  },
});

// `title.search contains "stemmed"` — SIMPLE clause on the plain (stemmed) surface.
const simpleStemmedTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'contains',
    leaf: { column_id: 'title.search', value: 'amphibian', operator: 'contains' },
  },
});

// `title.search contains (amphibian or "amphibi*")` — FACTORED clause mixing a
// stemmed value and an exact/wildcard one. The vleaves carry NO column_id; each
// value's surface is re-derived from its text at OQO-build time.
const factoredMixedTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'contains',
    value: {
      node: 'vgroup', id: 'vg1', join: 'or', children: [
        { node: 'vleaf', id: 'v1', value: 'amphibian', display: 'amphibian', negated: false },
        { node: 'vleaf', id: 'v2', value: 'amphibi*', display: 'amphibi*', negated: false },
      ],
    },
  },
});

// `publication_year is 2020` — a NON-search simple clause (re-pointing forbidden).
const nonSearchTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'publication_year', operator: 'is',
    leaf: { column_id: 'publication_year', value: '2020', operator: 'is' },
  },
});

describe('setColumn — simple clause', () => {
  it('re-points a stemmed search leaf, keeping the .search surface', () => {
    const t = simpleStemmedTree();
    setColumn(t, 'c1', 'abstract.search');
    expect(t.where.column_id).toBe('abstract.search');
    expect(t.where.leaf.column_id).toBe('abstract.search');
    expect(t.where.leaf.value).toBe('amphibian'); // value untouched
  });

  it('preserves the per-value .search.exact suffix when re-pointing', () => {
    const t = simpleExactTree();
    setColumn(t, 'c1', 'fulltext.search');
    expect(t.where.column_id).toBe('fulltext.search');         // clause base swapped
    expect(t.where.leaf.column_id).toBe('fulltext.search.exact'); // suffix preserved
    expect(t.where.column).toBe('fulltext');                   // display follows
    // the rebuilt OQO carries the new exact column for the value
    const [row] = v2FilterRows(t);
    expect(row.column_id).toBe('fulltext.search.exact');
    expect(row.value).toBe('climate change');
  });
});

describe('setColumn — factored clause (mixed surfaces)', () => {
  it('swaps the clause base; each value re-derives its own suffix on the new base', () => {
    const t = factoredMixedTree();
    setColumn(t, 'c1', 'abstract.search');
    expect(t.where.column_id).toBe('abstract.search');
    // the rebuilt OQO routes the stemmed value to .search and the wildcard to
    // .search.exact — both on the NEW base, with values intact.
    const [row] = v2FilterRows(t);
    expect(row.join).toBe('or');
    const byCol = Object.fromEntries(row.filters.map((f) => [f.column_id, f.value]));
    expect(byCol['abstract.search']).toBe('amphibian');
    expect(byCol['abstract.search.exact']).toBe('amphibi*');
  });
});

describe('setColumn — guards', () => {
  it('is a no-op on a non-search clause', () => {
    const t = nonSearchTree();
    setColumn(t, 'c1', 'abstract.search');
    expect(t.where.column_id).toBe('publication_year');
    expect(t.where.leaf.column_id).toBe('publication_year');
  });

  it('is a no-op when the target is not a search column', () => {
    const t = simpleStemmedTree();
    setColumn(t, 'c1', 'publication_year');
    expect(t.where.column_id).toBe('title.search');
  });

  it('is a no-op on an unknown id (no throw, tree unchanged)', () => {
    const t = simpleStemmedTree();
    expect(() => setColumn(t, 'nope', 'abstract.search')).not.toThrow();
    expect(t.where.column_id).toBe('title.search');
  });
});
