import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';
import { lineAddr } from '../components/Oql/oqlMargin.js';

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

  it('a single-filter query has no 0; the chrome line is unnumbered, the filter is 1', () => {
    // `works where title has animal` — no root group (no wrapper), so no `0`.
    const stream = [ent(), where(), col('title', '1'), vb('animal', '1.1')];
    expect(addrs(stream)).toEqual([null, '1']);   // chrome line unnumbered, lone filter = 1
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
    expect(lineAddr({ tokens: [rp('3')] })).toBe(null);
  });
});
