import { describe, it, expect } from 'vitest';
import { filtersFromUrlStr, filtersAsUrlStr } from '@/filterConfigs';
import { canonicalFilterKey } from '@/facetConfigUtils';

// ZD 6488: the GUI's funder filter wrote awards.funder.id (Nov 2025 - Jan 2026),
// which the API refuses with a 400; old links fold to today's funders.id.
describe('legacy awards.funder.id links (ZD 6488)', () => {
    it('folds to funders.id on works', () => {
        expect(canonicalFilterKey('works', 'awards.funder.id')).toBe('funders.id');
        expect(filtersAsUrlStr(filtersFromUrlStr('works', 'awards.funder.id:f4320313262')))
            .toBe('funders.id:f4320313262');
    });

    it('leaves the valid keys alone', () => {
        expect(canonicalFilterKey('works', 'awards.funder_id')).not.toBe('funders.id');
        expect(canonicalFilterKey('works', 'funders.id')).toBe('funders.id');
    });
});
