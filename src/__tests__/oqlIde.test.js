// The IDE layer's state logic (oxjob #1597): the caret at link edges, deletes around links,
// and what the autocomplete offers where. The API is mocked; no browser needed.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

vi.mock('@/edgeAutocomplete', () => ({ edgeWarm: vi.fn() }));
vi.mock('@/components/OqlPlayground/oqlEditorApi', () => ({
  getVocabulary: vi.fn(async () => [
    { value: 'about', kind: 'keyword', detail: 'search titles, abstracts and keywords', doc: 'Works about a subject.' },
    { value: 'most cited first', kind: 'order', detail: 'order', doc: 'Most cited first.' },
  ]),
  getParseContext: vi.fn(async (q, pos) => {
    if (q.slice(0, pos).endsWith('from ')) {
      return { entity: 'works', context: { category: 'core', slot: 'entity', prefix: '', replace_range: { start: pos, end: pos },
        suggestions: [{ value: 'both', kind: 'keyword', detail: 'works from every place' }],
        autocomplete_entities: ['institutions', 'countries'] } };
    }
    if (q.slice(0, pos).endsWith('kelp ')) {
      return { entity: 'works', context: { category: 'core', slot: 'works-slot', prefix: '', replace_range: { start: pos, end: pos },
        suggestions: [{ value: 'most cited first', insert: ', most cited first', kind: 'order', detail: 'order' }], autocomplete_entities: [] } };
    }
    if (q.slice(0, pos).endsWith('from stan')) {
      return { entity: 'works', context: { category: 'core', slot: 'works-slot', prefix: 'stan', replace_range: { start: pos - 4, end: pos },
        suggestions: [], autocomplete_entities: ['institutions', 'countries'] } };
    }
    return { entity: 'works', context: { category: 'core', slot: 'works-slot', prefix: 'ab', replace_range: { start: pos - 2, end: pos },
      suggestions: [{ value: 'about', kind: 'keyword', detail: 'search titles' }], autocomplete_entities: [] } };
  }),
  searchEntities: vi.fn(async (kinds, q) => [
    { kind: 'institutions', id: 'I97018004', name: 'Stanford University', hint: 'Stanford, USA', works_count: 558203 },
  ]),
  getEntityRecord: vi.fn(async () => null),
}));

import { oqlIde, _internal } from '@/components/OqlPlayground/oqlIde';
import { findLinks } from '@/components/OqlPlayground/oqlLinks';
import { searchEntities, getParseContext } from '@/components/OqlPlayground/oqlEditorApi';

const Q = 'get works from [Massachusetts Institute of Technology](I63966007) since 2020';
const make = (doc, anchor = 0) => EditorState.create({ doc, selection: { anchor }, extensions: oqlIde() });
const fakeView = (state) => ({ state, dispatch(spec) { this.state = this.state.update(spec).state; } });

beforeAll(async () => { await _internal.loadVocabulary(); });

describe('caret at link edges', () => {
  const l = findLinks(Q)[0];
  it('a click at the end of a name lands after the link', () => {
    const s = make(Q).update({ selection: { anchor: l.nameTo }, userEvent: 'select.pointer' }).state;
    expect(s.selection.main.head).toBe(l.to);
  });
  it('a click at the start of a name lands before the link', () => {
    const s = make(Q).update({ selection: { anchor: l.nameFrom }, userEvent: 'select.pointer' }).state;
    expect(s.selection.main.head).toBe(l.from);
  });
  it('an arrow left from after the link steps into the name', () => {
    const s = make(Q, l.to).update({ selection: { anchor: l.nameTo }, userEvent: 'select' }).state;
    expect(s.selection.main.head).toBe(l.nameTo - 1);
  });
  it('a click mid-name stays put', () => {
    const s = make(Q).update({ selection: { anchor: l.nameFrom + 4 }, userEvent: 'select.pointer' }).state;
    expect(s.selection.main.head).toBe(l.nameFrom + 4);
  });
});

describe('deletes around links', () => {
  const l = findLinks(Q)[0];
  it('backspace after a link removes the last letter of its name, keeping the link', () => {
    const v = fakeView(make(Q, l.to));
    expect(_internal.deleteAroundLink(v, false)).toBe(true);
    expect(v.state.doc.toString()).toContain('[Massachusetts Institute of Technolog](I63966007)');
  });
  it('backspace at the start of a name deletes the character before the link', () => {
    const v = fakeView(make(Q, l.nameFrom));
    _internal.deleteAroundLink(v, false);
    expect(v.state.doc.toString()).toContain('from[Massachusetts');
  });
  it('a selection over a whole name takes the whole link', () => {
    const v = fakeView(make(Q).update({ selection: { anchor: l.nameFrom, head: l.nameTo } }).state);
    _internal.deleteAroundLink(v, false);
    expect(v.state.doc.toString()).toBe('get works from  since 2020');
  });
  it('an emptied link goes with one more backspace', () => {
    const doc = 'get works by [](A1) since 2020';
    const e = findLinks(doc)[0];
    const v = fakeView(make(doc, e.to));
    _internal.deleteAroundLink(v, false);
    expect(v.state.doc.toString()).toBe('get works by  since 2020');
  });
  it('leaves ordinary text to the default command', () => {
    const v = fakeView(make(Q, 5));
    expect(_internal.deleteAroundLink(v, false)).toBe(false);
  });
});

async function complete(doc, pos, explicit = false) {
  const state = make(doc, pos);
  return _internal.oqlCompletions(new CompletionContext(state, pos, explicit));
}

describe('autocomplete', () => {
  it('in a name: entities named like it, replacing the whole link', async () => {
    const l = findLinks(Q)[0];
    const r = await complete(Q, l.nameFrom + 5, true);
    expect(searchEntities).toHaveBeenLastCalledWith(['institutions'], 'Massachusetts Institute of Technology');
    expect([r.from, r.to]).toEqual([l.from, l.to]);
    expect(r.options[0].label).toBe('Stanford University');
    expect(r.options[0].detail).toBe('Stanford, USA · 558.2K works');
  });
  it('after `[`: looks the name up in the kinds the slot wants', async () => {
    const doc = 'get works from [stan]';
    const r = await complete(doc, doc.length - 1);
    expect(searchEntities).toHaveBeenLastCalledWith(['institutions', 'countries'], 'stan');
    expect([r.from, r.to]).toEqual([15, doc.length]);
  });
  it('after a slot word and a space: a name prompt plus the grammar\'s words', async () => {
    const doc = 'get works from ';
    const r = await complete(doc, doc.length);
    const shown = [...r.options].sort((a, b) => a.section.rank - b.section.rank || b.boost - a.boost);
    expect(shown.map((o) => o.label)).toEqual(['Type a name: institution, country…', 'both']);
  });
  it('a bare name in a link slot searches entities and keeps the keywords', async () => {
    const doc = 'get works from stan';
    const r = await complete(doc, doc.length);
    expect(r.from).toBe(doc.length - 4);
    expect(r.options[0].label).toBe('Stanford University');
  });
  it('mid-word: the parser\'s matches', async () => {
    const doc = 'get works ab';
    const r = await complete(doc, doc.length);
    expect(getParseContext).toHaveBeenLastCalledWith(doc, doc.length);
    expect(r.options.map((o) => o.label)).toEqual(['about']);
    expect(r.filter).toBe(false);
  });
});

describe('applying a suggestion', () => {
  it('a mid-phrase `, order` eats the space before it', async () => {
    const doc = 'get works about kelp ';
    const r = await complete(doc, doc.length);
    const opt = r.options.find((o) => o.label === 'most cited first');
    const v = fakeView(make(doc, doc.length));
    opt.apply(v, opt, r.from, r.to);
    expect(v.state.doc.toString()).toBe('get works about kelp, most cited first');
  });
});

describe('code points', () => {
  it('converts both ways around astral characters', () => {
    const s = 'a😀b';
    expect(_internal.toCodePoints(s, 3)).toBe(2);
    expect(_internal.fromCodePoints(s, 2)).toBe(3);
  });
});
