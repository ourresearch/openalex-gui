import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";
import sanitizeHtml from 'sanitize-html';


import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {
    filtersFromUrlStr,
    filtersAsUrlStr,
    makeResultsFiltersFromApi,
    createSimpleFilter
} from "../filterConfigs";
import {entityTypes, entityTypeFromId, idsAreEqual} from "../util";
import {entityConfigs} from "../entityConfigs";


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
        // noTextSearch: "publication_date:desc",
        noTextSearch: "cited_by_count:desc",
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
        snackbarIcon: null,

        showFiltersDrawer: false,
        facetZoom: null,

        // entity stuff
        // entityZoomData: null,
        // zoomId: null,

        zoomIdsStack: [],
        zoomDataResponses: [],

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
        snackbar(state, arg, icon) {
            state.snackbarIsOpen = true;
            if (typeof arg === "string") {
                state.snackbarMsg = arg
                return
            }
            state.snackbarMsg = arg.msg
             state.snackbarIcon = arg.icon
        },
        closeSnackbar(state) {
            state.snackbarMsg = ""
            state.snackbarIsOpen = false
        },
        toggleFiltersDrawer(state) {
            state.showFiltersDrawer = !state.showFiltersDrawer
        },
        setFacetZoom(state, facetKey) {
            console.log("setFaectzoom", facetKey)
            state.facetZoom = facetKey
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
            await router.push(routerPushTo)
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
            // state.results = []
            commit("setEntityType", router.currentRoute.params.entityType)
            commit("setTextSearch", router.currentRoute.query.search)
            commit("setPage", router.currentRoute.query.page)

            if (router.currentRoute.query.zoom) {
                state.zoomDataResponses = []

                state.zoomIdsStack = router.currentRoute.query.zoom.split(",")
                state.zoomIdsStack.forEach(zoomId => {
                    if (zoomId.indexOf("filters") === 0){
                        state.zoomDataResponses.push({
                            display_name: zoomId
                        })
                    }
                    else {
                        const pathName = entityTypeFromId(zoomId) + "/" + zoomId
                        // console.log("bootFromUrl calling pathName", pathName)

                        // do this async to save time, and to keep results from jerky scroll behavior
                        api.get(pathName).then(resp => {
                            state.zoomDataResponses.push(resp)
                        })
                    }
                })
            }
            else {

                state.zoomDataResponses = []
                state.zoomIdsStack = []
            }


            // this must be after setting the text search, because it affects the defaults
            if (router.currentRoute.query.sort) {
                commit("setSort", router.currentRoute.query.sort)
            } else {
                commit("setSort", getters.defaultSort)
            }

            state.inputFilters = filtersFromUrlStr(router.currentRoute.query.filter)

            await dispatch("doSearch")
        },

        // eslint-disable-next-line no-unused-vars
        // async doTextSearch({commit, getters, dispatch, state}, {entityType, searchString}) {
        //     if (entityType !== state.entityType) commit("resetSearch")
        //
        //     commit("setEntityType", entityType)
        //     state.textSearch = searchString
        //     commit("setSort", getters.defaultSort)
        //
        //     // await dispatch("doSearch")
        //     dispatch("pushSearchUrl")
        // },
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
            console.log("addInputFilters", filters)
            filters.forEach(f => {
                commit("addInputFilter", f)
            })
            commit("setPage", 1)
            // await dispatch("doSearch")
            await dispatch("pushSearchUrl")
        },
        // eslint-disable-next-line no-unused-vars
        async removeInputFilters({commit, getters, dispatch, state}, filters) {
            filters.forEach(f => {
                commit("removeInputFilter", f)
            })
            commit("setPage", 1)
            // await dispatch("doSearch")
            await dispatch("pushSearchUrl")
        },
        // eslint-disable-next-line no-unused-vars
        async removeAllInputFilters({commit, getters, dispatch, state}) {
            state.inputFilters = []
            commit("setPage", 1)
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


            try {
                const resp = await api.get(state.entityType, getters.searchQueryBase)
                state.results = resp.results.map(r => {
                    return {
                        ...r,
                        safeTitle: sanitizeHtml(r.display_name, {
                            allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
                        }),
                    }
                })
                // state.resultsEntityType = state.entityType
                state.responseTime = resp.meta.db_response_time_ms
                state.resultsCount = resp.meta.count

                if (getters.inputFiltersAsString) {
                    const path = `${state.entityType}/filters/${getters.inputFiltersAsString}`
                    const params = (state.textSearch) ? {search: state.textSearch} : {}
                    const filtersResp = await api.get(path, params)

                    state.resultsFilters = makeResultsFiltersFromApi(filtersResp.filters)
                } else {
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
        // async setEntityZoom({commit, getters, dispatch, state}, id) {
        //     console.log("setting entity zoom", id)
        //     state.zoomId = id
        //     dispatch("pushSearchUrl")
        // },
    },
    getters: {
        resultsFilters(state, getters) {
            return state.resultsFilters
        },
        entityType(state) { return state.entityType},
        showFiltersDrawer(state) { return state.showFiltersDrawer},
        facetZoom(state) { return state.facetZoom},

        searchIsLoading(state) { return state.isLoading},
        results(state) { return state.results},
        resultsCount(state) { return state.resultsCount},
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
        // stuff used by both the server and UI
        searchQueryBase(state, getters) {
            const query = {}
            if (state.page > 1) query.page = state.page
            if (getters.inputFiltersAsString) query.filter = getters.inputFiltersAsString

            if (state.sort && state.sort !== getters.defaultSort) query["sort"] = state.sort
            if (state.textSearch) query.search = state.textSearch
            return query
        },

        // adds stuff just used by the ui
        searchQuery(state, getters) {
            const ret = getters.searchQueryBase
            if (getters.zoomId) ret.zoom = getters.zoomId
            return ret
        },
        // adds stuff just used by the ui
        textSearch(state, getters) {
            return state.textSearch
        },
        zoomId(state) {
            return state.zoomIdsStack.slice(-1)[0] // last item in stack
        },
        zoomType(state) {
            const lastInStack = state.zoomIdsStack.slice(-1)[0]
            if (!lastInStack) return
            return entityTypeFromId(lastInStack)
        },
        zoomTypeConfig(state) {
            const lastInStack = state.zoomIdsStack.slice(-1)[0]
            if (!lastInStack) return
            const entityType = entityTypeFromId(lastInStack)
            return entityConfigs[entityType]
        },
        entityZoomData(state) {
            const lastInStack = state.zoomIdsStack.slice(-1)[0]
            if (!lastInStack) return
            return state.zoomDataResponses.find(resp => {

                return idsAreEqual(resp.id, lastInStack)
            })
        },
        entityZoomHistoryData(state) {
            const lastInStack = state.zoomIdsStack.slice(-1)[0]
            if (!lastInStack) return

            return state.zoomDataResponses.filter(resp => !idsAreEqual(resp.id, lastInStack))


            return state.zoomIdsStack.map(zoomId => {
                return state.zoomDataResponses.find(zoomData => {
                    idsAreEqual(zoomData.id, zoomId)
                })
            })
        },
        defaultSort(state, getters) {
            return sortDefaults[state.entityType][(state.textSearch) ? "textSearch" : "noTextSearch"]
        },
        searchApiUrl(state, getters) {
            return api.createUrl(state.entityType, getters.searchQuery)
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
