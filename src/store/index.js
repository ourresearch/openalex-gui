import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {createFilter} from "../views/filterConfigs";

Vue.use(Vuex)






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
        setSort(state, sortKey) {
            // if we don't recognize this key, set it to the default
            if (!sortConfigs.some(c => c.key === sortKey)) {
                sortKey = "cited_by_count"
            }
            state.sort = sortKey
        },
        setFilterCount(state, {key, value, count}) {
            const myFilter = state.filtersList.find(f => {
                return f.key === key && f.value === value
            })
            if (myFilter) myFilter.count = count
        },
        setFilterIsApplied(state, {key, value, isApplied}) {
            const myFilter = state.filtersList.find(f => {
                return f.key === key && f.value === value
            })
            if (myFilter) myFilter.isApplied = isApplied
        },
        addFilter(state, filterObj) {
            // first, check: is there another filter loaded that has this exact same key and value?
            const isFilterAlreadyThere = state.filtersList.some(f => {
                return f.id === filterObj.id
            })
            if (!isFilterAlreadyThere)  {
                state.filtersList.push(filterObj)
            }
        },

    },
    actions: {
        // this is an sync functino, even though it's in actions, because it needs to call mutations
        // eslint-disable-next-line no-unused-vars
        applyFiltersFromString({commit, getters, dispatch, state}, filtersString) {
            if (!filtersString) return
            if (filtersString.indexOf(":") === -1) return
            filtersString.split(",").forEach(filterString => {
                const [key, value] = filterString.split(":");

                if (key === "display_name.search") {
                    state.textSearch = value
                }
                else {
                    const myFilter = createFilter({key, value, isApplied: true})
                    dispatch("mergeNewFilter", myFilter)
                }
            })
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
        async setFilterIsApplied({commit, getters, dispatch, state}, filterData) {
            const filterObj = createFilter(filterData)
            commit("setFilterIsApplied", filterObj)
            commit("setPage", 1)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setFilterIsAppliedMultiple({commit, getters, dispatch, state}, filterObjectsList) {
            filterObjectsList.forEach(filterObj => {
                commit("setFilterIsApplied", filterObj)
            })
            commit("setPage", 1)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async setPage({commit, getters, dispatch, state}, newPage) {
            commit("setPage", newPage)
            await dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async mergeNewFilter({commit, getters, dispatch, state}, filterObj) {
            commit("addFilter", filterObj)
            if (Number.isFinite(filterObj.count)) commit("setFilterCount", filterObj)
            if (typeof filterObj.isApplied === "boolean") commit("setFilterIsApplied", filterObj)
        },
        // eslint-disable-next-line no-unused-vars
        async setFilters({commit, getters, dispatch, state}, filterObjectsList) {
            filterObjectsList.forEach(filter => {
                dispatch("mergeNewFilter", filter)
            })
            dispatch("doSearch")
        },
        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {
            state.isLoading = true
            if (loadFromRoute) {
                state.entityType = router.currentRoute.params.entityType
                commit("setPage", router.currentRoute.query.page)
                commit("setSort", router.currentRoute.query.sort)
                dispatch("applyFiltersFromString", router.currentRoute.query.filter)
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
                state.results = resp.results
                state.responseTime = resp.meta.db_response_time_ms
                state.resultsCount = resp.meta.count

            } finally {
                state.isLoading = false
            }


            // state.groupBys = []
            for (let i = 0; i < getters.searchFacetConfigs.length; i++) {
                const config = getters.searchFacetConfigs[i]
                const resp = await api.get(state.entityType, getters.groupByQuery(config.key))
                resp.group_by.slice(0,4).forEach(group => {
                    const myFilter = createFilter({
                        key: config.key,
                        value: group.key,
                        count: group.count,
                    })
                    dispatch("mergeNewFilter", myFilter)
                })


                // state.groupBys.push({
                //     key: config.key,
                //     displayName: config.displayName,
                //     values: [],
                    // groups: await Promise.all(resp.group_by.slice(0, 5).map(async group => {
                    //     const resp = await api.get(group.key)
                    //     const display_name = resp.display_name
                    //
                    //     return {
                    //         ...group,
                    //         display_name
                    //     }
                    // })),
                // })

            }
        }
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

        searchTerm(state) {
            state.filters.find(f => f.id === "display_name").value
        },
        entityTypeAsPath(state) {
            return `/${state.entityType}`
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
            const filterStrings = state.filtersList
                .filter(f => f.isApplied)
                .map(f => {
                    return `${f.key}:${f.value}`
                })
            if (state.textSearch){
                filterStrings.push(`display_name.search:${state.textSearch}`)
            }
            filterStrings.sort()
            return filterStrings.join(",")
        },

        // this is a ghastly hack
        filtersAsStringExceptForThisOneKey: (state, getters) => (key) => {
            const filterStrings = state.filtersList
                .filter(f => f.isApplied)
                .filter(f => f.key !== key)
                .map(f => {
                    return `${f.key}:${f.value}`
                })
            if (state.textSearch){
                filterStrings.push(`display_name.search:${state.textSearch}`)
            }
            filterStrings.sort()
            return filterStrings.join(",")
        },


    },
    modules: {}
})
