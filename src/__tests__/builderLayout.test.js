import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';

// oxjob #507 — all-or-nothing column-grid layout (rev-2, Jason 2026-06-24).
// layoutLines re-derives line breaks + a rigid filler-column grid CLIENT-SIDE
// from the group structure of the flat token stream. Rules:
//   - a group is INLINE iff ALL its operands are leaves (AND or OR alike); the
//     moment it contains a sub-group it breaks FULLY (every operand its own line,
//     no partial-inline) and each sub-group operand recurses.
//   - a VERTICAL group adds one structural COLUMN: operand 0 → spacer, operands
//     1+ → connector (&/or) on the first line, spacer on continuation lines.
//   - a SINGLE-operand group is transparent (no column).
//   - the leading entity chrome (`works`, `where`) is DISCARDED — the subject-entity
//     selector lives in the toolbar now (oxjob #507), so the canvas is a pure list of
//     filters. Change #2: the first filter now leads with the ROOT group's operand-0
//     arrow (a `--` spacer) too, so every field chip lines up in one column.
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
    ])).toEqual(['title & abstract has cancer or tumor or neoplasm']);
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
      'title & abstract has',
      '-- | cancer or tumor or neoplasm',
      '& | therapy or treatment',
      '& | child or pediatric or adolescent',
    ]);
  });

  it('shape 2 · pure AND — a checklist of different filters; first leads with the root arrow', () => {
    // `type is article and publication year > 2020 and is open access is true`. Change #2
    // (Jason 2026-06-24 #507): the first filter no longer pulls flush-left — it leads with the
    // root group's operand-0 arrow (a `--` spacer here), so every field chip lines up in one column.
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('type is'), vb('article'), conn('and', 'ROOT'),
      col('publication year >'), vb('2020'), conn('and', 'ROOT'),
      col('is open access is'), vb('true'),
    ])).toEqual([
      '-- | type is article',
      '& | publication year > 2020',
      '& | is open access is true',
    ]);
  });

  it('shape 4 · crossgrain — AND-group inside OR: each all-leaf AND inlines', () => {
    // `title&abstract has ((cancer and therapy) or (tumor and treatment))`. rev-2:
    // the outer OR breaks (it has sub-groups), but each operand is an all-leaf AND,
    // so it inlines on its own line (`cancer & therapy`) — no 2-deep column grid.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('OR'),
      lp('a1'), vb('cancer'), conn('and', 'a1'), vb('therapy'), rp('a1'),
      conn('or', 'OR'),
      lp('a2'), vb('tumor'), conn('and', 'a2'), vb('treatment'), rp('a2'),
      rp('OR'),
    ])).toEqual([
      'title & abstract has',
      '-- | cancer & therapy',
      'or | tumor & treatment',
    ]);
  });

  it('mixed crossgrain — leaf operands COALESCE; only the subclause breaks (rev-3)', () => {
    // `title/abstract has (atrophic or atrophy or dryness or ((carbetocin or oxytocin)
    // and (dyspareunia or vulvar)))` — an OR bag mixing 3 leaf synonyms with one AND
    // sub-group. rev-3 (Jason 2026-06-24): the 3 leaves COALESCE onto one line; only the
    // AND subclause breaks. The AND (itself sub-grouped) breaks into the deeper column grid.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title/abstract has'),
      lp('OR'),
      vb('atrophic'), conn('or', 'OR'),
      vb('atrophy'), conn('or', 'OR'),
      vb('dryness'), conn('or', 'OR'),
      lp('AND'),
      lp('g1'), vb('carbetocin'), conn('or', 'g1'), vb('oxytocin'), rp('g1'),
      conn('and', 'AND'),
      lp('g2'), vb('dyspareunia'), conn('or', 'g2'), vb('vulvar'), rp('g2'),
      rp('AND'),
      rp('OR'),
    ])).toEqual([
      'title/abstract has',
      '-- | atrophic or atrophy or dryness',
      'or -- | carbetocin or oxytocin',
      '-- & | dyspareunia or vulvar',
    ]);
  });

  it('mixed crossgrain — coalesced run + broken subclause carry their _opIndex (rev-3)', () => {
    // `title/abstract has (atrophic or atrophy or dryness or (carbetocin & oxytocin))`.
    // rev-3: the 3 leaves coalesce (their WITHIN-run inline conns carry _opIndex 1,2); the
    // all-leaf AND subclause breaks onto its own line, led by the OR's operand-3 column conn.
    const lines = layoutLines([
      col('title/abstract has'),
      lp('OR'),
      vb('atrophic'), conn('or', 'OR'),
      vb('atrophy'), conn('or', 'OR'),
      vb('dryness'), conn('or', 'OR'),
      lp('AND'),
      lp('g1'), vb('carbetocin'), conn('and', 'AND'), vb('oxytocin'), rp('g1'),
      rp('AND'),
      rp('OR'),
    ]);
    // header, then the coalesced leaf run, then the AND subclause line.
    expect(lines).toHaveLength(3);
    // coalesced run leads with the OR operand-0 arrow; its inline conns address operands 1,2.
    expect(lines[1].cols[0].t).toBe('spacer');
    const runConns = lines[1].tokens.filter((t) => t.t === 'conn');
    expect(runConns.map((c) => c._opIndex)).toEqual([1, 2]);
    expect(runConns.every((c) => c.id === 'OR')).toBe(true);
    // the subclause line leads with the OR operand-3 column connector.
    const subCell = lines[2].cols[0];
    expect(subCell.t).toBe('conn');
    expect(subCell._opIndex).toBe(3);
    expect(subCell.id).toBe('OR');
    // the AND subclass inlined: its content carries the `&` connector inline.
    expect(lines[2].tokens.filter((t) => t.t === 'conn').map((c) => c.label)).toEqual(['and']);
  });

  it('trailing spacers go blank — a cleared column is indent, not structure', () => {
    // `title/abstract has (intake and (season or (spring and summer and winter and
    // (autumn or fall))))`. Deeply nested; once a column has no connector below it,
    // its remaining spacers are blank (`_blank`) — they keep width but drop the chip.
    // (oxjob #507 follow-up, Jason 2026-06-23.)
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'), col('title/abstract has'),
      lp('AND'),
      vb('intake'), conn('and', 'AND'),
      lp('OR'),
      vb('season'), conn('or', 'OR'),
      lp('AND2'),
      vb('spring'), conn('and', 'AND2'), vb('summer'), conn('and', 'AND2'), vb('winter'), conn('and', 'AND2'),
      lp('o1'), vb('autumn'), conn('or', 'o1'), vb('fall'), rp('o1'),
      rp('AND2'),
      rp('OR'),
      rp('AND'),
    ]);
    // map each line to its column cells tagged spacer(blank?)/conn
    const colKinds = lines.map((ln) => ln.cols.map((c) =>
      c.t === 'conn' ? (c.label === 'and' ? '&' : c.label) : (c._blank ? 'blank' : 'spacer')));
    expect(colKinds).toEqual([
      [],                                 // title/abstract has  (field header, no cols)
      ['spacer'],                         // intake   (& comes below → load-bearing)
      ['&', 'spacer'],                    // season   (col1 spacer holds the `or` below)
      ['blank', 'or', 'spacer'],          // spring & summer & winter  (rev-3: leaves coalesce)
      ['blank', 'blank', '&'],            // autumn or fall
    ]);
  });

  it('continuation spacers never show an arrow — indent is indent (Jason 2026-06-24)', () => {
    // `f has (orange or (apple and (x or y)) or cherry)`. The middle OR operand is a
    // vertical AND sub-group spanning two lines (apple / x-or-y). Its SECOND line is a
    // continuation of that one operand — pure indent. The OUTER OR has a later operand
    // (`or cherry`), so the outer column DOES carry a connector BELOW that continuation
    // line. The old elision (blank only when no connector below) wrongly kept an arrow
    // there — a SURPLUS second arrow marking indent. A continuation spacer must always
    // be blank; only the omitted-leading-conjunction slots (orange's `→`, apple's `→`)
    // earn an arrow.
    const lines = layoutLines([
      col('f has'),
      lp('OR'),
      vb('orange'), conn('or', 'OR'),
      lp('AND'),
      vb('apple'), conn('and', 'AND'),
      lp('g1'), vb('x'), conn('or', 'g1'), vb('y'), rp('g1'),
      rp('AND'),
      conn('or', 'OR'),
      vb('cherry'),
      rp('OR'),
    ]);
    const colKinds = lines.map((ln) => ln.cols.map((c) =>
      c.t === 'conn' ? (c.label === 'and' ? '&' : c.label) : (c._blank ? 'blank' : 'spacer')));
    expect(colKinds).toEqual([
      [],                       // f has         (field header)
      ['spacer'],               // orange        (OR-bag leader → `→`)
      ['or', 'spacer'],         // apple         (omitted-leading-AND slot → `→`)
      ['blank', '&'],           // x or y        (continuation of the apple operand → BLANK, not `→`)
      ['or'],                   // cherry
    ]);
    // the surplus arrow lived at line "x or y", col 0: it must be a BLANK spacer.
    const xOrY = lines[3];
    expect(xOrY.cols[0].t).toBe('spacer');
    expect(xOrY.cols[0]._blank).toBe(true);
    expect(xOrY.cols[0]._cont).toBe(true);
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
      '-- | title & abstract has cancer or tumor',   // first filter leads with the root arrow (#507 change #2)
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
      'title & abstract has',
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

  // --- #507 change #1/#2/#3: collapse, root arrow, value-vs-filter level ------

  it('change #2/#3 · the root arrow is a real, collapsible, FILTER-level cell when rootId is given', () => {
    const lines = layoutLines([
      col('type is'), vb('article'), conn('and', 'R'),
      col('year >'), vb('2020'),
    ], { rootId: 'R' });
    const arrow = lines[0].cols[0];
    expect(arrow.t).toBe('spacer');
    expect(arrow.id).toBe('R');               // carries the root id → collapsible
    expect(arrow._collapsible).toBe(true);
    expect(arrow._level).toBe('filter');      // top-level filters → gray
    // the filter connector on line 2 is filter-level too
    expect(lines[1].cols[0]._level).toBe('filter');
  });

  it('change #3 · connectors/arrows INSIDE a value bag are value-level (blue)', () => {
    // `title has ((cancer or tumor) and (therapy or treatment))` — one filter, vertical value bag.
    const lines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('therapy'), conn('or', 'o2'), vb('treatment'), rp('o2'),
      rp('AND'),
    ]);
    // line 0 = field header (no cols). lines 1+ = the AND value-bag operands.
    const bagArrow = lines[1].cols[0];
    expect(bagArrow.t).toBe('spacer');
    expect(bagArrow._level).toBe('value');                 // value-bag arrow → blue
    expect(lines[2].cols[0]._level).toBe('value');         // the `&` value-bag connector → blue
    // inline OR connectors are value-level too
    expect(lines[1].tokens.filter((t) => t.t === 'conn').every((c) => c._level === 'value')).toBe(true);
  });

  it('change #1 · a collapsed group folds to one [join ×N] summary line', () => {
    // collapse the AND value-bag 'AND' → its 2 operands fold to a single summary chip.
    const lines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('therapy'), conn('or', 'o2'), vb('treatment'), rp('o2'),
      rp('AND'),
    ], { collapsed: new Set(['AND']) });
    expect(lines).toHaveLength(2);                          // header + one collapsed summary line
    const summary = lines[1].tokens.find((t) => t.t === 'summary');
    expect(summary).toMatchObject({ id: 'AND', label: 'and', count: 2, _level: 'value' });
    const arrow = lines[1].cols[0];
    expect(arrow._collapsed).toBe(true);
    expect(arrow._collapsible).toBe(true);                  // stays visible (not elided to blank)
  });
});
