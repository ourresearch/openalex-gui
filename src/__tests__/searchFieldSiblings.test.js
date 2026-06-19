import { describe, it, expect } from 'vitest';
import { searchFieldSiblings } from '../components/OqlPlayground/oqoTree.js';

// oxjob #467 — the field chip's "change search field" menu (search filters only).
// searchFieldSiblings is CURATED to exactly three primary search surfaces, in breadth order.
// Jason re-curated the middle surface from abstract-only to the broader title/abstract scope
// (2026-06-19, the #475 menus-on-chips operator-change ask): title / title-abstract / full text.
// Offered only if they exist in the entity catalog, each flagged `current:true` when the filter
// is already on it.

// Trimmed shape of the live /works catalog (search props only + a couple non-search).
const worksProps = {
  'abstract.search': { name: 'abstract.search', type: 'search', display_name: 'abstract' },
  'abstract.search.exact': { name: 'abstract.search.exact', type: 'search', display_name: 'abstract' },
  'display_name.search': { name: 'display_name.search', type: 'search', display_name: 'title' },
  'fulltext.search': { name: 'fulltext.search', type: 'search', display_name: 'full text' },
  // obscure / non-curated surfaces that must NOT appear in the curated menu:
  'raw_author_name.search': { name: 'raw_author_name.search', type: 'search', display_name: 'byline' },
  'semantic.search': { name: 'semantic.search', type: 'search', display_name: 'semantic' },
  'default.search': { name: 'default.search', type: 'search', display_name: 'default' },
  'title_and_abstract.search': { name: 'title_and_abstract.search', type: 'search', display_name: 'title/abstract' },
  'title_and_abstract.search.exact': { name: 'title_and_abstract.search.exact', type: 'search', display_name: 'title and abstract' },
  'publication_year': { name: 'publication_year', type: 'number', display_name: 'year' },
  'authorships.author.id': { name: 'authorships.author.id', type: 'openalex_id', display_name: 'author' },
};

describe('searchFieldSiblings', () => {
  it('offers exactly the three curated surfaces in title / title-abstract / full-text order', () => {
    const out = searchFieldSiblings(worksProps, 'title_and_abstract.search');
    expect(out).toEqual([
      { column_id: 'display_name.search', label: 'title', current: false },
      { column_id: 'title_and_abstract.search', label: 'title/abstract', current: true },
      { column_id: 'fulltext.search', label: 'full text', current: false },
    ]);
  });

  it('never offers the obscure / dropped surfaces (byline / semantic / default / abstract-only)', () => {
    const cols = searchFieldSiblings(worksProps, 'display_name.search').map((s) => s.column_id);
    expect(cols).not.toContain('raw_author_name.search');
    expect(cols).not.toContain('semantic.search');
    expect(cols).not.toContain('default.search');
    expect(cols).not.toContain('abstract.search');
  });

  it('still shows all three when on one of them, flagging the current as active', () => {
    const out = searchFieldSiblings(worksProps, 'fulltext.search');
    expect(out.map((s) => s.column_id)).toEqual([
      'display_name.search', 'title_and_abstract.search', 'fulltext.search',
    ]);
    expect(out.find((s) => s.column_id === 'fulltext.search').current).toBe(true);
    expect(out.filter((s) => s.current)).toHaveLength(1);
  });

  it('flags current via the base even when called on the .exact column', () => {
    const out = searchFieldSiblings(worksProps, 'title_and_abstract.search.exact');
    expect(out.find((s) => s.column_id === 'title_and_abstract.search').current).toBe(true);
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
