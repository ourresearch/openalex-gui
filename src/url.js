import router from "./router";

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
        query: addToQuery(router.currentRoute.query, "search", search)
    }

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




const addZoomToRoute = function(router, zoom) {
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

const goToZoom = async function(router, zoom) {
    return pushToRoute(router, addZoomToRoute(router, zoom))
}

const url = {
    makeRoute,
    pushToRoute,
    addToQuery,

    goToZoom,
    addZoomToRoute,

    pushNewSearch,
}

export {
    url
}