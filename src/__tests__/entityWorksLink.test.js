import { describe, it, expect, vi } from 'vitest';

// filters.js pulls in the store and router at import time; the link builder needs neither.
vi.mock('@/store', () => ({ default: {} }));
vi.mock('@/router', () => ({ default: {} }));
vi.mock('../store', () => ({ default: {} }));
vi.mock('../router', () => ({ default: {} }));

import filters from '@/filters';

// oxjob #106: a source's works_count counts the works whose primary location is the
// source, repositories included. EUR Research Repository showed 81,500 and its link
// opened the any-location list of 221,860.
describe('entityWorksLink', () => {
  it("opens a source's primary-location works, repositories included", () => {
    const link = filters.entityWorksLink('https://openalex.org/S4306401266');
    expect(link.name).toBe('Serp');
    expect(link.query.filter).toBe('primary_location.source.id:s4306401266');
    // works_count counts every corpus, so the list does too.
    expect(link.query.include_xpac).toBe('true');
  });

  it('takes an explicit filter key (institutions: the institution itself, #1823)', () => {
    const link = filters.entityWorksLink('https://openalex.org/I141945490', 'authorships.institutions.id');
    expect(link.query.filter).toBe('authorships.institutions.id:i141945490');
  });

  it('returns nothing without an id', () => {
    expect(filters.entityWorksLink(undefined)).toBeUndefined();
  });
});
