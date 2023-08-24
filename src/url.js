import router from "./router";
import {filtersAsUrlStr, filtersFromUrlStr} from "./filterConfigs";
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

const setFilters = function (entityType, filters, hardReset=false) {
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

const setGroupBy = function(facetKey){
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

const url = {
    makeRoute,
    pushToRoute,
    addToQuery,

    setFiltersByKey,
    setFilters,
    setSearch,

    setGroupBy,

    goToZoom,
    addZoomToRoute,

    pushNewSearch,
}


export {
    url,
}