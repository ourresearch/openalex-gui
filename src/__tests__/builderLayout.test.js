import { describe, it, expect } from 'vitest';
import { layoutLines } from '../components/Oql/builderLayout.js';

// oxjob #523 — 2D INDENT-model layout (supersedes the #507 rigid column grid).
// layoutLines re-derives line breaks CLIENT-SIDE from the group structure of the flat
// token stream. The two boolean operators map to the two screen axes, as a simple indent:
//   FILTER scope (top level): each filter is its OWN row, flush-left, NO leading
//     connector and NO indent (a newline reads as AND). OR-ed filters (rare) SHARE one
//     row, joined by `or`. Filters never indent.
//   VALUE scope (inside one filter): field+op plus the value's FIRST OR-group sit inline
//     on row 1; each further AND-group drops to its own row with a small indent + a
//     leading `&`. OR values stay inline; the ONE extra level (an AND sub-group inside an
//     OR row, `pie or (tart and pastry)`) shows parens inline.
//   - parens are drawn ONLY for that one in-column AND sub-group; cols are always empty.

// --- token builders (mirror the server `oql_render_v2` / treeToTokens shape) --
const kw = (text, label) => ({ t: 'kw', text, label });
const col = (text, id) => ({ t: 'col', text, id });
const op = (text) => ({ t: 'op', text });
const vb = (v, extra = {}) => ({ t: 'vbrick', value: v, text: v, display: v, ...extra });
const conn = (w, id) => ({ t: 'conn', id, text: ` ${w} `, label: w });
const lp = (id) => ({ t: 'paren', text: '(', id });
const rp = (id) => ({ t: 'paren', text: ')', id });

// Render a line's CONTENT tokens (incl. the leading `&` on a value-continuation row,
// and parens for an in-column AND sub-group). A connector renders as `&`/`or`.
const content = (line) =>
  line.tokens.map((t) => (t.t === 'conn' ? (t.label === 'and' ? '&' : t.label)
    : (t.text != null ? t.text : t.display || '')).trim())
    .filter((s) => s !== '').join(' ');
// One row: a value-continuation row (_indent) is shown with a 2-space lead.
const row = (line) => (line._indent ? '  ' : '') + content(line);
const lay = (tokens) => layoutLines(tokens).map(row);

describe('layoutLines — 2D indent layout (oxjob #523)', () => {
  it('pure OR — synonyms stay inline on the field row', () => {
    // `title&abstract has (cancer or tumor or neoplasm)` — single clause, OR-bag value.
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title & abstract has'),
      lp('g1'), vb('cancer'), conn('or', 'g1'), vb('tumor'), conn('or', 'g1'), vb('neoplasm'), rp('g1'),
    ])).toEqual(['title & abstract has cancer or tumor or neoplasm']);
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
      'title & abstract has cancer or tumor or neoplasm',
      '  & therapy or treatment',
      '  & child or pediatric or adolescent',
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
      'type is article',
      'publication year > 2020',
      'is open access is true',
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
      'title & abstract has (cancer & therapy) or (tumor & treatment)',
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
      'title has apple or banana',
      '  & pie or (tart & pastry)',
    ]);
  });

  it('pure value-AND — `title has (a and b)` → field+a, then an indented `& b` row', () => {
    expect(lay([
      kw('works'), kw(' where ', 'where'), col('title has'),
      lp('AND'), vb('a'), conn('and', 'AND'), vb('b'), rp('AND'),
    ])).toEqual([
      'title has a',
      '  & b',
    ]);
  });

  it('filter-scope OR — two whole filters share one row, joined by `or`', () => {
    // ACCEPTANCE Test 9: `(title has apple) or (year is 2020)`.
    expect(lay([
      kw('works'), kw(' where ', 'where'),
      lp('OR'),
      col('title has'), vb('apple'),
      conn('or', 'OR'),
      col('year is'), vb('2020'),
      rp('OR'),
    ])).toEqual([
      'title has apple or year is 2020',
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

  it('filter-scope OR (#523 r2): a persistent add-value `+` follows each non-terminal filter', () => {
    const lines = layoutLines([
      kw('works'), kw(' where ', 'where'),
      lp('OR'),
      col('keyword is'), vb('anticoagulant', { id: 'v1' }),
      conn('or', 'OR'),
      col('title has'), vb('INR', { id: 'v2' }),
      rp('OR'),
    ]);
    const toks = lines[0].tokens;
    const plus = toks.filter((t) => t.t === 'addplus');
    expect(plus.length).toBe(1);                 // only the FIRST (non-terminal) filter gets it
    expect(plus[0]._valueId).toBe('v1');         // targets that filter's last value
    // the `+` sits right after the filter's value and before the filter-scope `or`
    const ix = toks.findIndex((t) => t.t === 'addplus');
    expect(toks[ix - 1].id).toBe('v1');
    expect(toks[ix + 1].t).toBe('conn');
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
      'title & abstract has cancer or tumor',
      'title & abstract has not pediatric',
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
      'title & abstract has neoplasm or carcinoma or sarcoma or lymphoma or melanoma',
      '  & screening or detection',
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
    expect(blocks[0].text).toBe('(tart & pastry)');
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

  it('AND connector keeps its `and` label (chip renders &); OR keeps `or`', () => {
    const lines = layoutLines([
      col('title has'),
      lp('AND'), vb('a'), conn('and', 'AND'), vb('b'), rp('AND'),
    ]);
    const lead = lines[1].tokens[0];
    expect(lead.t).toBe('conn');
    expect(lead.label).toBe('and');
  });

  it('value connectors are value-level (blue); filter connectors are filter-level (gray)', () => {
    // value-scope: the inline OR conns + the leading `&` are value-level.
    const valLines = layoutLines([
      col('title has'),
      lp('AND'),
      lp('o1'), vb('a'), conn('or', 'o1'), vb('b'), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('c'), conn('or', 'o2'), vb('d'), rp('o2'),
      rp('AND'),
    ]);
    const valConns = valLines.flatMap((l) => l.tokens.filter((t) => t.t === 'conn'));
    expect(valConns.every((c) => c._level === 'value')).toBe(true);
    // filter-scope OR: the `or` joining two whole filters is filter-level.
    const filtLines = layoutLines([
      lp('OR'), col('title has'), vb('apple'), conn('or', 'OR'), col('year is'), vb('2020'), rp('OR'),
    ]);
    const filtConn = filtLines[0].tokens.find((t) => t.t === 'conn');
    expect(filtConn._level).toBe('filter');
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

// oxjob #523 Phase 4 — the bottom-edge "& +" add-row target. Opt-in via { addRow:true }; one
// inert `addrow` token line is appended at the foot of each single-filter value block, carrying
// the owning clause id (_clauseId) for the handler's addAndRow call. Off by default.
describe('layoutLines — add-row target (#523 Phase 4)', () => {
  const addRowLines = (lines) => lines.filter((l) => l.tokens.some((t) => t.t === 'addrow'));

  it('is OFF by default (no opts) — no addrow tokens', () => {
    const lines = layoutLines([col('f has', 'c1'), vb('apple', { id: 'v1' })]);
    expect(addRowLines(lines)).toHaveLength(0);
  });

  it('appends ONE add-row line per simple filter, carrying its clause id, indented', () => {
    const lines = layoutLines([col('f has', 'c1'), vb('apple', { id: 'v1' })], { addRow: true });
    const ar = addRowLines(lines);
    expect(ar).toHaveLength(1);
    const tok = ar[0].tokens.find((t) => t.t === 'addrow');
    expect(tok._clauseId).toBe('c1');
    expect(ar[0]._indent).toBe(1);   // sits at the value-continuation indent
    expect(ar[0]._lead).toBeFalsy(); // not a filter row → no leading peach chip
  });

  it('appends the add-row AFTER the last value row of a multi-AND-row filter', () => {
    const lines = layoutLines([
      col('f has', 'c1'),
      lp('AND'),
      lp('o1'), vb('a', { id: 'a' }), conn('or', 'o1'), vb('b', { id: 'b' }), rp('o1'),
      conn('and', 'AND'),
      lp('o2'), vb('c', { id: 'c' }), rp('o2'),
      rp('AND'),
    ], { addRow: true });
    expect(addRowLines(lines)).toHaveLength(1);
    const last = lines[lines.length - 1];
    expect(last.tokens.some((t) => t.t === 'addrow')).toBe(true); // it's the final line
    expect(lines[lines.length - 1].tokens[0]._clauseId).toBe('c1');
  });

  it('one add-row per filter when several filters are AND-ed (one per clause id)', () => {
    const lines = layoutLines([
      col('type is', 'c1'), vb('article', { id: 'v1' }), conn('and', 'ROOT'),
      col('year >', 'c2'), vb('2020', { id: 'v2' }),
    ], { addRow: true });
    const ar = addRowLines(lines);
    expect(ar.map((l) => l.tokens.find((t) => t.t === 'addrow')._clauseId)).toEqual(['c1', 'c2']);
  });

  it('NO add-row for a filter-scope OR row (ambiguous which filter it would extend)', () => {
    // `(type is article) or (year is 2020)` — two whole filters OR-ed on one row.
    const lines = layoutLines([
      lp('OR'),
      col('type is', 'c1'), vb('article', { id: 'v1' }),
      conn('or', 'OR'),
      col('year is', 'c2'), vb('2020', { id: 'v2' }),
      rp('OR'),
    ], { addRow: true, rootId: 'OR' });
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
