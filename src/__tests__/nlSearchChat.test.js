import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1744: the one-mode search page's chat. A /query/text answer becomes the page's query
// in the new OQL form with its sort folded in; failures read as plain sentences; a calculation
// answer opens on the chart, a list on the list.

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.test' }, axiosConfig: () => ({ headers: {} }) }));
vi.mock('@/api', () => ({ api: { getQuery: vi.fn() } }));
vi.mock('@/components/OqlPlayground/oqlEditorApi', () => ({ validateOql: vi.fn(async () => ({ valid: true })) }));

import axios from 'axios';
import {
  askQueryText, friendlyError, sortToSortBy, oqlForAnswer, oqlForPageUrl, answerAsides, buildHistory, loadThread, saveThread,
  retryShortThrottle, stepsLine, answerQuestion,
} from '../components/NlSearch/nlChat';
import { api } from '@/api';
import { defaultFormat, normalizeView, answerView, DEFAULT_VIEW } from '../components/NlSearch/nlChart';

const err = (status, data = {}) => Object.assign(new Error(String(status)), { response: { status, data } });

describe('askQueryText', () => {
  beforeEach(() => axios.post.mockReset());

  it('posts the question and the page query to /query/text', async () => {
    axios.post.mockResolvedValueOnce({ data: { route: 'query', oql: 'get works' } });
    const a = await askQueryText({ text: 'only since 2023', currentQuery: 'get works about frogs' });
    expect(a.oql).toBe('get works');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.test/query/text',
      { text: 'only since 2023', current_query: 'get works about frogs' },
      expect.anything(),
    );
  });

  it('sends no current_query on a fresh question', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });
    await askQueryText({ text: 'frogs' });
    expect(axios.post.mock.calls[0][1]).toEqual({ text: 'frogs' });
  });

  it('rejects with a sentence fit to show', async () => {
    axios.post.mockRejectedValueOnce(err(401));
    await expect(askQueryText({ text: 'x' })).rejects.toThrow('Sign in to ask questions in plain words.');
  });
});

// Shared by the chat and the homepage box, which waits for it before opening the page.
describe('answerQuestion (a question to the chat message)', () => {
  beforeEach(() => { axios.post.mockReset(); api.getQuery.mockReset(); });

  it('a query answer carries the OQL the page will run', async () => {
    axios.post.mockResolvedValueOnce({ data: { route: 'query', oql: 'get works where x', note: 'Frogs.' } });
    api.getQuery.mockResolvedValueOnce({ oql: 'get works where x', x_new_oql: 'get works about frogs' });
    const m = await answerQuestion({ text: 'frogs' });
    expect(m).toMatchObject({ role: 'assistant', route: 'query', note: 'Frogs.', shownOql: 'get works about frogs' });
  });

  it('a help-desk answer has no query to run', async () => {
    axios.post.mockResolvedValueOnce({ data: { route: 'help', answer: 'Yes, it is free.' } });
    const m = await answerQuestion({ text: 'is it free?' });
    expect(m.answer).toBe('Yes, it is free.');
    expect(m.shownOql).toBeUndefined();
  });

  it('nothing to say, or a failure, is an error message; it never throws', async () => {
    axios.post.mockResolvedValueOnce({ data: { route: 'help' } });
    expect((await answerQuestion({ text: '?' })).error).toMatch(/couldn't find a query/);
    axios.post.mockRejectedValueOnce(err(401));
    expect(await answerQuestion({ text: 'frogs' })).toEqual({ role: 'assistant', error: 'Sign in to ask questions in plain words.' });
  });
});

describe('friendlyError', () => {
  it('uses the API message when it has one', () => {
    expect(friendlyError(err(403, { message: 'Not for this account.' }))).toBe('Not for this account.');
  });
  it('covers a missing query, a model failure and no network', () => {
    expect(friendlyError(err(422))).toMatch(/couldn't turn that into a query/);
    expect(friendlyError(err(502))).toMatch(/didn't answer/);
    expect(friendlyError(new Error('Network Error'))).toMatch(/Couldn't reach OpenAlex/);
  });
});

describe('sortToSortBy', () => {
  it('reads the classic sort string', () => {
    expect(sortToSortBy('cited_by_count:desc')).toEqual([{ column_id: 'cited_by_count', direction: 'desc' }]);
    expect(sortToSortBy('publication_year:asc,cited_by_count:desc')).toEqual([
      { column_id: 'publication_year', direction: 'asc' },
      { column_id: 'cited_by_count', direction: 'desc' },
    ]);
  });
  it('is null for no sort', () => {
    expect(sortToSortBy(null)).toBeNull();
    expect(sortToSortBy('')).toBeNull();
  });
});

describe('oqlForAnswer', () => {
  const OLD = 'get works where title-abstract-keywords has (CRISPR)';
  const OQO = { get_rows: 'works', filter_rows: [] };

  it('folds the sort in through the OQO and returns the new form', async () => {
    const getQuery = vi.fn()
      .mockResolvedValueOnce({ oql: OLD, x_new_oql: 'get works about CRISPR', oqo: OQO })
      .mockResolvedValueOnce({ oql: OLD, x_new_oql: 'get works about CRISPR, most cited first' });
    const out = await oqlForAnswer(OLD, 'cited_by_count:desc', getQuery);
    expect(out).toBe('get works about CRISPR, most cited first');
    expect(getQuery.mock.calls[1][0]).toEqual({
      oqo: { ...OQO, sort_by: [{ column_id: 'cited_by_count', direction: 'desc' }] },
    });
  });

  it('with no sort, just takes the new form', async () => {
    const getQuery = vi.fn().mockResolvedValueOnce({ oql: OLD, x_new_oql: 'get works about CRISPR', oqo: OQO });
    expect(await oqlForAnswer(OLD, null, getQuery)).toBe('get works about CRISPR');
    expect(getQuery).toHaveBeenCalledTimes(1);
  });

  it('never strands an answer: falls back to the unsorted new form, then the answer as given', async () => {
    const sortFails = vi.fn()
      .mockResolvedValueOnce({ oql: OLD, x_new_oql: 'get works about CRISPR', oqo: OQO })
      .mockRejectedValueOnce(new Error('400'));
    expect(await oqlForAnswer(OLD, 'cited_by_count:desc', sortFails)).toBe('get works about CRISPR');
    const allFail = vi.fn().mockRejectedValue(new Error('down'));
    expect(await oqlForAnswer(OLD, 'cited_by_count:desc', allFail)).toBe(OLD);
  });

  it("uses today's form when the new form doesn't re-read (production, 03:14 CT: `versus(BY)`)", async () => {
    const getQuery = vi.fn().mockResolvedValueOnce({
      oql: 'get works where ...; then, compare country [Belarus](BY) versus [Belgium](BE) using count',
      x_new_oql: 'compare country [Belarus](BY) versus [Belgium](BE) ...',
      oqo: OQO,
    });
    const validate = vi.fn(async () => ({ valid: false }));
    expect(await oqlForAnswer('x', null, getQuery, validate))
      .toBe('get works where ...; then, compare country [Belarus](BY) versus [Belgium](BE) using count');
    expect(validate).toHaveBeenCalledWith('compare country [Belarus](BY) versus [Belgium](BE) ...');
  });
});

describe('retryShortThrottle', () => {
  const throttled = () => Object.assign(new Error('429'), { response: { status: 429, headers: { 'retry-after': '0' } } });

  it('waits out a per-second throttle once, so the sort fold keeps the order', async () => {
    const getQuery = vi.fn()
      .mockResolvedValueOnce({ oql: 'get works', x_new_oql: 'get works about CRISPR', oqo: { get_rows: 'works' } })
      .mockRejectedValueOnce(throttled())
      .mockResolvedValueOnce({ x_new_oql: 'get works about CRISPR, most cited first' });
    expect(await oqlForAnswer('get works', 'cited_by_count:desc', getQuery)).toBe('get works about CRISPR, most cited first');
    expect(getQuery).toHaveBeenCalledTimes(3);
  });

  it('does not wait on the daily limit (a long Retry-After) or other errors', async () => {
    const daily = Object.assign(new Error('429'), { response: { status: 429, headers: { 'retry-after': '36000' } } });
    const fn = vi.fn().mockRejectedValue(daily);
    await expect(retryShortThrottle(fn)).rejects.toBe(daily);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('stepsLine (how the model got there, from #1494 meta.steps)', () => {
  it('names what it looked up and counts its tries (real B2 steps)', () => {
    const meta = {
      elapsed_ms: 19600,
      steps: [
        { tool: 'find_entity', detail: 'institutions: University of Michigan', ms: 4214 },
        { tool: 'run_oql', detail: 'get authors at [University of Michigan](I27837315) ...', ms: 6206 },
        { tool: 'run_oql', detail: 'get authors who published works where ...', ms: 9403 },
      ],
    };
    expect(stepsLine(meta)).toBe('Looked up University of Michigan · tried 2 queries · 19.6 s');
  });
  it('caps the names; one query reads singular', () => {
    const meta = {
      elapsed_ms: 11700,
      steps: [
        { tool: 'find_entity', detail: 'authors: Jennifer Doudna' },
        { tool: 'find_entity', detail: 'sources: Science' },
        { tool: 'find_entity', detail: 'institutions: UC Berkeley' },
        { tool: 'run_oql', detail: 'get works where ...' },
      ],
    };
    expect(stepsLine(meta)).toBe('Looked up Jennifer Doudna, Science and 1 more · tried 1 query · 11.7 s');
  });
  it('with no steps it gives the time; with nothing, null', () => {
    expect(stepsLine({ elapsed_ms: 8495 })).toBe('8.5 s');
    expect(stepsLine({})).toBeNull();
    expect(stepsLine(undefined)).toBeNull();
  });
});

describe('oqlForPageUrl', () => {
  it('collapses the layout onto one line and keeps entity names', () => {
    expect(oqlForPageUrl("get [MIT](I63966007)'s works\n  about (kelp)\n")).toBe("get [MIT](I63966007)'s works about (kelp)");
    expect(oqlForPageUrl('versus [Belarus](BY)')).toBe('versus [Belarus](BY)');
  });
});

describe('buildHistory (context for the model, agreed with #1494)', () => {
  it('pairs each question with the query its answer set, oldest first, last 6', () => {
    const msgs = [];
    for (let i = 0; i < 8; i++) {
      msgs.push({ role: 'user', text: `q${i}` });
      msgs.push(i === 3
        ? { role: 'assistant', route: 'help_desk', answer: 'words' }
        : { role: 'assistant', route: 'query', shownOql: `get works about x${i}` });
    }
    const h = buildHistory(msgs);
    expect(h).toHaveLength(6);
    expect(h[0]).toEqual({ text: 'q2', oql: 'get works about x2' });
    expect(h[1]).toEqual({ text: 'q3', oql: null });
    expect(h[5]).toEqual({ text: 'q7', oql: 'get works about x7' });
  });
  it('a question still waiting on its answer counts with no oql; an empty thread is no history', () => {
    expect(buildHistory([{ role: 'user', text: 'a' }])).toEqual([{ text: 'a', oql: null }]);
    expect(buildHistory([])).toEqual([]);
  });
  it('askQueryText sends history only when there is some', async () => {
    axios.post.mockReset();
    axios.post.mockResolvedValue({ data: {} });
    await askQueryText({ text: 'b', history: [{ text: 'a', oql: 'get works' }] });
    expect(axios.post.mock.calls[0][1]).toEqual({ text: 'b', history: [{ text: 'a', oql: 'get works' }] });
    await askQueryText({ text: 'c', history: [] });
    expect(axios.post.mock.calls[1][1]).toEqual({ text: 'c' });
  });
});

describe('answerAsides', () => {
  it('lists what was left out, out of reach and the how-to, in that order', () => {
    const a = answerAsides({ left_out: 'the second question', out_of_reach: null, howto: 'Use the Table format.' });
    expect(a.map((x) => x.kind)).toEqual(['left_out', 'howto']);
  });
});

describe('the thread survives a reload of the tab', () => {
  it('round-trips through storage and keeps the last 40', () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    const msgs = Array.from({ length: 45 }, (_, i) => ({ role: 'user', text: `q${i}` }));
    saveThread(msgs, storage);
    const back = loadThread(storage);
    expect(back).toHaveLength(40);
    expect(back[0].text).toBe('q5');
  });
  it('reads a broken or missing store as empty', () => {
    expect(loadThread({ getItem: () => '{nope' })).toEqual([]);
    expect(loadThread(undefined)).toEqual([]);
  });
});

describe('defaultFormat (the format a chat answer opens on)', () => {
  const pipeline = { meta: { splits: [{ oql: 'country' }], measures: [{ key: 'count' }] }, group_by: [] };
  const list = { meta: { count: 10 }, results: [] };

  it("follows #1745's pickChart when it has landed", () => {
    expect(defaultFormat(pipeline, 'x', () => ({ type: 'bar' }), true)).toBe('chart');
    expect(defaultFormat(list, 'x', () => null, true)).toBe('list');
  });
  it('without it: a calculation opens on the chart if one can draw, else the table; a list on the list', () => {
    expect(defaultFormat(pipeline, 'x', null, true)).toBe('chart');
    expect(defaultFormat(pipeline, 'x', null, false)).toBe('table');
    expect(defaultFormat(list, 'x', null, false)).toBe('list');
  });
  it('a pickChart that throws falls back to the shape rule', () => {
    expect(defaultFormat(pipeline, 'x', () => { throw new Error('bad'); }, true)).toBe('chart');
  });
  it('a calculation no chart fits opens on its table, not its works', () => {
    expect(defaultFormat(pipeline, 'x', () => null, true)).toBe('table');
  });
});

describe('the results view: Groups (Chart | Table) and Works (List | Table)', () => {
  it('maps a stored v1 format across', () => {
    expect(normalizeView('chart')).toEqual({ tab: 'groups', groups: 'chart', works: 'list' });
    expect(normalizeView('table')).toEqual({ tab: 'groups', groups: 'table', works: 'table' });
    expect(normalizeView('list')).toEqual({ tab: 'works', groups: 'chart', works: 'list' });
  });
  it('makes a missing or bad view whole', () => {
    expect(normalizeView(null)).toEqual(DEFAULT_VIEW);
    expect(normalizeView({ tab: 'nope', works: 'table' })).toEqual({ tab: 'groups', groups: 'chart', works: 'table' });
  });
  it("a chat answer opens a calculation on its groups and a list on the list, keeping the other tab's format", () => {
    const v = { tab: 'works', groups: 'table', works: 'table' };
    expect(answerView(v, 'chart')).toEqual({ tab: 'groups', groups: 'chart', works: 'table' });
    expect(answerView(v, 'table')).toEqual({ tab: 'groups', groups: 'table', works: 'table' });
    expect(answerView({ ...v, tab: 'groups' }, 'list')).toEqual({ tab: 'groups', groups: 'table', works: 'list' });
  });
});

describe('groupsTabLabel: the Groups tab names its groups (#1744)', () => {
  it('names the groups by their split', async () => {
    const { groupsTabLabel } = await import('@/components/NlSearch/nlChart');
    const m = (splits, n) => ({ splits: splits.map((oql) => ({ oql })), groups_count: n });
    expect(groupsTabLabel(m(['year'], 9))).toBe('9 years');
    expect(groupsTabLabel(m(['country'], 46))).toBe('46 countries');
    expect(groupsTabLabel(m(['source'], 2612))).toBe('2,612 sources');
    expect(groupsTabLabel(m(['open access status'], 6))).toBe('6 open access statuses');
    expect(groupsTabLabel(m(['SDG'], 17))).toBe('17 SDGs');
    expect(groupsTabLabel(m(['author'], 1))).toBe('1 author');
    expect(groupsTabLabel(m(['country', 'year'], 2))).toBe('2 countries by year');
    expect(groupsTabLabel(m(['country in ([United States](US), [China](CN))'], 2))).toBe('2 countries');
    expect(groupsTabLabel({ splits: [] })).toBe('Summary');
  });
});

describe('more than one match: choices from the note (#1744)', () => {
  it('reads the alternatives the note names', async () => {
    const { answerAlternatives, swapEntity, searchName } = await import('@/components/NlSearch/nlChat');
    const note = 'Many authors are named John Smith. I picked John R. Smith at IBM Research. Others include John W. Smith (A5050048211) and John A. Smith (A5002524476). Tell me which one you meant.';
    const oql = "get [John R. Smith](A5023888391)'s works";
    expect(answerAlternatives(note, oql)).toEqual({
      kind: 'authors', chosen: 'A5023888391', others: ['A5050048211', 'A5002524476'],
    });
    expect(answerAlternatives('Counts works about kelp.', 'get works about kelp')).toBeNull();
    expect(answerAlternatives(note, 'get works about kelp')).toBeNull();
    expect(swapEntity(oql, 'A5023888391', 'A5050048211', 'John W. Smith')).toBe("get [John W. Smith](A5050048211)'s works");
    expect(searchName('John R. Smith')).toBe('John Smith');
    expect(searchName('Jennifer A. Doudna')).toBe('Jennifer Doudna');
  });
});

describe('more than one match: an unsure lookup (#1744)', () => {
  it('reads the looked-up name when the model was unsure', async () => {
    const { lookupsOf, unsureLookup } = await import('@/components/NlSearch/nlChat');
    const meta = { steps: [{ tool: 'find_entity', detail: 'authors: John Smith' }, { tool: 'run_oql', detail: 'x' }] };
    const lookups = lookupsOf(meta);
    expect(lookups).toEqual([{ kind: 'authors', name: 'John Smith' }]);
    const msg = { confidence: 0.21, lookups, shownOql: "get [John Maynard Smith](A5108453556)'s works" };
    expect(unsureLookup(msg)).toEqual({ kind: 'authors', chosen: 'A5108453556', search: 'John Smith' });
    expect(unsureLookup({ ...msg, confidence: 0.9 })).toBeNull();
  });
});
