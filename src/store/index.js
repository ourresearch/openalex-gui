import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";
import {makeUrl} from "../urls";

Vue.use(Vuex)

const allEntityTypes = function () {
    return ["work", "author", "institution", "venue", "concept"]
}

const filterConfigs = {
    "display_name.search": {
        key: "display_name.search",
        entityTypes: allEntityTypes(),
        displayName: "Name",
    }
}

const stateDefaults = function () {
    const filterValues = {}
    Object.keys(filterConfigs).forEach(k => {
        filterValues[k] = null
    })
    const ret = {
        entityType: null,
        filters: filterValues,
        page: 1,
        results: [],
        isLoading: false,
    }

    return ret
}


export default new Vuex.Store({
    // state: stateDefaults(),
    state: stateDefaults(),
    mutations: {
        // eslint-disable-next-line no-unused-vars
        resetSearch(state) {
            // state = stateDefaults()
            const defaults = stateDefaults()
            Object.keys(defaults).forEach(k => {
                state[k] = defaults[k]
            })
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setPage(state, page) {
            state.page = page
        },
        setFilters(state, newFilters) {
            Object.assign(state.filters, newFilters)
        },
        setFiltersFromString(state, filtersString) {
            if (!filtersString) return
            if (filtersString.indexOf(":") === -1) return
            filtersString.split(",").forEach(filterString => {
                const [key, value] = filterString.split(":");
                state.filters[key] = value
            })
        },
    },
    actions: {
        // eslint-disable-next-line no-unused-vars
        async doTextSearch({commit, getters, dispatch, state}, {entityType, searchString}) {
            state.entityType = entityType
            commit("setFilters", {"display_name.search": searchString});
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {
            if (loadFromRoute) {
                console.log("loading search params from route", router.currentRoute)
                state.entityType = router.currentRoute.params.entityType
                state.page = router.currentRoute.query.page
                commit("setFiltersFromString", router.currentRoute.query.filter)
            }

            const routerPushTo = {
                query: {
                    filter: getters.filtersAsString,
                    page: state.page,
                },
                name: "Serp",
                params: {entityType: state.entityType},
            };
            router.push(routerPushTo)
                .catch((e) => {
                    if (e.name !== "NavigationDuplicated") {
                        throw e
                    }
                })

            const resp = await api.get(state.entityType, {
                page: state.page,
                filter: getters.filtersAsString
            })
            console.log("got response back from le server", resp)
            state.results = resp.results

        }
    },
    getters: {

        // simple search getters

        searchEntityType(state) {
            return state.entityType
        },
        searchFilters(state) {
            return state.searchFilters
        },
        searchResults(state) {
            return state.results
        },
        searchIsLoading(state) {
            return state.results
        },

        // search getters that modify things or do some kind of work

        getFilterValue: (state, getters) => (filterId) => {

        },
        serpUrl(state, getters) {
            return makeUrl(
                getters.entityTypeAsPath,
                getters.searchParams
            )
        },
        searchTerm(state) {
            state.filters.find(f => f.id === "display_name").value
        },
        entityTypeAsPath(state) {
            return `/${state.entityType}`
        },

        filtersAsArray(state) {
            const filtersAsArray = Object.entries(state.filters)
                .map(([k, v]) => {
                    return {key: k, value: v}
                })

            filtersAsArray.sort((a, b) => {
                return a.key > b.key
            })

            return filtersAsArray
                .filter(f => {
                    return typeof f.value !== "undefined"
                })
        },

        filtersAsString(state, getters) {
            return getters.filtersAsArray
                .map(f => {
                    return `${f.key}:${f.value}`
                })
                .join(",")
        },

    },
    modules: {}
})
