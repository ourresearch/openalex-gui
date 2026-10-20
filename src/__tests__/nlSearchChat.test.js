import { describe, it, expect, vi, beforeEach } from 'vitest';

// oxjob #1744: the one-mode search page's chat. A /query/text answer becomes the page's query
// in the new OQL form with its sort folded in; failures read as plain sentences; a calculation
// answer opens on the chart, a list on the list.

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.test' }, axiosConfig: () => ({ headers: {} }) }));
vi.mock('@/api', () => ({ api: { getQuery: vi.fn() } }));

import axios from 'axios';
import {
  askQueryText, friendlyError, sortToSortBy, oqlForAnswer, answerAsides, loadThread, saveThread,
} from '../components/NlSearch/nlChat';
import { defaultFormat } from '../components/NlSearch/nlChart';

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
});
