import { describe, it, expect } from 'vitest';
import { buildContextKey } from '@/composables/useSelectionContext';

const makeRoute = (path, query) => ({ path, query });

describe('buildContextKey', () => {
  it('keys the same SERP across pages so selection persists (Kyle, 2026-05-25)', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', page: '1' }));
    const k2 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', page: '2' }));
    expect(k1).toBe(k2);
  });

  it('ignores per_page changes', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', per_page: '10' }));
    const k2 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', per_page: '200' }));
    expect(k1).toBe(k2);
  });

  it('ignores view-only params (zoom, tab, view, data-version)', () => {
    const base = buildContextKey(makeRoute('/works', { filter: 'is_oa:true' }));
    for (const key of ['zoom', 'tab', 'view', 'data-version']) {
      const withParam = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', [key]: 'x' }));
      expect(withParam, `param ${key} should not affect context key`).toBe(base);
    }
  });

  it('changes key when filter changes (selection should reset)', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true' }));
    const k2 = buildContextKey(makeRoute('/works', { filter: 'is_oa:false' }));
    expect(k1).not.toBe(k2);
  });

  it('changes key when sort changes (selection should reset)', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', sort: 'cited_by_count' }));
    const k2 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', sort: 'publication_date' }));
    expect(k1).not.toBe(k2);
  });

  it('changes key when path changes', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true' }));
    const k2 = buildContextKey(makeRoute('/authors', { filter: 'is_oa:true' }));
    expect(k1).not.toBe(k2);
  });

  it('is stable across query-key ordering', () => {
    const k1 = buildContextKey(makeRoute('/works', { filter: 'is_oa:true', sort: 'cited_by_count' }));
    const k2 = buildContextKey(makeRoute('/works', { sort: 'cited_by_count', filter: 'is_oa:true' }));
    expect(k1).toBe(k2);
  });
});
