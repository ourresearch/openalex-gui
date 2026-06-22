import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';
import { lineAddr, fillTerminatorAddrs } from '../components/Oql/oqlMargin.js';

// oxjob #487 Part 1 — decimal margin numbers. lineAddr derives, from one laid-out
// builder line, the decimal address (#474) the gutter paints — or null (close
// paren / chrome / draft). We feed layoutLines the same shape displayLines does
// (server `oql_render_v2` tokens, post-foldPredicates so no `op` tokens), with
// each token carrying its server `addr`.

// --- token builders (mirror the post-enrich/post-fold token shape) -----------
const ent = () => ({ t: 'kw', id: 'works', text: 'works', label: 'works', _entity: true });
const where = () => ({ t: 'kw', text: 'where', label: 'where' });
const col = (text, addr) => ({ t: 'col', id: addr, text, addr });
const vb = (v, addr, extra = {}) => ({ t: 'vbrick', id: addr, value: v, text: v, display: v, addr, ...extra });
// group opener: server `groupkw` (`all (`/`any (`); layoutLines→joinkw carries addr
const gk = (join, addr) => ({ t: 'groupkw', id: addr || `g${join}`, text: `${join === 'or' ? 'any' : 'all'} (`, label: join, addr });
const comma = (addr) => ({ t: 'comma', id: addr, text: ', ', addr });
const rp = (addr) => ({ t: 'paren', id: addr, text: ')', addr });

const addrs = (tokens) => layoutLines(tokens).map(lineAddr);

describe('lineAddr', () => {
  // The running example, in the engine's real canonical order (type, full text,
  // title, boolean — verified against oql_render_v2). Shape matches EXPLORE's
  // example; only the ordinals differ from the spec's illustrative numbering.
  it('paints the decimal address of each committed row; close parens get none', () => {
    const stream = [
      ent(), where(), gk('and'),                                  // root open → 0
      col('type', '1'), gk('or'), vb('article', '1.1'), comma(), vb('preprint', '1.2'), rp(), comma(),
      col('full text', '2'), gk('and'),                           // fused value-root join → no addr
      gk('or', '2.1'), vb('dog', '2.1.1'), comma('2.1'), vb('cat', '2.1.2'), rp('2.1'), comma(),
      gk('or', '2.2'), vb('play', '2.2.1'), comma('2.2'), vb('jump', '2.2.2'), rp('2.2'),
      rp(), comma(),                                              // close of fused all( → no addr
      col('title', '3'), vb('animal', '3.1'), comma(),
      vb("it's open access", '4', { bool_phrase: true, _boolPhrase: true, _kind: 'boolean' }),
      rp(),                                                       // root close → no addr
    ];
    expect(addrs(stream)).toEqual([
      '0',      // works where all (
      '1',      // type is any (article, preprint)
      '2',      // full text has all (
      '2.1',    //   any (dog, cat)
      '2.2',    //   any (play, jump)
      null,     //   )   close of full text group
      '3',      // title has animal
      '4',      // it's open access
      null,     // ) root close
    ]);
  });

  it('a single-filter query: the bare `works where` chrome line is still 0, the filter is 1', () => {
    // `works where title has animal` — no root group, but the entity line is labelled 0
    // anyway (Jason 2026-06-19: no blank first line); the lone filter numbers from 1.
    const stream = [ent(), where(), col('title', '1'), vb('animal', '1.1')];
    expect(addrs(stream)).toEqual(['0', '1']);   // chrome line = 0, lone filter = 1
  });

  it('a group open line is numbered with the group address (joinkw carries addr)', () => {
    // a cross-field clause group `any ( year >= 2019 , year <= 2023 )` at addr 3
    const stream = [
      ent(), where(), gk('and'),                  // root open → 0
      gk('or', '3'), col('year', '3.1'), vb('2019', '3.1.1'), comma('3'),
      col('year', '3.2'), vb('2023', '3.2.1'), rp('3'),
      rp(),
    ];
    const out = addrs(stream);
    expect(out[0]).toBe('0');
    expect(out[1]).toBe('3');      // the `any (` open line owns the group addr
    expect(out[2]).toBe('3.1');
    expect(out[3]).toBe('3.2');
    expect(out[4]).toBe(null);     // the group's close paren
    expect(out[5]).toBe(null);     // root close
  });

  it('a draft/transient line with no addresses gets no number, and does not throw', () => {
    // a mid-edit draft clause carries no server addr yet.
    const draft = { tokens: [{ t: 'col', text: 'year', _draft: true }, { t: 'vbrick', text: '', _draft: true }] };
    expect(lineAddr(draft)).toBe(null);
    expect(lineAddr({ tokens: [] })).toBe(null);
    expect(lineAddr({})).toBe(null);
  });

  it('a pure close-paren line is unnumbered even if its paren carries an addr', () => {
    // a clause-GROUP close paren carries the group addr server-side; it must not show.
    // (The terminator numbering is applied SEPARATELY, by fillTerminatorAddrs over the laid-out
    // lines — lineAddr stays single-line / context-free. See the next describe block.)
    expect(lineAddr({ tokens: [rp('3')] })).toBe(null);
  });
});

// oxjob #475 (Jason 2026-06-22) — number the TERMINATOR lines. After the per-line lineAddr
// pass, fillTerminatorAddrs gives each solo close-`)` line the address of the line that opened
// its group (`_groupSpan[0]`), so a nested query counts up then back down and the root `)` is 0.
const numbered = (tokens) => {
  const lines = layoutLines(tokens);
  lines.forEach((l) => { l.addr = lineAddr(l); });   // mirror displayLines' per-line pass
  fillTerminatorAddrs(lines);
  return lines.map((l) => l.addr);
};

describe('fillTerminatorAddrs', () => {
  it('the running example: each `)` inherits its opener; the root `)` reads 0', () => {
    const stream = [
      ent(), where(), gk('and'),                                  // root open → 0
      col('type', '1'), gk('or'), vb('article', '1.1'), comma(), vb('preprint', '1.2'), rp(), comma(),
      col('full text', '2'), gk('and'),                           // `full text has all (` → 2
      gk('or', '2.1'), vb('dog', '2.1.1'), comma('2.1'), vb('cat', '2.1.2'), rp('2.1'), comma(),
      gk('or', '2.2'), vb('play', '2.2.1'), comma('2.2'), vb('jump', '2.2.2'), rp('2.2'),
      rp(), comma(),                                              // close of `full text all (` → 2
      col('title', '3'), vb('animal', '3.1'), comma(),
      vb("it's open access", '4', { bool_phrase: true, _boolPhrase: true, _kind: 'boolean' }),
      rp(),                                                       // root close → 0
    ];
    expect(numbered(stream)).toEqual([
      '0',      // works where all (
      '1',      // type is any (article, preprint)
      '2',      // full text has all (
      '2.1',    //   any (dog, cat)
      '2.2',    //   any (play, jump)
      '2',      //   )  ← was null; now the address it terminates
      '3',      // title has animal
      '4',      // it's open access
      '0',      // )  ← root close; was null, now 0
    ]);
  });

  it('Jason\'s spec example: type / title-abstract nesting → inner ) is 2, outer ) is 0', () => {
    // works where all( type is all(article, review), title/abstract has all( any(..), any(..) ) )
    const stream = [
      ent(), where(), gk('and'),                                  // 0
      col('type', '1'), gk('and', 'g1'), vb('article', '1.1'), comma('g1'), vb('review', '1.2'), rp('g1'), comma(),
      col('title/abstract', '2'), gk('and'),                      // 2 — opens the title/abstract block
      gk('or', '2.1'), vb('BERT', '2.1.1'), comma('2.1'), vb('ChatGPT', '2.1.2'), rp('2.1'), comma(),
      gk('or', '2.2'), vb('a', '2.2.1'), comma('2.2'), vb('b', '2.2.2'), rp('2.2'),
      rp(),                                                       // inner ) → 2
      rp(),                                                       // root ) → 0
    ];
    const out = numbered(stream);
    expect(out[out.length - 2]).toBe('2');   // first solo close-paren terminates line 2
    expect(out[out.length - 1]).toBe('0');   // final close-paren terminates line 0
  });

  it('leaves open / value / chrome lines untouched (only fills empty close ends)', () => {
    // a value line that happens to have no addr must NOT be filled from a span.
    const lines = [
      { addr: '0', _groupSpan: [0, 2] },   // open
      { addr: '1' },                        // child
      { addr: null, _groupSpan: [0, 2] },  // close → inherits '0'
      { addr: null },                       // chrome/draft, no span → stays null
    ];
    fillTerminatorAddrs(lines);
    expect(lines.map((l) => l.addr)).toEqual(['0', '1', '0', null]);
  });

  it('is a no-op on a span whose open line has no number (defensive)', () => {
    const lines = [{ addr: null, _groupSpan: [0, 1] }, { addr: null, _groupSpan: [0, 1] }];
    fillTerminatorAddrs(lines);
    expect(lines.map((l) => l.addr)).toEqual([null, null]);
  });
});
