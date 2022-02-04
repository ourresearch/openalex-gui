import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {createFilter, createFilterId,} from "../views/filterConfigs";

Vue.use(Vuex)


const mergeArrays = function(arr1, arr2){
    // arr1 = arr1.map(x => JSON.stringify(x, Object.keys(x).soz
    // const arraysCombined = [...new Set([...arr1, ...arr2])]
    // return arraysCombined.map(x => JSON.parse(x))

    return [...new Set([...arr1, ...arr2])]
}
const subtractArray = function(base, subtractThese){
    return base.filter(x =>{
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
    const filterValues = {}
    facetConfigs().forEach(config => {
        filterValues[config.key] = undefined
    })

    const ret = {
        entityType: null,
        filters: filterValues,
        filtersList: [],
        facetCounts: {},
        appliedFilters: [],
        entityDisplayNames: {},
        textSearch: "",
        groupBys: [],
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


    },
    actions: {

        // *****************************************
        // change stuff and then do a search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async bootFromUrl({commit, getters, dispatch, state}) {
            state.isLoading = true
            state.entityType = router.currentRoute.params.entityType
            commit("setPage", router.currentRoute.query.page)
            commit("setSort", router.currentRoute.query.sort)

            const filtersString = router.currentRoute.query.filter
            if (!filtersString) return
            if (filtersString.indexOf(":") === -1) return

            filtersString.split(",").forEach(filterString => {
                const [key, value] = filterString.split(":");
                if (key === "display_name.search") {
                    // although the api (and our own URL) treats this as just another filter,
                    // we don't store it that way.
                    state.textSearch = value
                } else {
                    state.appliedFilters.push(createFilterId(key, value))
                }
            })
            await dispatch("doSearch")
            state.isLoading = false
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
        async setAppliedFilters({commit, getters, dispatch, state}, {add, remove}) {
            state.appliedFilters = mergeArrays(state.appliedFilters, add)
            state.appliedFilters = subtractArray(state.appliedFilters, remove)
            dispatch("updateFilterDisplayNames")
            commit("setPage", 1)
            await dispatch("doSearch")
        },






        // *****************************************
        // change stuff then DON'T do a search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async updateFilterDisplayNames({commit, getters, dispatch, state}) {

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
            } finally {
                state.isLoading = false
            }
            dispatch("setFacetCounts")
        },


        // eslint-disable-next-line no-unused-vars
        async setFacetCounts({commit, getters, dispatch, state}) {
            state.facetCounts = {}
            for (let i = 0; i < getters.searchFacetConfigs.length; i++) {
                const config = getters.searchFacetConfigs[i]
                const resp = await api.get(state.entityType, getters.groupByQuery(config.key))

                resp.group_by.slice(0, 4).forEach(group => {
                    const filterId = createFilterId(config.key, group.key)
                    Vue.set(state.facetCounts, filterId, group.count)
                })
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
            if (getters.filtersAsString) query.filter = getters.filtersAsString
            if (state.sort) query["sort"] = state.sort + ":desc"
            return query
        },
        groupByQuery: (state, getters) => (key) => {
            const query = {}
            if (getters.filtersAsString) query.filter = getters.filtersAsStringExceptForThisOneKey(key)
            query.group_by = key
            return query
        },
        searchApiUrl(state, getters) {
            return api.getUrl(state.entityType, getters.searchQuery)
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
        filtersAsString(state, getters) {
            const filterStrings = [...state.appliedFilters]
            if (state.textSearch) {
                filterStrings.push(`display_name.search:${state.textSearch}`)
            }
            filterStrings.sort()
            return filterStrings.join(",")
        },

        // this is a yucky hack
        filtersAsStringExceptForThisOneKey: (state, getters) => (keyToOmit) => {
            const filterStrings = [...state.appliedFilters].filter(f => {
                const key = f.split(":")[0]
                return key != keyToOmit
            })

            if (state.textSearch) {
                filterStrings.push(`display_name.search:${state.textSearch}`)
            }
            filterStrings.sort()
            return filterStrings.join(",")
        },


        facetCountFilters(state, getters) {
            Object.entries(state.facetCounts).map(([id, count]) => {
                const [key, value] = id.split(":")
                return createFilter({key, value, count})
            })
        },

        appliedFilters(state, getters) {
            state.appliedFilters.map(id => {
                const [key, value] = id.split(":")
                return createFilter({
                    key,
                    value,
                    count: state.resultsCount
                })

            })
        },




    },
    modules: {}
})
