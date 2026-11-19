// A query too long for a URL goes to the editor endpoints as a POST body (oxjob #941).
// The API refuses a request line over 8,190 bytes, so a long query in the OQL tab failed
// GET /validate and Search silently did nothing. axios is mocked; no network.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async () => ({ data: { valid: true, oql: 'GET', phrases: [] } })),
    post: vi.fn(async () => ({ data: { valid: true, oql: 'POST', phrases: [] } })),
  },
}));
vi.mock('@/apiConfig', () => ({ urlBase: { api: 'https://api.openalex.org' }, axiosConfig: () => ({}) }));
vi.mock('@/api', () => ({ api: {} }));

import axios from 'axios';
import {
  editorRequest, EDITOR_URL_MAX, validateOql, getPhrases, getParseContext,
} from '@/components/OqlPlayground/oqlEditorApi';

const SHORT = 'get works about ("eye" and "screening" within 5 words of each other)';
// a systematic-review search: hundreds of proximity pairs
const LONG = 'get works from 2003–2025 about (' + Array.from({ length: 250 },
  (_, i) => `("eye" and "term${i}" within 5 words of each other)`).join(' or ') + ')';

beforeEach(() => { axios.get.mockClear(); axios.post.mockClear(); });

describe('editorRequest', () => {
  it('keeps a short query a GET, params in order', () => {
    const r = editorRequest('parse-context', { q: 'get works', pos: 3 });
    expect(r).toEqual({ method: 'get',
      url: 'https://api.openalex.org/parse-context?mailto=ui@openalex.org&q=get%20works&pos=3' });
  });

  it('leaves out unset and false params', () => {
    expect(editorRequest('validate', { q: 'x', plain_words: null }).url).not.toContain('plain_words');
    expect(editorRequest('validate', { q: 'x', plain_words: false }).url).not.toContain('plain_words');
    expect(editorRequest('validate', { q: 'x', plain_words: 1 }).url).toMatch(/&plain_words=1$/);
  });

  it('POSTs a query whose GET URL would pass the cut-off', () => {
    expect(encodeURIComponent(LONG).length).toBeGreaterThan(EDITOR_URL_MAX);
    const r = editorRequest('validate', { q: LONG, plain_words: 1 });
    expect(r).toEqual({ method: 'post', url: 'https://api.openalex.org/validate?mailto=ui@openalex.org',
      body: { q: LONG, plain_words: 1 } });
  });
});

describe('the editor calls', () => {
  it('validateOql GETs a short query and POSTs a long one', async () => {
    expect((await validateOql(SHORT)).oql).toBe('GET');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.post).not.toHaveBeenCalled();

    expect((await validateOql(LONG, { plainWords: true })).oql).toBe('POST');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.openalex.org/validate?mailto=ui@openalex.org', { q: LONG, plain_words: 1 }, {});
  });

  it('getPhrases and getParseContext POST a long query', async () => {
    await getPhrases(LONG);
    await getParseContext(LONG, 12);
    expect(axios.post.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ['https://api.openalex.org/oql-phrases?mailto=ui@openalex.org', { q: LONG }],
      ['https://api.openalex.org/parse-context?mailto=ui@openalex.org', { q: LONG, pos: 12 }],
    ]);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
