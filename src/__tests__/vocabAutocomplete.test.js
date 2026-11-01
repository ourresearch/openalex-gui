import { describe, it, expect } from 'vitest';
import { isSmallVocabType, filterVocabRows, SMALL_VOCAB_TYPES } from '../vocabAutocomplete';

const ROWS = [
    { id: 'https://openalex.org/countries/US', display_name: 'United States', works_count: 100 },
    { id: 'https://openalex.org/countries/GB', display_name: 'United Kingdom', works_count: 90 },
    { id: 'https://openalex.org/countries/FR', display_name: 'France', works_count: 80 },
    { id: 'https://openalex.org/types/article', display_name: 'article', works_count: 70 },
    { id: 'https://openalex.org/types/book-chapter', display_name: 'book-chapter', works_count: 60 },
];

describe('vocabAutocomplete', () => {
    describe('isSmallVocabType', () => {
        it('matches vocab types under both naming schemes', () => {
            expect(isSmallVocabType('countries')).toBe(true);
            expect(isSmallVocabType('work-types')).toBe(true);
            expect(isSmallVocabType('types')).toBe(true); // GUI name for work-types
            expect(isSmallVocabType('sdgs')).toBe(true);
        });

        it('excludes native types, keywords, and awards', () => {
            expect(isSmallVocabType('works')).toBe(false);
            expect(isSmallVocabType('authors')).toBe(false);
            expect(isSmallVocabType('keywords')).toBe(false); // has real /autocomplete
            expect(isSmallVocabType('awards')).toBe(false); // too big; ?search fallback
        });

        it('every set member is a users-api collection type name', () => {
            for (const t of SMALL_VOCAB_TYPES) {
                expect(t).not.toBe('types'); // stored as work-types, not the GUI name
            }
        });
    });

    describe('filterVocabRows', () => {
        it('empty query returns all rows (browse), capped by limit', () => {
            expect(filterVocabRows(ROWS, '')).toHaveLength(ROWS.length);
            expect(filterVocabRows(ROWS, '', 2)).toHaveLength(2);
        });

        it('substring-matches display_name case-insensitively', () => {
            const hits = filterVocabRows(ROWS, 'united');
            expect(hits.map(r => r.display_name)).toEqual(['United States', 'United Kingdom']);
            // mid-word substring — the thing server ?search= cannot do
            expect(filterVocabRows(ROWS, 'ingdom')).toHaveLength(1);
        });

        it('type-ahead order: name starts, then word starts, then the rest, each by works', () => {
            const rows = [
                { id: 'https://openalex.org/countries/CN', display_name: 'China' },
                { id: 'https://openalex.org/countries/IN', display_name: 'India' },
                { id: 'https://openalex.org/countries/GB', display_name: 'United Kingdom' },
                { id: 'https://openalex.org/countries/ID', display_name: 'Indonesia' },
                { id: 'https://openalex.org/countries/KR', display_name: 'Korea, Republic of' },
            ];
            expect(filterVocabRows(rows, 'in').map(r => r.display_name)).toEqual(['India', 'Indonesia', 'China', 'United Kingdom']);
            expect(filterVocabRows(rows, 'rep').map(r => r.display_name)).toEqual(['Korea, Republic of']);
            expect(filterVocabRows(rows, 'kingdom').map(r => r.display_name)).toEqual(['United Kingdom']);
        });

        it('matches the bare code too', () => {
            expect(filterVocabRows(ROWS, 'gb')).toHaveLength(1);
            expect(filterVocabRows(ROWS, 'book-ch').map(r => r.display_name)).toEqual(['book-chapter']);
        });

        it('drops malformed rows and handles null input', () => {
            expect(filterVocabRows([{ id: null, display_name: 'x' }, ...ROWS], 'france')).toHaveLength(1);
            expect(filterVocabRows(null, 'x')).toEqual([]);
        });
    });
});
