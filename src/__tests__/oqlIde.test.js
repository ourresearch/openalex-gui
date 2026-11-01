// The IDE layer's state logic (oxjob #1597): the caret at link edges, deletes around links,
// and what the autocomplete offers where. The API is mocked; no browser needed.
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext, completionStatus } from '@codemirror/autocomplete';

vi.mock('@/edgeAutocomplete', () => ({ edgeWarm: vi.fn() }));
vi.mock('@/components/OqlPlayground/oqlEditorApi', () => ({
  getVocabulary: vi.fn(async () => [
    { value: 'about', kind: 'keyword', detail: 'search titles, abstracts and keywords', doc: 'Works about a subject.' },
    { value: 'most cited first', kind: 'order', detail: 'order', doc: 'Most cited first.' },
  ]),
  getParseContext: vi.fn(async (q, pos) => {
    // the server's link answers: on a written link, its name; after `[`, the typed name
    const link = /\[([^\]]*)\]\(I63966007\)/.exec(q);
    if (link && pos > link.index && pos < link.index + link[0].length) {
      return { entity: 'works', context: { category: 'core', slot: 'link', prefix: link[1],
        replace_range: { start: link.index, end: link.index + link[0].length }, suggestions: [],
        autocomplete_entities: ['institutions'] } };
    }
    if (q.startsWith('get works from [stan]')) {
      return { entity: 'works', context: { category: 'core', slot: 'entity', prefix: q.slice(15, pos),
        replace_range: { start: 15, end: 21 }, suggestions: [], autocomplete_entities: ['institutions', 'countries'] } };
    }
    if (q.startsWith('get works about [')) {
      return { entity: 'works', context: { category: 'core', slot: 'search-text', prefix: q.slice(16, pos),
        replace_range: { start: 16, end: pos }, suggestions: [], autocomplete_entities: [] } };
    }
    if (q.slice(0, pos).endsWith('from ')) {
      return { entity: 'works', context: { category: 'core', slot: 'entity', prefix: '', replace_range: { start: pos, end: pos },
        suggestions: [{ value: 'both', kind: 'keyword', detail: 'works from every place' }],
        autocomplete_entities: ['institutions', 'countries'] } };
    }
    if (q.slice(0, pos).endsWith('by author ')) {
      return { entity: 'works', context: { category: 'core', slot: 'split', prefix: '', replace_range: { start: pos, end: pos },
        suggestions: [{ value: 'Show', insert: '. Show ', kind: 'sentence', detail: 'add fields' }], autocomplete_entities: [] } };
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
  // GET /oql-phrases for 'get works about kelp, most cited first'
  getPhrases: vi.fn(async (q) => (q === 'get works about kelp, most cited first' ? [
    { start: 0, end: 3, value: 'get', kind: 'keyword', detail: 'starts every statement', doc: 'd', choice: false },
    { start: 4, end: 9, value: 'works', kind: 'noun', detail: 'every type of work', doc: 'd', choice: true },
    { start: 10, end: 15, value: 'about', kind: 'keyword', detail: 'search', doc: 'd', choice: false },
    { start: 22, end: 38, value: 'most cited first', kind: 'order', detail: 'order', doc: 'd', choice: true },
  ] : [])),
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
  it('after `[`: looks the name up in the kinds the slot wants, replacing the `[...]`', async () => {
    const doc = 'get works from [stan]';
    const r = await complete(doc, doc.length - 1);
    expect(searchEntities).toHaveBeenLastCalledWith(['institutions', 'countries'], 'stan');
    expect([r.from, r.to]).toEqual([15, doc.length]);
  });
  it('after `[` where no name fits (a search): no lookup', async () => {
    searchEntities.mockClear();
    expect(await complete('get works about [ke', 19)).toBeNull();
    expect(searchEntities).not.toHaveBeenCalled();
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

describe('a sentence that brings its own space', () => {
  it('gets no second one', async () => {
    const doc = 'get the count of works by author ';
    const r = await complete(doc, doc.length);
    const opt = r.options.find((o) => o.label === 'Show');
    const v = fakeView(make(doc, doc.length));
    opt.apply(v, opt, r.from, r.to);
    expect(v.state.doc.toString()).toBe('get the count of works by author. Show ');
  });
});

describe('a click on a phrase', () => {
  const doc = 'get works about kelp, most cited first';
  const click = async (pos) => {
    const v = fakeView(make(doc, pos));
    await _internal.clickOpensDropdown(v);
    return completionStatus(v.state);
  };
  it('opens the dropdown on a choice the server marks', async () => {
    expect(await click(doc.indexOf('cited'))).not.toBeNull();
    expect(await click(6)).not.toBeNull();                 // `works`
  });
  it('stays shut on a keyword, and at the very end (typing)', async () => {
    expect(await click(12)).toBeNull();                    // `about`
    expect(await click(doc.length)).toBeNull();
  });
  it('opens on a link name', async () => {
    const v = fakeView(make(Q, findLinks(Q)[0].nameFrom + 3));
    await _internal.clickOpensDropdown(v);
    expect(completionStatus(v.state)).not.toBeNull();
  });
});

describe('vocabulary', () => {
  it('asks again after a failed fetch', async () => {
    vi.resetModules();
    const mod = await import('@/components/OqlPlayground/oqlIde');
    const api = await import('@/components/OqlPlayground/oqlEditorApi');
    api.getVocabulary.mockRejectedValueOnce(new Error('429'));
    await mod._internal.loadVocabulary();
    await mod._internal.loadVocabulary();
    expect(api.getVocabulary.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('code points', () => {
  it('converts both ways around astral characters', () => {
    const s = 'a😀b';
    expect(_internal.toCodePoints(s, 3)).toBe(2);
    expect(_internal.fromCodePoints(s, 2)).toBe(3);
  });
});
