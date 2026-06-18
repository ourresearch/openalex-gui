import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';

// oxjob #428 — responsive flex-wrap paren/indent layout. layoutLines re-derives
// line breaks CLIENT-SIDE from the paren structure of the flat token stream.
// Invariant: a group renders each child GROUP on its own line; its bare VALUES
// flow as one line; a group with no child-groups is just that single value-line.
//
// OQL decision 32 (2026-06-18, oxjob #475): the server emits the keyword-group
// form — a `groupkw` opener (`all (`/`any (`) + `comma`-separated items + a `)`
// close (no infix `and`/`or`). layoutLines turns each `groupkw` into a single `joinkw`
// chip that carries the keyword + the open paren (`all (`), and DROPS the commas, so a
// group reads `all ( a b )`.
// The retired leading-connector + first-item `dot` convention is gone.

// --- token builders (mirror the server `oql_render_v2` token shape) ----------
const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text) => ({ t: 'col', text });
const op = (text) => ({ t: 'op', text });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: v, display: v, ...extra });
// group opener: `all (` (join "and") / `any (` (join "or")
const gk = (join) => ({ t: 'groupkw', text: `${join === 'or' ? 'any' : 'all'} (`, label: join });
const comma = () => ({ t: 'comma', text: ', ' });
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
    // `title has any (a, b, c)` — leaf group, no nesting → single line, `any ( … )`
    expect(lay([
      col('title'), op(' has '), gk('or'), vb('a'), comma(), vb('b'), comma(), vb('c'), rp(),
    ])).toEqual(['0:title has any ( a b c )']);
  });

  it('the leaf bag is emitted as ONE grp item (its own wrap box)', () => {
    const lines = layoutLines([col('title'), op(' has '), gk('or'), vb('a'), comma(), vb('b'), rp()]);
    expect(lines).toHaveLength(1);
    const grps = lines[0].items.filter((it) => it.grp);
    expect(grps).toHaveLength(1);
    // the box carries the paren + join chip + values together (commas dropped)
    expect(grps[0].grp.map((t) => t.text.trim()).join(' ')).toBe('any ( a b )');
  });

  it('groupkw becomes a single joinkw chip carrying the keyword + open paren', () => {
    const lines = layoutLines([col('t'), op(' has '), gk('and'), vb('a'), comma(), vb('b'), rp()]);
    const toks = lines[0].tokens;
    const join = toks.find((t) => t.t === 'joinkw');
    expect(join).toBeTruthy();
    expect(join.text).toBe('all (');         // keyword + open paren on the one chip
    expect(join.label).toBe('and');
    // the open paren is fused into the join chip — no separate `(` paren token on this line
    expect(toks.some((t) => t.t === 'paren' && t.text === '(')).toBe(false);
    // …and no commas survive into the rendered token stream
    expect(toks.some((t) => t.t === 'comma')).toBe(false);
  });

  it('block group (nested groups) explodes — one open paren per line', () => {
    // the canonical gamification query: `… has all ( any (game, …), any (literacy, …) )`
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title/abstract'), op(' has '),
      gk('and'), gk('or'), vb('game'), comma(), vb('gamification'), comma(), vb('gamified'), rp(),
      comma(), gk('or'), vb('literacy'), comma(), vb('read'), comma(), vb('reading'), rp(), rp(),
    ])).toEqual([
      '0:works where',
      '0:title/abstract has all (',
      '1:any ( game gamification gamified )',
      '1:any ( literacy read reading )',
      '0:)',
    ]);
  });

  it('FOLDED predicate: a value group rides up onto the property line (leaf bag)', () => {
    // #467 folds the predicate into the property chip, so the token before the group
    // is the `col` itself (no separate `op`). The bag must still flow inline.
    expect(lay([
      col('title/abstract has'), gk('or'), vb('a'), comma(), vb('b'), rp(),
    ])).toEqual(['0:title/abstract has any ( a b )']);
  });

  it('FOLDED predicate: block group keeps its open paren on the property line', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title/abstract has'),
      gk('and'), gk('or'), vb('game'), comma(), vb('gamification'), rp(),
      comma(), gk('or'), vb('literacy'), comma(), vb('read'), rp(), rp(),
    ])).toEqual([
      '0:works where',
      '0:title/abstract has all (',
      '1:any ( game gamification )',
      '1:any ( literacy read )',
      '0:)',
    ]);
  });

  it('mixed group — child group on its own line, bare values flow (no reorder)', () => {
    // `title has any ( all (C, D), A, B )` — isolates the child group, flows bare values.
    expect(lay([
      col('title'), op(' has '),
      gk('or'), gk('and'), vb('C'), comma(), vb('D'), rp(), comma(), vb('A'), comma(), vb('B'), rp(),
    ])).toEqual([
      '0:title has any (',
      '1:all ( C D )',
      '1:A B',
      '0:)',
    ]);
  });

  it('clause group (parens around clauses) explodes, each clause its own line', () => {
    // `any ( author is X, author is Y )` — NOT a value bag; clauses keep own lines
    expect(lay([
      gk('or'), col('author'), op(' is '), vb('X'), comma(), col('author'), op(' is '), vb('Y'), rp(),
    ])).toEqual([
      '0:any (',
      '1:author is X',
      '1:author is Y',
      '0:)',
    ]);
  });

  it('multiple top-level filters wrap in the outer all() block on the works-where line', () => {
    // the outer all/any wrapper leads the `works where` line (Jason 2026-06-18).
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      gk('and'), col('author'), op(' is '), vb('X'),
      comma(), col('institution'), op(' is '), vb('Y'), rp(),
    ])).toEqual([
      '0:works where all (',
      '1:author is X',
      '1:institution is Y',
      '0:)',
    ]);
  });

  it('a standalone boolean-phrase brick starts its own filter line', () => {
    expect(lay([
      gk('and'), col('title'), op(' has '), vb('x'),
      comma(), vb("it's open access", { bool_phrase: true }), rp(),
    ])).toEqual([
      '0:all (',
      "1:title has x",
      "1:it's open access",
      '0:)',
    ]);
  });

  it('deep 3-level nesting — every open paren alone on its line', () => {
    // `title has any ( all ( any (a, b), c ), d )`
    expect(lay([
      col('title'), op(' has '),
      gk('or'), gk('and'), gk('or'), vb('a'), comma(), vb('b'), rp(), comma(), vb('c'), rp(),
      comma(), vb('d'), rp(),
    ])).toEqual([
      '0:title has any (',
      '1:all (',
      '2:any ( a b )',
      '2:c',
      '1:)',
      '1:d',
      '0:)',
    ]);
  });

  it('entity chrome (`works where`) gets its own line; first filter starts on the next', () => {
    // single filter → no outer all() wrapper (only a 2+ body wraps).
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('type'), op(' is '), vb('article'),
    ])).toEqual([
      '0:works where',
      '0:type is article',
    ]);
  });

  it('no dot placeholder is emitted (retired with the leading-connector convention)', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'),
      gk('and'), col('author'), op(' is '), vb('X'),
      comma(), col('institution'), op(' is '), vb('Y'), rp(),
    ]);
    expect(lines.every((l) => !l._dot)).toBe(true);
    expect(lines.every((l) => l.tokens.every((t) => t.t !== 'dot'))).toBe(true);
  });

  it('assigns unique keys to every emitted line', () => {
    const lines = layoutLines([
      gk('and'), gk('or'), vb('a'), comma(), vb('b'), rp(), comma(), gk('or'), vb('c'), rp(), rp(),
    ]);
    const keys = lines.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
