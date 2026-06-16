import { describe, it, expect } from 'vitest';
import { addValueAfter, joinOfValue, setValue } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #472 — scalar "New" INSIDE a nested ( ) group edits the COMMITTED tree
// directly (Option B), never the flat draft. These lock in the core correctness
// property the snackbar guard used to protect against: the inner parens survive and
// the sibling group is untouched (no flatten). This is the model-level guarantee
// behind the UX; the browser test covers the rendering/commit wiring.

// `title.search has ((Boy or Girl) and (cat or dog))` — a NESTED value tree:
// an outer `and` vgroup whose two children are themselves `or` vgroups.
const nestedTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'vgOuter', join: 'and', children: [
        { node: 'vgroup', id: 'vgL', join: 'or', children: [
          { node: 'vleaf', id: 'boy', value: 'Boy', display: 'Boy', negated: false },
          { node: 'vleaf', id: 'girl', value: 'Girl', display: 'Girl', negated: false },
        ] },
        { node: 'vgroup', id: 'vgR', join: 'or', children: [
          { node: 'vleaf', id: 'cat', value: 'cat', display: 'cat', negated: false },
          { node: 'vleaf', id: 'dog', value: 'dog', display: 'dog', negated: false },
        ] },
      ],
    },
  },
});

describe('addValueAfter — inside a nested value group (#472)', () => {
  it('inserts the empty sibling INTO the clicked value\'s own inner group (no flatten)', () => {
    const t = nestedTree();
    const nid = addValueAfter(t, 'girl');           // "New" on Girl
    expect(nid).toBeTruthy();
    // the new empty leaf landed in the LEFT inner group, right after Girl…
    const left = t.where.value.children[0];
    expect(left.id).toBe('vgL');
    expect(left.children.map((c) => c.id)).toEqual(['boy', 'girl', nid]);
    expect(left.children[2].value).toBe('');
    // …and the structure is still two nested groups under an `and` (NOT flattened)
    expect(t.where.value.join).toBe('and');
    expect(t.where.value.children.map((c) => c.node)).toEqual(['vgroup', 'vgroup']);
    // the RIGHT group is byte-for-byte untouched
    expect(t.where.value.children[1]).toEqual({
      node: 'vgroup', id: 'vgR', join: 'or', children: [
        { node: 'vleaf', id: 'cat', value: 'cat', display: 'cat', negated: false },
        { node: 'vleaf', id: 'dog', value: 'dog', display: 'dog', negated: false },
      ],
    });
  });

  it('joinOfValue returns the inner group\'s join (the connector the box renders with)', () => {
    const t = nestedTree();
    const nid = addValueAfter(t, 'girl');
    expect(joinOfValue(t, nid)).toBe('or');         // inner group is `or`, not the outer `and`
  });

  it('typing "kid" yields ((Boy or Girl or kid) and (cat or dog)) in the OQO', () => {
    const t = nestedTree();
    const nid = addValueAfter(t, 'girl');
    setValue(t, nid, 'kid');                        // what onValueInput does on commit
    const rows = v2FilterRows(t);                   // the canonical filter the server renders
    expect(rows).toHaveLength(1);
    expect(rows[0].join).toBe('and');
    expect(rows[0].filters).toHaveLength(2);
    const [l, r] = rows[0].filters;
    expect(l.join).toBe('or');
    expect(l.filters.map((f) => f.value)).toEqual(['Boy', 'Girl', 'kid']);
    expect(r.join).toBe('or');
    expect(r.filters.map((f) => f.value)).toEqual(['cat', 'dog']);
  });

  it('abandoning (no text typed) leaves the empty leaf, which v2ToOqo strips (vFilled)', () => {
    const t = nestedTree();
    addValueAfter(t, 'girl');                       // never typed into
    const rows = v2FilterRows(t);                   // what a swap render would send
    const [l, r] = rows[0].filters;
    expect(l.filters.map((f) => f.value)).toEqual(['Boy', 'Girl']);   // empty dropped
    expect(r.filters.map((f) => f.value)).toEqual(['cat', 'dog']);
  });
});
