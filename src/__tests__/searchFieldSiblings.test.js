import { describe, it, expect } from 'vitest';
import { searchFieldSiblings } from '../components/OqlPlayground/oqoTree.js';

// oxjob #467 — the field chip's "change search field" menu (search filters only).
// searchFieldSiblings is CURATED (Jason, 2026-06-15) to exactly three primary search
// surfaces — title / abstract / full text, in that order — offered only if they exist
// in the entity catalog, each flagged `current:true` when the filter is already on it.

// Trimmed shape of the live /works catalog (search props only + a couple non-search).
const worksProps = {
  'abstract.search': { name: 'abstract.search', type: 'search', display_name: 'abstract' },
  'abstract.search.exact': { name: 'abstract.search.exact', type: 'search', display_name: 'abstract' },
  'display_name.search': { name: 'display_name.search', type: 'search', display_name: 'title' },
  'fulltext.search': { name: 'fulltext.search', type: 'search', display_name: 'full text' },
  // obscure surfaces that must NOT appear in the curated menu:
  'raw_author_name.search': { name: 'raw_author_name.search', type: 'search', display_name: 'byline' },
  'semantic.search': { name: 'semantic.search', type: 'search', display_name: 'semantic' },
  'default.search': { name: 'default.search', type: 'search', display_name: 'default' },
  'title_and_abstract.search': { name: 'title_and_abstract.search', type: 'search', display_name: 'title/abstract' },
  'title_and_abstract.search.exact': { name: 'title_and_abstract.search.exact', type: 'search', display_name: 'title and abstract' },
  'publication_year': { name: 'publication_year', type: 'number', display_name: 'year' },
  'authorships.author.id': { name: 'authorships.author.id', type: 'openalex_id', display_name: 'author' },
};

describe('searchFieldSiblings', () => {
  it('offers exactly the three curated surfaces in title/abstract/full text order', () => {
    const out = searchFieldSiblings(worksProps, 'title_and_abstract.search');
    expect(out).toEqual([
      { column_id: 'display_name.search', label: 'title', current: false },
      { column_id: 'abstract.search', label: 'abstract', current: false },
      { column_id: 'fulltext.search', label: 'full text', current: false },
    ]);
  });

  it('never offers the obscure surfaces (byline / semantic / default / title-abstract)', () => {
    const cols = searchFieldSiblings(worksProps, 'abstract.search').map((s) => s.column_id);
    expect(cols).not.toContain('raw_author_name.search');
    expect(cols).not.toContain('semantic.search');
    expect(cols).not.toContain('default.search');
    expect(cols).not.toContain('title_and_abstract.search');
  });

  it('still shows all three when on one of them, flagging the current as active', () => {
    const out = searchFieldSiblings(worksProps, 'abstract.search');
    expect(out.map((s) => s.column_id)).toEqual([
      'display_name.search', 'abstract.search', 'fulltext.search',
    ]);
    expect(out.find((s) => s.column_id === 'abstract.search').current).toBe(true);
    expect(out.filter((s) => s.current)).toHaveLength(1);
  });

  it('flags current via the base even when called on the .exact column', () => {
    const out = searchFieldSiblings(worksProps, 'abstract.search.exact');
    expect(out.find((s) => s.column_id === 'abstract.search').current).toBe(true);
  });

  it('never returns the .exact twins (exactness is a per-value surface form)', () => {
    const out = searchFieldSiblings(worksProps, 'display_name.search');
    expect(out.every((s) => !s.column_id.endsWith('.exact'))).toBe(true);
  });

  it('only offers surfaces that exist in the entity catalog', () => {
    const authorProps = { 'display_name.search': { type: 'search', display_name: 'name' } };
    const out = searchFieldSiblings(authorProps, 'display_name.search');
    expect(out).toEqual([{ column_id: 'display_name.search', label: 'name', current: true }]);
  });

  it('returns [] for a non-search field or missing catalog', () => {
    expect(searchFieldSiblings(worksProps, 'publication_year')).toEqual([]);
    expect(searchFieldSiblings(null, 'title_and_abstract.search')).toEqual([]);
  });
});
