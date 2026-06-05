import { describe, it, expect } from 'vitest';
import { basicCanRepresent, facetTypeToChipType } from '../components/Filter/basicFilterMode';
import { filtersFromUrlStr } from '../filterConfigs';

// #353 round 4: the basic (chip) view must be offered ONLY when it can faithfully
// represent the whole query. basicCanRepresent is the predicate that gates it;
// when false the SERP forces advanced mode and disables the Basic toggle.
const can = (filterStr) => basicCanRepresent('works', filtersFromUrlStr('works', filterStr));

describe('basicCanRepresent — when basic mode can faithfully show the query', () => {
  it('true for an empty query', () => {
    expect(can(undefined)).toBe(true);
    expect(can('')).toBe(true);
  });

  it('true for a single chip-able entity filter', () => {
    expect(can('authorships.institutions.lineage:i27837315')).toBe(true);
  });

  it('true for one field with a pipe-OR list (one chip, multiple values)', () => {
    expect(can('authorships.institutions.lineage:i27837315|i136199984')).toBe(true);
  });

  it('true for several DIFFERENT chip-able fields (year + boolean + entity)', () => {
    expect(can('publication_year:2020,open_access.is_oa:true,type:article')).toBe(true);
  });

  it('true for a negated BOOLEAN (the boolean chip shows a NOT state)', () => {
    expect(can('open_access.is_oa:!true')).toBe(true);
    expect(can('open_access.is_oa:false')).toBe(true);
  });

  // --- the cases that force advanced + disable basic ---

  it('FALSE for the same field in multiple AND clauses (the B9 AND→OR trap)', () => {
    expect(can('authorships.institutions.lineage:i27837315,authorships.institutions.lineage:i136199984')).toBe(false);
  });

  it('FALSE for a field with no chip in the basic view (a .search filter)', () => {
    expect(can('title.search:machine learning')).toBe(false);
  });

  it('FALSE for a negated ENTITY filter (chips can only render it as positive)', () => {
    expect(can('authorships.institutions.lineage:!i27837315')).toBe(false);
  });

  it('FALSE when one bad clause rides along with otherwise-fine clauses', () => {
    expect(can('publication_year:2020,title.search:foo')).toBe(false);
  });
});

describe('facetTypeToChipType', () => {
  it('returns null for an unmapped/missing facet config', () => {
    expect(facetTypeToChipType(null)).toBe(null);
    expect(facetTypeToChipType({ type: 'search' })).toBe(null);
  });
  it('maps selectEntity/boolean/range/year', () => {
    expect(facetTypeToChipType({ type: 'selectEntity' })).toBe('entity');
    expect(facetTypeToChipType({ type: 'boolean' })).toBe('boolean');
    expect(facetTypeToChipType({ type: 'range', key: 'publication_year' })).toBe('year');
    expect(facetTypeToChipType({ type: 'range', key: 'cited_by_count' })).toBe('range');
  });
});
