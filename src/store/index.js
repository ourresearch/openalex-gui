import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";

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
        filterValues[k] = undefined
    })
    const ret = {
        entityType: null,
        filters: filterValues,
        page: 1,
        results: [],
        sort: null,
        resultsMeta: null,
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
            const defaults = stateDefaults()
            Object.keys(defaults).forEach(k => {
                state[k] = defaults[k]
            })
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setPage(state, page) {
            const pageInt = parseInt(page)
            state.page = (isNaN(pageInt)) ? 1 : pageInt
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
            commit("setPage", 1)
            state.entityType = entityType
            commit("setFilters", {"display_name.search": searchString});
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setSort({commit, getters, dispatch, state}, newSortValue) {
            state.sort = newSortValue
            commit("setPage", 1)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setPage({commit, getters, dispatch, state}, newPage) {
            commit("setPage", newPage)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {
            state.isLoading = true
            if (loadFromRoute) {
                state.entityType = router.currentRoute.params.entityType
                commit("setPage", router.currentRoute.query.page)
                commit("setFiltersFromString", router.currentRoute.query.filter)
            }

            const routerPushTo = {
                query: getters.searchQuery,
                name: "Serp",
                params: {entityType: state.entityType},
            };
            router.push(routerPushTo)
                .catch((e) => {
                    if (e.name !== "NavigationDuplicated") {
                        throw e
                    }
                })

            try {
                const resp = await api.get(state.entityType, getters.searchQuery)
                console.log("got response back from le server", resp)
                state.results = resp.results

            } finally {
                state.isLoading = false
            }


        }
    },
    getters: {
        searchQuery(state, getters) {
            const query = {
                page: state.page
            }
            if (getters.filtersAsString) query.filter = getters.filtersAsString
            if (state.sort) query["sort:desc"] = state.sort
            return query
        },
        searchApiUrl(state, getters) {
            return api.getUrl(state.entityType, getters.searchQuery)
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
