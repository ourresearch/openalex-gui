import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';

// oxjob #428 — responsive flex-wrap paren/indent layout. layoutLines re-derives
// line breaks CLIENT-SIDE from the paren structure of the flat token stream.
// Invariant: a group renders each child GROUP on its own line; its bare VALUES
// flow as one line; a group with no child-groups is just that single value-line.
// Connectors (and/or) TRAIL their clause's line — appended to the END of the line,
// not leading the next one (Jason 2026-06-17).

// --- token builders (mirror the server `oql_render_v2` token shape) ----------
const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text) => ({ t: 'col', text });
const op = (text) => ({ t: 'op', text });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: v, display: v, ...extra });
const conn = (w) => ({ t: 'conn', text: ` ${w} `, label: w });
const lp = () => ({ t: 'paren', text: '(' });
const rp = () => ({ t: 'paren', text: ')' });

const text = (line) =>
  line.tokens.map((t) => (t.text != null ? t.text : t.display || '').trim())
    .filter((s) => s !== '').join(' ');
const lay = (tokens) => layoutLines(tokens).map((l) => `${l.depth}:${text(l)}`);

describe('layoutLines', () => {
  it('flat clause, no group, stays one line', () => {
    expect(lay([col('year'), op(' is '), vb('2020')])).toEqual(['0:year is 2020']);
  });

  it('a leaf value-bag flows INLINE with its clause (one line, wraps in browser)', () => {
    // `title has ( a or b or c )` — leaf group, no nesting → single line
    expect(lay([
      col('title'), op(' has '), lp(), vb('a'), conn('or'), vb('b'), conn('or'), vb('c'), rp(),
    ])).toEqual(['0:title has ( a or b or c )']);
  });

  it('the leaf bag is emitted as ONE grp item (its own wrap box)', () => {
    const lines = layoutLines([col('title'), op(' has '), lp(), vb('a'), conn('or'), vb('b'), rp()]);
    expect(lines).toHaveLength(1);
    const grps = lines[0].items.filter((it) => it.grp);
    expect(grps).toHaveLength(1);
    // the box carries the parens + values together
    expect(grps[0].grp.map((t) => t.text.trim()).join(' ')).toBe('( a or b )');
  });

  it('block group (nested groups) explodes — one open paren per line', () => {
    // the canonical gamification query
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title/abstract'), op(' has '),
      lp(), lp(), vb('game'), conn('or'), vb('gamification'), conn('or'), vb('gamified'), rp(),
      conn('and'), lp(), vb('literacy'), conn('or'), vb('read'), conn('or'), vb('reading'), rp(), rp(),
    ])).toEqual([
      '0:works where',
      '0:title/abstract has (',
      '1:( game or gamification or gamified ) and',
      '1:( literacy or read or reading )',
      '0:)',
    ]);
  });

  it('FOLDED predicate: a value group rides up onto the property line (leaf bag)', () => {
    // #467 folds the predicate into the property chip, so the token before the `(`
    // is now the `col` itself (no separate `op`). The bag must still flow inline.
    expect(lay([
      col('title/abstract has'), lp(), vb('a'), conn('or'), vb('b'), rp(),
    ])).toEqual(['0:title/abstract has ( a or b )']);
  });

  it('FOLDED predicate: block group keeps its open paren on the property line', () => {
    // the regression Jason hit — with the op token folded away, the outer `(` was
    // stranded on its own line 2 instead of `…has (` on line 1.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title/abstract has'),
      lp(), lp(), vb('game'), conn('or'), vb('gamification'), rp(),
      conn('and'), lp(), vb('literacy'), conn('or'), vb('read'), rp(), rp(),
    ])).toEqual([
      '0:works where',
      '0:title/abstract has (',
      '1:( game or gamification ) and',
      '1:( literacy or read )',
      '0:)',
    ]);
  });

  it('mixed group — child group on its own line, bare values flow (no reorder)', () => {
    // `title has ( (C and D) or A or B )` — the layout isolates the child
    // group and flows the bare values regardless of their order (the real
    // canonical order is values-first; this exercises the group-first variant).
    expect(lay([
      col('title'), op(' has '),
      lp(), lp(), vb('C'), conn('and'), vb('D'), rp(), conn('or'), vb('A'), conn('or'), vb('B'), rp(),
    ])).toEqual([
      '0:title has (',
      '1:( C and D ) or',
      '1:A or B',
      '0:)',
    ]);
  });

  it('clause group (parens around clauses) explodes, each clause its own line', () => {
    // `( author is X or author is Y )` — NOT a value bag; clauses keep own lines
    expect(lay([
      lp(), col('author'), op(' is '), vb('X'), conn('or'), col('author'), op(' is '), vb('Y'), rp(),
    ])).toEqual([
      '0:(',
      '1:author is X or',
      '1:author is Y',
      '0:)',
    ]);
  });

  it('multiple top-level filters each get their own line, connector trailing', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('author'), op(' is '), vb('X'),
      conn('and'), col('institution'), op(' is '), vb('Y'),
    ])).toEqual([
      '0:works where',
      '0:author is X and',
      '0:institution is Y',
    ]);
  });

  it('a standalone boolean-phrase brick starts its own filter line', () => {
    expect(lay([
      col('title'), op(' has '), vb('x'),
      conn('and'), vb("it's open access", { bool_phrase: true }),
    ])).toEqual([
      "0:title has x and",
      "0:it's open access",
    ]);
  });

  it('deep 3-level nesting — every open paren alone on its line', () => {
    // `title has ( ( (a or b) and c ) or d )`
    expect(lay([
      col('title'), op(' has '),
      lp(), lp(), lp(), vb('a'), conn('or'), vb('b'), rp(), conn('and'), vb('c'), rp(),
      conn('or'), vb('d'), rp(),
    ])).toEqual([
      '0:title has (',
      '1:(',
      '2:( a or b ) and',
      '2:c',
      '1:) or',
      '1:d',
      '0:)',
    ]);
  });

  it('entity chrome (`works where`) gets its own line; first filter starts on the next', () => {
    // oxjob #428 (Jason 2026-06-16): diverge from OQL so the first filter is its own block.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('type'), op(' is '), vb('article'),
    ])).toEqual([
      '0:works where',
      '0:type is article',
    ]);
  });

  it('assigns unique keys to every emitted line', () => {
    const lines = layoutLines([
      lp(), lp(), vb('a'), conn('or'), vb('b'), rp(), conn('and'), lp(), vb('c'), rp(), rp(),
    ]);
    const keys = lines.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
