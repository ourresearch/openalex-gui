import { describe, it, expect } from 'vitest';
import {
    normalizeId,
    getEntityType,
    getShortId,
    parseId,
    idsAreEqual,
    isValidId,
    isNativeEntityType,
    getNativePrefix,
    toApiUrl,
    toOpenAlexUrl,
    toDisplayFormat,
    makeId,
} from '../openalexId';

describe('openalexId', () => {
    describe('normalizeId', () => {
        it('normalizes fully-qualified URLs', () => {
            expect(normalizeId('https://openalex.org/W123')).toBe('works/w123');
            expect(normalizeId('https://openalex.org/A456')).toBe('authors/a456');
            expect(normalizeId('https://openalex.org/I789')).toBe('institutions/i789');
        });

        it('normalizes fully-qualified URLs with entity type path', () => {
            expect(normalizeId('https://openalex.org/works/W123')).toBe('works/w123');
            expect(normalizeId('https://openalex.org/authors/A456')).toBe('authors/a456');
        });

        it('normalizes API URLs', () => {
            expect(normalizeId('https://api.openalex.org/works/W123')).toBe('works/w123');
            expect(normalizeId('https://api.openalex.org/W123')).toBe('works/w123');
        });

        it('normalizes openalex: prefix', () => {
            expect(normalizeId('openalex:W123')).toBe('works/w123');
            expect(normalizeId('openalex:a456')).toBe('authors/a456');
        });

        it('normalizes short native IDs', () => {
            expect(normalizeId('W123')).toBe('works/w123');
            expect(normalizeId('w123')).toBe('works/w123');
            expect(normalizeId('A456')).toBe('authors/a456');
            expect(normalizeId('I789')).toBe('institutions/i789');
            expect(normalizeId('S111')).toBe('sources/s111');
            expect(normalizeId('P222')).toBe('publishers/p222');
            expect(normalizeId('F333')).toBe('funders/f333');
            expect(normalizeId('C444')).toBe('concepts/c444');
            expect(normalizeId('T555')).toBe('topics/t555');
            expect(normalizeId('G666')).toBe('awards/g666');
        });

        it('normalizes already-namespaced IDs', () => {
            expect(normalizeId('works/w123')).toBe('works/w123');
            expect(normalizeId('authors/a456')).toBe('authors/a456');
            expect(normalizeId('sdgs/1')).toBe('sdgs/1');
            expect(normalizeId('types/article')).toBe('types/article');
        });

        it('normalizes external entity IDs', () => {
            expect(normalizeId('sdgs/1')).toBe('sdgs/1');
            expect(normalizeId('sdgs/3')).toBe('sdgs/3');
            expect(normalizeId('types/article')).toBe('types/article');
            expect(normalizeId('countries/us')).toBe('countries/us');
            expect(normalizeId('languages/en')).toBe('languages/en');
            expect(normalizeId('domains/1')).toBe('domains/1');
            expect(normalizeId('fields/12')).toBe('fields/12');
            expect(normalizeId('subfields/1234')).toBe('subfields/1234');
            expect(normalizeId('keywords/keyword123')).toBe('keywords/keyword123');
        });

        it('normalizes legacy SDG format', () => {
            expect(normalizeId('https://metadata.un.org/sdg/3')).toBe('sdgs/3');
            expect(normalizeId('https://metadata.un.org/sdg/1')).toBe('sdgs/1');
        });

        it('handles entity types with hyphens', () => {
            expect(normalizeId('source-types/journal')).toBe('source-types/journal');
            expect(normalizeId('institution-types/education')).toBe('institution-types/education');
            expect(normalizeId('oa-statuses/gold')).toBe('oa-statuses/gold');
        });

        it('handles case insensitivity', () => {
            expect(normalizeId('WORKS/W123')).toBe('works/w123');
            expect(normalizeId('Works/W123')).toBe('works/w123');
            expect(normalizeId('SDGS/1')).toBe('sdgs/1');
        });

        it('handles whitespace', () => {
            expect(normalizeId('  W123  ')).toBe('works/w123');
            expect(normalizeId('  works/w123  ')).toBe('works/w123');
        });

        it('returns null for invalid inputs', () => {
            expect(normalizeId(null)).toBe(null);
            expect(normalizeId(undefined)).toBe(null);
            expect(normalizeId('')).toBe(null);
            expect(normalizeId('random-string')).toBe(null);
            expect(normalizeId('invalid/entity/type')).toBe(null);
            expect(normalizeId('X123')).toBe(null); // X is not a valid prefix
            expect(normalizeId(123)).toBe(null); // Not a string
        });

        it('returns null for invalid entity types', () => {
            expect(normalizeId('notanentity/123')).toBe(null);
            expect(normalizeId('foobar/xyz')).toBe(null);
        });
    });

    describe('getEntityType', () => {
        it('extracts entity type from various formats', () => {
            expect(getEntityType('W123')).toBe('works');
            expect(getEntityType('https://openalex.org/W123')).toBe('works');
            expect(getEntityType('works/w123')).toBe('works');
            expect(getEntityType('sdgs/1')).toBe('sdgs');
            expect(getEntityType('types/article')).toBe('types');
        });

        it('returns null for invalid IDs', () => {
            expect(getEntityType('invalid')).toBe(null);
            expect(getEntityType(null)).toBe(null);
        });
    });

    describe('getShortId', () => {
        it('extracts short ID from various formats', () => {
            expect(getShortId('W123')).toBe('w123');
            expect(getShortId('https://openalex.org/W123')).toBe('w123');
            expect(getShortId('works/w123')).toBe('w123');
            expect(getShortId('sdgs/1')).toBe('1');
            expect(getShortId('types/article')).toBe('article');
        });

        it('returns null for invalid IDs', () => {
            expect(getShortId('invalid')).toBe(null);
            expect(getShortId(null)).toBe(null);
        });
    });

    describe('parseId', () => {
        it('parses native entity IDs', () => {
            const result = parseId('W123');
            expect(result).toEqual({
                entityType: 'works',
                shortId: 'w123',
                isNative: true,
                normalized: 'works/w123',
            });
        });

        it('parses external entity IDs', () => {
            const result = parseId('sdgs/1');
            expect(result).toEqual({
                entityType: 'sdgs',
                shortId: '1',
                isNative: false,
                normalized: 'sdgs/1',
            });
        });

        it('returns null for invalid IDs', () => {
            expect(parseId('invalid')).toBe(null);
            expect(parseId(null)).toBe(null);
        });
    });

    describe('idsAreEqual', () => {
        it('compares IDs in different formats', () => {
            expect(idsAreEqual('W123', 'w123')).toBe(true);
            expect(idsAreEqual('W123', 'https://openalex.org/W123')).toBe(true);
            expect(idsAreEqual('W123', 'works/w123')).toBe(true);
            expect(idsAreEqual('works/w123', 'https://openalex.org/works/W123')).toBe(true);
            expect(idsAreEqual('sdgs/1', 'https://metadata.un.org/sdg/1')).toBe(true);
        });

        it('returns false for different IDs', () => {
            expect(idsAreEqual('W123', 'W456')).toBe(false);
            expect(idsAreEqual('W123', 'A123')).toBe(false);
            expect(idsAreEqual('sdgs/1', 'sdgs/2')).toBe(false);
        });

        it('returns false for invalid IDs', () => {
            expect(idsAreEqual('W123', 'invalid')).toBe(false);
            expect(idsAreEqual('invalid', 'W123')).toBe(false);
            expect(idsAreEqual(null, 'W123')).toBe(false);
        });
    });

    describe('isValidId', () => {
        it('validates correct IDs', () => {
            expect(isValidId('W123')).toBe(true);
            expect(isValidId('works/w123')).toBe(true);
            expect(isValidId('https://openalex.org/W123')).toBe(true);
            expect(isValidId('sdgs/1')).toBe(true);
            expect(isValidId('types/article')).toBe(true);
        });

        it('rejects invalid IDs', () => {
            expect(isValidId('invalid')).toBe(false);
            expect(isValidId('X123')).toBe(false);
            expect(isValidId('')).toBe(false);
            expect(isValidId(null)).toBe(false);
        });
    });

    describe('isNativeEntityType', () => {
        it('identifies native entity types', () => {
            expect(isNativeEntityType('works')).toBe(true);
            expect(isNativeEntityType('authors')).toBe(true);
            expect(isNativeEntityType('institutions')).toBe(true);
            expect(isNativeEntityType('awards')).toBe(true);
        });

        it('identifies external entity types', () => {
            expect(isNativeEntityType('sdgs')).toBe(false);
            expect(isNativeEntityType('types')).toBe(false);
            expect(isNativeEntityType('countries')).toBe(false);
        });
    });

    describe('getNativePrefix', () => {
        it('returns prefix for native entities', () => {
            expect(getNativePrefix('works')).toBe('w');
            expect(getNativePrefix('authors')).toBe('a');
            expect(getNativePrefix('awards')).toBe('g');
        });

        it('returns null for external entities', () => {
            expect(getNativePrefix('sdgs')).toBe(null);
            expect(getNativePrefix('types')).toBe(null);
        });
    });

    describe('toApiUrl', () => {
        it('generates API URLs', () => {
            expect(toApiUrl('W123')).toBe('https://api.openalex.org/works/w123');
            expect(toApiUrl('works/w123')).toBe('https://api.openalex.org/works/w123');
            expect(toApiUrl('sdgs/1')).toBe('https://api.openalex.org/sdgs/1');
        });

        it('returns null for invalid IDs', () => {
            expect(toApiUrl('invalid')).toBe(null);
        });
    });

    describe('toOpenAlexUrl', () => {
        it('generates openalex.org URLs', () => {
            expect(toOpenAlexUrl('W123')).toBe('https://openalex.org/works/w123');
            expect(toOpenAlexUrl('works/w123')).toBe('https://openalex.org/works/w123');
            expect(toOpenAlexUrl('sdgs/1')).toBe('https://openalex.org/sdgs/1');
        });

        it('returns null for invalid IDs', () => {
            expect(toOpenAlexUrl('invalid')).toBe(null);
        });
    });

    describe('toDisplayFormat', () => {
        it('formats native IDs for short display', () => {
            expect(toDisplayFormat('works/w123', 'short')).toBe('W123');
            expect(toDisplayFormat('W123', 'short')).toBe('W123');
        });

        it('formats external IDs for short display (always namespaced)', () => {
            expect(toDisplayFormat('sdgs/1', 'short')).toBe('sdgs/1');
            expect(toDisplayFormat('types/article', 'short')).toBe('types/article');
        });

        it('formats for namespaced display', () => {
            expect(toDisplayFormat('W123', 'namespaced')).toBe('works/W123');
            expect(toDisplayFormat('sdgs/1', 'namespaced')).toBe('sdgs/1');
        });

        it('formats for full display', () => {
            expect(toDisplayFormat('W123', 'full')).toBe('https://openalex.org/W123');
            expect(toDisplayFormat('sdgs/1', 'full')).toBe('https://openalex.org/sdgs/1');
        });

        it('returns null for invalid IDs', () => {
            expect(toDisplayFormat('invalid', 'short')).toBe(null);
        });
    });

    describe('makeId', () => {
        it('creates normalized IDs', () => {
            expect(makeId('works', 'w123')).toBe('works/w123');
            expect(makeId('works', 'W123')).toBe('works/w123');
            expect(makeId('sdgs', '1')).toBe('sdgs/1');
            expect(makeId('types', 'article')).toBe('types/article');
        });

        it('returns null for invalid entity types', () => {
            expect(makeId('invalid', '123')).toBe(null);
        });

        it('returns null for empty short ID', () => {
            expect(makeId('works', '')).toBe(null);
            expect(makeId('works', null)).toBe(null);
        });
    });
});
