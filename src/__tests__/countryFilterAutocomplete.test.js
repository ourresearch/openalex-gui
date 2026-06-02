import { describe, it, expect } from 'vitest';
import { createDisplayFilter } from '../filterConfigs';
import { openAlexCountries } from '../countries';

// zd#7567: typing in a Basic Filter Style country filter returned nothing
// because /autocomplete/countries 404s. The fix searches the static country
// list locally in api.getAutocompleteResponses and shapes each hit exactly
// like getGroups() does: createDisplayFilter(..., `https://openalex.org/countries/<code>`).
// These tests pin the two correctness claims behind that fix.

describe('country filter autocomplete (zd#7567)', () => {
    it('createDisplayFilter on a /countries/<CODE> URL yields the short lowercase code as .value (parity with getGroups)', () => {
        const f = createDisplayFilter(
            'works', 'authorships.countries',
            'https://openalex.org/countries/AU', false, 'Australia', 1234,
        );
        expect(f.value).toBe('au');
        expect(f.asStr).toBe('authorships.countries:au');
        expect(f.displayValue).toBe('Australia');
        expect(f.count).toBe(1234);
    });

    it('the static list (used for local search) actually contains Australia, matchable by name and by code', () => {
        const term = 'aus';
        const hits = openAlexCountries
            .filter(c => c.id !== 'unknown')
            .filter(c =>
                c.display_name.toLowerCase().includes(term) ||
                c.id.toLowerCase().includes(term));
        expect(hits.some(c => c.id === 'AU')).toBe(true);
        // and by exact code
        const byCode = openAlexCountries.filter(c => c.id.toLowerCase().includes('au'));
        expect(byCode.some(c => c.id === 'AU')).toBe(true);
    });
});
