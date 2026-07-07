import { describe, it, expect } from 'vitest';
import { addValue, addAdjacentValue, setValue, decomposeValue } from '../components/OqlPlayground/v2Edit.js';
import { treeToTokens } from '../components/Oql/treeToTokens.js';
import { proxSegments, surfaceSegments } from '../components/Oql/proxSegments.js';

// oxjob #560 — chip display bugs.
//
// Bug 3: promoting a SIMPLE clause (server leaf + segments) to a FACTORED value list
// must carry the human display baked into the server `segments` onto the promoted
// vleaf — the raw leaf value (`institutions/I136199984`) is not what the user was
// seeing ("Harvard University"), and losing it flashed the raw id while an OR draft
// was open.
//
// Bug 2: a locally-typed value is LITERAL text awaiting search-surface routing at
// OQO-build time (quotes → `.search.exact`). It's marked `_rawInput` so the chip
// renders it verbatim instead of deriving a `stemmed "…"` surface off the clause's
// still-unrouted `.search` column — that rewrite fed back into the edit box and
// silently converted a typed exact phrase into a stemmed one.

// A server-rendered SIMPLE entity clause, exactly as `/query/oql/` returns it: the leaf
// and the `value` segment hold the RAW id; the display name rides in the trailing `id`
// segment (`[Harvard University]` + meta.entity_display_name).
const harvardClause = () => ({
  where: {
    node: 'clause', id: 'c1', column_id: 'authorships.institutions.lineage', operator: 'is',
    clause_kind: 'entity',
    leaf: { column_id: 'authorships.institutions.lineage', value: 'institutions/I136199984', operator: 'is' },
    segments: [
      { kind: 'column', text: 'institution', meta: { column_id: 'authorships.institutions.lineage' } },
      { kind: 'operator', text: ' is ' },
      { kind: 'text', text: '(' },
      { kind: 'value', text: 'institutions/I136199984', meta: { value: 'institutions/I136199984' } },
      { kind: 'text', text: ' ' },
      { kind: 'id', text: '[Harvard University]', meta: { entity_display_name: 'Harvard University', entity_display_id: '[Harvard University]' } },
      { kind: 'text', text: ')' },
    ],
  },
});

describe('#560 bug 3 — promote carries the segment display onto the vleaf', () => {
  it('addAdjacentValue keeps "Harvard University" as the promoted vleaf display', () => {
    const t = harvardClause();
    addAdjacentValue(t, 'c1', 'or');
    const kids = t.where.value.children;
    expect(kids[0].value).toBe('institutions/I136199984');
    expect(kids[0].display).toBe('Harvard University');
  });

  it('addValue (promote path) keeps the display too', () => {
    const t = harvardClause();
    addValue(t, 'c1');
    expect(t.where.value.children[0].display).toBe('Harvard University');
  });

  it('treeToTokens then renders the name, not the raw id', () => {
    const t = harvardClause();
    addAdjacentValue(t, 'c1', 'or');
    const toks = treeToTokens({ entity: { id: 'works', text: 'works' }, where: t.where });
    const vbricks = toks.filter((tk) => tk.t === 'vbrick');
    expect(vbricks[0].display).toBe('Harvard University');
    expect(vbricks[0].text).toBe('Harvard University');
  });

  it('falls back to leaf.display, then the raw value, when there are no segments', () => {
    const t = {
      where: {
        node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
        leaf: { value: 'cancer', display: 'cancer', is_negated: false },
      },
    };
    addAdjacentValue(t, 'c1', 'and');
    expect(t.where.value.children[0].display).toBe('cancer');
  });
});

describe('#560 bug 2 — locally-typed values are literal (no stemmed re-derive)', () => {
  it('setValue on a factored vleaf stamps _rawInput', () => {
    const t = {
      where: {
        node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
        value: {
          node: 'vgroup', id: 'vg', join: 'or', children: [
            { node: 'vleaf', id: 'a', value: '', display: '', negated: false },
          ],
        },
      },
    };
    setValue(t, 'a', '"my value"');
    const leaf = t.where.value.children[0];
    expect(leaf.value).toBe('"my value"');
    expect(leaf._rawInput).toBe(true);
    // and treeToTokens carries the marker onto the token
    const toks = treeToTokens({ entity: { id: 'works', text: 'works' }, where: t.where });
    const v = toks.find((tk) => tk.t === 'vbrick');
    expect(v._rawInput).toBe(true);
  });

  it('round-tripped stemmed values render bold via their baked display, not (value, column)', () => {
    // Phase 3: the (value, column) stemmed derivation is GONE from proxSegments — the
    // clause column is the group's stemmed base even for exact values, so it relabeled
    // exact phrases in or-groups. The server bakes `stemmed "…"` into the vleaf display;
    // surfaceSegments bolds that.
    expect(proxSegments('"my value"', 'title.search')).toBeNull();
    expect(surfaceSegments('stemmed "my value"')[0].text).toBe('stemmed ');
    expect(surfaceSegments('"my value"')).toBeNull();
  });

  it('decomposeValue leaves are marked _rawInput too', () => {
    const t = {
      where: {
        node: 'clause', id: 'c1', column_id: 'title.search', operator: 'has',
        leaf: { value: 'x', display: 'x', is_negated: false },
      },
    };
    expect(decomposeValue(t, 'c1', 'cancer or "my value"')).toBe(true);
    const kids = t.where.value.children;
    expect(kids.map((k) => k.value)).toEqual(['cancer', '"my value"']);
    kids.forEach((k) => expect(k._rawInput).toBe(true));
  });
});
