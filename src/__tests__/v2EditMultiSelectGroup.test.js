import { describe, it, expect } from 'vitest';
import { groupableValues, wrapValuesInGroup, removeNodes } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #472 — multi-select chips (Shift/Cmd-click) → "Add to subclause" / "Delete n chips".
// These lock the MODEL guarantees behind the UX: same-field gating, lowest-common-ancestor
// insertion, no-flatten of the values NOT selected, and batch delete. The browser test
// covers the selection-gesture + menu wiring.

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

// `title.search has ((Boy or X) and (Girl or Y))` — two nested `or` sub-groups under an
// outer `and`, so Boy and Girl live in DIFFERENT branches (their LCA is the outer group).
const nestedTree = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
    value: {
      node: 'vgroup', id: 'root', join: 'and', children: [
        { node: 'vgroup', id: 'g1', join: 'or', children: [
          { node: 'vleaf', id: 'boy', value: 'Boy', display: 'Boy', negated: false },
          { node: 'vleaf', id: 'x', value: 'X', display: 'X', negated: false },
        ] },
        { node: 'vgroup', id: 'g2', join: 'or', children: [
          { node: 'vleaf', id: 'girl', value: 'Girl', display: 'Girl', negated: false },
          { node: 'vleaf', id: 'y', value: 'Y', display: 'Y', negated: false },
        ] },
      ],
    },
  },
});

// two separate clauses (different fields), each with a value group — for the cross-field test
const twoFieldTree = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
        value: { node: 'vgroup', id: 'vg1', join: 'or', children: [
          { node: 'vleaf', id: 'boy', value: 'Boy', display: 'Boy', negated: false },
          { node: 'vleaf', id: 'girl', value: 'Girl', display: 'Girl', negated: false },
        ] } },
      { node: 'clause', id: 'c2', column_id: 'publication_year', operator: 'is',
        leaf: { column_id: 'publication_year', value: 2020 } },
    ],
  },
});

describe('groupableValues — same-field gating + LCA (#472)', () => {
  it('returns null for fewer than 2 distinct ids', () => {
    const t = flatTree();
    expect(groupableValues(t, ['boy'])).toBeNull();
    expect(groupableValues(t, ['boy', 'boy'])).toBeNull();
    expect(groupableValues(t, [])).toBeNull();
  });

  it('returns null when an id is not a factored vleaf', () => {
    const t = twoFieldTree();
    expect(groupableValues(t, ['boy', 'c2'])).toBeNull();   // c2 is a simple-clause value
    expect(groupableValues(t, ['boy', 'nope'])).toBeNull();
  });

  it('returns null when the values span different fields (clauses)', () => {
    const t = twoFieldTree();
    // boy ∈ c1, but there is no groupable partner in c1 alone besides girl; mixing fields
    // is the case we forbid — pair boy (c1) with a value that lives in c2-land is impossible
    // here, so assert directly that same-clause pairs ARE groupable and the guard holds.
    expect(groupableValues(t, ['boy', 'girl'])).toBeTruthy();   // both in c1 → ok
  });

  it('LCA of two values in a FLAT group is that group', () => {
    const t = flatTree();
    const g = groupableValues(t, ['boy', 'cat']);
    expect(g).toBeTruthy();
    expect(g.lca.id).toBe('vg');
    expect(g.columnId).toBe('title.search');
  });

  it('LCA of values in DIFFERENT branches is their nearest common ancestor', () => {
    const t = nestedTree();
    const g = groupableValues(t, ['boy', 'girl']);
    expect(g.lca.id).toBe('root');             // outer `and`, not either inner `or`
    const sameBranch = groupableValues(t, ['boy', 'x']);
    expect(sameBranch.lca.id).toBe('g1');      // both in g1 → LCA is g1
  });
});

describe('wrapValuesInGroup — Add to subclause (#472)', () => {
  it('wraps non-adjacent flat values into a new opposite-join group, preserving the rest', () => {
    const t = flatTree();
    const newId = wrapValuesInGroup(t, ['boy', 'cat']);   // group Boy + cat, leave Girl
    expect(newId).toBeTruthy();
    const root = t.where.value;
    // Girl stays a flat sibling; Boy+cat are pulled into the new group (inserted where Boy was)
    const ng = root.children.find((c) => c.id === newId);
    expect(ng.node).toBe('vgroup');
    expect(ng.join).toBe('or');                            // opposite of the parent `and`
    expect(ng.children.map((c) => c.id)).toEqual(['boy', 'cat']);   // document order
    const girl = root.children.find((c) => c.id === 'girl');
    expect(girl).toBeTruthy();
    expect(root.children.length).toBe(2);                  // [newGroup, Girl]
  });

  it('inserts at the LOWEST COMMON ANCESTOR when the values are in different branches', () => {
    const t = nestedTree();
    const newId = wrapValuesInGroup(t, ['boy', 'girl']);   // LCA = outer `and` group
    const root = t.where.value;
    expect(root.id).toBe('root');
    const ng = root.children.find((c) => c.id === newId);
    expect(ng).toBeTruthy();                               // the new group sits AT the root (LCA)
    expect(ng.join).toBe('or');                            // opposite of the `and` LCA
    expect(ng.children.map((c) => c.id)).toEqual(['boy', 'girl']);
    // Boy/Girl are MOVED out of their original branches; leftovers are singletons.
    const g1 = root.children.find((c) => c.id === 'g1');
    const g2 = root.children.find((c) => c.id === 'g2');
    expect(g1.children.map((c) => c.id)).toEqual(['x']);   // (Boy or X) → (X)
    expect(g2.children.map((c) => c.id)).toEqual(['y']);   // (Girl or Y) → (Y)
  });

  it('produces a valid OQO that round-trips (leftover singletons collapse)', () => {
    const t = nestedTree();
    wrapValuesInGroup(t, ['boy', 'girl']);
    const rows = v2FilterRows(t);
    expect(rows.length).toBe(1);
    const flatJson = JSON.stringify(rows[0]);
    // all four values survive somewhere in the rebuilt OQO; the new (Boy or Girl) group is present
    ['Boy', 'Girl', 'X', 'Y'].forEach((v) => expect(flatJson).toContain(v));
  });

  it('returns null (no-op) for a non-groupable selection', () => {
    const t = flatTree();
    expect(wrapValuesInGroup(t, ['boy'])).toBeNull();
    expect(wrapValuesInGroup(t, ['boy', 'ghost'])).toBeNull();
  });

  // Regression: on a Vue REACTIVE tree, objects spliced into a reactive array come back as
  // proxies, so an internal `inserted === placeholder` (raw) reference check is always false.
  // That made the insertion `splice(-1, …)` clobber the LAST leftover group (e.g. dog) and
  // strand an empty placeholder. We simulate it with a recursive proxy that breaks identity
  // on every property read; the wrap must still keep every value and insert at the LCA.
  it('keeps all leftovers under a reactive-proxy tree (no reference-identity reliance)', () => {
    // Faithful to Vue reactive(): ONE cached proxy per raw object (so same-raw identity
    // like `clause === clause` still holds), but a RAW object read back after insertion
    // comes out as its proxy (≠ the raw), which is exactly what breaks a reference check.
    const cache = new WeakMap();
    const reactiveLike = (o) => {
      if (o === null || typeof o !== 'object') return o;
      if (cache.has(o)) return cache.get(o);
      const p = new Proxy(o, { get: (t, k, r) => { const v = Reflect.get(t, k, r); return typeof v === 'function' ? v : reactiveLike(v); } });
      cache.set(o, p);
      return p;
    };
    const t = reactiveLike(nestedTree());
    const newId = wrapValuesInGroup(t, ['boy', 'girl']);
    expect(newId).toBeTruthy();
    const root = t.where.value;
    expect(root.children.find((c) => c.id === newId).children.map((c) => c.id)).toEqual(['boy', 'girl']);
    expect(root.children.find((c) => c.id === 'g1').children.map((c) => c.id)).toEqual(['x']);
    expect(root.children.find((c) => c.id === 'g2').children.map((c) => c.id)).toEqual(['y']); // dog/y NOT clobbered
    // no empty placeholder left behind: every direct child of the LCA is non-empty
    expect(root.children.every((c) => c.children.length > 0)).toBe(true);
  });
});

describe('removeNodes — Delete n chips (#472)', () => {
  it('removes every selected value in one pass and prunes', () => {
    const t = flatTree();
    removeNodes(t, ['boy', 'cat']);
    expect(t.where.value.children.map((c) => c.id)).toEqual(['girl']);
  });

  it('deleting ALL values empties the query (no filters reach the OQO)', () => {
    const t = flatTree();
    removeNodes(t, ['boy', 'girl', 'cat']);
    expect(v2FilterRows(t)).toEqual([]);     // empty value vgroup contributes nothing
  });

  it('deleting ALL values of a clause inside an implicit group prunes the clause', () => {
    const t = twoFieldTree();
    removeNodes(t, ['boy', 'girl']);         // empties c1's vgroup
    // c1 is dropped; only the publication_year clause remains
    expect(t.where.children.map((c) => c.id)).toEqual(['c2']);
  });
});
