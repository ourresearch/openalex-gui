// oxjob #1689: record-page SSR routing (src/ssr/recordRoutes.js).
import { describe, it, expect } from 'vitest';
import {
    RECORD_TYPES, RECORD_TYPE_NAMES, parseRecordPath, isUnderRecordPrefix, pathFromApiId,
    worksListPlan, worksListApiPath, trimWorkForList, trimWorksList, WORKS_LIST_PER_PAGE, canonicalRecordId,
} from '@/ssr/recordRoutes';

import { getEntityConfigs, urlPartsFromId } from '@/entityConfigs';

describe('parseRecordPath', () => {
    it('parses long forms and canonicalizes id case', () => {
        expect(parseRecordPath('/works/W2741809807')).toMatchObject({
            type: 'works', id: 'W2741809807', apiPath: 'works/W2741809807', canonicalPath: '/works/W2741809807', isShortForm: false,
        });
        expect(parseRecordPath('/authors/a5023888391').canonicalPath).toBe('/authors/A5023888391');
        expect(parseRecordPath('/countries/us').canonicalPath).toBe('/countries/US');
        expect(parseRecordPath('/continents/q15').canonicalPath).toBe('/continents/Q15');
        expect(parseRecordPath('/keywords/Machine-Learning').canonicalPath).toBe('/keywords/machine-learning');
        expect(parseRecordPath('/fields/17').canonicalPath).toBe('/fields/17');
        expect(parseRecordPath('/works/W123/').canonicalPath).toBe('/works/W123');
    });

    it('parses short forms', () => {
        expect(parseRecordPath('/W123')).toMatchObject({ type: 'works', canonicalPath: '/works/W123', isShortForm: true });
        expect(parseRecordPath('/a5023888391')).toMatchObject({ type: 'authors', canonicalPath: '/authors/A5023888391' });
        expect(parseRecordPath('/g123').type).toBe('awards');
        expect(parseRecordPath('/c41008148').type).toBe('concepts');
    });

    it('rejects anything that is not a valid record id, so it never reaches the API', () => {
        for (const p of [
            '/works', '/works/', '/works/A123', '/works/W123x', '/works/W123/extra', '/works/doi:10.1/x',
            '/works/W123%2F..', '/keywords/a%2Fb', '/keywords/kelp?x', '/keywords/a b', '/fields/abc',
            '/countries/usa', '/sdgs/123', '/locations/doi:10.1/x', '/settings/profile', '/', '/x123',
            '/__proto__/x', '/constructor/x', '/works/W' + '1'.repeat(16), '/keywords/' + 'a'.repeat(81),
        ]) {
            expect(parseRecordPath(p), p).toBeNull();
        }
    });

    it('flags rejected paths under a record prefix (served as the SPA shell)', () => {
        expect(isUnderRecordPrefix('/works/W123/extra')).toBe(true);
        expect(isUnderRecordPrefix('/keywords/a%2Fb')).toBe(true);
        expect(isUnderRecordPrefix('/works')).toBe(false);
        expect(isUnderRecordPrefix('/settings/x')).toBe(false);
    });
});

describe('canonical links', () => {
    it('writes record ids the way record URLs canonicalize them (no 301 per internal link)', () => {
        expect(canonicalRecordId('works', 'w123')).toBe('W123');
        expect(canonicalRecordId('countries', 'us')).toBe('US');
        expect(canonicalRecordId('keywords', 'machine-learning')).toBe('machine-learning');
        expect(canonicalRecordId('locations', 'doi:10.1/X')).toBe('doi:10.1/X');
        // filters.js entityPageTarget (every record link) uses the same helper.
        expect(urlPartsFromId('authors/a5023888391')).toEqual({ entityType: 'authors', entityId: 'A5023888391' });
        expect(urlPartsFromId('https://openalex.org/W2741809807')).toEqual({ entityType: 'works', entityId: 'W2741809807' });
    });
});

describe('pathFromApiId', () => {
    it('maps API ids to canonical page paths', () => {
        expect(pathFromApiId('https://openalex.org/W2741809807')).toBe('/works/W2741809807');
        expect(pathFromApiId('https://openalex.org/T13607')).toBe('/topics/T13607');
        expect(pathFromApiId('https://openalex.org/F4320311904')).toBe('/funders/F4320311904');
        expect(pathFromApiId('https://openalex.org/keywords/machine-learning')).toBe('/keywords/machine-learning');
        expect(pathFromApiId('https://openalex.org/countries/US')).toBe('/countries/US');
        expect(pathFromApiId('https://openalex.org/continents/Q15')).toBe('/continents/Q15');
        expect(pathFromApiId('https://openalex.org/fields/17')).toBe('/fields/17');
    });
    it('returns null for anything else', () => {
        expect(pathFromApiId(null)).toBeNull();
        expect(pathFromApiId('https://example.com/W1')).toBeNull();
        expect(pathFromApiId('https://openalex.org/settings/x')).toBeNull();
    });
});

describe('works list', () => {
    it('uses the same works filter as the entity configs (EntityPage list in the browser)', () => {
        const configs = Object.fromEntries(getEntityConfigs().map((c) => [c.name, c]));
        for (const t of RECORD_TYPE_NAMES) {
            if (t === 'works') continue;
            expect(RECORD_TYPES[t].filterKey, t).toBe(configs[t].filterKey);
        }
        // Every entity-page type in the router is covered, except locations (stay SPA).
        const routed = getEntityConfigs().filter((c) => c.hasSerp !== false).map((c) => c.name);
        expect(routed.filter((t) => !RECORD_TYPE_NAMES.includes(t))).toEqual(['locations']);
    });

    it('plans a fixed-shape list', () => {
        expect(worksListPlan('works', null)).toBeNull();
        expect(worksListPlan('authors', null)).toEqual({ filterKey: 'authorships.author.id', sort: 'cited_by_count:desc' });
        expect(worksListPlan('awards', null).sort).toBe('publication_year:desc');
        expect(worksListPlan('sources', { type: 'repository' }).filterKey).toBe('locations.source.id');
        expect(worksListPlan('sources', { type: 'journal' }).filterKey).toBe('primary_location.source.id');
        const path = worksListApiPath(worksListPlan('authors', null), 'A5023888391');
        expect(path).toBe(`works?filter=authorships.author.id:A5023888391&sort=cited_by_count:desc&per_page=${WORKS_LIST_PER_PAGE}&select=id,display_name,publication_year,authorships,primary_location,cited_by_count,best_oa_location`);
        expect(path).not.toMatch(/group_by|group-by/);
    });

    it('trims each work to what a list row shows', () => {
        const w = {
            id: 'https://openalex.org/W1', display_name: 'T', publication_year: 2020, cited_by_count: 5,
            abstract_inverted_index: { a: [0] },
            authorships: [1, 2, 3, 4].map((i) => ({ raw_author_name: `R${i}`, author: { id: `A${i}`, display_name: `N${i}`, orcid: 'x' }, institutions: [{}] })),
            primary_location: { source: { id: 'S1', display_name: 'J', issn: ['x'] }, landing_page_url: 'u' },
            best_oa_location: { pdf_url: 'p', license: 'cc-by' },
        };
        const t = trimWorkForList(w);
        expect(t.authorships).toHaveLength(3);
        expect(t.authorships[0]).toEqual({ raw_author_name: 'R1' });
        expect(trimWorkForList({ authorships: [{ author: { display_name: 'N' } }, {}] }).authorships)
            .toEqual([{ raw_author_name: 'N' }, { raw_author_name: 'Unknown author' }]);
        expect(t.primary_location).toEqual({ source: { display_name: 'J' } });
        expect(t.best_oa_location).toEqual({ pdf_url: 'p' });
        expect(t.abstract_inverted_index).toBeUndefined();
        expect(trimWorksList({ meta: { count: 99 }, results: [w] }).meta).toEqual({ count: 99, page: 1, per_page: 25 });
        expect(trimWorksList({ error: 'x' })).toBeNull();
    });
});
