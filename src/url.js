import router from "./router";
import {filtersAsUrlStr, filtersFromUrlStr, filtersAreEqual, createSimpleFilter} from "./filterConfigs";
import {entityConfigs} from "@/entityConfigs";

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

const setFiltersByKey = function (filterKey, filters) {
    const entityType = router.currentRoute.params.entityType

    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)
    const newFilters = [
        ...oldFilters.filter(f => f.key !== filterKey),
        ...filters
    ]

    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: router.currentRoute.query.sort,
            search: router.currentRoute.query.search,
            filter: filtersAsUrlStr(newFilters, entityType)
        }
    }
    pushToRoute(router, newRoute)
}

const negateFilter = async function (key, value) {

}

const replaceFilter = async function (oldFilter, newFilter) {
    const entityType = router.currentRoute.params.entityType
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // remove the old filter
    const oldFiltersToKeep = oldFilters.filter(f => {
        return !oldFilter || !filtersAreEqual(f, oldFilter)
    })

    // add the new filter
    const newFilters = [...oldFiltersToKeep, newFilter].filter(f => !!f)

    // set and push
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: router.currentRoute.query.sort,
            filter: filtersAsUrlStr(newFilters, entityType)
        }
    }
    pushToRoute(router, newRoute)
}

const createFilter = async function (entityType, key, newValue) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)
    if (oldFilters.map(f => f.key).includes(key)) {
        throw Error("OpenAlex: url.createFilter trying to create a filter with a key that's already in URL")
    }
    const newFilters = [...oldFilters, createSimpleFilter(entityType, key, newValue)]

    // set and push
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: router.currentRoute.query.sort,
            filter: filtersAsUrlStr(newFilters, entityType)
        }
    }
    return await pushToRoute(router, newRoute)
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
            key,
            updatedValue
        )
    })
    console.log("updateFilter", filtersAsUrlStr(newFilters))

    // set and push
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: router.currentRoute.query.sort,
            filter: filtersAsUrlStr(newFilters, entityType)
        }
    }
    return await pushToRoute(router, newRoute)
}

const deleteFilter = async function (entityType, key) {
    const oldFilters = filtersFromUrlStr(entityType, router.currentRoute.query.filter)

    // add the new filter
    const newFilters = oldFilters.filter(oldFilter => {
        return oldFilter.key !== key
    })

    // set and push
    const newRoute = {
        name: "Serp",
        params: {entityType},
        query: {
            page: 1,
            sort: router.currentRoute.query.sort,
            filter: filtersAsUrlStr(newFilters, entityType)
        }
    }
    return await pushToRoute(router, newRoute)
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


const makeGroupByUrl = function (entityType, groupByKey, options) {

    // set options from defaults and args
    const defaults = {
        searchString: null,
        perPage: 100,
        formatCsv: false,
        includeEmail: true,
    }
    options = Object.assign({}, defaults, options);

    // gather state from the current URL
    const filters = filtersFromUrlStr(
        entityType,
        router.currentRoute.query.filter
    )

    // set required params
    const url = new URL(`https://api.openalex.org`)
    url.pathname = entityType
    url.searchParams.set("filter", filtersAsUrlStr(filters, entityType))
    url.searchParams.set("group_by", groupByKey)

    // set optional params
    url.searchParams.set("per_page", String(options.perPage))
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
    updateFilter,
    deleteFilter,

    setFiltersByKey,
    setFilters,
    replaceFilter,
    negateFilter,
    setSearch,

    setGroupBy,

    goToZoom,
    addZoomToRoute,

    pushNewSearch,
    makeGroupByUrl
}


export {
    url,
}