import { describe, it, expect } from 'vitest';
import {
    createSimpleFilter,
    filtersFromUrlStr,
    filtersAsUrlStr,
} from '../filterConfigs';

// Regression coverage for #191.5: createSimpleFilter must not double-quote
// `.search`-type filter values. Their value is a raw API query string that
// may already contain quotes / proximity (`~N`) / Boolean groups (`|`/`+`);
// wrapping it in another pair of `"` corrupts the query (commit c8e689f7).
describe('filterConfigs — search-filter quoting (#191.5)', () => {
    it('does NOT extra-quote a .search value containing quotes + proximity', () => {
        const value = '"Girls perspective"~2|"Girls experience"~2';
        const f = createSimpleFilter('works', 'title.search', value, false);
        expect(f.asStr).toBe(`title.search:${value}`);
        // specifically: no leading double-quote-wrap
        expect(f.asStr).not.toContain('title.search:""');
    });

    it('does NOT quote a bare multi-word .search value (loose AND, the API default)', () => {
        const f = createSimpleFilter('works', 'title.search', 'machine learning', false);
        expect(f.asStr).toBe('title.search:machine learning');
    });

    it('round-trips a proximity/quoted .search filter idempotently', () => {
        const url = 'title.search:"a b"~2|"c d"~2';
        const filters = filtersFromUrlStr('works', url);
        expect(filtersAsUrlStr(filters)).toBe(url);
    });

    it('round-trips the reporter\'s exact 5-clause query unchanged', () => {
        const url = 'title.search:"Girls perspective"~2|"Girls experience"~2|"Girls attitude"~2|"Girls attitudinal"~2|"Girls belief"~2';
        const filters = filtersFromUrlStr('works', url);
        expect(filtersAsUrlStr(filters)).toBe(url);
    });

    // Regression guard for c8e689f7's original, still-valid case: a
    // non-`.search` filter value containing a space MUST stay quoted for the
    // API (e.g. a source type "ebook platform" → type:"ebook platform").
    it('still quotes a space-containing NON-search filter value', () => {
        const f = createSimpleFilter('sources', 'type', 'ebook platform', false);
        expect(f.asStr).toBe('type:"ebook platform"');
    });
});
