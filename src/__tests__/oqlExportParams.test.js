import { describe, it, expect } from 'vitest';
import { deriveOqlExportParams } from '@/utils/oqlExportParams';

// deriveOqlExportParams turns the server's canonical x_query.url echo into the
// param set the export request sends. The contract that matters most: it must
// return null (→ export blocked) rather than ever mis-scoping — an unfiltered
// or wrongly-filtered request becomes a whole-corpus / wrong-corpus export.

describe('deriveOqlExportParams', () => {
  it('passes through a plain filter', () => {
    expect(
      deriveOqlExportParams('/works?filter=authorships.institutions.lineage:institutions%2FI169615421')
    ).toEqual({ filter: 'authorships.institutions.lineage:institutions/I169615421' });
  });

  it('passes through filter + sort + search family + include_xpac', () => {
    expect(
      deriveOqlExportParams(
        '/works?filter=publication_year:2020&sort=cited_by_count:desc&search=dark+matter&include_xpac=true'
      )
    ).toEqual({
      filter: 'publication_year:2020',
      sort: 'cited_by_count:desc',
      search: 'dark matter',
      include_xpac: 'true',
    });
  });

  it('drops view chrome (paging, group_by, select, seed) without blocking', () => {
    expect(
      deriveOqlExportParams(
        '/works?filter=type:article&page=2&per_page=50&cursor=abc&group_by=oa_status&select=id,doi&seed=42'
      )
    ).toEqual({ filter: 'type:article' });
  });

  it('returns {} for a query over the whole corpus (no params) — intentional, cost gate applies', () => {
    expect(deriveOqlExportParams('/works')).toEqual({});
  });

  it('blocks (null) when x_query.url is null/absent (query not URL-expressible)', () => {
    expect(deriveOqlExportParams(null)).toBeNull();
    expect(deriveOqlExportParams(undefined)).toBeNull();
    expect(deriveOqlExportParams('')).toBeNull();
  });

  it('blocks (null) on a row-set-changing param the exporter does not honor (sample)', () => {
    expect(deriveOqlExportParams('/works?filter=type:article&sample=100&seed=1')).toBeNull();
  });

  it('blocks (null) on unknown/future params rather than silently dropping them', () => {
    expect(deriveOqlExportParams('/works?filter=type:article&corpus=all')).toBeNull();
  });
});
