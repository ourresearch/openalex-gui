import router from "./router";
import store from "./store";
import {
    filtersAsUrlStr,
    filtersFromUrlStr,
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


const setZoom = function (val) {
    pushQueryParam("zoom", val)
}


const getZoom = function (route) {
    return route.query.zoom
}


const setHideResults = function (val) {
    const urlVal = val ? true : undefined
    pushQueryParam("hide_results", urlVal)
}


const pushNewFilters = async function (newFilters, entityType) {
    console.log("url.pushNewFilters", newFilters, entityType)
    const filter = (newFilters.length) ?
        filtersAsUrlStr(newFilters) :
        undefined

    if (!entityType) {
         entityType = router.currentRoute.value.params.entityType ?? "works"
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
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.value.query.filter)
    // console.log("createFilterNoPush oldFilters")
    // console.log(oldFilters)
    const newFilter = createSimpleFilter(entityType, key, newValue)
    return [...oldFilters, newFilter]
}


const readFilter = function (currentRoute, entityType, index) {
    return filtersFromUrlStr(entityType, currentRoute.query.filter)[index]
}


const readFilters = function (currentRoute, isNegatedOnly = false) {
    const filters = filtersFromUrlStr(
        currentRoute.params.entityType,
        currentRoute.query.filter
    )
    return isNegatedOnly ?
        filters.filter(f => f.value[0] === "!") :
        filters
}


const readFiltersLength = function () {
    return filtersFromUrlStr(
        router.currentRoute.value.params.entityType,
        router.currentRoute.value.query.filter,
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
    const filters = filtersFromUrlStr(entityType, router.currentRoute.value.query.filter)
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
    const filters = filtersFromUrlStr(entityType, router.currentRoute.value.query.filter)
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
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.value.query.filter)

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
    return !!router.currentRoute.value.query.group_by
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
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.value.query.filter)
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
        params: {entityType: entityType || router.currentRoute.value.params.entityType || "works"},
        query: currentQuery,
    }
    pushToRoute(router, newRoute)
}

const getSearchFromRoute = function (currentRoute) {
    for (const key of searchParamKeys) {
        if (currentRoute.query?.[key]) {
            return {type: key, value: currentRoute.query[key]}
        }
    }
    return null
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
        params: {entityType: router.currentRoute.value.params.entityType || "works"},
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
        const entityType = currentRoute.params.entityType
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


// Results-per-page for BOTH the pager and the API fetch (makeApiUrl), for the
// current view. Held reactively in the store, persisted to localStorage.
const getPerPage = function() {
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


// The `view` query param is a small set of independent flags, NOT a single
// radio choice:
//   - results presentation: list (default) vs `table`. `table` present => table
//     mode; absent => list. They are mutually exclusive (see setResultsView).
//   - `api`: an independent overlay (Show API query) that combines with either.
// The old `report` ("Stats") view was removed: the group-by/stats rail is now
// always shown beside the results (its show/hide toggle had been deleted from
// the UI, leaving the `report` flag permanently on and the conditional dead).
const viewConfigs = [
    {
        id: "list",
        icon: "mdi-format-list-checkbox",
        displayName: "Results list",
        isDefault: true,
    },
    {
        id: "table",
        icon: "mdi-table",
        displayName: "Table",
        isDefault: false,
    },
    {
        id: "api",
        icon: "mdi-api",
        displayName: "Show API query",
        isDefault: false,
    },
]


const defaultViewIds = viewConfigs.filter(v => v.isDefault).map(v => v.id).sort()
const isViewDefault = function (viewIds) {
    const defaultViewIdsString = [...defaultViewIds].join(",")
    const viewIdsString = [...viewIds].sort().join(",")
    return defaultViewIdsString === viewIdsString
}


// Persist ONLY the results presentation (list vs table) across searches, the
// same way columns persist (useColumnsState). The `api` overlay is transient
// and never stored. A `view` param in the URL is always authoritative; only a
// bare URL (no param) consults this. So `?view=list` still forces list — it
// overrides the stored preference — matching how `?column=` overrides columns.
const resultsViewStorageKey = "oax.resultsView"

const readStoredResultsView = function () {
    try {
        const v = localStorage.getItem(resultsViewStorageKey)
        return v === "table" || v === "list" ? v : null
    } catch (e) {
        return null
    }
}

const writeStoredResultsView = function (resultsView) {
    try {
        localStorage.setItem(resultsViewStorageKey, resultsView === "table" ? "table" : "list")
    } catch (e) {
        // private mode / quota — persistence is best-effort, never fatal
    }
}


const getView = function (route) {
    if (route.query.view) return route.query.view.split(",")
    // No explicit view param: honor the user's last-used presentation so a
    // bare URL (e.g. a hand-built `?filter=doi:…` link) stays in their chosen
    // view instead of snapping back to the list default (zd#8973). Only the
    // list/table dimension persists; the `api` overlay is never stored.
    return readStoredResultsView() === "table" ? ["table"] : defaultViewIds
}


const isViewSet = function (route, viewId) {
    const myViewOptions = getView(route)
    return myViewOptions.includes(viewId)
}


const setView = function (viewIds) {
    const unsetViewParam = !viewIds.length || isViewDefault(viewIds)

    const newViewValue = unsetViewParam ?
        undefined :
        viewIds.join(",")
    pushQueryParam("view", newViewValue)
}


const toggleView = function (viewId) {
    const selectedViewIds = getView(router.currentRoute.value)
    const newViewIds = selectedViewIds.includes(viewId) ?
        selectedViewIds.filter(id => id !== viewId) : // remove it
        [...selectedViewIds, viewId] // add it
    setView(newViewIds)
}


// Switch the results presentation between 'list' and 'table'. These are
// mutually exclusive, so we drop both flags first, then add 'table' only when
// requested — preserving any independent flag (e.g. 'api'). Setting list mode
// with no other flags clears the param entirely (clean `?…` with no `view`);
// table mode yields a clean `?view=table`.
const setResultsView = function (resultsView) {
    // Persist the choice so subsequent bare URLs inherit it (zd#8973). We still
    // clear the `view` param when switching to the list default (clean URL) —
    // localStorage now carries the preference, so getView resolves it correctly.
    writeStoredResultsView(resultsView)
    const others = getView(router.currentRoute.value)
        .filter(id => id !== "list" && id !== "table")
    const newViewIds = resultsView === "table" ? [...others, "table"] : others
    setView(newViewIds)
}

// Set the `column` list AND switch to table view in a SINGLE navigation.
// Calling setColumn() then setResultsView() back-to-back loses the columns:
// each helper reads `router.currentRoute.value.query` synchronously, but
// router.push is async, so the second call reads the pre-navigation query and
// overwrites `column`. Merging both params into one push avoids the race.
// Used by the export dialog's "Open in table view" (job #304).
const setColumnsAndResultsView = function (filterKeys, resultsView) {
    writeStoredResultsView(resultsView)
    const others = getView(router.currentRoute.value)
        .filter(id => id !== "list" && id !== "table")
    const newViewIds = resultsView === "table" ? [...others, "table"] : others
    const unsetViewParam = !newViewIds.length || isViewDefault(newViewIds)
    const query = {
        ...router.currentRoute.value.query,
        column: filterKeys.join(","),
        view: unsetViewParam ? undefined : newViewIds.join(","),
    }
    pushToRoute(router, {
        name: "Serp",
        query,
    })
}

const isTableView = function (route) {
    return isViewSet(route, "table")
}


const getGroupBy = function (route) {
    const defaultValue = getEntityConfig(route.params.entityType).groupByDefaults ?? []
    return route.query.group_by?.split(",") ?? defaultValue
}


const setGroupBy = function (filterKeys) {
    pushQueryParam("group_by", filterKeys?.join(","))
}


const addGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute.value)
    const newKeys = [...extantKeys, filterKey]
    pushQueryParam("group_by", newKeys.join(","))
}


const deleteGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute.value)
    const newKeys = extantKeys.filter(k => k !== filterKey)
    pushQueryParam("group_by", newKeys.join(","))
}


const toggleGroupBy = function (filterKey) {
    const extantKeys = getGroupBy(router.currentRoute.value)
    let newKeys
    if (extantKeys.includes(filterKey)) {
        newKeys = extantKeys.filter(k => k !== filterKey)
    } else {
        newKeys = [...extantKeys, filterKey]
    }
    pushQueryParam("group_by", newKeys.join(","))
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
        query.apc_sum = currentRoute.query.group_by?.split(",")?.includes("apc_sum")
        query.cited_by_count_sum = currentRoute.query.group_by?.split(",")?.includes("cited_by_count_sum")
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
    urlObjectFromSearchUrl,
    routeFromOxurl,

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

    viewConfigs,
    isViewSet,
    toggleView,
    setResultsView,
    setColumnsAndResultsView,
    isTableView,

    setZoom,
    getZoom,

}


export {
    url,
}