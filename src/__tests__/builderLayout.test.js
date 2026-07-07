import { describe, it, expect } from 'vitest';
import { layoutLines, splitLineCells } from '../components/Oql/builderLayout.js';

// oxjob #575 — the TWO-COLUMN TABLE layout (supersedes #523's indent model).
// layoutLines re-derives line breaks CLIENT-SIDE from the group structure of the flat
// token stream, and splits every line into a FIELD cell and a VALUE cell:
//   FILTER scope (top level): each filter is its OWN row — field(+op) chip in the field
//     cell, value list in the value cell (a newline reads as AND). Filter-scope OR is
//     gated to the OQL tab by representableShape; layoutLines keeps a defensive inline
//     fallback (everything in the value cell) so a transient tree never crashes.
//   VALUE scope (inside one filter): the first OR-group rides the filter's row; each
//     further AND-group gets its OWN row with an EMPTY field cell and its `&` connector
//     as the field cell's only token (_fieldConn — rendered right-aligned at the column
//     boundary). OR values stay inline; an AND sub-group inside an OR row
//     (`pie or (tart and pastry)`) collapses to ONE bold text-block chip.
//   - #523 round 8 (unchanged): the parens OQL writes are re-attached as `_pOpen`/`_pClose`
//     decoration COUNTS on a group's first/last chip. cols are always empty.
// The serializer below renders `field │ value` per row (`│` = the column boundary).

// --- token builders (mirror the server `oql_render_v2` / treeToTokens shape) --
const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text, id) => ({ t: 'col', text, id });
const op = (text) => ({ t: 'op', text });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: v, display: v, ...extra });
const conn = (w, id) => ({ t: 'conn', id, text: ` ${w} `, label: w });
const lp = (id) => ({ t: 'paren', text: '(', id });
const rp = (id) => ({ t: 'paren', text: ')', id });

// Render a token run. A connector renders as `&`/`or`. The OQL grouping parens (#523
// round 8) ride as `_pOpen`/`_pClose` decoration COUNTS on the first/last chip of a
// group — serialize them glued to that chip (`(apple`, `banana)`).
const cellStr = (toks) =>
  (toks || []).map((t) => {
    const base = (t.t === 'conn' ? t.label  // #575 r4: chips show the word ('and'), no '&'
      : (t.text != null ? t.text : t.display || '')).trim();
    if (base === '') return '';
    return '('.repeat(t._pOpen || 0) + base + ')'.repeat(t._pClose || 0);
  })
    .filter((s) => s !== '').join(' ');
const content = (line) => cellStr(line.tokens);
// One row as the two table cells: `field │ value` (#575). An empty field cell (the
// defensive filter-OR fallback) renders a bare leading `│`.
const row = (line) => `${cellStr(line._fieldToks)} │ ${cellStr(line._valueToks)}`.trim();
const lay = (tokens) => layoutLines(tokens).map(row);

describe('layoutLines — 2D indent layout (oxjob #523)', () => {
  it('pure OR — synonyms stay inline on the field row', () => {
    // `title&abstract has (cancer or tumor or neoplasm)` — single clause, OR-bag value.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('g1'), vb('cancer'), conn('or', 'g1'), vb('tumor'), conn('or', 'g1'), vb('neoplasm'), rp('g1'),
    ])).toEqual(['title & abstract has │ (cancer or tumor or neoplasm)']);
  });

  it('hero — product of sums: field+first OR on row 1, each AND group an indented `&` row', () => {
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
      'title & abstract has │ (cancer or tumor or neoplasm)',
      'and │ (therapy or treatment)',
      'and │ (child or pediatric or adolescent)',
    ]);
  });

  it('pure AND of filters — each filter its own row, NO indent, NO connector', () => {
    // `type is article and publication year > 2020 and is open access is true`. Filters
    // stack flush-left; the newline is the AND. (#523: filters never indent.)
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('type is'), vb('article'), conn('and', 'ROOT'),
      col('publication year >'), vb('2020'), conn('and', 'ROOT'),
      col('is open access is'), vb('true'),
    ])).toEqual([
      'type is │ article',
      'publication year > │ 2020',
      'is open access is │ true',
    ]);
  });

  it('crossgrain — sum of products: OR inline, each AND group a text-block chip, one row', () => {
    // `title&abstract has ((cancer and therapy) or (tumor and treatment))`. The value is one
    // OR-group → inline; each in-column AND operand collapses to ONE bold text-block chip (#523 r2).
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('OR'),
      lp('a1'), vb('cancer'), conn('and', 'a1'), vb('therapy'), rp('a1'),
      conn('or', 'OR'),
      lp('a2'), vb('tumor'), conn('and', 'a2'), vb('treatment'), rp('a2'),
      rp('OR'),
    ])).toEqual([
      'title & abstract has │ ((cancer and therapy) or (tumor and treatment))',
    ]);
  });

  it('one paren level — `(apple or banana) and (pie or (tart and pastry))`', () => {
    // ACCEPTANCE Test 2. field + first OR-group on row 1; the second AND-group on an
    // indented `&` row, with the inner AND sub-group `(tart and pastry)` parenthesized.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title has'),
      lp('AND'),
      lp('o1'), vb('apple'), conn('or', 'o1'), vb('banana'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('pie'), conn('or', 'o2'),
      lp('a1'), vb('tart'), conn('and', 'a1'), vb('pastry'), rp('a1'),
      rp('o2'),
      rp('AND'),
    ])).toEqual([
      'title has │ (apple or banana)',
      'and │ (pie or (tart and pastry))',
    ]);
  });

  it('pure value-AND — `title has (a and b)` → field+a, then an indented `& b` row', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title has'),
      lp('AND'), vb('a'), conn('and', 'AND'), vb('b'), rp('AND'),
    ])).toEqual([
      'title has │ a',
      'and │ b',
    ]);
  });

  it('filter-scope OR — DEFENSIVE fallback only (#575): one row, everything in the value cell', () => {
    // `(title has apple) or (year is 2020)` — representableShape gates this to the OQL tab,
    // so the builder should never render it; if a transient tree slips through, layoutLines
    // must not crash: the whole row inlines with an EMPTY field cell.
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      lp('OR'),
      col('title has'), vb('apple'),
      conn('or', 'OR'),
      col('year is'), vb('2020'),
      rp('OR'),
    ])).toEqual([
      '│ (title has apple or year is 2020)',
    ]);
  });

  it('leading chips (#523 r2): `→` on the first filter row, `&` on each AND-ed filter row, none on value rows', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'),
      col('type is'), vb('article'), conn('and', 'ROOT'),
      col('title has'),
      lp('AND'),
      lp('o1'), vb('apple'), conn('or', 'o1'), vb('banana'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('pie'), conn('or', 'o2'), vb('tart'), rp('o2'),
      rp('AND'),
    ]);
    // rows: [type is article] [title has apple or banana] [  & pie or tart]
    expect(lines.map((l) => l._lead)).toEqual(['arrow', 'and', null]);
  });

  it('filter-scope OR emits NO addplus token any more (#575 — the chip died with the shared row)', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'),
      lp('OR'),
      col('keyword is'), vb('anticoagulant', { id: 'v1' }),
      conn('or', 'OR'),
      col('title has'), vb('INR', { id: 'v2' }),
      rp('OR'),
    ]);
    expect(lines.flatMap((l) => l.tokens).every((t) => t.t !== 'addplus')).toBe(true);
    expect(lines[0]._lead).toBe('arrow');
  });

  it('negation — two AND-ed filters, the `not` rides the value chip', () => {
    // `title&abstract has (cancer or tumor) and not title&abstract has pediatric`.
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      col('title & abstract has'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'ROOT'),
      col('title & abstract has'), vb('pediatric', { negated: true, display: 'pediatric', text: 'not pediatric' }),
    ])).toEqual([
      'title & abstract has │ (cancer or tumor)',
      'title & abstract has │ not pediatric',
    ]);
  });

  it('long OR — one logical line (CSS wraps it); the next AND concept is an indented `&` row', () => {
    const syn = ['neoplasm', 'carcinoma', 'sarcoma', 'lymphoma', 'melanoma'];
    const orBag = [lp('o1')];
    syn.forEach((s, i) => { if (i) orBag.push(conn('or', 'o1')); orBag.push(vb(s)); });
    orBag.push(rp('o1'));
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'),
      ...orBag,
      conn('and', 'AND'),
      lp('o2'), vb('screening'), conn('or', 'o2'), vb('detection'), rp('o2'),
      rp('AND'),
    ])).toEqual([
      'title & abstract has │ (neoplasm or carcinoma or sarcoma or lymphoma or melanoma)',
      'and │ (screening or detection)',
    ]);
  });
});

describe('layoutLines — structural invariants', () => {
  it('a single flat clause stays one line, no cols, no indent', () => {
    const lines = layoutLines([col('year', 'c1'), op(' is '), vb('2020', { id: 'v1' })]);
    expect(lines).toHaveLength(1);
    expect(lines[0].cols).toHaveLength(0);
    expect(lines[0]._indent).toBe(0);
    expect(content(lines[0])).toBe('year is 2020');
  });

  it('cols is always empty (the #507 column grid is gone)', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'), col('title has'),
      lp('AND'),
      lp('o1'), vb('a'), conn('or', 'o1'), vb('b'), rp('o1'),
      conn('and', 'AND'), vb('c'),
      rp('AND'),
    ]);
    for (const ln of lines) expect(ln.cols).toHaveLength(0);
  });

  it('value-continuation rows carry _indent: 1; the field/first row is 0', () => {
    const lines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('apple'), conn('or', 'o1'), vb('banana'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('pie'), conn('or', 'o2'), vb('tart'), rp('o2'),
      rp('AND'),
    ]);
    expect(lines.map((l) => l._indent)).toEqual([0, 1]);
  });

  it('a value-continuation row leads with its `&` connector token (carrying id + _opIndex)', () => {
    const lines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('apple'), conn('or', 'o1'), vb('banana'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('pie'), conn('or', 'o2'), vb('tart'), rp('o2'),
      rp('AND'),
    ]);
    const lead = lines[1].tokens[0];
    expect(lead.t).toBe('conn');
    expect(lead.label).toBe('and');
    expect(lead.id).toBe('AND');
    expect(lead._opIndex).toBe(1);
  });

  it('an in-column AND sub-group becomes ONE text-block token; parens are never raw tokens (#523 r2)', () => {
    // A pure CNF value emits no parens AND no text-block (each AND operand is its own indented row).
    const noBlock = layoutLines([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('AND'),
      lp('o1'), vb('cancer'), conn('or', 'o1'), vb('tumor'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('therapy'), conn('or', 'o2'), vb('treatment'), rp('o2'),
      rp('AND'),
    ]);
    for (const ln of noBlock) {
      expect(ln.tokens.every((t) => t.t !== 'paren')).toBe(true);
      expect(ln.tokens.every((t) => t.t !== 'textblock')).toBe(true);
    }
    // `pie or (tart and pastry)`: the AND sub-group collapses to ONE text-block chip — no raw parens.
    const withBlock = layoutLines([
      col('title has'),
      lp('OR'), vb('pie'), conn('or', 'OR'),
      lp('a1'), vb('tart'), conn('and', 'a1'), vb('pastry'), rp('a1'),
      rp('OR'),
    ]);
    const allToks = withBlock.flatMap((ln) => ln.tokens);
    expect(allToks.every((t) => t.t !== 'paren')).toBe(true);
    const blocks = allToks.filter((t) => t.t === 'textblock');
    expect(blocks.length).toBe(1);
    expect(blocks[0].text).toBe('(tart and pastry)');
    expect(blocks[0]._vgroupId).toBe('a1');
  });

  it('inline OR connector cells carry their group id + _opIndex (the flip address)', () => {
    const lines = layoutLines([
      col('f has'),
      lp('g1'), vb('a'), conn('or', 'g1'), vb('b'), conn('or', 'g1'), vb('c'), rp('g1'),
    ]);
    const inlineConns = lines[0].tokens.filter((t) => t.t === 'conn');
    expect(inlineConns.map((c) => c._opIndex)).toEqual([1, 2]);
    expect(inlineConns.every((c) => c.id === 'g1')).toBe(true);
  });

  // #523 round 8: OQL grouping parens ride as `_pOpen`/`_pClose` decoration COUNTS on the
  // first/last chip of a paren-group (never their own chips), to teach grouping/precedence.
  describe('OQL grouping parens as edge decorations (#523 round 8)', () => {
    it('an OR value-bag puts `_pOpen` on its first value, `_pClose` on its last — and on no other token', () => {
      const line = layoutLines([
        col('title has'),
        lp('g1'), vb('apple', { id: 'a' }), conn('or', 'g1'), vb('banana', { id: 'b' }), conn('or', 'g1'), vb('cherry', { id: 'c' }), rp('g1'),
      ])[0];
      const open = line.tokens.filter((t) => t._pOpen);
      const close = line.tokens.filter((t) => t._pClose);
      expect(open.map((t) => t.id)).toEqual(['a']);
      expect(open[0]._pOpen).toBe(1);
      expect(close.map((t) => t.id)).toEqual(['c']);
      expect(close[0]._pClose).toBe(1);
      // the value bag still emits NO raw paren tokens (decoration only)
      expect(line.tokens.every((t) => t.t !== 'paren')).toBe(true);
    });

    it('a single bare value (no group) gets NO parens', () => {
      const line = layoutLines([col('year is'), vb('2020', { id: 'v' })])[0];
      expect(line.tokens.every((t) => !t._pOpen && !t._pClose)).toBe(true);
    });

    it('the row-spanning outer value-AND wrapper is OMITTED; each per-row OR-group keeps its own parens', () => {
      // `title has ((cancer or tumor) and (therapy or treatment))` → 2 rows, each its own ( … ),
      // and NO stray outer paren on either row (it would span rows — undrawable).
      const lines = layoutLines([
        col('title has'),
        lp('AND'),
        lp('o1'), vb('cancer', { id: 'c' }), conn('or', 'o1'), vb('tumor', { id: 't' }), rp('o1'),
        conn('and', 'AND'),
        lp('o2'), vb('therapy', { id: 'th' }), conn('or', 'o2'), vb('treatment', { id: 'tr' }), rp('o2'),
        rp('AND'),
      ]);
      // exactly one open + one close decoration per row (the per-row OR-group), depth 1 each.
      expect(lines.map((l) => l.tokens.filter((t) => t._pOpen).map((t) => t._pOpen))).toEqual([[1], [1]]);
      expect(lines.map((l) => l.tokens.filter((t) => t._pClose).map((t) => t._pClose))).toEqual([[1], [1]]);
    });

    it('nesting stacks depth: a text-block tail inside an OR group → `_pClose` of 1 on the block (its own parens are internal)', () => {
      // `f has (apple or (tart and pastry))` — the AND sub-group is ONE text-block; the OR group
      // wraps it, so the block carries the outer `)` while apple carries the outer `(`.
      const line = layoutLines([
        col('f has'),
        lp('OR'), vb('apple', { id: 'a' }), conn('or', 'OR'),
        lp('a1'), vb('tart', { id: 't' }), conn('and', 'a1'), vb('pastry', { id: 'p' }), rp('a1'),
        rp('OR'),
      ])[0];
      const block = line.tokens.find((t) => t.t === 'textblock');
      expect(block._pClose).toBe(1);
      expect(block.text).toBe('(tart and pastry)');
      const apple = line.tokens.find((t) => t.id === 'a' && t.t === 'vbrick');
      expect(apple._pOpen).toBe(1);
    });
  });

  it('AND connector keeps its `and` label (chip renders &); OR keeps `or`', () => {
    const lines = layoutLines([
      col('title has'),
      lp('AND'), vb('a'), conn('and', 'AND'), vb('b'), rp('AND'),
    ]);
    const lead = lines[1].tokens[0];
    expect(lead.t).toBe('conn');
    expect(lead.label).toBe('and');
  });

  it('inline conns are value-level (blue); the row-LEADING `&` is filter-level (peach, #575 r2)', () => {
    // value-scope: the inline OR conns stay value-level; the continuation row's leading `&`
    // renders PEACH (an AND row reads as "the filter repeated") — colour only, same flip id.
    const valLines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('a'), conn('or', 'o1'), vb('b'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('c'), conn('or', 'o2'), vb('d'), rp('o2'),
      rp('AND'),
    ]);
    const inlineConns = valLines.flatMap((l) => l._valueToks.filter((t) => t.t === 'conn'));
    expect(inlineConns.every((c) => c._level === 'value')).toBe(true);
    const rowLead = valLines[1]._fieldToks[0];
    expect(rowLead.t).toBe('conn');
    expect(rowLead._level).toBe('filter');
    // filter-scope OR: the `or` joining two whole filters is filter-level.
    const filtLines = layoutLines([
      lp('OR'), col('title has'), vb('apple'), conn('or', 'OR'), col('year is'), vb('2020'), rp('OR'),
    ]);
    const filtConn = filtLines[0].tokens.find((t) => t.t === 'conn');
    expect(filtConn._level).toBe('filter');
  });

  // #575 — the two table cells on every line: tokens === [..._fieldToks, ..._valueToks].
  describe('two-column cell split (#575)', () => {
    it('a filter row: field(+op) run in the field cell, values in the value cell', () => {
      const line = layoutLines([col('year', 'c1'), op(' is '), vb('2020', { id: 'v1' })])[0];
      expect(line._fieldToks.map((t) => t.t)).toEqual(['col', 'op']);
      expect(line._valueToks.map((t) => t.t)).toEqual(['vbrick']);
      expect(line._fieldConn).toBe(false);
      expect(line.tokens).toEqual([...line._fieldToks, ...line._valueToks]);
    });

    it('a value-continuation row: EMPTY field cell except its `&` conn (_fieldConn)', () => {
      const lines = layoutLines([
        col('title has'),
        lp('AND'),
        lp('o1'), vb('apple'), conn('or', 'o1'), vb('banana'), rp('o1'),
        conn('and', 'AND'),
        lp('o2'), vb('pie'), conn('or', 'o2'), vb('tart'), rp('o2'),
        rp('AND'),
      ]);
      const contRow = lines[1];
      expect(contRow._fieldConn).toBe(true);
      expect(contRow._fieldToks).toHaveLength(1);
      expect(contRow._fieldToks[0].t).toBe('conn');
      expect(contRow._fieldToks[0].label).toBe('and');
      expect(contRow._valueToks.every((t) => t.t !== 'conn' || t.label === 'or')).toBe(true);
      expect(contRow.tokens).toEqual([...contRow._fieldToks, ...contRow._valueToks]);
    });

    it('a filter-scope-OR line (defensive) keeps EVERYTHING in the value cell', () => {
      const line = layoutLines([
        lp('OR'), col('title has'), vb('apple'), conn('or', 'OR'), col('year is'), vb('2020'), rp('OR'),
      ])[0];
      expect(line._fieldToks).toHaveLength(0);
      expect(line._fieldConn).toBe(false);
      expect(line._valueToks).toEqual(line.tokens);
    });

    it('splitLineCells is the exported single spelling (used by draftLine too)', () => {
      const toks = [col('title has', 'c1'), vb('apple', { id: 'v1' })];
      const cells = splitLineCells(toks);
      expect(cells.fieldToks.map((t) => t.t)).toEqual(['col']);
      expect(cells.valueToks.map((t) => t.t)).toEqual(['vbrick']);
      expect(cells.fieldConn).toBe(false);
      // an op-led run with no col is NOT a field cell (defensive)
      expect(splitLineCells([vb('x')]).fieldToks).toHaveLength(0);
      expect(splitLineCells([]).valueToks).toHaveLength(0);
    });
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

  it('depth is 0 (cols empty) on every line', () => {
    const lines = layoutLines([
      col('f has'),
      lp('AND'),
      lp('o1'), vb('a'), conn('or', 'o1'), vb('b'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('c'), conn('or', 'o2'), vb('d'), rp('o2'),
      rp('AND'),
    ]);
    for (const ln of lines) expect(ln.depth).toBe(0);
  });
});

// oxjob #523 round 4 — the bottom-edge "& +" add-row FURNITURE LINE was REMOVED (Jason: the blank
// line imposed ugly vertical space). Adding a value-AND row / a new filter now lives in the per-line
// left-gutter kebab menu (`.row-kebab` in OqlQueryBuilder.vue; was the end-of-line dropdown until
// #523 round 10). layoutLines must therefore NEVER emit an `addrow` token or an `_addRow` line —
// even when passed the old (now-ignored) opt.
describe('layoutLines — no add-row furniture line (#523 round 4)', () => {
  const addRowLines = (lines) => lines.filter((l) => l.tokens.some((t) => t.t === 'addrow') || l._addRow);

  it('emits no addrow token / _addRow line for a simple filter', () => {
    const lines = layoutLines([col('f has', 'c1'), vb('apple', { id: 'v1' })], { addRow: true });
    expect(addRowLines(lines)).toHaveLength(0);
    expect(lines.every((l) => !l._addRow)).toBe(true);
  });

  it('emits no add-row line for a multi-AND-row filter', () => {
    const lines = layoutLines([
      col('f has', 'c1'),
      lp('AND'),
      lp('o1'), vb('a', { id: 'a' }), conn('or', 'o1'), vb('b', { id: 'b' }), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('c', { id: 'c' }), rp('o2'),
      rp('AND'),
    ], { addRow: true });
    expect(addRowLines(lines)).toHaveLength(0);
  });

  it('emits no add-row line when several filters are AND-ed', () => {
    const lines = layoutLines([
      col('type is', 'c1'), vb('article', { id: 'v1' }), conn('and', 'ROOT'),
      col('year >', 'c2'), vb('2020', { id: 'v2' }),
    ], { addRow: true });
    expect(addRowLines(lines)).toHaveLength(0);
  });
});

// oxjob #523 Phase 4 — an in-column AND sub-group normally collapses to ONE text-block chip
// (#523 round 2), BUT while it still holds an EMPTY value (the draft-conjunction merge leaves an
// editable box), it renders EXPANDED with paren chips + a flippable `&` so the box stays editable.
describe('layoutLines — AND sub-group expands while it holds an empty value (#523 Phase 4)', () => {
  const tokTypes = (line) => line.tokens.map((t) => t.t);

  it('FILLED AND sub-group collapses to one text-block chip (round-2 behaviour)', () => {
    // `f has apple or (banana and pastry)` — inner AND fully filled.
    const lines = layoutLines([
      col('f has', 'c1'),
      lp('vg1'), vb('apple', { id: 'a' }), conn('or', 'vg1'),
      lp('vg2'), vb('banana', { id: 'b' }), conn('and', 'vg2'), vb('pastry', { id: 'p' }), rp('vg2'),
      rp('vg1'),
    ]);
    const types = tokTypes(lines[0]);
    expect(types).toContain('textblock');
    // the inner group's own paren chips are NOT separately rendered (folded into the block)
    expect(types.filter((t) => t === 'paren')).toHaveLength(0);
  });

  it('AND sub-group with an EMPTY value renders EXPANDED (parens + flippable & + box)', () => {
    // `f has apple or (banana and [__])` — the merge mid-edit.
    const lines = layoutLines([
      col('f has', 'c1'),
      lp('vg1'), vb('apple', { id: 'a' }), conn('or', 'vg1'),
      lp('vg2'), vb('banana', { id: 'b' }), conn('and', 'vg2'), vb('', { id: 'e' }), rp('vg2'),
      rp('vg1'),
    ]);
    const types = tokTypes(lines[0]);
    expect(types).not.toContain('textblock');     // NOT collapsed while editing
    expect(types.filter((t) => t === 'paren')).toHaveLength(2); // the inner ( … )
    // the inner connector is rendered as a flippable conn cell carrying its group + opIndex
    const innerConn = lines[0].tokens.find((t) => t.t === 'conn' && t.label === 'and');
    expect(innerConn).toBeTruthy();
    expect(innerConn._opIndex).toBe(1);
    // the empty value box brick is present (id preserved) so it stays editable
    expect(lines[0].tokens.some((t) => t.t === 'vbrick' && t.id === 'e')).toBe(true);
  });

  it('stays EXPANDED while a value box inside it is being edited (editingId), even once typed', () => {
    // `f has apple or (banana and pie)` but `pie` is the value currently being typed (editingId).
    const toks = [
      col('f has', 'c1'),
      lp('vg1'), vb('apple', { id: 'a' }), conn('or', 'vg1'),
      lp('vg2'), vb('banana', { id: 'b' }), conn('and', 'vg2'), vb('pie', { id: 'e' }), rp('vg2'),
      rp('vg1'),
    ];
    // no editingId → fully-filled group collapses to a text block.
    expect(tokTypes(layoutLines(toks)[0])).toContain('textblock');
    // editingId points at the value inside → stays expanded so the box doesn't vanish mid-type.
    const live = layoutLines(toks, { editingId: 'e' })[0];
    expect(tokTypes(live)).not.toContain('textblock');
    expect(tokTypes(live).filter((t) => t === 'paren')).toHaveLength(2);
  });
});
