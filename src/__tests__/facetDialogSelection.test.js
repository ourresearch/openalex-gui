import { describe, it, expect } from 'vitest';
import {
    facetDialogSelection,
    applyFacetDialogSelection,
    filtersFromUrlStr,
    filtersAsUrlStr,
} from '../filterConfigs';

// oxjob #1942: the facet "More..." dialog on a collection-filtered field seeded
// the collection into its checklist and Apply wrote one clause,
// `topics.id:col_F9K8x52ngn|t12275|...`, which the API refuses with a 400
// ("mixes a collection reference"). Seen on openalex.org 2026-10-21.
const TOPICS = 'topics.id';
const COL = 'col_F9K8x52ngn';

const seed = (urlStr, key = TOPICS) =>
    facetDialogSelection(filtersFromUrlStr('works', urlStr), key);

const apply = (urlStr, selectedValues, key = TOPICS) =>
    filtersAsUrlStr(applyFacetDialogSelection({
        entityType: 'works',
        filterKey: key,
        currentFilters: filtersFromUrlStr('works', urlStr),
        selectedValues,
    }));

// The API's rule: a clause holds one collection and nothing else.
const mixesACollection = (urlStr) =>
    urlStr.split(',').some(clause => clause.includes('col_') && clause.includes('|'));

describe('facet More... dialog on a collection-filtered field (#1942)', () => {
    it('the 21 Oct case: picks go in their own clause and the collection stays', () => {
        expect(seed(`${TOPICS}:${COL}`)).toEqual([]);
        const out = apply(`${TOPICS}:${COL}`, ['t12275', 't11717']);
        expect(out).toBe(`${TOPICS}:${COL},${TOPICS}:t12275|t11717`);
        expect(mixesACollection(out)).toBe(false);
    });

    it('keeps the collection id case (collection ids are case-sensitive)', () => {
        expect(apply(`${TOPICS}:${COL}`, ['t1'])).toContain(COL);
    });

    it('edits the plain clause next to the collection, not the collection', () => {
        const url = `${TOPICS}:${COL},${TOPICS}:t1`;
        expect(seed(url)).toEqual(['t1']);
        expect(apply(url, ['t1', 't2'])).toBe(`${TOPICS}:${COL},${TOPICS}:t1|t2`);
    });

    it('unticking everything leaves the collection', () => {
        expect(apply(`${TOPICS}:${COL},${TOPICS}:t1`, [])).toBe(`${TOPICS}:${COL}`);
    });

    it('splits an old mixed clause (a link from before the fix) into legal clauses', () => {
        const url = `${TOPICS}:${COL}|t1`;
        expect(seed(url)).toEqual(['t1']);
        const out = apply(url, ['t1']);
        expect(out).toBe(`${TOPICS}:${COL},${TOPICS}:t1`);
        expect(mixesACollection(out)).toBe(false);
    });

    it('drops a collection id handed in as a pick', () => {
        expect(apply('', [COL, 't1'])).toBe(`${TOPICS}:t1`);
    });

    it('works the same for sources and institutions', () => {
        const SRC = 'primary_location.source.id';
        const INST = 'authorships.institutions.lineage';
        const srcOut = apply(`${SRC}:col_Abc123`, ['s137773608', 's3880285'], SRC);
        expect(srcOut).toBe(`${SRC}:col_Abc123,${SRC}:s137773608|s3880285`);
        const instOut = apply(`${INST}:col_Xyz789`, ['i136199984'], INST);
        expect(instOut).toBe(`${INST}:col_Xyz789,${INST}:i136199984`);
    });
});

describe('facet More... dialog: what it owns', () => {
    it('leaves a negated clause alone (it used to seed it as ticked and drop the "!")', () => {
        const url = `${TOPICS}:!t9,${TOPICS}:t1`;
        expect(seed(url)).toEqual(['t1']);
        expect(apply(url, ['t2'])).toBe(`${TOPICS}:!t9,${TOPICS}:t2`);
    });

    it('leaves other fields where they are', () => {
        const url = `publication_year:2020,${TOPICS}:${COL},type:article`;
        expect(apply(url, ['t1'])).toBe(`publication_year:2020,${TOPICS}:${COL},type:article,${TOPICS}:t1`);
    });

    it('without a collection, still collapses the field into one OR clause (unchanged)', () => {
        const url = `${TOPICS}:t1,${TOPICS}:t2`;
        expect(seed(url)).toEqual(['t1', 't2']);
        expect(apply(url, ['t1', 't2', 't3'])).toBe(`${TOPICS}:t1|t2|t3`);
        expect(apply(url, [])).toBe('');
    });
});
