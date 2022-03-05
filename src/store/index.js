import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {
    filtersFromUrlStr,
    filtersAsUrlStr,
    textSearchFromUrlString,
    makeResultsFiltersFromApi,
    createSimpleFilter
} from "../filterConfigs";

Vue.use(Vuex)


const mergeArrays = function (arr1, arr2) {
    // arr1 = arr1.map(x => JSON.stringify(x, Object.keys(x).soz
    // const arraysCombined = [...new Set([...arr1, ...arr2])]
    // return arraysCombined.map(x => JSON.parse(x))

    return [...new Set([...arr1, ...arr2])]
}
const subtractArray = function (base, subtractThese) {
    return base.filter(x => {
        return !subtractThese.includes(x)
    })
}


const sortConfigs = [
    {
        key: "cited_by_count",
        displayName: "Citations",
    },
    {
        // only for non-work entities
        key: "works_count",
        displayName: "Works",
    },
    {
        // only for works
        key: "publication_date",
        displayName: "Date",
    },
    {
        // only if there's a text search on
        key: "relevance_score",
        displayName: "Relevance",
    },
]


const stateDefaults = function () {
    const ret = {
        entityType: null,

        inputFilters: [],
        resultsFilters: [],

        filterObjects: [],
        appliedFilterObjects: [],

        textSearch: "",
        page: 1,
        results: [],
        sort: null,
        responseTime: 0,
        resultsCount: 0,
        isLoading: false,
    }
    return ret
}


export default new Vuex.Store({
    // state: stateDefaults(),
    state: stateDefaults(),
    mutations: {
        resetSearch(state, entityType) {
            stateDefaults()
            Object.entries(stateDefaults()).forEach(([k, v]) => {
                state[k] = v
            })
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setPage(state, page) {
            const pageInt = parseInt(page)
            state.page = (isNaN(pageInt)) ? 1 : pageInt
        },
        setSort(state, sortKey) {
            // if we don't recognize this key, set it to the default
            if (!sortConfigs.some(c => c.key === sortKey)) {
                sortKey = "cited_by_count"
            }
            state.sort = sortKey
        },
        addInputFilter(state, filter) {
            if (!state.inputFilters.map(f => f.asStr).includes(filter.asStr)) {
                state.inputFilters.push(filter)
            }
        },
        removeInputFilter(state, filter) {
            state.inputFilters = state.inputFilters.filter(f => {
                return f.asStr !== filter.asStr
            })
        },


    },
    actions: {

        // *****************************************
        // change stuff and then do a search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async bootFromUrl({commit, getters, dispatch, state}) {
            state.entityType = router.currentRoute.params.entityType
            commit("setPage", router.currentRoute.query.page)
            commit("setSort", router.currentRoute.query.sort)
            state.inputFilters = filtersFromUrlStr(router.currentRoute.query.filter)
            state.textSearch = textSearchFromUrlString(router.currentRoute.query.filter)
            await dispatch("doSearch")
        },

        // eslint-disable-next-line no-unused-vars
        async doTextSearch({commit, getters, dispatch, state}, {entityType, searchString}) {
            commit("setPage", 1)
            commit("setSort", "relevance_score")
            state.entityType = entityType
            state.textSearch = searchString
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
        async addInputFilters({commit, getters, dispatch, state}, filters) {
            console.log("Vuex addInputFilters", filters)
            filters.forEach(f => {
                commit("addInputFilter", f)
            })
            commit("setPage", 1)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async removeInputFilters({commit, getters, dispatch, state}, filters) {
            console.log("Vuex removeInputFilters", filters)
            filters.forEach(f => {
                commit("removeInputFilter", f)
            })
            commit("setPage", 1)
            await dispatch("doSearch")
        },


        // *****************************************
        // do the search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {

            state.isLoading = true
            const routerPushTo = {
                query: getters.searchQuery,
                name: "Serp",
                params: {entityType: state.entityType},
            };

            console.log("doSearch", getters.searchQuery)

            router.push(routerPushTo)
                .catch((e) => {
                    if (e.name !== "NavigationDuplicated") {
                        throw e
                    }
                })
            try {
                const resp = await api.get(state.entityType, getters.searchQuery)
                state.results = resp.results
                state.responseTime = resp.meta.db_response_time_ms
                state.resultsCount = resp.meta.count

                const path = `${state.entityType}/filters/${getters.inputFiltersAsString}`
                const filtersResp = await api.get(path)
                state.resultsFilters = makeResultsFiltersFromApi(filtersResp.filters)
            } finally {
                state.isLoading = false
            }

        },


    },
    getters: {
        sortObjectOptions(state, getters) {
            if (!state.results.length) return
            return sortConfigs.filter(sortOption => {
                return sortOption.key in state.results[0]
            })
        },
        sortObject(state, getters) {
            return sortConfigs.find(sortOption => {
                return sortOption.key === state.sort
            })
        },
        searchQuery(state, getters) {
            const query = {
                page: state.page
            }
            if (getters.inputFiltersAsString) query.filter = getters.inputFiltersAsString
            if (state.sort) query["sort"] = state.sort + ":desc"
            return query
        },
        searchApiUrl(state, getters) {
            return api.getUrl(state.entityType, getters.searchQuery)
        },
        resultsFiltersAsStringToWatch(state, getters) {
            const copy = [...state.resultsFilters]
            copy.sort()
            return JSON.stringify(copy)
        },
        searchFacetConfigs(state) {
            return facetConfigs()
                .filter(config => {
                    return config.entityTypes.indexOf(state.entityType) > -1
                })
                .filter(config => {
                    return config.key.indexOf(".search") === -1
                })
        },
        inputFiltersAsString(state, getters) {
            const copy = [...getters.inputFiltersForUrl]
            copy.sort()
            return filtersAsUrlStr(copy)
        },
        inputFiltersForUrl(state, getters) {
            return [
                ...state.inputFilters,
                getters.textSearchFilter
            ]
        },
        textSearchFilter(state, getters) {
            return createSimpleFilter("display_name.search", state.textSearch)
        },

    },
    modules: {}
})
