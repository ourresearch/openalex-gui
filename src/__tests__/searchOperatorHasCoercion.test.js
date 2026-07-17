import { describe, it, expect } from 'vitest';
import { resolvePropertyKey } from '../components/OqlPlayground/oqoTree.js';
import { v2FilterRows } from '../components/OqlPlayground/v2ToOqo.js';
import { makeDraft, draftToFilter } from '../components/OqlPlayground/v2Edit.js';

// oxjob #603 round 30 — two coupled bugs when a curated facet key isn't the
// catalog column's own key (e.g. `default.search` is an ALTERNATE key of the
// non-works entities' `text.search`): the field pick fell back to operator `is`
// (the only valid operator on a search column is `has`; an omitted operator also
// defaults server-side to `is`) → invalid_operator_for_column on every commit,
// and the chip label fell back to the raw key ("default.search").

describe('resolvePropertyKey — alternate_keys resolution (#603 r30)', () => {
  const catalog = {
    'text.search': { display_name: 'text', operators: ['search'],
                     alternate_keys: ['default.search'] },
    'open_access.is_oa': { display_name: 'open access', type: 'boolean',
                           operators: ['eq', 'null'], alternate_keys: ['is_oa'] },
    'display_name.search': { display_name: 'display name', operators: ['search'] },
  };

  it('passes a direct catalog key through', () => {
    expect(resolvePropertyKey(catalog, 'display_name.search')).toBe('display_name.search');
  });

  it('resolves an alternate key to its catalog column', () => {
    expect(resolvePropertyKey(catalog, 'default.search')).toBe('text.search');
    expect(resolvePropertyKey(catalog, 'is_oa')).toBe('open_access.is_oa');
  });

  it('passes unknown keys and empty inputs through unchanged', () => {
    expect(resolvePropertyKey(catalog, 'nope.search')).toBe('nope.search');
    expect(resolvePropertyKey(null, 'default.search')).toBe('default.search');
    expect(resolvePropertyKey(catalog, null)).toBe(null);
    // a catalog entry with no alternate_keys must not throw
    expect(resolvePropertyKey({ a: {} }, 'b')).toBe('b');
  });
});

describe('search columns always emit operator "has" in the OQO (#603 r30)', () => {
  it('draftToFilter coerces a stale `is` draft operator on a search column', () => {
    const d = makeDraft(); // operator defaults to "is"
    d.column_id = 'default.search';
    d.column = 'default.search';
    d.value = { node: 'vgroup', id: 'g', join: 'or',
                children: [{ node: 'vleaf', id: 'v', value: 'foo', display: 'foo' }] };
    const f = draftToFilter(d);
    expect(f).toEqual({ column_id: 'default.search', value: 'foo', operator: 'has' });
  });

  it('draftToFilter keeps a resolved `has` operator as-is', () => {
    const d = makeDraft();
    d.column_id = 'text.search';
    d.column = 'text';
    d.operator = 'has';
    d.value = { node: 'vgroup', id: 'g', join: 'or',
                children: [{ node: 'vleaf', id: 'v', value: 'foo', display: 'foo' }] };
    expect(draftToFilter(d).operator).toBe('has');
  });

  it('draftToFilter leaves non-search columns on `is`', () => {
    const d = makeDraft();
    d.column_id = 'raw_affiliation_strings'; // the exact (string-eq) sibling
    d.column = 'exact raw affiliation';
    d.value = { node: 'vgroup', id: 'g', join: 'or',
                children: [{ node: 'vleaf', id: 'v', value: 'foo', display: 'foo' }] };
    expect(draftToFilter(d).operator).toBe('is');
  });

  it('v2FilterRows coerces a factored search clause carrying `is`', () => {
    const tree = {
      where: {
        node: 'clause', id: 'c1', column_id: 'default.search', operator: 'is',
        value: { node: 'vgroup', id: 'g', join: 'or',
                 children: [{ node: 'vleaf', id: 'v', value: 'foo', display: 'foo' }] },
      },
    };
    const rows = v2FilterRows(tree);
    expect(rows).toHaveLength(1);
    expect(rows[0].operator).toBe('has');
  });
});
