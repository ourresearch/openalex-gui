import { describe, it, expect } from 'vitest';
import { splitClauses } from '../components/Oql/builderLayout.js';

// oxjob #428 — "every filter gets its own line, always". splitClauses breaks a
// display line at CLAUSE-level connectors (and/or that join filters), leaving
// value-OR groups (`title contains (a or b)`) intact (one filter, one line).

const line = (tokens) => ({ key: 's1', depth: 0, tokens });
const col = (id) => ({ t: 'col', id, text: 'type' });
const op = () => ({ t: 'op', text: ' is ' });
const vb = (id, v) => ({ t: 'vbrick', id, value: v, text: v });
const conn = (id, w) => ({ t: 'conn', id, text: ` ${w} `, label: w });
const lp = (id) => ({ t: 'paren', id, text: '(' });
const rp = (id) => ({ t: 'paren', id, text: ')' });
const labels = (segs) => segs.map((s) => s.tokens.map((t) => (t.text || '').trim()).join('|'));

describe('splitClauses', () => {
  it('splits two top-level filters onto their own lines, connector leading', () => {
    // `type is x and type is y`
    const out = splitClauses(line([
      col('a'), op(), vb('av', 'x'), conn('g', 'and'), col('b'), op(), vb('bv', 'y'),
    ]));
    expect(out).toHaveLength(2);
    expect(labels(out)).toEqual(['type|is|x', 'and|type|is|y']);
    // unique keys for the v-for
    expect(out[0].key).not.toBe(out[1].key);
  });

  it('keeps a value-OR group (between vbricks) on one line', () => {
    // `title contains a or b` — one filter, value-level `or`
    const out = splitClauses(line([
      col('c'), op(), vb('v1', 'a'), conn('vg', 'or'), vb('v2', 'b'),
    ]));
    expect(out).toHaveLength(1);
    expect(labels(out)).toEqual(['type|is|a|or|b']);
  });

  it('returns the same line object (no split) when there is nothing to split', () => {
    const l = line([col('c'), op(), vb('v1', 'a')]);
    expect(splitClauses(l)).toEqual([l]);
  });

  it('splits a connector that introduces a paren group', () => {
    // `type is x and (` — the open paren starts a new clause group
    const out = splitClauses(line([
      col('a'), op(), vb('av', 'x'), conn('g', 'and'), lp('grp'),
    ]));
    expect(labels(out)).toEqual(['type|is|x', 'and|(']);
  });

  it('splits three top-level filters', () => {
    const out = splitClauses(line([
      col('a'), op(), vb('av', 'x'),
      conn('g', 'and'), col('b'), op(), vb('bv', 'y'),
      conn('g', 'and'), col('d'), op(), vb('dv', 'z'),
    ]));
    expect(labels(out)).toEqual(['type|is|x', 'and|type|is|y', 'and|type|is|z']);
  });

  it('does not split a leading connector with an empty buffer', () => {
    // a line the server already broke, starting with the connector
    const out = splitClauses(line([
      conn('g', 'and'), col('b'), op(), vb('bv', 'y'),
    ]));
    expect(out).toHaveLength(1);
    expect(labels(out)).toEqual(['and|type|is|y']);
  });

  it('leaves the value group intact but splits the clause after it', () => {
    // `title contains (a or b) and type is x`
    const out = splitClauses(line([
      col('c'), op(), lp('vg'), vb('v1', 'a'), conn('vg', 'or'), vb('v2', 'b'), rp('vg'),
      conn('top', 'and'), col('d'), op(), vb('dv', 'x'),
    ]));
    expect(labels(out)).toEqual(['type|is|(|a|or|b|)', 'and|type|is|x']);
  });

  it('splits before a standalone boolean phrase brick (its own filter)', () => {
    // `it's open access and is_retracted is true` — both are boolean filters; the
    // phrase is a vbrick but starts a new clause, so the connector splits.
    const phrase = (id, text) => ({ t: 'vbrick', id, text, bool_phrase: true });
    const out = splitClauses(line([
      phrase('a', "it's open access"), conn('g', 'and'), phrase('b', "it's retracted"),
    ]));
    expect(out).toHaveLength(2);
    expect(labels(out)).toEqual(["it's open access", "and|it's retracted"]);
  });
});
