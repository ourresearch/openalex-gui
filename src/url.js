import router from "./router";
import store from "./store";
import {
    filtersAsUrlStr,
    filtersFromUrlStr,
    splitFilterString,
    createSimpleFilter,
    deleteOptionFromFilterValue,
    optionsFromString,
    addOptionToFilterValue,
    toggleOptionIsNegated,
    getMatchModeFromSelectFilterValue,
    optionsToString,
} from "./filterConfigs";
import {getEntityConfig} from "@/entityConfigs";
import * as openalexId from "@/openalexId";
import {getActionConfig, getActionDefaultsStr, getActionDefaultValues} from "@/actionConfigs";
import {getFacetConfig} from "@/facetConfigUtils";
import {urlBase} from "@/apiConfig";
import {oqlForUrl} from "@/oqlSerialize";


const urlObjectFromSearchUrl = function (searchUrl) {
    const query = Object.fromEntries(new URL(searchUrl).searchParams);
    const entityType = "works" // hardcoded for now
    return {
        name: "Serp",
        params: {
            entityType,
        },
        query,
    }
}


const pushSearchUrlToRoute = async function (router, searchUrl) {
    await pushToRoute(router, urlObjectFromSearchUrl(searchUrl))
}


// Convert an OXURL form (e.g. "/works?filter=type:article&sort=…", as returned
// in meta.x_query.url) into a Serp route object. Unlike urlObjectFromSearchUrl,
// this reads the entity type from the path so OQL targeting authors/sources/etc.
// lands on the right entity page. Returns null for an empty/invalid oxurl.
// (oxjob #373)
const routeFromOxurl = function (oxurl) {
    if (!oxurl) return null;
    try {
        const parsed = new URL(oxurl, urlBase.api);
        const entityType = parsed.pathname.split('/').filter(Boolean)[0] || 'works';
        const query = Object.fromEntries(parsed.searchParams);
        return {
            name: "Serp",
            params: {entityType},
            query,
        };
    } catch (e) {
        return null;
    }
}


// #378 C1+C2: the SINGLE source for basic-chip DISPLAY and EDIT-BASE.
//
// The server is the source of truth for query *meaning*: every entity response
// carries a canonical `meta.x_query.url` (the same flat oxurl, re-rendered from
// the parsed OQO — clauses reordered, ranges collapsed, options sorted). Once a
// response for THIS query has landed we hydrate chips from that canonical url
// instead of the raw `route.query.filter`, so the chips reflect the server's
// interpretation (and the differential V1 gate proves the two agree).
//
// While a request is in flight — optimistic chip edits and first paint — there
// is no settled response yet, so we fall back to the route filter. Display AND
// edit-base both read this one helper: the server may reorder clauses, so chip
// edit-by-index is only safe if both sides see the same ordering.
//
// Search-strip: the server folds a top-level `?search=` into x_query.url as a
// `default.search:…` clause (and drops scoped `search.title=…`). Search is a
// top-level route param and is never a chip (`facetTypeToChipType('search')`
// → null), so we strip search-typed clauses here — otherwise the edit base
// would re-serialize a folded search back into `?filter=`, yanking it out of
// the search box. See EXPLORE.md §"search-folding nuance".
const stripSearchClauses = function (filterStr) {
    if (!filterStr) return filterStr;
    const kept = splitFilterString(filterStr).filter(clause => {
        let key = clause.split(":")[0];
        if (key.startsWith("!")) key = key.slice(1);
        return key !== "search" && !key.endsWith(".search");
    });
    return kept.join(",");
}

const chipFilterStr = function (currentRoute) {
    const routeFilter = currentRoute?.query?.filter;
    // Only trust x_query once the response for the current query has settled.
    if (store.state.isLoading) return routeFilter;
    const xqUrl = store.state.resultsObject?.meta?.x_query?.url;
    if (!xqUrl) return routeFilter;
    const xqRoute = routeFromOxurl(xqUrl);
    if (!xqRoute) return routeFilter;
    // Entity guard: don't hydrate (e.g.) works chips from a stale authors
    // response while a cross-entity navigation is mid-flight. Compare against the
    // EFFECTIVE entity (entityTypeForRoute), not route.params.entityType — the latter
    // is undefined on the entity-less `/q?oql=` route, which made this guard always
    // fail there and silently return the empty URL filter, so Basic chips never
    // hydrated for an `?oql=` query (#492 Phase 3). entityTypeForRoute resolves the
    // oql query's entity via store.state.entityType.
    if (xqRoute.params.entityType !== entityTypeForRoute(currentRoute)) return routeFilter;
    return stripSearchClauses(xqRoute.query.filter) || undefined;
}


// Entity type for the current query. On the `/:entityType` route it's the path
// param; on the entity-less `/q` OQL route there's no path param (the OQL declares
// the entity), so fall back to the store — which Serp.vue sets from the executed
// query's `meta.x_query.oqo.get_rows`. Then 'works'. (oxjob #373 Phase 2)
const entityTypeForRoute = function (route) {
    return route?.params?.entityType || store.state.entityType || "works";
}


const addToQuery = function (oldQuery, k, v) {
    const newQuery = {...oldQuery}
    newQuery[k] = v
    return newQuery
}


const pushQueryParam = function (key, value) {
    const query = {
        ...router.currentRoute.value.query,
        [key]: value,
    }
    pushToRoute(router, {
        name: "Serp",
        query,
    })
}


const replaceQueryParam = function (key, value) {
    const query = {
        ...router.currentRoute.value.query,
        [key]: value,
    }
    replaceToRoute(router, {
        name: "Serp",
        query,
    })
}


// Persistent params that should be preserved across navigation
const persistentParams = [
    ['ui', 'uiVariant'], 
    ['elastic', 'useElasticForAnalytics'], 
    ['data-version', 'useV2']
];

// Helper to add persistent params from store to a route
const addPersistentParams = function(route) {
    const enrichedRoute = {
        ...route,
        query: route.query || {}
    };
    
    // Remove legacy v2 parameter if it exists
    delete enrichedRoute.query.v2;
    
    const currentQuery = router.currentRoute.value.query;
    
    persistentParams.forEach(([param, stateProp]) => {
        const val = store.state[stateProp];
        
        // Special handling for data-version: should be "2" when true
        if (param === 'data-version' && val === true) {
            enrichedRoute.query[param] = '2';
        }
        // Only add if: (1) value is boolean true, OR (2) param already exists in current URL
        // Check for both data-version and legacy v2 param
        else if (val === true || currentQuery[param] !== undefined || (param === 'data-version' && currentQuery.v2 !== undefined)) {
            if (val) {
                enrichedRoute.query[param] = val;
            }
        }
    });
    
    return enrichedRoute;
}

const pushToRoute = async function (router, newRoute) {
    const enrichedRoute = addPersistentParams(newRoute);
    return await router.push(enrichedRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}


const replaceToRoute = async function (router, newRoute) {
    const enrichedRoute = addPersistentParams(newRoute);
    return await router.replace(enrichedRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}


const setPage = async function (page) {
    const route = router.currentRoute.value
    const query = {
        ...route.query,
        page
    }
    // `per_page` rides along only on deep pages (page > 1) so page-1 URLs stay
    // clean. This makes a shared deep-page link unambiguous about which results
    // it shows (in either list or table view).
    if (page && page > 1) {
        query.per_page = getPerPage()
    } else {
        delete query.per_page
    }
    return pushToRoute(router, {
        name: "Serp",
        query
    })
}


const setShowApi = function (val) {
    pushQueryParam("show_api", val)
}


const setHideResults = function (val) {
    const urlVal = val ? true : undefined
    pushQueryParam("hide_results", urlVal)
}


// #492 Phase 3: the current query's NON-filter clauses (search.*, sort) — needed to
// re-translate a Basic chip edit to OQL without dropping them. In OQL mode the URL
// only carries ?oql=, so recover them from the settled response's canonical
// x_query.url (the OXURL form of the running query). Drops `filter` (the edit replaces
// it) and paging chrome (an edit resets to page 1).
const nonFilterClausesFromCanonical = function () {
    const xqUrl = store.state.resultsObject?.meta?.x_query?.url
    if (!xqUrl) return {}
    const r = routeFromOxurl(xqUrl)
    if (!r) return {}
    // eslint-disable-next-line no-unused-vars
    const { filter, page, per_page, ...rest } = r.query || {}
    return rest
}

const pushNewFilters = async function (newFilters, entityType) {
    const filter = (newFilters.length) ?
        filtersAsUrlStr(newFilters) :
        undefined

    if (!entityType) {
         entityType = entityTypeForRoute(router.currentRoute.value)
    }

    // #492 Phase 3: in canonical-OQL mode (oql flag + ?oql= URL) a Basic chip edit must
    // NOT downgrade the URL to ?filter=. Translate the new flat filter set + the current
    // query's search/sort clauses to OQL via the /query service (a store action — url.js
    // can't import api, the api⇄url cycle), then run it on the canonical ?oql= route. A
    // filter add/remove is a back-worthy new query → push. Falls back to the legacy
    // ?filter= push if the translate fails (safe — a Basic-representable query
    // round-trips losslessly through OXURL).
    const inOqlMode = !!store.getters?.featureFlags?.['oql'] && !!router.currentRoute.value?.query?.oql
    if (inOqlMode) {
        const oql = await store.dispatch('translateFiltersToOql', {
            entityType,
            filter,
            query: nonFilterClausesFromCanonical(),
        })
        if (oql) {
            return pushToRoute(router, { name: "OqlQuery", query: { oql: oqlForUrl(oql) } })
        }
    }

    const query = {
        ...router.currentRoute.value.query,
        page: 1,
        filter,
    }
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query
    }
    return pushToRoute(router, newRoute)
}


const createFilter = async function (entityType, key, newValue) {
    const newFilters = createFilterNoPush(entityType, key, newValue)
    return await pushNewFilters(newFilters, entityType)
}


const createFilterNoPush = function (entityType, key, newValue) {
    const oldFilters = filtersFromUrlStr(entityType, chipFilterStr(router.currentRoute.value))
    // console.log("createFilterNoPush oldFilters")
    // console.log(oldFilters)
    const newFilter = createSimpleFilter(entityType, key, newValue)
    return [...oldFilters, newFilter]
}


const readFilter = function (currentRoute, entityType, index) {
    return filtersFromUrlStr(entityType, chipFilterStr(currentRoute))[index]
}


const readFilters = function (currentRoute, isNegatedOnly = false) {
    const filters = filtersFromUrlStr(
        currentRoute.params.entityType,
        chipFilterStr(currentRoute)
    )
    return isNegatedOnly ?
        filters.filter(f => f.value[0] === "!") :
        filters
}


const readFiltersLength = function () {
    return filtersFromUrlStr(
        router.currentRoute.value.params.entityType,
        chipFilterStr(router.currentRoute.value),
    ).length
}


const readFilterValue = function (currentRoute, entityType, index) {
    return readFilter(currentRoute, entityType, index)?.value
}


const isFilterApplied = function (currentRoute, entityType, index) {
    const filterValue = readFilterValue(currentRoute, entityType, index)
    console.log("isFilterApplied entity: " + entityType + ", index: " + index + ", fiterValue: " + filterValue)
    return filterValue !== "" && filterValue !== undefined && filterValue !== null
}


const isFilterKeyApplied = function (currentRoute, entityType, filterKey) {
    const myFilters = readFilters(currentRoute)
    const myFilterKeys = myFilters.map(f => f.key)
    return myFilterKeys.includes(filterKey)
}


const isSearchFilterApplied = function (currentRoute) {
    // Check for top-level search params
    if (searchParamKeys.some(k => currentRoute.query?.[k])) {
        return true
    }
    // Check for legacy filter-based search
    return currentRoute.query?.filter?.split(",")?.some(f => {
        return f.split(":")[0]?.indexOf(".search") > -1
    })
}

const isFilterKeyAvailableToCreate = function (currentRoute, entityType, filterKey) {
    // `collection` is single-only (oxjob #228): max one collection: filter per request.
    if (filterKey === 'collection') {
        return !isFilterKeyApplied(currentRoute, entityType, filterKey)
    }
    const config = getFacetConfig(entityType, filterKey)
    return (config.type === "selectEntity") ?
        true : // you can always make more select filters
        !isFilterKeyApplied(currentRoute, entityType, filterKey) // if it's applied, you should edit not create

}


const updateFilter = async function (entityType, index, newValue, isNegated) {
    console.log("url.updateFilter", entityType, index, newValue, isNegated)
    const filters = filtersFromUrlStr(entityType, chipFilterStr(router.currentRoute.value))
    filters[index] = createSimpleFilter(
        entityType,
        filters[index].key,
        newValue,
        isNegated,
    )

    // const filterKey = filters[index].filterKey
    // filters[index] = createSimpleFilter(
    //         entityType,
    //         filterKey,
    //         newValue
    //     )
    return await pushNewFilters(filters)
}


const deleteFilterOption = async function (entityType, index, optionToDelete) {
    console.log("url.deleteFilterOption", entityType, index, optionToDelete)

    const filters = readFilters(router.currentRoute.value)
    const myFilter = readFilter(router.currentRoute.value, entityType, index)
    const isMyFilterNegated = readIsFilterNegated(router.currentRoute.value, entityType, index)

    const myFilterKey = myFilter.key
    const myFilterValue = myFilter.value

    const newValue = deleteOptionFromFilterValue(myFilterValue, optionToDelete)
    newValue ?
        filters[index] = createSimpleFilter(
            entityType,
            myFilterKey,
            newValue,
            isMyFilterNegated
        ) :
        filters.splice(index, 1)
    return await pushNewFilters(filters)
}


const deleteFilterOptionByKey = async function (entityType, filterKey, optionToDelete) {
    console.log("url.deleteFilterOptionByKey", entityType, filterKey, optionToDelete)
    const filters = readFilters(router.currentRoute.value)
    const newFilters = filters
        .map(f => {
            // Only touch the filter we're actually editing. Previously this
            // re-serialized EVERY filter, which ran the unrelated ones through
            // deleteOptionFromFilterValue → optionsFromString and lowercased
            // their values. For a `default.search` filter that lowercased the
            // Boolean operators (`OR`/`AND` → `or`/`and`), silently changing the
            // result count when a different facet option (e.g. a work type) was
            // unticked (zd#7179). Leave non-matching filters byte-for-byte intact.
            if (f.key !== filterKey) return f
            const newValue = deleteOptionFromFilterValue(f.value, optionToDelete)
            return createSimpleFilter(
                entityType,
                f.key,
                newValue,
                f.isNegated,
            )
        })
        .filter(f => {
            return f.value !== "" && f.value !== undefined
        })

    return await pushNewFilters(newFilters)
}


const addFilterOption = async function (entityType, index, optionToAdd) {
    console.log("url.addFilterOption", index, optionToAdd)
    const newFilters = addFilterOptionNoPush(entityType, index, optionToAdd)
    return await pushNewFilters(newFilters)
}


const addFilterOptionNoPush = function (entityType, index, optionToAdd) {
    const filters = filtersFromUrlStr(entityType, chipFilterStr(router.currentRoute.value))
    const myFilter = filters[index]
    filters[index] = createSimpleFilter(
        entityType,
        myFilter.key,
        addOptionToFilterValue(myFilter.value, optionToAdd),
        myFilter.isNegated,
    )
    return filters
}


const moveFilterOptionToOwnFilter = function(entityType, index, option, isNegated) {
    const myFilter = readFilter(router.currentRoute.value, entityType, index)
    const myNewFilter = createSimpleFilter(
        entityType,
        myFilter.key,
        option,
        isNegated,
    )
    const oldFilters= readFilters(router.currentRoute.value)
    oldFilters[index] = createSimpleFilter(
        entityType,
        oldFilters[index].key,
        deleteOptionFromFilterValue(oldFilters[index].value, option),
        oldFilters[index].isNegated
    )

    const newFilters = [...oldFilters, myNewFilter]
    pushNewFilters(newFilters)
}


const setIsFilterOptionNegated = function(entityType, filterKey, option, isNegated){
    const myFilterIndex = findFilterIndex(
        router.currentRoute.value,
        entityType,
        filterKey,
        option
    )
    const myFilter = readFilter(router.currentRoute.value, entityType, myFilterIndex)
    const myFilterOptionsCount = optionsFromString(myFilter.value).length
    myFilterOptionsCount === 1 ?
        setIsFilterNegated(entityType, myFilterIndex, isNegated) :
        moveFilterOptionToOwnFilter(entityType, myFilterIndex, option, isNegated)

}


const setIsFilterNegated = function (entityType, index, isNegated) {
    console.log("setIsFilterNegated", isNegated)
    const myValue = readFilter(router.currentRoute.value, entityType, index)?.value
    // const newValue = setStringIsNegated(myValue, isNegated)
    updateFilter(entityType, index, myValue, isNegated)
}


const readIsFilterNegated = function (currentRoute, entityType, index) {
    const myFilter = readFilter(currentRoute, entityType, index)
    return myFilter?.isNegated
    // return myFilter?.value && myFilter?.value?.indexOf("!") === 0
}


const findFilterIndex = function (currentRoute, entityType, filterKey, option) {
    const filters = readFilters(currentRoute)
    const index = filters.findIndex(f => {
        if (f.key !== filterKey) return false
        return optionsFromString(f.value).includes(option)
    })
    return index
}


const toggleFilterOptionIsNegated = async function (entityType, key, option) {
    const oldFilters = filtersFromUrlStr(entityType, chipFilterStr(router.currentRoute.value))

    const newFilters = oldFilters.map(oldFilter => {
        const newValue = (oldFilter.key === key) ?
            toggleOptionIsNegated(oldFilter.value, option) :
            oldFilter.value // change nothing

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            newValue
        )
    })

    return await pushNewFilters(newFilters)
}


const createFilterOptions = function(filter){
    // Collections are case-sensitive shortuuid / base58 IDs — bypass the lowercasing
    // optionsFromString applies. Each `collection:` filter is one value, never
    // pipe-OR'd, so no splitting required.
    if (filter.key === 'collection') {
        return [filter.value]
    }

    const entityConfig = filter.entityToSelect ? getEntityConfig(filter.entityToSelect) : null
    const filterNamespace = entityConfig && !entityConfig.isNative ?
        filter.entityToSelect + "/" :
        undefined

    return optionsFromString(filter.value).map(o => {
        // A collection ref used as a regular field's value (cross-type filter,
        // oxjob #273) must never get an entity-namespace prefix appended — it's
        // a `col_xxx` id, not an entity of `filter.entityToSelect`.
        if (openalexId.isCollectionId(o)) return o
        const appendToFilterOption = filterNamespace && !o.includes("/") ?
            filterNamespace :
            ""
        return appendToFilterOption + o
    })
}


const readFilterOptions = function (currentRoute, entityType, index) {
    const filter = readFilter(currentRoute, entityType, index)
    if (!filter) return []
    return createFilterOptions(filter)
}


const isFilterOptionApplied = function (currentRoute, entityType, filterKey, option) {
    return readFilterOptionsByKey(currentRoute, entityType, filterKey).includes(option)
}


const readFilterOptionsByKey = function (currentRoute, entityType, filterKey, isNegatedOnly = false) {
    const allFilters = readFilters(currentRoute, isNegatedOnly)
    const filtersWithKey = allFilters.filter(f => f.key == filterKey)

    //console.log("readFilterOptionsByKey: " + filterKey)
    //console.log(filtersWithKey)

    // Collection IDs are case-sensitive (shortuuid for legacy `collection-…` rows,
    // base58 for new `lab_…` rows). optionsFromString lowercases everything
    // — bypass it for collections so selected-state checks in the filter pickers
    // (NoviceFilterChip, AddFilter) compare against the actual stored ID.
    if (filterKey === 'collection') {
        return filtersWithKey.map(f => f.value)
    }

    const filterOptionsWithKey = filtersWithKey?.length ?
        [...filtersWithKey.map(f => optionsFromString(f.value)).flat()] :
        []
    return filterOptionsWithKey
}


const readFilterMatchMode = function (currentRoute, entityType, key) {
    const filter = readFilter(currentRoute, entityType, key)

    return getMatchModeFromSelectFilterValue(filter?.value)
}


const setFilterMatchMode = function (entityType, key, mode) {
    const filter = readFilter(router.currentRoute.value, entityType, key)
    const options = optionsFromString(filter.value)
    const newValue = optionsToString(options, mode)
    upsertFilter(entityType, key, newValue)
}


const isGroupBy = function () {
    return getGroupBy(router.currentRoute.value).length > 0
}


const updateOrDeleteFilter = function (entityType, index, filterValue) {
    (filterValue === "" || filterValue === "-") ?
        deleteFilter(entityType, index) :
        updateFilter(entityType, index, filterValue)
}


const upsertFilter = function (entityType, index, filterValue) {
    //console.log("url.upsertFilter()", index, filterValue)
    //console.log("url.upsertFilter() isFilterApplied: " + isFilterApplied(router.currentRoute.value, entityType, index))
    return isFilterApplied(router.currentRoute.value, entityType, index) ?
        updateOrDeleteFilter(entityType, index, filterValue) :
        createFilter(entityType, index, filterValue)
}


const upsertFilterOption = function (entityType, index, filterOption) {
    if (isFilterApplied(router.currentRoute.value, entityType, index)) {
        addFilterOption(entityType, index, filterOption)
    } else {
        upsertFilter(entityType, index, filterOption)
    }
}

const upsertFilterOptionNoPush = function (entityType, index, filterOption) {
    const isExtant = isFilterApplied(router.currentRoute.value, entityType, index)
    return isExtant ?
        addFilterOptionNoPush(entityType, index, filterOption) :
        createFilterNoPush(entityType, index, filterOption)
}


const deleteFilter = async function (entityType, index) {
    console.log("url.deleteFilter", index)
    const oldFilters = filtersFromUrlStr(entityType, chipFilterStr(router.currentRoute.value))
    return await pushNewFilters(oldFilters.toSpliced(index, 1))
}

const deleteAllFilters = async function () {
    return await pushNewFilters([])
}

const makeFilterRoute = function (entityType, key, value) {
    const newFilter = createSimpleFilter(entityType, key, value)
    const currentSort = router.currentRoute.value.query.sort
    // Don't preserve relevance_score sort — it requires an active search,
    // and filter-only routes (like cited_by/cites) shouldn't carry search terms.
    const sort = (currentSort && !currentSort.startsWith('relevance_score'))
        ? currentSort
        : undefined
    return {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort,
            filter: filtersAsUrlStr([newFilter]),
            is_list_view: router.currentRoute.value.query.is_list_view,
        }
    }
}


const setSearch = function (entityType, searchString) {
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            search: searchString,
        }
    }
    pushToRoute(router, newRoute)
}


// Search param helpers
const searchParamKeys = [
    'search', 'search.exact', 'search.semantic',
    'search.title', 'search.title.exact',
    'search.title_and_abstract', 'search.title_and_abstract.exact',
]

// Map a `*.search[.exact]` FILTER key to the equivalent top-level search type, so a
// shared/legacy URL like `?filter=title_and_abstract.search:foo` (or `default.search:foo`)
// hydrates the search box + scope mode instead of showing an empty box (#397). Only keys
// with a clean UI scope-mode equivalent are listed; anything else falls through to the
// existing behavior (no hydration), so this can't mis-set a scope it can't represent.
const filterSearchKeyToType = {
    'search': 'search',
    'default.search': 'search',
    'default.search.exact': 'search.exact',
    'fulltext.search': 'search',
    'fulltext.search.exact': 'search.exact',
    'display_name.search': 'search.title',
    'display_name.search.exact': 'search.title.exact',
    'title.search': 'search.title',
    'title.search.exact': 'search.title.exact',
    'title_and_abstract.search': 'search.title_and_abstract',
    'title_and_abstract.search.exact': 'search.title_and_abstract.exact',
    'semantic.search': 'search.semantic',
}

const setNewSearch = function (entityType, searchType, searchString) {
    // Build query preserving existing non-search params
    const currentQuery = {...router.currentRoute.value.query}
    // Remove any existing search params
    searchParamKeys.forEach(k => delete currentQuery[k])

    if (searchString) {
        currentQuery[searchType] = searchString
    }
    currentQuery.page = 1
    // Sort by relevance when searching
    if (searchString) {
        currentQuery.sort = 'relevance_score:desc'
    }

    const newRoute = {
        name: "Serp",
        params: {entityType: entityType || entityTypeForRoute(router.currentRoute.value)},
        query: currentQuery,
    }
    pushToRoute(router, newRoute)
}

const getSearchFromRoute = function (currentRoute) {
    // The search box reads only the canonical top-level `search.*=` param it emits.
    // A search carried in a `filter=<scope>.search:…` clause is normalized to this
    // shape up front by the router guard (see filterSearchRedirectQuery), so the box
    // itself never needs to read the filter form. (#397)
    for (const key of searchParamKeys) {
        if (currentRoute.query?.[key]) {
            return {type: key, value: currentRoute.query[key]}
        }
    }
    return null
}

// #397: a shared/legacy/API-style URL can run a search via a single
// `filter=<scope>.search:<terms>` clause (e.g. `?filter=title_and_abstract.search:climate`),
// which used to land on an empty-looking box + "No filters applied". Normalize that one
// shape up front to the canonical `?search.*=` URL the box already hydrates, so the box
// stays simple (it never reads the filter form). Returns the rewritten query object, or
// null when no redirect applies.
//
// Deliberately handles ONLY the single, non-negated clause case. A multi-filter URL
// (`filter=title_and_abstract.search:x,is_oa:true`) is left untouched — its non-search
// clauses still render as chips, and expressing a search-plus-filters URL in the box is
// what OQL is for. No redirect loop: the rewritten URL carries no `.search` filter clause,
// so the guard won't re-fire.
const filterSearchRedirectQuery = function (query) {
    const filterStr = query?.filter
    if (!filterStr) return null
    const clauses = splitFilterString(filterStr)
    if (clauses.length !== 1) return null   // single-filter case only
    const clause = clauses[0]
    const idx = clause.indexOf(":")
    if (idx === -1) return null
    const key = clause.slice(0, idx)
    if (key.startsWith("!")) return null    // negated search — don't hydrate a positive box
    const type = filterSearchKeyToType[key]
    if (!type) return null
    const value = clause.slice(idx + 1)
    if (!value) return null
    // Drop filter=, set the equivalent top-level search param, keep every other query param.
    const rest = {...query}
    delete rest.filter
    return {...rest, [type]: value}
}

const clearNewSearch = function () {
    const currentQuery = {...router.currentRoute.value.query}
    searchParamKeys.forEach(k => delete currentQuery[k])
    // Remove relevance sort if it was set by search
    if (currentQuery.sort === 'relevance_score:desc') {
        delete currentQuery.sort
    }
    currentQuery.page = 1

    pushToRoute(router, {
        name: "Serp",
        params: {entityType: entityTypeForRoute(router.currentRoute.value)},
        query: currentQuery,
    })
}


const setDefaultActions = function () {
    console.log("setDefaultActions")
    pushToRoute(router, {
        name: "Serp",
        query: {
            sort: getActionDefaultsStr("sort", router.currentRoute.value.query),
            column: getActionDefaultsStr("column", router.currentRoute.value.query),
        }
    })
}


const getActionValues = function (action) {
    const val = router.currentRoute.value.query[action]
    if (!val) return []

    return val?.split(",").filter(x => !!x)
}


const getActionValueKeys = function (currentRoute, action) {
    const val = currentRoute.query[action]
    if (!val) return []

    return val?.split(",").filter(x => !!x).map(val => {
        const hasColon = val.indexOf(":") > -1
        return hasColon ? val.split(":")[0] : val
    })
}


const getDefaultSortValueForRoute = function(currentRoute, withDirection=false){
    let sort = ""
    if (isSearchFilterApplied(currentRoute)) {
        sort = "relevance_score"
    } else {
        const entityType = entityTypeForRoute(currentRoute)
        if (entityType === "works") {
            sort = "cited_by_count"
        } else if (entityType === "awards") {
            sort = "amount"
        } else {
            sort = "works_count"
        }
    }

    return sort + (withDirection ? ":desc" : "")
}


const setSortNoPush = function(sortByKey, route){
    const defaultValue = getDefaultSortValueForRoute(route)
    const appendVerb = (sortByKey === "display_name") ? "" : ":desc"
    const myNewKey = (sortByKey === defaultValue) ?
        undefined :
        sortByKey + appendVerb

    return {
        name: "Serp",
        query: {
            ...route.query,
            sort: myNewKey,
            page: 1,
        },
    }
}


const setSort = function (filterKey) {
    return pushToRoute(router, setSortNoPush(filterKey, router.currentRoute.value))
}


const getSort = function (currentRoute) {
    const defaultValue = getDefaultSortValueForRoute(router.currentRoute.value)
    return currentRoute.query.sort?.replace(":desc", "") ?? defaultValue
}


const toggleSort = function (filterKey) {
    const currentSort = getSort(router.currentRoute.value)
    if (currentSort === filterKey) {
        setSort(undefined)
    } else {
        setSort(filterKey)
    }
}


// Set sort to an explicit field + direction. Unlike setSort (which only toggles
// the :desc form), this always writes `field:dir` — used by the table column
// header menu's Sort ↑ (asc) / Sort ↓ (desc) items, which need both directions.
const setSortDirection = function (sortByKey, direction) {
    const dir = direction === "asc" ? "asc" : "desc"
    return pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.value.query,
            sort: `${sortByKey}:${dir}`,
            page: 1,
        },
    })
}


// The active sort field, parsed from the URL (falls back to the route default).
// Used to reflect active sort state on table column headers.
const getSortField = function (currentRoute) {
    const raw = currentRoute.query.sort
    if (raw) return raw.split(":")[0]
    return getDefaultSortValueForRoute(currentRoute).split(":")[0]
}


// The active sort direction: "asc" | "desc". Defaults to "desc" (the implicit
// direction when no explicit suffix is present).
const getSortDirection = function (currentRoute) {
    const raw = currentRoute.query.sort
    if (!raw) return "desc"
    return raw.split(":")[1] === "asc" ? "asc" : "desc"
}


const perPageDefault = 10
const tablePerPageDefault = 100
// Selectable page sizes (the kebab "Page size" submenu).
const pageSizeOptions = [10, 20, 50, 100]


// List and table view keep INDEPENDENT page sizes, so picking 10 in a list never
// turns a table into a sparse 10-row table (and vice versa). The Vuex mutation /
// localStorage key / default for whichever view `route` is in.
const pageSizeStoreFor = function(route) {
    return isTableView(route ?? router.currentRoute.value)
        ? { mutation: "setSerpTablePageSize", state: "serpTablePageSize", default: tablePerPageDefault }
        : { mutation: "setSerpPageSize", state: "serpPageSize", default: perPageDefault }
}


// The OQL endpoint's natural default page size. In OQL mode the page size is owned
// by the canonical query store's viewState (not the legacy serpPageSize store), and
// `executeOql` (the inbound channel) ignores any URL per_page, so a fresh OQL load
// returns this many rows until the user picks a size. (#464 Phase 2b)
const OQL_DEFAULT_PER_PAGE = 25

// Results-per-page for BOTH the pager and the API fetch, for the current view.
//
// OQL mode (#464 Phase 2b): the EXECUTED page size is owned by the canonical query
// store's `viewState.per_page` (echoed back by the server after every store-driven
// fetch), NOT the legacy serpPageSize store. Reading it here means the pager, the
// "1–N of M" label, showPagination, and the page-size checkmark all stay consistent
// with what the OQL endpoint actually returned. Falls back to the API default (25)
// when unset (e.g. first load, before any paging edit). Basic/chip + flag-off modes
// are unchanged — they keep the per-view serpPageSize store + localStorage pref.
const getPerPage = function() {
    const r = router.currentRoute.value
    if (store.getters.featureFlags?.["oql"] && r?.query?.oql) {
        return store.state.query?.viewState?.per_page ?? OQL_DEFAULT_PER_PAGE
    }
    const cfg = pageSizeStoreFor()
    return store.state[cfg.state] ?? cfg.default
}


// An explicit page-size pick from the UI. Persists the current view's preference
// and resets to page 1 — where `per_page` is omitted from the URL (it rides along
// only on deep pages via setPage), so the size lives in the store, not the URL.
const setPerPage = function(val){
    store.commit(pageSizeStoreFor().mutation, { value: val, persist: true })
    const query = { ...router.currentRoute.value.query, page: undefined }
    delete query.per_page
    return pushToRoute(router, { name: "Serp", query })
}


// Adopt a `per_page` present in the URL (e.g. a shared deep-page link) into the
// current view's size as a session-only override (persist:false), so it sticks
// even after the param drops from the URL on page 1 (no snap-back) — without
// clobbering the saved preference. Ignored for out-of-range values. Called from
// Serp.vue's fetch watcher.
const adoptPerPageFromUrl = function(route) {
    const r = route ?? router.currentRoute.value
    const pp = parseInt(r.query.per_page, 10)
    if (Number.isFinite(pp) && pp >= 1 && pp <= 200 && pp !== getPerPage()) {
        store.commit(pageSizeStoreFor(r).mutation, { value: pp, persist: false })
    }
}


const setColumn = function (filterKeys) {
    pushQueryParam("column", filterKeys.join(","))
}


const addColumn = function (filterKey) {
    const extantKeys = getColumn(router.currentRoute.value)
    const newKeys = [...extantKeys, filterKey]
    pushQueryParam("column", newKeys.join(","))
}


const toggleColumn = function (filterKey) {
    const extantKeys = getColumn(router.currentRoute.value)
    let newKeys
    if (extantKeys.includes(filterKey)) {
        newKeys = extantKeys.filter(k => k !== filterKey)
    } else {
        newKeys = [...extantKeys, filterKey]
    }
    pushQueryParam("column", newKeys.join(","))
}


const getColumn = function (route) {
    return route.query.column?.split(",") ?? []
}


// Results presentation (list vs table) and the `api` overlay are recipient-local
// CHROME, kept OFF the URL (#492, charter decision 33). The reactive Vuex store
// is the source of truth (`serpResultsView` / `serpShowApi`); list/table persists
// to localStorage, the `api` overlay is session-only. A LEGACY inbound `?view=`
// (table/api) is still honored for first paint, then seeded into the store and
// stripped (see Serp.vue) — so a bookmarked old link keeps working.
//
// (The `view` param historically also carried a `report`/"Stats" flag, long since
// removed; the group-by rail is always shown beside the results.)

// True iff the given route's CHROME resolves to table presentation. A legacy
// `?view=` param (pre-strip / bookmarked) wins for that paint; steady state reads
// the reactive store. Reading `store.state` keeps Vue computeds reactive so the
// toggle re-renders with no navigation.
const isTableView = function (route) {
    const r = route ?? router.currentRoute.value
    const raw = r?.query?.view
    if (raw) return raw.split(",").includes("table")
    return store.state.serpResultsView === "table"
}


// The `view` "flags" are now store-backed chrome, not a URL param. `list`/`table`
// derive from isTableView; `api` is the overlay flag. Kept as a thin shim so the
// few call sites (`isViewSet($route, 'api')`, etc.) need no change.
const isViewSet = function (route, viewId) {
    if (viewId === "api") {
        const r = route ?? router.currentRoute.value
        return store.state.serpShowApi || !!r?.query?.view?.split(",").includes("api")
    }
    if (viewId === "table") return isTableView(route)
    if (viewId === "list") return !isTableView(route)
    return false
}


const toggleView = function (viewId) {
    if (viewId === "api") {
        store.commit("setSerpShowApi", !store.state.serpShowApi)
        return
    }
    setResultsView(isTableView() ? "list" : "table")
}


// Switch the results presentation between 'list' and 'table'. Recipient-local
// chrome → commit to the reactive store (persisted to localStorage); never the
// URL (#492).
const setResultsView = function (resultsView) {
    store.commit("setSerpResultsView", { value: resultsView, persist: true })
}

// Set the `column` list AND switch to table view. `column` is still a URL param;
// the results-view is now store chrome, so this is one column push + one store
// commit (no two-push race to avoid anymore). Used by the export dialog's "Open
// in table view" (job #304).
const setColumnsAndResultsView = function (filterKeys, resultsView) {
    store.commit("setSerpResultsView", { value: resultsView, persist: true })
    pushQueryParam("column", filterKeys.join(","))
}


// #492 Phase 4: group-by widgets are recipient-local SERP chrome, OFF the URL
// (charter decision 33). The active list lives in a per-entity session store
// (store.state.serpGroupBy), seeded from entityConfigs `groupByDefaults` when unset.
// Returns a COPY — callers (drag-reorder splice) mutate it, and we must not corrupt
// store state. An empty stored array means "user cleared all widgets" (≠ unset).
const getGroupBy = function (route) {
    const entityType = entityTypeForRoute(route)
    const stored = store.state.serpGroupBy[entityType]
    if (stored) return [...stored]
    return [...(getEntityConfig(entityType).groupByDefaults ?? [])]
}


const setGroupBy = function (filterKeys) {
    const entityType = entityTypeForRoute(router.currentRoute.value)
    store.commit("setSerpGroupBy", { entityType, keys: filterKeys ?? [] })
}


const addGroupBy = function (filterKey) {
    setGroupBy([...getGroupBy(router.currentRoute.value), filterKey])
}


const deleteGroupBy = function (filterKey) {
    setGroupBy(getGroupBy(router.currentRoute.value).filter(k => k !== filterKey))
}


const toggleGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute.value)
    setGroupBy(
        extantKeys.includes(filterKey)
            ? extantKeys.filter(k => k !== filterKey)
            : [...extantKeys, filterKey]
    )
}


// #492 Phase 4: a signature of the only group-bys that affect the MAIN results
// fetch (the "money" sums, read by makeApiUrl). Serp.vue watches this so toggling
// an apc_sum / cited_by_count_sum widget re-runs the fetch even though the group-by
// list no longer rides the URL (a store change alone wouldn't move route.fullPath).
const groupByMoneySignature = function (route) {
    const keys = getGroupBy(route)
    return (keys.includes("apc_sum") ? "1" : "0")
        + (keys.includes("cited_by_count_sum") ? "1" : "0")
}


const setActionValueKeys = function (actionName, keys) {
    console.log("url.setActionValueKeys", actionName, keys)
    const actionConfig = getActionConfig(actionName)

    const keysArray = (!Array.isArray(keys)) ? [keys] : keys

    let newValues = keysArray.map(k => k + actionConfig.appendToValues)
    if (actionName === "sort" && newValues.length === 0) {
        newValues = getActionDefaultValues(actionName, router.currentRoute.value.query).map(v => v + actionConfig.appendToValues)
    }

    const query = {
        ...router.currentRoute.value.query,
        [actionName]: newValues.join(",")
    }
    console.log("url.setActionValueKeys query", query)

    pushToRoute(router, {
        name: "Serp",
        query,
    })
}


const addActionKey = function (actionName, actionKey) {
    const current = getActionValueKeys(router.currentRoute.value, actionName)
    console.log("addActionKey", current)
    setActionValueKeys(actionName, [...current, actionKey])
}


const deleteActionKey = function (actionName, actionKey) {
    const current = getActionValueKeys(router.currentRoute.value, actionName)
    console.log("deleteActionKey", actionName, actionKey)
    const newKeys = current.filter(k => k !== actionKey)
    setActionValueKeys(actionName, newKeys)
}


const setSidebar = function (id) {
    const shortId = openalexId.getShortId(id)
    console.log("setSidebar", shortId)
    pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.value.query,
            sidebar: shortId
        }
    })
}


const makeAutocompleteUrl = function (entityId, searchString) {
    const url = new URL(urlBase.api)

    url.pathname = entityId ?
        `autocomplete/${entityId}` :
        "autocomplete"

    // url.pathname = `autocomplete/${entityType}`
    url.searchParams.set("q", searchString)
    url.searchParams.set("mailto", "ui@openalex.org")
    if (store.state.useV2) url.searchParams.set("data-version", "2")
    if (router.currentRoute.value.query.include_xpac === 'true') url.searchParams.set("include_xpac", "true")
    return url.toString().replace("mailto=ui%40openalex.org", "mailto=ui@openalex.org")
}


const makeApiUrl = function (currentRoute, formatCsv, groupBy) {
    const entityType = currentRoute.params.entityType
    const filtersFromUrl = filtersFromUrlStr(entityType, currentRoute.query.filter)
    const filterString = filtersAsUrlStr(filtersFromUrl)

    const query = {
        filter: filterString,
    }

    if (formatCsv) {
        query.format = "csv"
    }
    if (groupBy) {
        query.group_by = groupBy
    } else {
        query.page = currentRoute.query.page
        query.sort = currentRoute.query.sort ?? getDefaultSortValueForRoute(currentRoute, true)
        query.per_page = getPerPage()
        // #492 Phase 4: the money group-bys now live in the session store, not the URL.
        const activeGroupBys = getGroupBy(currentRoute)
        query.apc_sum = activeGroupBys.includes("apc_sum")
        query.cited_by_count_sum = activeGroupBys.includes("cited_by_count_sum")
    }

    // Add include_xpac if present in URL
    if (currentRoute.query.include_xpac === 'true') {
        query.include_xpac = 'true'
    }

    // Pass through top-level search params from URL
    searchParamKeys.forEach(k => {
        if (currentRoute.query[k]) query[k] = currentRoute.query[k]
    })

    const apiUrl = new URL(urlBase.api)
    apiUrl.pathname = entityType

    const validQueryKeys = [
        "page",
        "filter",
        "group_by",
        "sort",
        "format",
        "per_page",
        "apc_sum",
        "cited_by_count_sum",
        "include_xpac",
        ...searchParamKeys,
    ]
    const searchParams = new URLSearchParams()
    validQueryKeys.forEach(k => {
        if (query[k] !== undefined && query[k] !== "") {
            searchParams.set(k, query[k])
        }
    })
    
    if (store.state.useV2) {
        searchParams.set("data-version", "2")
    }

    searchParams.set("mailto", "ui@openalex.org")

    apiUrl.search = decodeURIComponent(searchParams.toString())
    return apiUrl.toString().replace("mailto=ui%40openalex.org", "mailto=ui@openalex.org")
}


const makeGroupByUrl = function (entityType, groupByKey, options) {
    // set options from defaults and args
    const defaults = {
        searchString: null,
        perPage: 200,
        formatCsv: false,
        includeEmail: true,
        filters: [],
        isMultipleGroups: false,
    }
    options = Object.assign({}, defaults, options);

    // set required params
    const url = new URL(urlBase.api)
    url.pathname = entityType
    if (options.isMultipleGroups) {
        url.searchParams.set("group_bys", groupByKey) // comma-separated list of keys
    } else {
        url.searchParams.set("group_by", groupByKey)

    }

    // set optional params
    url.searchParams.set("per_page", String(options.perPage))
    if (options.searchString) url.searchParams.set("q", options.searchString)
    if (options.formatCsv) url.searchParams.set("format", "csv");
    if (options.includeEmail) url.searchParams.set("mailto", "ui@openalex.org")
    if (store.state.useV2) url.searchParams.set("data-version", "2")
    if (router.currentRoute.value.query.include_xpac === 'true') url.searchParams.set("include_xpac", "true")

    // copy top-level search params from the current route so group-by results
    // match the same search as the main SERP query
    const routeQuery = router.currentRoute.value.query
    searchParamKeys.forEach(k => {
        if (routeQuery[k]) url.searchParams.set(k, routeQuery[k])
    })

    // we have to do it hacky like this because searchParams.set() will urlencode
    // special within-filter symbols like + and !
    if (options.filters.length > 0) {
        url.search = url.search + "&filter=" + filtersAsUrlStr(options.filters)
    }

    return url.toString().replace("mailto=ui%40openalex.org", "mailto=ui@openalex.org")
}


const url = {
    pushToRoute,
    replaceToRoute,
    pushSearchUrlToRoute,
    addToQuery,
    oqlForUrl,
    urlObjectFromSearchUrl,
    routeFromOxurl,
    chipFilterStr,

    createFilter,
    createFilterNoPush,
    readFilter,
    readFilters,
    readFiltersLength,
    isSearchFilterApplied,
    isFilterOptionApplied,
    readFilterOptionsByKey,
    readFilterValue,
    readFilterOptions,
    readFilterMatchMode,

    isFilterApplied,
    isFilterKeyAvailableToCreate,
    updateFilter,
    updateOrDeleteFilter,
    deleteFilter,
    deleteAllFilters,
    upsertFilter,
    upsertFilterOption,
    upsertFilterOptionNoPush,
    setFilterMatchMode,
    makeFilterRoute,
    pushNewFilters,

    deleteFilterOption,
    deleteFilterOptionByKey,
    addFilterOption,
    toggleFilterOptionIsNegated,

    readIsFilterNegated,
    setIsFilterNegated,
    setIsFilterOptionNegated,
    findFilterIndex,

    setDefaultActions,
    getActionValues,
    getActionValueKeys,
    setActionValueKeys,
    addActionKey,
    deleteActionKey,

    setSort,
    setGroupBy,
    toggleGroupBy,
    deleteGroupBy,
    groupByMoneySignature,
    setColumn,
    addColumn,
    toggleColumn,

    getPerPage,
    setPerPage,
    pageSizeOptions,
    adoptPerPageFromUrl,

    getSort,
    toggleSort,
    setSortDirection,
    getSortField,
    getSortDirection,
    getGroupBy,
    getColumn,
    addGroupBy,

    setSidebar,

    setSearch,
    setNewSearch,
    getSearchFromRoute,
    filterSearchRedirectQuery,
    clearNewSearch,
    setPage,

    isGroupBy,

    makeGroupByUrl,
    makeAutocompleteUrl,

    makeApiUrl,
    setShowApi,
    setHideResults,

    pushQueryParam,
    replaceQueryParam,

    isViewSet,
    toggleView,
    setResultsView,
    setColumnsAndResultsView,
    isTableView,

}


export {
    url,
}