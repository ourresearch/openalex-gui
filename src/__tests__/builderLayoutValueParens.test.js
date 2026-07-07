import { describe, it, expect } from 'vitest';
import { layoutLines, absorbValueParens } from '../components/Oql/builderLayout.js';

// oxjob #560 Phase 2 — value-block parens render INSIDE the value chip.
// The server bakes literal `(` / `)` TEXT segments around a simple clause's value
// (`open access is (true)` → column, operator, text "(", value, text ")"), and
// treeToTokens emits the same inert text parens around a bare-vleaf value (#554).
// Those used to render as separate text tokens OUTSIDE the chip; layoutLines now
// absorbs them into the adjacent value brick as `_pOpen`/`_pClose` decoration counts
// (the same mechanism markParens uses for group parens), so every value block reads
// `[field is][(true)]`.

const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text, id) => ({ t: 'col', text, id });
const op = (text, id) => ({ t: 'op', text, id });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: String(v), display: String(v), ...extra });
const conn = (w, id) => ({ t: 'conn', id, text: ` ${w} `, label: w });
const txt = (text, id) => ({ t: 'text', text, id });

// Serialize a line's tokens with _pOpen/_pClose glued to the chip (same convention as
// builderLayout.test.js): a paren absorbed into the chip prints "(true"/"true)" with no
// space, while a leftover standalone text paren prints as its own " ( " word.
const content = (line) =>
  line.tokens.map((t) => {
    const base = (t.t === 'conn' ? t.label  // #575 r4: chips show the word ('and'), no '&'
      : (t.text != null ? t.text : t.display || '')).trim();
    if (base === '') return '';
    return '('.repeat(t._pOpen || 0) + base + ')'.repeat(t._pClose || 0);
  })
    .filter((s) => s !== '').join(' ');
const lay = (tokens) => layoutLines(tokens).map(content);

describe('absorbValueParens (oxjob #560 Phase 2)', () => {
  it('stamps a text-paren pair onto a lone value brick and drops the text tokens', () => {
    const out = absorbValueParens([
      col('open access is', 'c1'), txt('(', 'c1'), vb('true', { kind: 'boolean', id: 'c1' }), txt(')', 'c1'),
    ]);
    expect(out.map((t) => t.t)).toEqual(['col', 'vbrick']);
    expect(out[1]._pOpen).toBe(1);
    expect(out[1]._pClose).toBe(1);
  });

  it('multi-value segment run: `(` lands on the first brick, `)` on the last', () => {
    const out = absorbValueParens([
      col('language is', 'c1'), txt('(', 'c1'), vb('en'), conn('or', 'c1'), vb('unknown'), txt(')', 'c1'),
    ]);
    expect(out.map((t) => t.t)).toEqual(['col', 'vbrick', 'conn', 'vbrick']);
    expect(out[1]._pOpen).toBe(1);
    expect(out[1]._pClose).toBeUndefined();
    expect(out[3]._pOpen).toBeUndefined();
    expect(out[3]._pClose).toBe(1);
  });

  it('stacks onto existing decoration counts instead of clobbering them', () => {
    const out = absorbValueParens([txt('('), vb('x', { _pOpen: 1, _pClose: 1 }), txt(')')]);
    expect(out[0]._pOpen).toBe(2);
    expect(out[0]._pClose).toBe(2);
  });

  it('leaves text parens NOT adjacent to a value brick untouched', () => {
    const stream = [txt('('), col('year is'), vb(2020), txt(')'), txt('(')];
    const out = absorbValueParens(stream);
    // leading "(" precedes a col → kept; ")" follows the brick → absorbed; trailing "(" → kept
    expect(out.map((t) => t.t)).toEqual(['text', 'col', 'vbrick', 'text']);
    expect(out[2]._pClose).toBe(1);
    // and the input array is not mutated
    expect(stream[2]._pClose).toBeUndefined();
  });

  it('leaves other text tokens (`not `, connector text) alone', () => {
    const out = absorbValueParens([txt('not '), vb('x'), txt(' or ')]);
    expect(out.map((t) => t.t)).toEqual(['text', 'vbrick', 'text']);
  });
});

describe('layoutLines absorbs simple-clause value parens (oxjob #560 Phase 2)', () => {
  it('boolean clause reads `open access is (true)` with parens glued to the chip', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('open access is', 'c1'), txt('(', 'c1'), vb('true', { kind: 'boolean', id: 'v1' }), txt(')', 'c1'),
    ])).toEqual(['open access is (true)']);
  });

  it('scalar clause reads `year is (2020)` with parens glued to the chip', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('year is', 'c1'), txt('(', 'c1'), vb(2020, { id: 'v1' }), txt(')', 'c1'),
    ])).toEqual(['year is (2020)']);
  });
});
