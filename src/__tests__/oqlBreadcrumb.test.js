import { describe, it, expect } from 'vitest';
import { buildAddrIndex, pathForAddr, joinWord } from '../components/Oql/oqlBreadcrumb.js';

// oxjob #487 Part 2 — ancestor-path footer breadcrumb. buildAddrIndex walks the
// committed render tree (`v2.value.where`) into an `addr → segment` map; pathForAddr
// turns a hovered dotted address into the humanized ` › `-joined ancestor path.
//
// Tree fixtures mirror the v2 `oql_render_v2` shape (verified against the engine
// for the running example): clause / group / vgroup / vleaf nodes, each structural
// node carrying its `addr` int-list, in the engine's real canonical order.

// --- v2 tree builders --------------------------------------------------------
const vleaf = (display, addr, extra = {}) => ({ node: 'vleaf', addr, display, value: display, negated: false, ...extra });
const vgroup = (join, addr, children) => ({ node: 'vgroup', join, addr, children });
const clauseGrouped = (addr, column, column_id, value, clause_kind = 'text') =>
  ({ node: 'clause', addr, column, column_id, operator: 'has', clause_kind, value });
const clauseSimple = (addr, column, column_id, valueText) =>
  ({ node: 'clause', addr, column, column_id, operator: 'has', clause_kind: 'text', value: null,
    segments: [{ kind: 'column', text: column }, { kind: 'operator', text: ' has ' }, { kind: 'value', text: valueText }] });
const clauseBool = (addr, column, phrase) =>
  ({ node: 'clause', addr, column, clause_kind: 'boolean', value: null, segments: [{ kind: 'keyword', text: phrase }] });

// The running example, in the engine's REAL canonical order: type(1), full text(2),
// title(3), it's open access(4). (The EXPLORE/ACCEPTANCE numbering 1=title … 4=fulltext
// is illustrative; the engine orders filters differently — verified via render_v2.)
const WHERE = {
  node: 'group', join: 'and', implicit: true, children: [
    clauseGrouped([1], 'type', 'type', vgroup('or', null, [vleaf('article', [1, 1]), vleaf('preprint', [1, 2])]), 'other'),
    clauseGrouped([2], 'full text', 'fulltext.search', vgroup('and', null, [
      vgroup('or', [2, 1], [vleaf('dog', [2, 1, 1]), vleaf('cat', [2, 1, 2])]),
      vgroup('or', [2, 2], [vleaf('play', [2, 2, 1]), vleaf('jump', [2, 2, 2])]),
    ])),
    clauseSimple([3], 'title', 'display_name.search', 'animal'),
    clauseBool([4], 'open access', "it's open access"),
  ],
};
// fieldLabelFor mirrors the chip: friendly column name (here just the column text).
const OPTS = { entityLabel: 'works', fieldLabelFor: (cid, col) => col };
const index = buildAddrIndex(WHERE, OPTS);
const path = (addr) => pathForAddr(addr, index);

describe('buildAddrIndex', () => {
  it('joinWord maps the OQO join to the OQL keyword', () => {
    expect(joinWord('or')).toBe('any');
    expect(joinWord('and')).toBe('all');
  });

  it('indexes the entity root as just the entity (no address, no join)', () => {
    expect(index.get('0')).toEqual({ kind: 'root', label: 'works' });
  });

  it('a clause whose value is a group shows just the field (orientation, no glued join)', () => {
    expect(index.get('2')).toEqual({ kind: 'clause', label: 'full text' });
    expect(index.get('1')).toEqual({ kind: 'clause', label: 'type' });
  });

  it('a simple clause has no glued join; its scalar value rides .1', () => {
    expect(index.get('3')).toEqual({ kind: 'clause', label: 'title' });
    expect(index.get('3.1')).toEqual({ kind: 'value', label: 'animal' });
  });

  it('a boolean clause is one atomic fused phrase', () => {
    expect(index.get('4')).toEqual({ kind: 'boolean', label: "it's open access" });
  });

  it('nested value groups show their own join word; values their display', () => {
    expect(index.get('2.1')).toEqual({ kind: 'group', label: 'any()' });
    expect(index.get('2.1.2')).toEqual({ kind: 'value', label: 'cat' });
    expect(index.get('2.2.1')).toEqual({ kind: 'value', label: 'play' });
  });
});

describe('pathForAddr', () => {
  it('builds the full ancestor path of a deep value (the Test-4 shape)', () => {
    expect(path('2.1.2')).toEqual(['works', '2 full text', '2.1 any()', '2.1.2 cat']);
  });

  it('boolean, simple clause, and grouped-value clause (the Test-5 shapes)', () => {
    expect(path('4')).toEqual(['works', "4 it's open access"]);
    expect(path('3.1')).toEqual(['works', '3 title', '3.1 animal']);
    expect(path('1.1')).toEqual(['works', '1 type', '1.1 article']);
  });

  it('hover granularity: clause / group / value end at the right depth (Test 6)', () => {
    expect(path('2')).toEqual(['works', '2 full text']);          // field token → clause
    expect(path('2.1')).toEqual(['works', '2 full text', '2.1 any()']); // paren/join → group
    expect(path('2.1.2')).toEqual(['works', '2 full text', '2.1 any()', '2.1.2 cat']);
  });

  it('nothing hovered / chrome → just the entity root (resting state, D5)', () => {
    expect(path(null)).toEqual(['works']);
    expect(path('')).toEqual(['works']);
    expect(path('0')).toEqual(['works']);
  });

  it('a single top-level clause has no 0; root segment still shows the entity', () => {
    const single = buildAddrIndex(clauseSimple([1], 'title', 'display_name.search', 'animal'), OPTS);
    expect(single.get('0')).toEqual({ kind: 'root', label: 'works' });
    expect(pathForAddr('1.1', single)).toEqual(['works', '1 title', '1.1 animal']);
  });
});
