import { describe, it, expect } from 'vitest';
import { normalizeCollection } from '../collectionShape.js';
import * as openalexId from '../openalexId';

// oxjob #1524: the API's collection `id` is a URL and its dates are
// created_date/updated_date; the website keys everything by the short col_x.
describe('normalizeCollection', () => {
    it('shortens the URL id and keeps the new date fields', () => {
        const out = normalizeCollection({
            id: 'https://openalex.org/collections/col_AbCd123xyz',
            display_name: 'UC journals',
            created_date: '2026-10-03',
            updated_date: '2026-10-03T12:00:00.123456',
            member_count: 3,
        });
        expect(out.id).toBe('col_AbCd123xyz');
        expect(out.created_date).toBe('2026-10-03');
        expect(out.updated_date).toBe('2026-10-03T12:00:00.123456');
        expect(out.member_count).toBe(3);
    });

    it('reads the older shape (bare id, created_at/updated_at) the same way', () => {
        const out = normalizeCollection({
            id: 'col_AbCd123xyz',
            created_at: '2026-10-02T15:00:00.5',
            updated_at: '2026-10-03T01:00:00',
        });
        expect(out).toEqual({
            id: 'col_AbCd123xyz', created_date: '2026-10-02', updated_date: '2026-10-03T01:00:00',
        });
    });

    it('passes non-objects through', () => {
        expect(normalizeCollection(null)).toBe(null);
        expect(normalizeCollection(undefined)).toBe(undefined);
    });
});

describe('location ids as collection members', () => {
    it('toCollectionEntityId keeps a location id verbatim', () => {
        expect(openalexId.toCollectionEntityId('locations/doi:10.7717/peerj.4375')).toBe('doi:10.7717/peerj.4375');
        expect(openalexId.toCollectionEntityId('locations/pmh:oai:arXiv.org:cond-mat/0404022'))
            .toBe('pmh:oai:arXiv.org:cond-mat/0404022');
    });
});
