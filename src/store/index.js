import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";

import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {
    filtersFromUrlStr,
    filtersAsUrlStr,
    makeResultsFiltersFromApi,
    createSimpleFilter
} from "../filterConfigs";
import {entityTypes} from "../util";


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

const sortDefaults = {
    works: {
        textSearch: "relevance_score:desc",
        noTextSearch: "publication_date:desc",
    },
    authors: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    venues: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    institutions: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    concepts: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
}

const sortConfigs = [
    {
        key: "cited_by_count:desc",
        displayName: "Citations",
        showForEntityTypes: entityTypes.all(),
    },
    {
        // only for non-work entities
        key: "works_count:desc",
        displayName: "Works",
        showForEntityTypes: entityTypes.allExcept("works"),
    },
    {
        // only for works
        key: "publication_date:desc",
        displayName: "Date",
        showForEntityTypes: ["works"],
    },
    {
        // only if there's a text search on
        key: "relevance_score:desc",
        displayName: "Relevance",
        showForEntityTypes: entityTypes.all(),
        requiresTextSearch: true,
    },
]


const stateDefaults = function () {
    const ret = {
        entityType: "works",
        // resultsEntityType: "works",

        inputFilters: [],
        resultsFilters: [],

        filterObjects: [],
        appliedFilterObjects: [],

        textSearch: "",
        page: 1,
        results: [],
        sort: null,
        responseTime: null,
        resultsCount: null,
        isLoading: false,

        // this really should go someplace else
        snackbarIsOpen: false,
        snackbarMsg: "",

        // entity stuff
        entityZoomData: null,
        entityZoomType: null,
        entityZoomIsOpen: false,
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
        snackbar(state, msg) {
            state.snackbarMsg = msg
            state.snackbarIsOpen = true
        },
        closeSnackbar(state) {
            state.snackbarMsg = ""
            state.snackbarIsOpen = false
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setTextSearch(state, textSearch) {
            state.textSearch = textSearch;
        },
        setPage(state, page) {
            const pageInt = parseInt(page)
            state.page = (isNaN(pageInt)) ? 1 : pageInt
        },
        setSort(state, sortKey) {
            const mySortConfig = sortConfigs.find(c => c.key === sortKey)
            if (mySortConfig) state.sort = mySortConfig.key
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
        // mess with the URL
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async pushSearchUrl({commit, getters, dispatch, state}) {
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
        },



        // *****************************************
        // change stuff and then do a search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async bootFromUrl({commit, getters, dispatch, state}) {
            // commit("resetSearch")
            state.results = []
            commit("setEntityType", router.currentRoute.params.entityType)
            commit("setTextSearch", router.currentRoute.query.search)
            commit("setPage", router.currentRoute.query.page)

            // this must be after setting the text search, because it affects the defaults
            if (router.currentRoute.query.sort) {
                commit("setSort", router.currentRoute.query.sort)
            }
            else {
                commit("setSort", getters.defaultSort)
            }

            state.inputFilters = filtersFromUrlStr(router.currentRoute.query.filter)
            await dispatch("doSearch")
        },

        // eslint-disable-next-line no-unused-vars
        async doTextSearch({commit, getters, dispatch, state}, {entityType, searchString}) {
            // commit("resetSearch")
            // commit("setPage", 1)
            // commit("setSort", "relevance_score:desc")
            if (entityType !== state.entityType) commit("resetSearch")

            commit("setEntityType", entityType)
            state.textSearch = searchString
            // await dispatch("doSearch")
            dispatch("pushSearchUrl")
        },
        // eslint-disable-next-line no-unused-vars
        async setSort({commit, getters, dispatch, state}, newSortValue) {
            commit("setSort", newSortValue)
            commit("setPage", 1)
            // await dispatch("doSearch")
            dispatch("pushSearchUrl")
        },
        // eslint-disable-next-line no-unused-vars
        async setPage({commit, getters, dispatch, state}, newPage) {
            commit("setPage", newPage)
            // await dispatch("doSearch")
            dispatch("pushSearchUrl")
        },

        // eslint-disable-next-line no-unused-vars
        async addInputFilters({commit, getters, dispatch, state}, filters) {
            console.log("Vuex addInputFilters", filters)
            filters.forEach(f => {
                commit("addInputFilter", f)
            })
            commit("setPage", 1)
            // await dispatch("doSearch")
            dispatch("pushSearchUrl")
        },
        // eslint-disable-next-line no-unused-vars
        async removeInputFilters({commit, getters, dispatch, state}, filters) {
            console.log("Vuex removeInputFilters", filters)
            filters.forEach(f => {
                commit("removeInputFilter", f)
            })
            commit("setPage", 1)
            // await dispatch("doSearch")
            dispatch("pushSearchUrl")
        },

        // eslint-disable-next-line no-unused-vars
        async replaceInputFilters({commit, getters, dispatch, state}, filters) {
            console.log("Vuex replaceInputFilters", filters)
            state.inputFilters = []
            await dispatch("addInputFilters", filters)
        },


        // *****************************************
        // do the search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}, loadFromRoute) {
            state.isLoading = true
            // dispatch("pushSearchUrl")
            // if (state.entityType !== this.state.resultsEntityType) commit("resetSearch")

            try {
                const resp = await api.get(state.entityType, getters.searchQuery)
                state.results = resp.results
                // state.resultsEntityType = state.entityType
                state.responseTime = resp.meta.db_response_time_ms
                state.resultsCount = resp.meta.count

                if (getters.inputFiltersAsString) {
                    const path = `${state.entityType}/filters/${getters.inputFiltersAsString}`
                    const params = (state.textSearch) ? {search:state.textSearch} : {}
                    const filtersResp = await api.get(path, params)
                    state.resultsFilters = makeResultsFiltersFromApi(filtersResp.filters)
                }
                else {
                    state.resultsFilters = []
                }
            } finally {
                state.isLoading = false
            }

        },


        // *****************************************
        // entityZoom stuff
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async setEntityZoom({commit, getters, dispatch, state}, id) {
            state.entityZoomIsOpen = true
            state.entityZoomType = entityTypes.fromId(id)
            const pathName = state.entityZoomType + "/" + id
            state.entityZoomData = await api.get(pathName)
        },

        // eslint-disable-next-line no-unused-vars
        closeEntityZoomDrawer({commit, getters, dispatch, state}) {
            // if (!state.entityType) state.entityType = state.entityZoomType
            // dispatch("pushSearchUrl")
            state.entityZoomIsOpen = false
            state.entityZoomType = null
            state.entityZoomData = null
        },


    },
    getters: {
        sortObjectOptions(state, getters) {
            if (!state.results.length) return
            return sortConfigs.filter(sortConfig => {
                if (sortConfig.requiresTextSearch && !state.textSearch) return false
                if (!sortConfig.showForEntityTypes.includes(state.entityType)) return false
                return true
            })
        },
        sortObject(state, getters) {
            return sortConfigs.find(sortOption => {
                return sortOption.key === state.sort
            })
        },
        searchQuery(state, getters) {
            const query = {}
            if (state.page > 1) query.page = state.page
            if (getters.inputFiltersAsString) query.filter = getters.inputFiltersAsString
            if (state.sort && state.sort !==  getters.defaultSort) query["sort"] = state.sort
            if (state.textSearch) query.search = state.textSearch
            return query
        },
        defaultSort(state, getters){
            return sortDefaults[state.entityType][(state.textSearch) ? "textSearch" : "noTextSearch"]
        },
        searchApiUrl(state, getters) {
            return api.getUrl(state.entityType, getters.searchQuery)
        },
        searchParamsAsStringToWatch(state, getters) {
            const copy = [...state.resultsFilters, state.textSearch]
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
            const copy = [...state.inputFilters]
            copy.sort()
            return filtersAsUrlStr(copy)
        },
        allOaStatusFiltersAreActive(state) {
            const oaStatusFilter = state.resultsFilters.find(f => f.key === "oa_status")

        }

    },
    modules: {}
})
