import router from "./router";
import {filtersAsUrlStr, filtersFromUrlStr, filtersAreEqual, createSimpleFilter} from "./filterConfigs";
import {entityConfigs} from "@/entityConfigs";
import entity from "@/components/Entity/Entity.vue";
import {entityTypes} from "./util";
import {filter} from "core-js/internals/array-iteration";
import {getActionConfig, getActionDefaultsStr, getActionDefaultValues} from "@/actionConfigs";

const makeRoute = function (router, newRoute) {
    const newQuery = {...router.currentRoute.query}
    newQuery.zoom = undefined
    return {
        name: this.$route.name,
        params: this.$route.params,
        query: newQuery,
    }
}

const addToQuery = function (oldQuery, k, v) {
    const newQuery = {...oldQuery}
    newQuery[k] = v
    return newQuery
}


const removeFromQuery = function (oldQuery, k) {
    const newQuery = {...oldQuery}
    delete newQuery[k]
    return newQuery
}

const setApiMode = async function (newVal) {
    return await pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.query,
            "api-mode": newVal ? "true" : undefined
        }
    })
}

const pushNewSearch = async function (router, entityType, search) {
    const newRoute = {
        name: "Serp",
        params: {entityType,},
    }
    // if (entityType === router.currentRoute.params.entityType) {
    //     newRoute.query = addToQuery(router.currentRoute.query, "search", search)
    // }
    newRoute.query = addToQuery(router.currentRoute.query, "search", search)


    console.log("pushNewSearch", newRoute)
    return await pushToRoute(router, newRoute)
}

const pushToRoute = async function (router, newRoute) {
    return await router.push(newRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}



const setPage = async function (page) {
    return pushToRoute(router, {
        name: "Serp",
        query: {
            ...router.currentRoute.query,
            page
        }
    })
}


const pushNewFilters = async function (newFilters) {
    const filter = (newFilters.length) ?
        filtersAsUrlStr(newFilters) :
        undefined

    // const oldSort = router.currentRoute.query.sort
    // const oldSortIsRelevance = oldSort?.indexOf("relevance") > -1
    // const oldParams = new URLSearchParams(router.currentRoute.query)
    // const isSearchFilterApplied = oldParams.toString().indexOf(".search") > -1
    //


    const query = {
        ...router.currentRoute.query,
        page: 1,
        filter,
    }
    query.sort = getActionDefaultsStr("sort", query)

    const newRoute = {
        name: "Serp",
        // params: {entityType},
        query
    }
    return pushToRoute(router, newRoute)
}



const createFilter = async function (entityType, key, newValue) {
    console.log("url.createFilter()", entityType, key, newValue);

    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)
    if (oldFilters.map(f => f.key).includes(key)) {
        throw Error("OpenAlex: url.createFilter trying to create a filter with a key that's already in URL")
    }
    const newFilters = [...oldFilters, createSimpleFilter(entityType, key, newValue)]

    return await pushNewFilters(newFilters)

}
const readFilter = function (entityType, key) {
    return filtersFromUrlStr(entityType, router.currentRoute.query.filter).find(f => {
        return f.key === key
    })
}
const readFilterValue = function (entityType, key) {
    const myFilter = filtersFromUrlStr(entityType, router.currentRoute.query.filter).find(f => {
        return f.key === key
    })
    return myFilter?.value
}

const isFilterApplied = function(entityType, key){
    const filterValue = readFilterValue(entityType, key)
    return filterValue !== "" && filterValue !== undefined && filterValue !== null
}
const isSearchFilterApplied = function(){
    return router.currentRoute.query?.filter?.split(",")?.some(f => {
        return f.split(":")[0]?.indexOf(".search") > -1
    })
}



const updateFilter = async function (entityType, key, newValue) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // add the new filter
    const newFilters = oldFilters.map(oldFilter => {
        const updatedValue = (oldFilter.key === key) ?
            newValue :
            oldFilter.value

        return createSimpleFilter(
            entityType,
            oldFilter.key,
            updatedValue
        )
    })

    return await pushNewFilters(newFilters)
}

const isGroupBy = function(){
    return !!router.currentRoute.query.group_by
}

const updateOrDeleteFilter = function(entityType, filterKey, filterValue){
    (filterValue === "" || filterValue === "-") ?
        deleteFilter(entityType, filterKey) :
        updateFilter(entityType, filterKey, filterValue)

}

const upsertFilter = function(entityType, filterKey, filterValue){
    return isFilterApplied(entityType, filterKey) ?
        updateOrDeleteFilter(entityType, filterKey, filterValue) :
        createFilter(entityType, filterKey, filterValue)
}



const deleteFilter = async function (entityType, key) {
    console.log("url.deleteFilter")
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // add the new filter
    const newFilters = oldFilters.filter(oldFilter => {
        return oldFilter.key !== key
    })

    return await pushNewFilters(newFilters)
}


const setFilters = function (entityType, filters, hardReset = false) {
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: (hardReset) ? undefined : router.currentRoute.query.sort,
            search: (hardReset) ? undefined : router.currentRoute.query.search,
            filter: filtersAsUrlStr(filters)
        }
    }
    pushToRoute(router, newRoute)
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

const setGroupBy = function (facetKey) {
    // if (!Object.keys(entityConfigs).includes(entityType)) {
    //     throw new Error("OpenAlex error: url.setGroupBy called with invalid entityType")
    // }
    if (!facetKey) facetKey = undefined

    const newRoute = {
        name: "Serp",
        // params: {entityType},
    }
    newRoute.query = addToQuery(router.currentRoute.query, "group_by", facetKey)

    return pushToRoute(router, newRoute)
}


const setDefaultActions = function() {
    console.log("setDefaultActions")
    pushToRoute(router, {
        name: "Serp",
        query: {
            sort: getActionDefaultsStr("sort", router.currentRoute.query),
            column: getActionDefaultsStr("column", router.currentRoute.query),
        }
    })
}







const addZoomToRoute = function (router, zoom) {
    if (!zoom) return
    const shortId = zoom.replace("https://openalex.org/", "")

    const zoomIds = router.currentRoute.query.zoom?.split(",") ?? []
    zoomIds.push(shortId)

    const newQuery = url.addToQuery(router.currentRoute.query, "zoom", zoomIds.join())
    return {
        name: "Serp",
        query: newQuery,
    }
}

const goToZoom = async function (router, zoom) {
    return pushToRoute(router, addZoomToRoute(router, zoom))
}


const makeAutocompleteUrl = function (entityType, searchString) {
    const url = new URL(`https://api.openalex.org`)

    url.pathname = (entityType === null) ?
        "autocomplete" :
        `autocomplete/${entityType}`

    // url.pathname = `autocomplete/${entityType}`
    url.searchParams.set("q", searchString)
    url.searchParams.set("mailto", "team@ourresearch.org")
    return url.toString()
}

const makeApiUrl = function (currentRoute, formatCsv) {
    const entityType = currentRoute.params.entityType
    const filtersFromUrl = filtersFromUrlStr(entityType, currentRoute.query.filter)
    const filterString = filtersAsUrlStr(filtersFromUrl)


    const query = {
        page: currentRoute.query.page,
        filter: filterString,
        group_by: currentRoute.query.group_by,
        sort: currentRoute.query.sort
    }

    if (formatCsv) {
        query.format = "csv"
    }
    if (query.group_by){
        query.sort = undefined
    }

    const apiUrl = new URL("https://api.openalex.org")
    apiUrl.pathname = entityType

    // list of legal keys: https://api.openalex.org/works?page=1&foo=bar
    const validQueryKeys = [
        "page",
        "filter",
        "group_by",
        "sort",
        "format",
    ]
    const searchParams = new URLSearchParams()
    validQueryKeys.forEach(k => {
        if (query[k] !== undefined && query[k] !== "") {
            searchParams.set(k, query[k])
        }
    })

    apiUrl.search =  decodeURIComponent(searchParams.toString())
    return apiUrl.toString()

}




const makeGroupByUrl = function (entityType, groupByKey, options) {

    // set options from defaults and args
    const defaults = {
        searchString: null,
        perPage: 100,
        formatCsv: false,
        includeEmail: true,
        filters: [],
    }
    options = Object.assign({}, defaults, options);

    // gather state from the current URL
    // const filters = filtersFromUrlStr(
    //     entityType,
    //     router.currentRoute.query.filter
    // )

    // set required params
    const url = new URL(`https://api.openalex.org`)
    url.pathname = entityType
    url.searchParams.set("group_by", groupByKey)

    // set optional params
    url.searchParams.set("per_page", String(options.perPage))
    if (options.filters.length > 0) url.searchParams.set(
        "filter",
        filtersAsUrlStr(options.filters)
    )
    if (options.searchString) url.searchParams.set("q", options.searchString)
    if (options.formatCsv) url.searchParams.set("format", "csv");
    if (options.includeEmail) url.searchParams.set("mailto", "team@ourresearch.org")

    // all done
    return url.toString()
}


const url = {
    makeRoute,
    pushToRoute,
    addToQuery,

    createFilter,
    readFilter,
    isSearchFilterApplied,
    readFilterValue,
    isFilterApplied,
    updateFilter,
    deleteFilter,
    upsertFilter,

    setDefaultActions,





    setFilters,
    setSearch,
    setPage,

    setGroupBy,
    isGroupBy,

    goToZoom,
    addZoomToRoute,

    pushNewSearch,
    makeGroupByUrl,
    makeAutocompleteUrl,

    setApiMode,
    makeApiUrl,
}


export {
    url,
}