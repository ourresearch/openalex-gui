import { describe, it, expect } from 'vitest';
import {
    widgetBaseFilters,
    applyFacetDialogSelection,
    facetDialogSelection,
    createSimpleFilter,
    filtersFromUrlStr,
    filtersAsUrlStr,
} from '../filterConfigs';

// oxjob #1086. A sidebar widget (GroupBy.vue) on an entity page gets the page's
// own works filter in `filterBy`; the URL has no ?filter=. Its "More..." dialog
// and its OA chart built on the URL alone, so a click lost the entity:
//   ZD 8363: author page, year "More...", tick 1951 -> every 1951 work in OpenAlex
//   ZD 2837: source page, OA chart -> every OA work in OpenAlex (chart since removed;
//            the donut path stays guarded)
//   ZD 8768: institution page, work type "More..." (same dialog)
const authorPage = [createSimpleFilter('works', 'authorships.author.id', 'A5017453014')];
const sourcePage = [createSimpleFilter('works', 'primary_location.source.id', 'S2765070212')];
const institutionPage = [createSimpleFilter('works', 'authorships.institutions.lineage', 'I4210085968')];

// What GroupBy.applySelections pushes.
const applyDialog = ({ isEntityPage, filterBy, routeUrlStr, filterKey, picks }) =>
    filtersAsUrlStr(applyFacetDialogSelection({
        entityType: 'works',
        filterKey,
        currentFilters: widgetBaseFilters({
            isEntityPage,
            filterBy,
            routeFilters: filtersFromUrlStr('works', routeUrlStr),
        }),
        selectedValues: picks,
    }));

describe('entity-page widgets keep the entity (oxjob #1086)', () => {
    it('ZD 8363: a year ticked in an author page "More..." list stays on the author', () => {
        expect(applyDialog({
            isEntityPage: true, filterBy: authorPage, routeUrlStr: undefined,
            filterKey: 'publication_year', picks: ['1951'],
        })).toBe('authorships.author.id:a5017453014,publication_year:1951');
    });

    it('two years OR inside one clause, still on the author', () => {
        expect(applyDialog({
            isEntityPage: true, filterBy: authorPage, routeUrlStr: undefined,
            filterKey: 'publication_year', picks: ['1951', '1960'],
        })).toBe('authorships.author.id:a5017453014,publication_year:1951|1960');
    });

    it('ZD 8768 page: a work type picked on an institution page stays on the institution', () => {
        expect(applyDialog({
            isEntityPage: true, filterBy: institutionPage, routeUrlStr: undefined,
            filterKey: 'type', picks: ['book-chapter'],
        })).toBe('authorships.institutions.lineage:i4210085968,type:book-chapter');
    });

    it('ZD 2837: an OA donut on a source page opens the source\'s OA works', () => {
        // What GroupBy's isSelected setter pushes on an entity page.
        const base = widgetBaseFilters({ isEntityPage: true, filterBy: sourcePage, routeFilters: [] });
        const out = filtersAsUrlStr([...base, createSimpleFilter('works', 'open_access.is_oa', true)]);
        expect(out).toBe('primary_location.source.id:s2765070212,open_access.is_oa:true');
    });

    it('a search page still builds on the URL filters (unchanged)', () => {
        expect(applyDialog({
            isEntityPage: false, filterBy: undefined,
            routeUrlStr: 'authorships.author.id:a5017453014,type:types/article',
            filterKey: 'publication_year', picks: ['2020'],
        })).toBe('authorships.author.id:a5017453014,type:article,publication_year:2020');
    });

    it('does not mutate filterBy', () => {
        const filterBy = [...authorPage];
        const base = widgetBaseFilters({ isEntityPage: true, filterBy, routeFilters: [] });
        base.push(createSimpleFilter('works', 'publication_year', '1951'));
        expect(filterBy).toHaveLength(1);
    });

    it('the dialog opens with nothing ticked on an entity page', () => {
        const base = widgetBaseFilters({ isEntityPage: true, filterBy: authorPage, routeFilters: [] });
        expect(facetDialogSelection(base, 'publication_year')).toEqual([]);
    });
});
