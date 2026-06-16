import { describe, it, expect } from 'vitest';
import { wrapValueInGroup, setValue } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #472 gesture 2 — the value-chip "Group" wraps a committed value in a NEW nested
// vgroup seeded with it + an empty sibling, on the committed tree (Option B). These lock
// the model-level guarantees behind the UX: the wrap nests in place (no flatten), the
// inner join is the OPPOSITE of the parent (the only nesting that changes meaning), a typed
// 2nd value round-trips to a real nested group, and ABANDONING collapses cleanly back to the
// original flat value. The browser test covers the transient rendering/commit wiring.

// `title.search has (Boy and Girl and cat)` — a FLAT `and` value group.
const flatTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vg', join: 'and', children: [
        { node: 'vleaf', id: 'boy', value: 'Boy', display: 'Boy', negated: false },
        { node: 'vleaf', id: 'girl', value: 'Girl', display: 'Girl', negated: false },
        { node: 'vleaf', id: 'cat', value: 'cat', display: 'cat', negated: false },
      ],
    },
  },
});

describe('wrapValueInGroup — value-chip "Group" (#472 gesture 2)', () => {
  it('wraps the clicked value in a new inner group with an empty sibling, in place (no flatten)', () => {
    const t = flatTree();
    const res = wrapValueInGroup(t, 'girl');         // "Group" on Girl
    expect(res).toBeTruthy();
    const top = t.where.value;
    // Boy and cat stay as flat siblings; Girl is replaced by the wrapper group, in place.
    expect(top.children.map((c) => c.node)).toEqual(['vleaf', 'vgroup', 'vleaf']);
    expect(top.children[0].id).toBe('boy');
    expect(top.children[2].id).toBe('cat');
    const inner = top.children[1];
    expect(inner.id).toBe(res.innerId);
    expect(inner.children.map((c) => c.id)).toEqual(['girl', res.emptyId]);
    expect(inner.children[1].value).toBe('');         // the empty sibling
  });

  it('the inner group\'s join is the OPPOSITE of the parent (and -> or)', () => {
    const t = flatTree();
    const res = wrapValueInGroup(t, 'girl');
    expect(res.innerJoin).toBe('or');
    expect(t.where.value.children[1].join).toBe('or');
  });

  it('an `or` parent yields an `and` inner group', () => {
    const t = flatTree();
    t.where.value.join = 'or';
    const res = wrapValueInGroup(t, 'girl');
    expect(res.innerJoin).toBe('and');
  });

  it('typing "dog" yields (Boy and (Girl or dog) and cat) in the OQO', () => {
    const t = flatTree();
    const res = wrapValueInGroup(t, 'girl');
    setValue(t, res.emptyId, 'dog');                  // what onValueInput does on commit
    const rows = v2FilterRows(t);                      // the canonical filter the server renders
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('and');
    expect(rows[0].filters).toHaveLength(3);
    const [b, mid, c] = rows[0].filters;
    expect(b.value).toBe('Boy');
    expect(c.value).toBe('cat');
    expect(mid.join).toBe('or');
    expect(mid.filters.map((f) => f.value)).toEqual(['Girl', 'dog']);
  });

  it('abandoning (no 2nd value) strips the empty -> singleton collapses -> original flat value', () => {
    const t = flatTree();
    wrapValueInGroup(t, 'girl');                       // never typed into
    const rows = v2FilterRows(t);                       // what a swap render would send
    expect(rows[0].join).toBe('and');
    // the wrapper is gone: back to a flat (Boy and Girl and cat) — no stray nesting
    expect(rows[0].filters.map((f) => f.value)).toEqual(['Boy', 'Girl', 'cat']);
    expect(rows[0].filters.every((f) => !f.filters)).toBe(true);
  });

  it('returns null for a sole value (nothing to nest within) — caller falls back to add', () => {
    const lone = {
      where: { node: 'clause', id: 'c1', column_id: 'publication_year', operator: 'is',
        leaf: { column_id: 'publication_year', value: 2020 } },
    };
    expect(wrapValueInGroup(lone, 'c1')).toBeNull();    // addressed by the clause id (simple clause)
  });
});
