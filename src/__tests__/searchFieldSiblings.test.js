import { describe, it, expect } from 'vitest';
import { searchFieldSiblings } from '../components/OqlPlayground/oqoTree.js';

// oxjob #467 — the field chip's "change search field" menu (search filters only).
// searchFieldSiblings derives the candidate fields from the per-entity /properties
// catalog: every BASE `.search` column except the `.exact` twins and the current one.

// Trimmed shape of the live /works catalog (search props only + a couple non-search).
const worksProps = {
  'abstract.search': { name: 'abstract.search', type: 'search', display_name: 'abstract' },
  'abstract.search.exact': { name: 'abstract.search.exact', type: 'search', display_name: 'abstract' },
  'display_name.search': { name: 'display_name.search', type: 'search', display_name: 'title' },
  'fulltext.search': { name: 'fulltext.search', type: 'search', display_name: 'full text' },
  'title_and_abstract.search': { name: 'title_and_abstract.search', type: 'search', display_name: 'title/abstract' },
  'title_and_abstract.search.exact': { name: 'title_and_abstract.search.exact', type: 'search', display_name: 'title and abstract' },
  'publication_year': { name: 'publication_year', type: 'number', display_name: 'year' },
  'authorships.author.id': { name: 'authorships.author.id', type: 'openalex_id', display_name: 'author' },
};

describe('searchFieldSiblings', () => {
  it('lists the OTHER base .search fields, sorted by label', () => {
    const out = searchFieldSiblings(worksProps, 'title_and_abstract.search');
    expect(out).toEqual([
      { column_id: 'abstract.search', label: 'abstract' },
      { column_id: 'fulltext.search', label: 'full text' },
      { column_id: 'display_name.search', label: 'title' },
    ]);
  });

  it('excludes the current field even when called on its .exact column', () => {
    const out = searchFieldSiblings(worksProps, 'title_and_abstract.search.exact');
    expect(out.map((s) => s.column_id)).not.toContain('title_and_abstract.search');
    expect(out.map((s) => s.column_id)).toEqual(
      expect.arrayContaining(['abstract.search', 'display_name.search', 'fulltext.search']),
    );
  });

  it('never returns the .exact twins (exactness is a per-value surface form)', () => {
    const out = searchFieldSiblings(worksProps, 'display_name.search');
    expect(out.every((s) => !s.column_id.endsWith('.exact'))).toBe(true);
  });

  it('returns [] for a non-search field or missing catalog', () => {
    expect(searchFieldSiblings(worksProps, 'publication_year')).toEqual([]);
    expect(searchFieldSiblings(null, 'title_and_abstract.search')).toEqual([]);
  });
});
