import { describe, it, expect } from 'vitest';
import { keyedApiUrl, keyParamJoiner, apiErrorSummary } from '@/apiViewer';

describe('API viewer URLs (#1246)', () => {
  it('adds the key as api_key, after ? or &', () => {
    expect(keyedApiUrl('https://api.openalex.org/works/W1', 'abc'))
      .toBe('https://api.openalex.org/works/W1?api_key=abc');
    expect(keyedApiUrl('https://api.openalex.org/works/W1?data-version=2', 'abc'))
      .toBe('https://api.openalex.org/works/W1?data-version=2&api_key=abc');
  });

  it('leaves the URL alone with no key', () => {
    expect(keyedApiUrl('https://api.openalex.org/works/W1', null)).toBe('https://api.openalex.org/works/W1');
    expect(keyedApiUrl('', 'abc')).toBe('');
  });

  it('never re-encodes the rest of the URL', () => {
    const groupBy = 'https://api.openalex.org/works?filter=institutions.id:I1,publication_year:2020&group_by=type';
    expect(keyedApiUrl(groupBy, 'k')).toBe(groupBy + '&api_key=k');
    const oqo = 'https://api.openalex.org/?oqo=%7B%22a%22%3A1%7D&per_page=200';
    expect(keyedApiUrl(oqo, 'k')).toBe(oqo + '&api_key=k');
    expect(keyedApiUrl('https://api.openalex.org/locations/doi:10.1/x', 'k'))
      .toBe('https://api.openalex.org/locations/doi:10.1/x?api_key=k');
  });

  it('joins with ? or &', () => {
    expect(keyParamJoiner('https://api.openalex.org/works/W1')).toBe('?');
    expect(keyParamJoiner('https://api.openalex.org/works/W1?data-version=2')).toBe('&');
  });
});

describe('apiErrorSummary', () => {
  it("shows the proxy's 429 message", () => {
    const err = { response: { status: 429, data: { error: 'Rate limit exceeded', message: 'Insufficient budget. ...' } } };
    expect(apiErrorSummary(err)).toEqual({ status: 429, message: 'Insufficient budget. ...' });
  });

  it('falls back to error, then statusText', () => {
    expect(apiErrorSummary({ response: { status: 404, data: { error: 'Not found' } } }).message).toBe('Not found');
    expect(apiErrorSummary({ response: { status: 502, data: '', statusText: 'Bad Gateway' } }).message).toBe('Bad Gateway');
  });

  it('says the request failed when there was no response', () => {
    expect(apiErrorSummary({ message: 'Network Error' })).toEqual({ status: null, message: 'Network Error' });
  });
});
