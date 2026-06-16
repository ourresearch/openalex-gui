import { describe, it, expect } from 'vitest';
import { groupableFilters, wrapFiltersInGroup } from '../components/OqlPlayground/v2Edit.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';

// oxjob #472 — clause-level analog of the value wrap (wrapValuesInGroup): select ≥2 whole
// FILTERS (by their field chip) and wrap them into a parenthesized CLAUSE group. This is the
// gesture #428 Phase B depends on (it removes every other clause-creation path). These lock
// the MODEL guarantees: sibling gating, opposite-join, move-not-copy, leftovers preserved,
// and a valid round-tripping OQO. The browser test covers the field-chip selection + menu.

// `type is article and year is 2020 and is_oa is true` — three flat top-level filters under
// the implicit `and` where group.
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

// A nested committed group `(c1 and c2) and c3` — to test wrapping siblings INSIDE an
// explicit group (parent join = the inner group's `and`).
const nestedGroup = () => ({
  where: {
    node: 'group', id: 'w', implicit: true, join: 'and', children: [
      { node: 'group', id: 'g', join: 'and', paren: true, children: [
        { node: 'clause', id: 'c1', column_id: 'type', operator: 'is',
          leaf: { column_id: 'type', value: 'article' } },
        { node: 'clause', id: 'c2', column_id: 'publication_year', operator: 'is',
          leaf: { column_id: 'publication_year', value: 2020 } },
        { node: 'clause', id: 'c3', column_id: 'language', operator: 'is',
          leaf: { column_id: 'language', value: 'en' } },
      ] },
      { node: 'clause', id: 'c4', column_id: 'is_retracted', operator: 'is',
        leaf: { column_id: 'is_retracted', value: false } },
    ],
  },
});

describe('groupableFilters — sibling gating (#472)', () => {
  it('returns null for fewer than 2 distinct ids', () => {
    const t = threeFilters();
    expect(groupableFilters(t, ['c1'])).toBeNull();
    expect(groupableFilters(t, ['c1', 'c1'])).toBeNull();
    expect(groupableFilters(t, [])).toBeNull();
  });

  it('returns null when an id is not an expr node', () => {
    const t = threeFilters();
    expect(groupableFilters(t, ['c1', 'ghost'])).toBeNull();
  });

  it('enables for ≥2 top-level filters; parent is the implicit where group', () => {
    const t = threeFilters();
    const g = groupableFilters(t, ['c1', 'c2']);
    expect(g).toBeTruthy();
    expect(g.parent.id).toBe('w');
  });

  it('returns null when the filters are not siblings (different parents)', () => {
    const t = nestedGroup();
    // c1 lives in group `g`; c4 is a direct child of the implicit where → different parents
    expect(groupableFilters(t, ['c1', 'c4'])).toBeNull();
    // siblings inside the same explicit group ARE groupable
    expect(groupableFilters(t, ['c1', 'c2'])).toBeTruthy();
  });
});

describe('wrapFiltersInGroup — Wrap as subclause / whole filters (#472)', () => {
  it('wraps two top-level filters into a new OR group, preserving the third', () => {
    const t = threeFilters();
    const newId = wrapFiltersInGroup(t, ['c1', 'c2']);   // group type + year, leave is_oa
    expect(newId).toBeTruthy();
    const root = t.where;
    const ng = root.children.find((c) => c.id === newId);
    expect(ng.node).toBe('group');
    expect(ng.join).toBe('or');                          // opposite of the implicit `and`
    expect(ng.children.map((c) => c.id)).toEqual(['c1', 'c2']);   // document order
    // is_oa stays a flat sibling; the new group took c1's slot → [newGroup, c3]
    expect(root.children.map((c) => c.id)).toEqual([newId, 'c3']);
  });

  it('wraps NON-adjacent filters (c1 + c3) at c1’s slot, keeping c2 between is gone (moved)', () => {
    const t = threeFilters();
    const newId = wrapFiltersInGroup(t, ['c1', 'c3']);
    const root = t.where;
    const ng = root.children.find((c) => c.id === newId);
    expect(ng.children.map((c) => c.id)).toEqual(['c1', 'c3']);   // document order, both moved
    // c2 stays a flat sibling; group sits where c1 was → [newGroup, c2]
    expect(root.children.map((c) => c.id)).toEqual([newId, 'c2']);
  });

  it('wraps siblings INSIDE an explicit group (opposite of that group’s join)', () => {
    const t = nestedGroup();
    const newId = wrapFiltersInGroup(t, ['c1', 'c2']);
    const g = t.where.children.find((c) => c.id === 'g');
    const ng = g.children.find((c) => c.id === newId);
    expect(ng).toBeTruthy();
    expect(ng.join).toBe('or');                          // opposite of `g`’s `and`
    expect(ng.children.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(g.children.map((c) => c.id)).toEqual([newId, 'c3']);   // c3 preserved
  });

  it('produces a valid OQO that round-trips (the new group is an or-branch)', () => {
    const t = threeFilters();
    wrapFiltersInGroup(t, ['c1', 'c2']);
    const rows = v2FilterRows(t);
    // [ {join:or, filters:[type, year]}, is_oa ]
    expect(rows.length).toBe(2);
    const orRow = rows.find((r) => r.join === 'or');
    expect(orRow).toBeTruthy();
    expect(orRow.filters.map((f) => f.column_id)).toEqual(['type', 'publication_year']);
  });

  it('returns null (no-op) for a non-groupable selection', () => {
    const t = threeFilters();
    expect(wrapFiltersInGroup(t, ['c1'])).toBeNull();
    expect(wrapFiltersInGroup(t, ['c1', 'ghost'])).toBeNull();
  });

  // Regression (same trap as wrapValuesInGroup): on a Vue REACTIVE tree, a raw object
  // spliced into a reactive array reads back as its proxy, so a reference-identity check
  // on the placeholder is always false → splice(-1,…) clobbers the wrong child. The op must
  // re-find the placeholder by id. Simulate with a recursive identity-breaking proxy.
  it('keeps siblings under a reactive-proxy tree (no reference-identity reliance)', () => {
    const cache = new WeakMap();
    const reactiveLike = (o) => {
      if (o === null || typeof o !== 'object') return o;
      if (cache.has(o)) return cache.get(o);
      const p = new Proxy(o, { get: (tt, k, r) => { const v = Reflect.get(tt, k, r); return typeof v === 'function' ? v : reactiveLike(v); } });
      cache.set(o, p);
      return p;
    };
    const t = reactiveLike(threeFilters());
    const newId = wrapFiltersInGroup(t, ['c1', 'c2']);
    expect(newId).toBeTruthy();
    const root = t.where;
    expect(root.children.find((c) => c.id === newId).children.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(root.children.map((c) => c.id)).toEqual([newId, 'c3']);   // c3 NOT clobbered
  });
});
