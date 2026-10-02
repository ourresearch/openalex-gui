import { describe, it, expect } from 'vitest';
import { canAlertOnFilter } from '../collectionFilter';

// oxjob #1505: no alert item on a search limited to a works collection; mirrors
// users-api new_works_alert.has_works_collection_filter.
describe('canAlertOnFilter', () => {
  it('hides alerts on a works collection', () => {
    expect(canAlertOnFilter('collection:col_nQxuJkvZUQ')).toBe(false);
    expect(canAlertOnFilter('collection:col_C72Q,publication_year:2025-2026')).toBe(false);
    expect(canAlertOnFilter(['publication_year:2025', 'collection:col_x'])).toBe(false);
  });

  it('allows alerts that exclude a works collection or use another type', () => {
    expect(canAlertOnFilter('collection:!col_x,title.search:coral')).toBe(true);
    expect(canAlertOnFilter('authorships.institutions.lineage:col_dWbCjwhR8V')).toBe(true);
    expect(canAlertOnFilter('title.search:coral')).toBe(true);
    expect(canAlertOnFilter(undefined)).toBe(true);
    expect(canAlertOnFilter('')).toBe(true);
  });
});
