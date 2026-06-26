import { describe, it, expect } from 'vitest';
import { canRepresentAsGrid, treeRepresentable } from '../components/Oql/representableShape.js';

// oxjob #523 — the gate that decides builder (2D grid) vs OQL text tab.
// Representable set: top-level AND of OR-groups of filters; each single-filter
// value is an AND-of-OR-groups with <=1 extra explicit-paren level per column;
// OR-ed filters must have flat values; NOT is structurally transparent.

// ---- tiny tree builders (match v2 node shapes) ----------------------------
let _id = 0;
const nid = () => `n${++_id}`;
const vleaf = (value, negated = false) => ({ node: 'vleaf', id: nid(), value, negated });
const vgroup = (join, ...children) => ({ node: 'vgroup', id: nid(), join, children });
// factored clause: title has <value>
const clause = (column_id, operator, value) => ({ node: 'clause', id: nid(), column_id, column: column_id, operator, value });
// simple/atomic clause (date range, boolean, proximity, is between): no value vtree
const simple = (column_id, operator = 'is') => ({ node: 'clause', id: nid(), column_id, column: column_id, operator, leaf: { value: 1 }, segments: [] });
const group = (join, ...children) => ({ node: 'group', id: nid(), join, children });
const root = (...children) => ({ node: 'group', id: nid(), join: 'and', implicit: true, children });

const pass = (where) => expect(canRepresentAsGrid(where).ok).toBe(true);
const fail = (where) => expect(canRepresentAsGrid(where).ok).toBe(false);

describe('canRepresentAsGrid — the representable core', () => {
  it('null / empty where is representable (empty builder)', () => {
    pass(null);
  });

  it('a single simple filter is representable', () => {
    pass(simple('publication_year', '>='));
    pass(root(simple('publication_year', '>=')));
  });

  it('a single value is representable', () => {
    pass(clause('title', 'has', vleaf('apple')));
  });

  // ACCEPTANCE Test 1: title has (apple or banana) and (pie or tart)
  it('AND-of-ORs value (CNF) is representable', () => {
    const value = vgroup('and', vgroup('or', vleaf('apple'), vleaf('banana')),
                                vgroup('or', vleaf('pie'), vleaf('tart')));
    pass(clause('title', 'has', value));
    pass(root(clause('title', 'has', value)));
  });

  // ACCEPTANCE Test 2: title has (apple or banana) and (pie or (tart and pastry))
  it('one extra paren level (AND inside a column) is representable', () => {
    const value = vgroup('and',
      vgroup('or', vleaf('apple'), vleaf('banana')),
      vgroup('or', vleaf('pie'), vgroup('and', vleaf('tart'), vleaf('pastry'))));
    pass(clause('title', 'has', value));
  });

  // ACCEPTANCE Test 3 boundary: ...(pie or (tart and (pastry or cake))) — 1 level too deep
  it('TWO extra levels (OR inside the paren column) is NOT representable', () => {
    const value = vgroup('and',
      vgroup('or', vleaf('apple'), vleaf('banana')),
      vgroup('or', vleaf('pie'),
        vgroup('and', vleaf('tart'), vgroup('or', vleaf('pastry'), vleaf('cake')))));
    fail(clause('title', 'has', value));
  });

  it('a deeply nested value (and>or>and>or) is NOT representable', () => {
    const value = vgroup('and',
      vgroup('or', vleaf('a'),
        vgroup('and', vleaf('b'),
          vgroup('or', vleaf('c'), vleaf('d')))));
    fail(clause('title', 'has', value));
  });

  // ACCEPTANCE Test 11: institution is (not I1 and not I2) — negation transparent
  it('negation is structurally transparent', () => {
    const value = vgroup('and', vleaf('I33213144', true), vleaf('I97018004', true));
    pass(clause('institutions.id', 'is', value));
  });
});

describe('canRepresentAsGrid — multiple rows (top-level AND)', () => {
  it('several AND-ed filters each a row', () => {
    pass(root(
      simple('publication_year', '>='),
      clause('title', 'has', vgroup('or', vleaf('apple'), vleaf('banana'))),
      clause('type', 'is', vleaf('article')),
    ));
  });

  it('a row whose value is a full AND-of-ORs grid (multi-row value)', () => {
    pass(root(
      clause('title', 'has', vgroup('and',
        vgroup('or', vleaf('apple'), vleaf('banana')),
        vgroup('or', vleaf('pie'), vleaf('tart')))),
      simple('publication_year', '>='),
    ));
  });
});

describe('canRepresentAsGrid — filter-scope OR (one row, multiple filters)', () => {
  // ACCEPTANCE Test 9: (title has apple) or (year is 2020)
  it('two flat filters OR-ed on one row is representable', () => {
    pass(group('or', clause('title', 'has', vleaf('apple')), simple('publication_year', 'is')));
  });

  it('OR-ed filters with a flat OR value set are representable', () => {
    pass(group('or',
      clause('title', 'has', vgroup('or', vleaf('apple'), vleaf('banana'))),
      simple('publication_year', 'is')));
  });

  // bullet 2: OR-ed filters must have FLAT values (no nested AND / sub-paren)
  it('OR-ed filter with a NESTED value set is NOT representable', () => {
    fail(group('or',
      clause('title', 'has', vgroup('and',
        vgroup('or', vleaf('apple'), vleaf('banana')),
        vleaf('pie'))),
      simple('publication_year', 'is')));
  });

  it('an OR-row mixing in a sub-group (not a flat clause) is NOT representable', () => {
    fail(group('or',
      clause('title', 'has', vleaf('apple')),
      group('and', simple('publication_year', '>='), simple('type', 'is'))));
  });
});

describe('treeRepresentable — accepts a full tree or a bare where', () => {
  it('unwraps a full tree object', () => {
    const where = root(clause('title', 'has', vleaf('apple')));
    expect(treeRepresentable({ entity: { id: 'works' }, where }).ok).toBe(true);
  });
  it('accepts a bare where node', () => {
    expect(treeRepresentable(clause('title', 'has', vleaf('apple'))).ok).toBe(true);
  });
  it('null tree is representable', () => {
    expect(treeRepresentable(null).ok).toBe(true);
  });
});
