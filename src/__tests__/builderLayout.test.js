import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';

// oxjob #507 — AND-vertical / OR-horizontal column-grid layout. layoutLines
// re-derives line breaks + a rigid filler-column grid CLIENT-SIDE from the group
// structure of the flat token stream. The six shapes below are the approved
// mockups (oxjob #507 evidence/mockups.html). Rules:
//   - AND → vertical (each operand its own line); OR-of-leaves → inline.
//   - a VERTICAL group adds one structural COLUMN: operand 0 → spacer, operands
//     1+ → connector (&/or) on the first line, spacer on continuation lines.
//   - a SINGLE-operand group is transparent (no column).
//   - `works where` chrome rides the first line; its leading spacer is dropped.
//   - parens are NEVER drawn (the columns carry the grouping).

// --- token builders (mirror the server `oql_render_v2` / treeToTokens shape) --
const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text, id) => ({ t: 'col', text, id });
const op = (text) => ({ t: 'op', text });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: v, display: v, ...extra });
const conn = (w, id) => ({ t: 'conn', id, text: ` ${w} `, label: w });
const lp = (id) => ({ t: 'paren', text: '(', id });
const rp = (id) => ({ t: 'paren', text: ')', id });

// Render a line's structural column prefix as a compact string: spacer = `--`,
// connector = its glyph (`&` for and, the word for or).
const colstr = (line) =>
  line.cols.map((c) => (c.t === 'spacer' ? '--' : (c.label === 'and' ? '&' : c.label))).join(' ');
// Render a line's CONTENT tokens (no parens — they're never emitted).
const content = (line) =>
  line.tokens.map((t) => (t.label && t.t === 'conn' ? (t.label === 'and' ? '&' : t.label)
    : (t.text != null ? t.text : t.display || '')).trim())
    .filter((s) => s !== '').join(' ');
// One row as `<cols> | <content>` (cols omitted when empty).
const row = (line) => (line.cols.length ? `${colstr(line)} | ${content(line)}` : content(line));
const lay = (tokens) => layoutLines(tokens).map(row);

describe('layoutLines — column-grid layout (oxjob #507)', () => {
  it('shape 3 · pure OR — synonyms stay inline on one line', () => {
    // `title&abstract has (cancer or tumor or neoplasm)` — single clause, OR-bag value.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('g1'), vb('cancer'), conn('or', 'g1'), vb('tumor'), conn('or', 'g1'), vb('neoplasm'), rp('g1'),
    ])).toEqual(['works where title & abstract has cancer or tumor or neoplasm']);
  });

  it('shape 1 · hero — product of sums: AND vertical, OR synonyms inline', () => {
    // `title&abstract has ((cancer or tumor) and (therapy or treatment) and (child or pediatric))`
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), conn('or', 'o1'), vb('neoplasm'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('therapy'), conn('or', 'o2'), vb('treatment'), rp('o2'),
      conn('and', 'AND'),
      lp('o3'), vb('child'), conn('or', 'o3'), vb('pediatric'), conn('or', 'o3'), vb('adolescent'), rp('o3'),
      rp('AND'),
    ])).toEqual([
      'works where title & abstract has',
      '-- | cancer or tumor or neoplasm',
      '& | therapy or treatment',
      '& | child or pediatric or adolescent',
    ]);
  });

  it('shape 2 · pure AND — a checklist of different filters; first rides the where line', () => {
    // `type is article and publication year > 2020 and is open access is true`
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('type is'), vb('article'), conn('and', 'ROOT'),
      col('publication year >'), vb('2020'), conn('and', 'ROOT'),
      col('is open access is'), vb('true'),
    ])).toEqual([
      'works where type is article',
      '& | publication year > 2020',
      '& | is open access is true',
    ]);
  });

  it('shape 4 · crossgrain — AND-group inside OR: two filler columns, no rail', () => {
    // `title&abstract has ((cancer and therapy) or (tumor and treatment))`
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('OR'),
      lp('a1'), vb('cancer'), conn('and', 'a1'), vb('therapy'), rp('a1'),
      conn('or', 'OR'),
      lp('a2'), vb('tumor'), conn('and', 'a2'), vb('treatment'), rp('a2'),
      rp('OR'),
    ])).toEqual([
      'works where title & abstract has',
      '-- -- | cancer',
      '-- & | therapy',
      'or -- | tumor',
      '-- & | treatment',
    ]);
  });

  it('shape 5 · negation — negated filter on its own & line', () => {
    // `(cancer or tumor) and not title&abstract has pediatric`. The `not` rides the
    // value chip (vbrick.negated) — layout just puts the second filter on its & line.
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('title & abstract has'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'ROOT'),
      col('title & abstract has'), vb('pediatric', { negated: true, display: 'pediatric', text: 'not pediatric' }),
    ])).toEqual([
      'works where title & abstract has cancer or tumor',
      '& | title & abstract has not pediatric',
    ]);
  });

  it('shape 6 · long OR — one logical line (CSS wraps it); next concept resumes', () => {
    // `(neoplasm or carcinoma or ... ) and (screening or detection)` — the first
    // AND operand is a long OR that wraps VISUALLY (flex-wrap), but it's ONE layout
    // line; the second concept gets its own & line.
    const syn = ['neoplasm', 'carcinoma', 'sarcoma', 'lymphoma', 'melanoma'];
    const orBag = [lp('o1')];
    syn.forEach((s, i) => { if (i) orBag.push(conn('or', 'o1')); orBag.push(vb(s)); });
    orBag.push(rp('o1'));
    const lines = lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'),
      ...orBag,
      conn('and', 'AND'),
      lp('o2'), vb('screening'), conn('or', 'o2'), vb('detection'), rp('o2'),
      rp('AND'),
    ]);
    expect(lines).toEqual([
      'works where title & abstract has',
      '-- | neoplasm or carcinoma or sarcoma or lymphoma or melanoma',
      '& | screening or detection',
    ]);
  });
});

describe('layoutLines — structural invariants', () => {
  it('a single flat clause stays one line, no column', () => {
    const lines = layoutLines([col('year', 'c1'), op(' is '), vb('2020', { id: 'v1' })]);
    expect(lines).toHaveLength(1);
    expect(lines[0].cols).toHaveLength(0);
    expect(content(lines[0])).toBe('year is 2020');
  });

  it('NEVER emits a paren token in cols or content', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'), lp('o1'), vb('a'), conn('and', 'AND'), vb('b'), rp('o1'), rp('AND'),
    ]);
    for (const ln of lines) {
      expect(ln.cols.every((c) => c.t !== 'paren')).toBe(true);
      expect(ln.tokens.every((t) => t.t !== 'paren')).toBe(true);
    }
  });

  it('AND connector cell keeps its `and` label (chip renders &); OR keeps `or`', () => {
    const lines = layoutLines([
      col('type is'), vb('article'), conn('and', 'ROOT'),
      col('year >'), vb('2020'),
    ]);
    const andCell = lines[1].cols[0];
    expect(andCell.t).toBe('conn');
    expect(andCell.label).toBe('and');
  });

  it('connector cells carry the group id (for Phase-3 connector editing)', () => {
    const lines = layoutLines([
      col('type is'), vb('article'), conn('and', 'ROOTID'),
      col('year >'), vb('2020'),
    ]);
    expect(lines[1].cols[0].id).toBe('ROOTID');
  });

  it('assigns unique keys to every emitted line', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'),
      col('a', 'c1'), vb('1', { id: 'v1' }), conn('and', 'r'),
      col('b', 'c2'), vb('2', { id: 'v2' }),
    ]);
    const keys = lines.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('cl:c1');
    expect(keys).toContain('cl:c2');
  });

  it('depth mirrors cols.length', () => {
    const lines = layoutLines([
      col('f has'),
      lp('OR'), lp('a1'), vb('a'), conn('and', 'a1'), vb('b'), rp('a1'),
      conn('or', 'OR'), lp('a2'), vb('c'), conn('and', 'a2'), vb('d'), rp('a2'), rp('OR'),
    ]);
    for (const ln of lines) expect(ln.depth).toBe(ln.cols.length);
  });

  // oxjob #507 Phase 3: connector cells carry their group id + the index of the operand
  // they precede (`_opIndex`), so a click flips THAT connector (v2Edit.flipConnector).
  it('vertical-group connector cells carry group id + _opIndex (the flip address)', () => {
    // hero: AND group of 3 operands (o1,o2,o3) — lines 2 and 3 lead with `&` connector cells.
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('therapy'), conn('or', 'o2'), vb('treatment'), rp('o2'),
      conn('and', 'AND'),
      lp('o3'), vb('child'), conn('or', 'o3'), vb('pediatric'), rp('o3'),
      rp('AND'),
    ]);
    const connCells = lines.flatMap((l) => l.cols.filter((c) => c.t === 'conn'));
    expect(connCells.map((c) => c.id)).toEqual(['AND', 'AND']);   // both carry the AND group id
    expect(connCells.map((c) => c._opIndex)).toEqual([1, 2]);     // operands 1 and 2 (0 leads w/ spacer)
  });

  it('inline-OR connector cells carry _opIndex too', () => {
    const lines = layoutLines([
      col('f has'),
      lp('g1'), vb('a'), conn('or', 'g1'), vb('b'), conn('or', 'g1'), vb('c'), rp('g1'),
    ]);
    const inlineConns = lines[0].tokens.filter((t) => t.t === 'conn');
    expect(inlineConns.map((c) => c._opIndex)).toEqual([1, 2]);
    expect(inlineConns.every((c) => c.id === 'g1')).toBe(true);
  });
});
