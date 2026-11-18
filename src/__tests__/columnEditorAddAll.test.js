import { describe, it, expect } from 'vitest';
import { availableKeys, withAllAdded } from '@/components/Results/Table/columnEditorKeys';

const categories = [
  { displayName: 'work', items: [{ key: 'title' }, { key: 'doi' }] },
  { displayName: 'source', items: [{ key: 'primary_location.source.issn' }, { key: 'primary_location.source.id:ids' }] },
];

describe('column editor "Add all" (oxjob #635)', () => {
  it('lists the available keys in display order', () => {
    expect(availableKeys(categories)).toEqual(['title', 'doi', 'primary_location.source.issn', 'primary_location.source.id:ids']);
  });

  it('appends every available key after the selected ones, keeping their order', () => {
    expect(withAllAdded(['publication_year', 'cited_by_count'], categories)).toEqual([
      'publication_year', 'cited_by_count', 'title', 'doi', 'primary_location.source.issn', 'primary_location.source.id:ids',
    ]);
  });

  it('adds no key twice', () => {
    expect(withAllAdded(['doi'], categories)).toEqual(['doi', 'title', 'primary_location.source.issn', 'primary_location.source.id:ids']);
  });

  it('copes with nothing available or nothing selected', () => {
    expect(withAllAdded(['doi'], [])).toEqual(['doi']);
    expect(withAllAdded(undefined, undefined)).toEqual([]);
  });

  it('does not change the selection it was given', () => {
    const selected = ['doi'];
    withAllAdded(selected, categories);
    expect(selected).toEqual(['doi']);
  });
});
