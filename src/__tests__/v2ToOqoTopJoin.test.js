import { describe, it, expect } from 'vitest';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #475 — the top-level join must reach the OQO. The implicit top-level `where` group is
// AND by default → sibling filter_rows (joined by ` and `). Flipping it to OR must wrap the
// whole body in ONE cross-field OR group row (e.g. `(abstract has banana or title has apple)`),
// not silently stay AND.

const tree = (join) => ({
  where: {
    node: 'group', id: 'w', join, negated: false, paren: false, implicit: true,
    children: [
      { node: 'clause', id: 'c1', column_id: 'abstract.search', operator: 'has',
        leaf: { column_id: 'abstract.search', value: 'banana', operator: 'has' } },
      { node: 'clause', id: 'c2', column_id: 'title.search', operator: 'has',
        leaf: { column_id: 'title.search', value: 'apple', operator: 'has' } },
    ],
  },
});

describe('v2FilterRows — top-level join', () => {
  it('AND top-level body → sibling filter rows (no wrapping group)', () => {
    const rows = v2FilterRows(tree('and'));
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => !r.filters)).toBe(true); // flat leaf rows, no wrapping group
  });

  it('OR top-level body → a single cross-field OR group row', () => {
    const rows = v2FilterRows(tree('or'));
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('or');
    expect(rows[0].filters).toHaveLength(2);
  });

  it('a single-child OR body has no join to express → stays a flat row', () => {
    const t = tree('or');
    t.where.children = [t.where.children[0]];
    const rows = v2FilterRows(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBeUndefined();
  });
});
