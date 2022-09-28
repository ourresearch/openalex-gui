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

const url = {
    makeRoute,
    pushToRoute,

    pushNewSearch,
}

export {
    url
}