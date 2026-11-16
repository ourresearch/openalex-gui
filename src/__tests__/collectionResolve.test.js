// The collection import wizard's ID lookups (oxjob #1923, ZD 26619): batched
// list filters through api.getUrl (the user's key and the shared refusal policy,
// with retries), and "lookup failed" kept apart from "not found". The retries
// themselves are tested with withRefusalPolicy in requestStates.test.js.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/api';
import { resolveIds, enrichDisplayNames, LOOKUP_FAILED } from '@/collectionResolve';

vi.mock('@/api', () => ({ api: { getUrl: vi.fn() } }));
vi.mock('@/apiConfig.js', () => ({ urlBase: { api: 'https://api.openalex.org' } }));

const API = 'https://api.openalex.org';
const getUrl = api.getUrl;

// A fake API: works by DOI (lower-case, as the API stores them).
function worksDb(n) {
  const db = new Map();
  for (let i = 0; i < n; i++) db.set(`10.1234/abc.${i}`, { id: `https://openalex.org/W${1000 + i}`, display_name: `Work ${i}` });
  return db;
}

function filterValues(url) {
  const filter = new URL(url).searchParams.get('filter');
  return filter.slice(filter.indexOf(':') + 1).split('|');
}

const httpError = (status, data = {}, headers = {}) =>
  Object.assign(new Error(`HTTP ${status}`), { response: { status, data, headers }, request: {} });

// Answers list calls `/works?filter=doi:a|b` from db, and singletons `/works/doi:x`.
function serve(db, { extra = [] } = {}) {
  return async url => {
    const u = new URL(url);
    if (u.pathname === '/works') {
      const results = [];
      for (const v of filterValues(url)) {
        const key = v.toLowerCase();
        const w = db.get(key);
        if (w) results.push({ ...w, doi: `https://doi.org/${key}` });
      }
      results.push(...extra);
      return { meta: { count: results.length }, results };
    }
    const m = decodeURIComponent(u.pathname).match(/^\/works\/doi:(.*)$/);
    const w = m && db.get(m[1].toLowerCase());
    if (w) return w;
    throw httpError(404);
  };
}

beforeEach(() => {
  getUrl.mockReset();
});

describe('batched DOI lookups', () => {
  it('resolves 100 DOIs with one list call (with retries), mapping every form back', async () => {
    const db = worksDb(100);
    // The SICI DOI needs ; < > : to survive the filter.
    db.set('10.1002/(sici)1097-0258(19980430)17:8<857::aid-sim777>3.0.co;2-e', { id: 'https://openalex.org/W77', display_name: 'SICI' });
    getUrl.mockImplementation(serve(db));
    const lines = [];
    for (let i = 0; i < 97; i++) lines.push(`10.1234/abc.${i}`);
    lines.push('10.1234/ABC.97');                       // upper case
    lines.push('https://doi.org/10.1234/abc.98');       // URL form
    lines.push('10.1002/(SICI)1097-0258(19980430)17:8<857::AID-SIM777>3.0.CO;2-E');

    const rows = await resolveIds(lines, 'works');

    expect(getUrl).toHaveBeenCalledTimes(1);
    const [url, config, policy] = getUrl.mock.calls[0];
    expect(url.startsWith(`${API}/works?filter=doi%3A`)).toBe(true);
    expect(url).toContain('per_page=200');
    expect(filterValues(url)).toHaveLength(100);
    expect(config).toBeUndefined();
    expect(policy).toEqual({ retries: 3 });
    expect(rows.every(r => r.resolved)).toBe(true);
    expect(rows[0]).toEqual({ input: '10.1234/abc.0', resolved: 'W1000', display_name: 'Work 0' });
    expect(rows[97].resolved).toBe('W1097');
    expect(rows[98]).toMatchObject({ input: 'https://doi.org/10.1234/abc.98', resolved: 'W1098' });
    expect(rows[99].resolved).toBe('W77');
  });

  it('1,000 DOIs take 10 calls of at most 100 values', async () => {
    getUrl.mockImplementation(serve(worksDb(1000)));
    const lines = Array.from({ length: 1000 }, (_, i) => `10.1234/abc.${i}`);
    const progress = [];
    const rows = await resolveIds(lines, 'works', { onProgress: d => progress.push(d) });
    expect(getUrl).toHaveBeenCalledTimes(10);
    for (const [url] of getUrl.mock.calls) expect(filterValues(url).length).toBeLessThanOrEqual(100);
    expect(rows.filter(r => r.resolved)).toHaveLength(1000);
    expect(progress.at(-1)).toBe(1000);
  });

  it('a DOI the API does not have is "not found", with no extra call', async () => {
    getUrl.mockImplementation(serve(worksDb(2)));
    const rows = await resolveIds(['10.1234/abc.0', '10.1234/missing', '10.1234/abc.1'], 'works');
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(rows.map(r => r.resolved)).toEqual(['W1000', null, 'W1001']);
    expect(rows[1]).toEqual({ input: '10.1234/missing', resolved: null, reason: 'not found' });
  });

  it('repeated DOIs share one lookup, each row keeping its own input', async () => {
    getUrl.mockImplementation(serve(worksDb(1)));
    const rows = await resolveIds(['10.1234/abc.0', 'doi: 10.1234/ABC.0'], 'works');
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(filterValues(getUrl.mock.calls[0][0])).toEqual(['10.1234/abc.0']);
    expect(rows.map(r => [r.input, r.resolved])).toEqual([['10.1234/abc.0', 'W1000'], ['doi: 10.1234/ABC.0', 'W1000']]);
  });

  it('OpenAlex IDs need no call; a wrong type or format is settled locally', async () => {
    const rows = await resolveIds(['W123', 'https://openalex.org/W456', '2755968057', 'A5', 'hello'], 'works');
    expect(getUrl).not.toHaveBeenCalled();
    expect(rows.map(r => r.resolved)).toEqual(['W123', 'W456', 'W2755968057', null, null]);
    expect(rows[3].reason).toMatch(/^wrong entity type/);
    expect(rows[4].reason).toBe('unrecognized format');
  });
});

describe('a refused lookup reads "lookup failed", never "not found"', () => {
  it('a refusal that may clear (still failing after the retries) is failed: try again', async () => {
    getUrl.mockRejectedValue(httpError(429, { message: 'Rate limit exceeded: 10 requests per second.', retryAfter: 1 }));
    const rows = await resolveIds(['10.1234/abc.0', '10.1234/abc.1'], 'works');
    for (const r of rows) expect(r).toMatchObject({ resolved: null, reason: LOOKUP_FAILED, failed: true });
  });

  it('a spent daily budget says so, and no "try again"', async () => {
    getUrl.mockRejectedValue(httpError(429, { message: 'Insufficient budget. ...' }, { 'retry-after': '40000' }));
    const rows = await resolveIds(['10.1234/abc.0'], 'works');
    expect(rows[0]).toEqual({ input: '10.1234/abc.0', resolved: null, reason: "lookup failed: today's budget is used up" });
  });

  it('a 404 on a one-by-one lookup is "not found"', async () => {
    getUrl.mockImplementation(serve(new Map()));
    // A comma can't go in a filter, so this DOI is looked up on its own.
    const rows = await resolveIds(['10.1234/a,b'], 'works');
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(getUrl.mock.calls[0][0]).toContain('/works/doi%3A10.1234%2Fa%2Cb');
    expect(rows[0]).toMatchObject({ resolved: null, reason: 'not found' });
  });
});

describe('fallbacks to one-by-one lookups', () => {
  it('a filter the API refuses (400) falls back to one call per DOI', async () => {
    const ok = serve(worksDb(2));
    getUrl.mockImplementation(async url => {
      if (new URL(url).pathname === '/works') throw httpError(400, { message: 'Invalid filter' });
      return ok(url);
    });
    const rows = await resolveIds(['10.1234/abc.0', '10.1234/abc.1'], 'works');
    expect(getUrl).toHaveBeenCalledTimes(3);
    expect(rows.map(r => r.resolved)).toEqual(['W1000', 'W1001']);
  });

  it("a result that maps to no line sends that batch's misses one by one", async () => {
    // The API matched a line but returns its DOI in a form we can't map back.
    getUrl.mockImplementation(serve(worksDb(1), { extra: [{ id: 'https://openalex.org/W9', display_name: 'Odd', doi: 'https://doi.org/10.1234/odd%20' }] }));
    const rows = await resolveIds(['10.1234/abc.0', '10.1234/ODD-ISH'], 'works');
    expect(getUrl).toHaveBeenCalledTimes(2); // one batch + one singleton for the miss
    expect(getUrl.mock.calls[1][0]).toContain('/works/doi%3A10.1234%2FODD-ISH');
    expect(rows[0].resolved).toBe('W1000');
    expect(rows[1]).toMatchObject({ resolved: null, reason: 'not found' });
  });
});

describe('other IDs', () => {
  it('authors batch by ORCID', async () => {
    getUrl.mockResolvedValue({ meta: { count: 1 }, results: [
      { id: 'https://openalex.org/A5', display_name: 'Ada', orcid: 'https://orcid.org/0000-0002-1825-009X' },
    ] });
    const rows = await resolveIds(['https://orcid.org/0000-0002-1825-009x', '0000-0001-0000-0000'], 'authors');
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(getUrl.mock.calls[0][0]).toContain(`${API}/authors?filter=orcid%3A`);
    expect(rows[0]).toMatchObject({ resolved: 'A5', display_name: 'Ada' });
    expect(rows[1]).toMatchObject({ resolved: null, reason: 'not found' });
  });

  it('sources batch by any of their ISSNs', async () => {
    getUrl.mockResolvedValue({ meta: { count: 1 }, results: [
      { id: 'https://openalex.org/S7', display_name: 'J', issn: ['1234-5678', '8765-432X'], issn_l: '1234-5678' },
    ] });
    const rows = await resolveIds(['8765-432x', '1234-5678'], 'sources');
    expect(getUrl).toHaveBeenCalledTimes(1);
    expect(rows.map(r => r.resolved)).toEqual(['S7', 'S7']);
  });

  it('funder DOIs stay one call each (funders have no doi filter)', async () => {
    getUrl.mockResolvedValue({ id: 'https://openalex.org/F3', display_name: 'NSF' });
    const rows = await resolveIds(['10.13039/100000001'], 'funders');
    expect(getUrl.mock.calls[0][0]).toContain(`${API}/funders/doi%3A10.13039%2F100000001`);
    expect(rows[0]).toMatchObject({ resolved: 'F3' });
  });

  it('vocab codes are looked up once per distinct code', async () => {
    getUrl.mockResolvedValue({ id: 'https://openalex.org/countries/US', display_name: 'United States' });
    const rows = await resolveIds(['US', 'US', 'countries/US'], 'countries');
    expect(getUrl).toHaveBeenCalledTimes(2); // "US" twice = one call; "countries/US" parses to its own path
    expect(rows.map(r => r.resolved)).toEqual(['US', 'US', 'US']);
  });
});

describe('enrichDisplayNames', () => {
  it('names 250 OpenAlex IDs in calls of at most 100 (the API refuses 101)', async () => {
    getUrl.mockImplementation(async url => ({
      results: filterValues(url).map(id => ({ id: `https://openalex.org/${id}`, display_name: `name ${id}` })),
    }));
    const rows = Array.from({ length: 250 }, (_, i) => ({ input: `W${i + 1}`, resolved: `W${i + 1}` }));
    await enrichDisplayNames(rows, 'works');
    expect(getUrl).toHaveBeenCalledTimes(3);
    for (const [url] of getUrl.mock.calls) expect(filterValues(url).length).toBeLessThanOrEqual(100);
    expect(rows.every(r => r.display_name === `name ${r.resolved}`)).toBe(true);
  });
});
