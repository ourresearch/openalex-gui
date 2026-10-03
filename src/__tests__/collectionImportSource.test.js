// What "Save results as a collection" and "Select all" send (oxjob #1527).
import { describe, it, expect } from 'vitest';
import { importSource, legacyApiUrl } from '@/collectionImportSource';
import { liveFilterLimit } from '@/collectionLimits';
import { isCollectibleEntityType } from '@/openalexId';

describe('importSource', () => {
  it('uses the server-canonical URL when the query has one', () => {
    const ro = { meta: { x_query: { url: '/works?filter=publication_year:2020&per_page=25', oql: 'works where year is 2020' } } };
    expect(importSource(ro, {}, 'works')).toEqual({ query: 'https://api.openalex.org/works?filter=publication_year:2020&per_page=25' });
  });
  it('falls back to OQL, then to the route', () => {
    expect(importSource({ meta: { x_query: { oql: 'works where x' } } }, {}, 'works')).toEqual({ oql: 'works where x' });
    expect(importSource(null, { oql: 'authors where y' }, 'authors')).toEqual({ oql: 'authors where y' });
    expect(importSource(null, { filter: 'type:article', search: 'frogs', sort: 'cited_by_count:desc', page: '3' }, 'works'))
      .toEqual({ query: 'https://api.openalex.org/works?filter=type%3Aarticle&search=frogs&sort=cited_by_count%3Adesc' });
  });
  it('legacy URL with no params', () => {
    expect(legacyApiUrl({}, 'sources')).toBe('https://api.openalex.org/sources');
  });
});

describe('limits and types', () => {
  it('authors filter live to 100,000, everything else 300,000', () => {
    expect(liveFilterLimit('authors')).toBe(100_000);
    expect(liveFilterLimit('sources')).toBe(300_000);
    expect(liveFilterLimit('works')).toBe(300_000);
  });
  it('collectible types use the GUI names', () => {
    expect(isCollectibleEntityType('types')).toBe(true);
    expect(isCollectibleEntityType('works')).toBe(true);
    expect(isCollectibleEntityType('raw-affiliation-strings')).toBe(false);
  });
});
