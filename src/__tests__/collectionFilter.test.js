import { describe, it, expect } from 'vitest';
import { filterCollectionsForField, collectionMatchType, worksFieldsForCollectionType, collectionFilterLabel, derivedWorksMenu } from '../collectionFilter';
import { isCollectionId } from '../openalexId';
import { optionsFromString, filtersFromUrlStr, filtersAsUrlStr } from '../filterConfigs';

// oxjob #273 — cross-type collection filter. A user collection (`col_<base58>`)
// can be a value of any entity-ID field whose selected type matches the
// collection's entity_type. These cover the PURE decision logic.

const SOURCES_A = { id: 'col_AaAaAa1111', display_name: 'Elsevier journals', entity_type: 'sources', entity_count: 42, description: 'big publisher' };
const SOURCES_B = { id: 'col_BbBbBb2222', display_name: 'arXiv mirrors', entity_type: 'sources', entity_count: 7 };
const AUTHORS_A = { id: 'col_CcCcCc3333', display_name: 'My coauthors', entity_type: 'authors', entity_count: 3 };
const INSTS_A = { id: 'col_DdDdDd4444', display_name: 'R1 universities', entity_type: 'institutions', entity_count: 130 };

const ALL = [SOURCES_A, SOURCES_B, AUTHORS_A, INSTS_A];

describe('filterCollectionsForField — type matching', () => {
    it('returns only collections whose entity_type === selectType', () => {
        const out = filterCollectionsForField(ALL, 'sources');
        expect(out.map(c => c.value)).toEqual(['col_BbBbBb2222', 'col_AaAaAa1111']); // alpha sort
    });

    it('cross-type collections never leak (the API 400 is unreachable)', () => {
        const out = filterCollectionsForField(ALL, 'sources');
        expect(out.some(c => c.value === 'col_CcCcCc3333')).toBe(false); // authors
        expect(out.some(c => c.value === 'col_DdDdDd4444')).toBe(false); // institutions
    });

    it('returns [] when selectType has no matching collections', () => {
        expect(filterCollectionsForField(ALL, 'funders')).toEqual([]);
    });

    it('returns [] for a null/empty selectType (no tab for string-only fields)', () => {
        expect(filterCollectionsForField(ALL, null)).toEqual([]);
        expect(filterCollectionsForField(ALL, undefined)).toEqual([]);
    });

    it('tolerates null/empty collection lists', () => {
        expect(filterCollectionsForField(null, 'sources')).toEqual([]);
        expect(filterCollectionsForField([], 'sources')).toEqual([]);
        expect(filterCollectionsForField([null, undefined], 'sources')).toEqual([]);
    });
});

describe('collectionFilterLabel — "<Entity> is in collection" (oxjob #367)', () => {
    it('renders the per-SERP-entity membership phrase, sentence-cased', () => {
        expect(collectionFilterLabel('works')).toBe('Work is in collection');
        expect(collectionFilterLabel('authors')).toBe('Author is in collection');
        expect(collectionFilterLabel('sources')).toBe('Source is in collection');
        expect(collectionFilterLabel('institutions')).toBe('Institution is in collection');
    });

    it('keeps a proper-noun subject intact (SDG singular is already cased)', () => {
        expect(collectionFilterLabel('sdgs')).toBe('Sustainable Development Goal is in collection');
    });

    it('"collection" is always lowercase and never title-cased', () => {
        for (const t of ['works', 'authors', 'funders', 'publishers', 'keywords']) {
            const label = collectionFilterLabel(t);
            expect(label.endsWith(' is in collection')).toBe(true);
            expect(label).not.toMatch(/Collection|In |Is /); // no title-cased words after the subject
        }
    });

    it('falls back to the raw type when unknown', () => {
        expect(collectionFilterLabel('widgets')).toBe('Widgets is in collection');
        expect(collectionFilterLabel('')).toBe(' is in collection');
    });
});

describe('filterCollectionsForField — search', () => {
    it('filters by display_name (case-insensitive substring)', () => {
        const out = filterCollectionsForField(ALL, 'sources', 'elsev');
        expect(out.map(c => c.value)).toEqual(['col_AaAaAa1111']);
    });

    it('filters by description too', () => {
        const out = filterCollectionsForField(ALL, 'sources', 'publisher');
        expect(out.map(c => c.value)).toEqual(['col_AaAaAa1111']);
    });

    it('empty/whitespace search returns all matching', () => {
        expect(filterCollectionsForField(ALL, 'sources', '   ').length).toBe(2);
        expect(filterCollectionsForField(ALL, 'sources', '').length).toBe(2);
    });

    it('non-matching search returns []', () => {
        expect(filterCollectionsForField(ALL, 'sources', 'zzz')).toEqual([]);
    });
});

describe('filterCollectionsForField — sort + shape', () => {
    it('sorts alphabetically by display_name, case-insensitive', () => {
        const out = filterCollectionsForField(ALL, 'sources');
        expect(out.map(c => c.displayValue)).toEqual(['arXiv mirrors', 'Elsevier journals']);
    });

    it('emits suggestion shape carrying isCollection + entityCount', () => {
        const out = filterCollectionsForField(ALL, 'sources', 'elsev');
        expect(out[0]).toEqual({
            value: 'col_AaAaAa1111',
            displayValue: 'Elsevier journals',
            entityCount: 42,
            isCollection: true,
        });
    });
});

describe('collectionMatchType', () => {
    it('maps the dedicated `collection` field to the SERP entity type', () => {
        expect(collectionMatchType('works', 'collection')).toBe('works');
        expect(collectionMatchType('authors', 'collection')).toBe('authors');
    });

    it('maps a regular entity-ID field to its entityToSelect', () => {
        // primary_location.source.id selects sources
        expect(collectionMatchType('works', 'primary_location.source.id')).toBe('sources');
    });

    it('returns null for an unknown/string-only field', () => {
        expect(collectionMatchType('works', 'this.is.not.a.field')).toBeNull();
    });
});

describe('worksFieldsForCollectionType (#356 hub "Show works by …")', () => {
    const keys = t => worksFieldsForCollectionType(t).map(f => f.key);

    it('sources → the source-ID works fields, primary first', () => {
        // #573 strict-parity facets added best_oa_location.source.id
        expect(keys('sources')).toEqual([
            'primary_location.source.id',
            'locations.source.id',
            'best_oa_location.source.id',
        ]);
    });

    it('institutions → lineage (broadest) before corresponding', () => {
        expect(keys('institutions')).toEqual([
            'authorships.institutions.lineage',
            'corresponding_institution_ids',
        ]);
    });

    it('authors → author + corresponding author', () => {
        expect(keys('authors')).toEqual([
            'authorships.author.id',
            'corresponding_author_ids',
        ]);
    });

    it('single-field types resolve to their one works field', () => {
        expect(keys('funders')).toEqual(['funders.id']);
        expect(keys('publishers')).toEqual(['primary_location.source.publisher_lineage']);
        // #573: topics.id (any topic) joined primary_topic.id
        expect(keys('topics')).toEqual(['primary_topic.id', 'topics.id']);
        expect(keys('keywords')).toEqual(['keywords.id']);
    });

    it('excludes same-type but non-ID fields (.issn / .ror / source type)', () => {
        expect(keys('sources')).not.toContain('primary_location.source.issn');
        expect(keys('sources')).not.toContain('primary_location.source.type');
        expect(keys('institutions')).not.toContain('authorships.institutions.ror');
    });

    it('carries a human displayName for the menu label', () => {
        const f = worksFieldsForCollectionType('sources')[0];
        expect(f).toEqual({ key: 'primary_location.source.id', displayName: 'source' });
    });

    it('returns [] for null/empty', () => {
        expect(worksFieldsForCollectionType(null)).toEqual([]);
        expect(worksFieldsForCollectionType('')).toEqual([]);
    });
});

describe('derivedWorksMenu — collection homepage launcher (oxjob #366)', () => {
    it('works-collection collapses to a single "View as full search" (no fields)', () => {
        const m = derivedWorksMenu({ id: 'col_W111', entity_type: 'works' });
        expect(m.isWorksCollection).toBe(true);
        expect(m.fullSearchUrl).toBe('/works?filter=collection:col_W111');
        expect(m.fields).toEqual([]);
    });

    it('typed (institutions) → role dropdown, lineage before corresponding, capitalised labels', () => {
        const m = derivedWorksMenu({ id: 'col_DdDdDd4444', entity_type: 'institutions' });
        expect(m.isWorksCollection).toBe(false);
        expect(m.entityPlural).toBe('institutions');
        expect(m.fields).toEqual([
            { key: 'authorships.institutions.lineage', label: 'Institution', to: '/works?filter=authorships.institutions.lineage:col_DdDdDd4444' },
            { key: 'corresponding_institution_ids', label: 'Corresponding institution', to: '/works?filter=corresponding_institution_ids:col_DdDdDd4444' },
        ]);
    });

    it('typed (sources) → the source-ID fields, primary first', () => {
        const m = derivedWorksMenu({ id: 'col_S222', entity_type: 'sources' });
        // #573 strict-parity facets added best_oa_location.source.id
        expect(m.fields.map(f => f.key)).toEqual([
            'primary_location.source.id',
            'locations.source.id',
            'best_oa_location.source.id',
        ]);
        expect(m.fields[0].to).toBe('/works?filter=primary_location.source.id:col_S222');
    });

    it('always exposes a fullSearchUrl even for typed collections', () => {
        const m = derivedWorksMenu({ id: 'col_S222', entity_type: 'sources' });
        expect(m.fullSearchUrl).toBe('/works?filter=collection:col_S222');
    });

    it('tolerates a null/empty collection', () => {
        const m = derivedWorksMenu(null);
        expect(m.fields).toEqual([]);
        expect(m.isWorksCollection).toBe(false);
    });
});

describe('isCollectionId', () => {
    it('detects col_ ids case-insensitively', () => {
        expect(isCollectionId('col_AbCd123xyz')).toBe(true);
        expect(isCollectionId('COL_AbCd')).toBe(true);
        expect(isCollectionId(' col_AbCd ')).toBe(true);
    });

    it('rejects non-collection values', () => {
        expect(isCollectionId('W123')).toBe(false);
        expect(isCollectionId('sources/s123')).toBe(false);
        expect(isCollectionId('collection')).toBe(false);
        expect(isCollectionId(null)).toBe(false);
        expect(isCollectionId(undefined)).toBe(false);
        expect(isCollectionId(123)).toBe(false);
    });
});

describe('case-sensitivity — col_ ids survive the URL read path', () => {
    it('optionsFromString preserves collection-id case but lowercases entity ids', () => {
        expect(optionsFromString('col_AbCdEf1234')).toEqual(['col_AbCdEf1234']);
        expect(optionsFromString('S123ABC')).toEqual(['s123abc']);
    });

    it('a collection ref under a regular field key round-trips case-preserved', () => {
        // cross-type: a sources-collection as the value of primary_location.source.id
        const url = 'primary_location.source.id:col_AbCdEf1234';
        const filters = filtersFromUrlStr('works', url);
        expect(filters[0].value).toBe('col_AbCdEf1234');
        expect(filtersAsUrlStr(filters)).toBe(url);
    });

    it('negated collection ref round-trips (field:!col_xxx)', () => {
        const url = 'primary_location.source.id:!col_AbCdEf1234';
        const filters = filtersFromUrlStr('works', url);
        expect(filters[0].value).toBe('col_AbCdEf1234');
        expect(filters[0].isNegated).toBe(true);
        expect(filtersAsUrlStr(filters)).toBe(url);
    });
});
