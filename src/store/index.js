import Vue from 'vue'
import Vuex from 'vuex'
import router from "../router";
import sanitizeHtml from 'sanitize-html';


import {api} from "../api";
import {facetConfigs} from "../facetConfigs";
import {
    filtersFromUrlStr,
    filtersAsUrlStr,
    filtersFromFiltersApiResponse,
    createSimpleFilter
} from "../filterConfigs";
import {entityTypes, entityTypeFromId, idsAreEqual} from "../util";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";

Vue.use(Vuex)




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
        resultsObject: null,
        velocity: null,
        sort: null,
        responseTime: null,
        resultsCount: null,
        isLoading: false,

        // this really should go someplace else
        snackbarIsOpen: false,
        snackbarMsg: "",
        snackbarIcon: null,
        apiDialogIsOpen: true,
        apiDialogUrl: "",

        showFiltersDrawer: false,
        facetZoom: null,
        facetsListDialogIsOpen: false,

        // entity stuff
        // entityZoomData: null,
        // zoomId: null,

        zoomIdsStack: [],
        zoomDataResponses: [],

        // other
        showYearRange: false,
        facetsToRequireAll: [],
        exportProgressUrl: null,

        filterOptionChipOpenMenu: null,

        tabs: [
            {
                name: "First tab",
                url: ""
            }
        ]
    }
    return ret
}


export default new Vuex.Store({
    // state: stateDefaults(),
    state: stateDefaults(),
    modules: {
        user,
    },
    mutations: {
        setApiDialogUrl(state, url) {
            state.apiDialogUrl = url
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
        setGlobalIsLoading(state, isLoading) {
            state.isLoading = !!isLoading
        },
        setFacetZoom(state, facetKey) {
            console.log("setFacetZoom", facetKey)
            // state.facetsListDialogIsOpen = true
            state.facetZoom = facetKey
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            })
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
        addInputFilter(state, filter) {
            state.inputFilters = state.inputFilters.filter(f => {
                // check for key + value, not f.toStr becuase we want to ignore negation symbol "!"
                return f.kv !== filter.kv
            })
            state.inputFilters.push(filter)
        },
        removeInputFilter(state, filter) {
            state.inputFilters = state.inputFilters.filter(f => {
                // check for key + value, not f.toStr becuase we want to ignore negation symbol "!"
                return f.kv !== filter.kv
            })
        },
        removeAllInputFilters(state) {
            state.inputFilters = []
        },
        replaceInputFilter(state, filter) {
            const newFilters = state.inputFilters.filter(f => {
                return f.key !== filter.key
            })
            newFilters.push(filter)
            state.inputFilters = newFilters
        },
        setFiltersZoom(state, arg) {
            const filterKeys = facetConfigs().map(f => f.key)
            if (filterKeys.includes(arg)) {
                state.filtersZoom = arg
            } else {
                state.filtersZoom = !!arg
            }
        },
        openFacetsDialog(state) {
            state.facetZoom = null
            state.facetsListDialogIsOpen = true
        },

        closeFacetsDialog(state) {
            console.log("closeFacetsDialog")
            state.facetZoom = null
            state.facetsListDialogIsOpen = false
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

        // eslint-disable-next-line no-unused-vars
        async setExport({commit, getters, dispatch, state}, format) {
            const filterStr = router.currentRoute.query.filter
            const params = [
                `filter=${filterStr}`,
                `format=${format}`,
            ]
            const url = `https://export.openalex.org/works?` + params.join("&")
            const resp = await axios.get(url)
            console.log("startExport resp:", resp)
            state.exportProgressUrl = resp.data.progress_url
            return state.exportProgressUrl
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


        // used once
        // eslint-disable-next-line no-unused-vars
        async removeAllInputFilters({commit, getters, dispatch, state}) {
            commit("removeAllInputFilters")
            commit("setPage", 1)
            dispatch("pushSearchUrl")
        },



        // used a lot
        // eslint-disable-next-line no-unused-vars
        async replaceInputFilter({commit, getters, dispatch, state}, filter) {
            commit("replaceInputFilter", filter)
            commit("setPage", 1)
            dispatch("pushSearchUrl")
        },


        // *****************************************
        // do the search
        // *****************************************

        // eslint-disable-next-line no-unused-vars
        async getResults({commit, getters, dispatch, state}) {
            const resp = await api.get(state.entityType, getters.searchQueryBase)
            state.resultsObject = resp
            state.results = resp.results.map(r => {
                return {
                    ...r,
                    safeTitle: sanitizeHtml(r.display_name, {
                        allowedTags: ['b', 'i', 'em', 'strong', 'a'],
                    }),
                }
            })
            // state.resultsEntityType = state.entityType
            state.responseTime = resp.meta.db_response_time_ms
            state.resultsCount = resp.meta.count

        },
        // eslint-disable-next-line no-unused-vars
        async getVelocity({commit, getters, dispatch, state}) {
            const filterStr = (getters.inputFiltersAsString) || "is_paratext:true|false|null"
            const userApiBaseUrl = "https://user.openalex.org"
            const url = userApiBaseUrl + `/alert/work/${filterStr}/velocity`;
            const resp = await axios.get(url)
            state.velocity = resp.data
        },
        // eslint-disable-next-line no-unused-vars
        async getResultsFilters({commit, getters, dispatch, state}) {
            if (getters.inputFiltersAsString) {
                const path = `${state.entityType}/filters/${getters.inputFiltersAsString}`
                const params = (state.textSearch) ? {search: state.textSearch} : {}
                const filtersResp = await api.get(path, params)

                state.resultsFilters = filtersFromFiltersApiResponse(state.entityType, filtersResp.filters)
            } else {
                state.resultsFilters = []
            }

        },
        // eslint-disable-next-line no-unused-vars
        async doSearch({commit, getters, dispatch, state}) {
            state.isLoading = true
            try {
                await Promise.all([
                    this.dispatch("getResults"),
                    this.dispatch("getResultsFilters"),
                    this.dispatch("getVelocity")
                ])

            } finally {
                state.isLoading = false
            }

        },


    },
    getters: {
        apiDialogUrl(state) {
            return state.apiDialogUrl
        },
        resultsFilters(state, getters) {
            return state.resultsFilters
        },
        resultsFiltersAny(state, getters) {
            return state.resultsFilters.filter(f => !f.isNegated)
        },
        resultsFiltersNegated(state, getters) {
            return state.resultsFilters.filter(f => f.isNegated)
        },
        entityType(state) {
            return state.entityType
        },
        entityConfig(state) {
            return entityConfigs[state.entityType]
        },
        showFiltersDrawer(state) {
            return state.showFiltersDrawer
        },
        facetZoom(state) {
            return state.facetZoom
        },
        inputFilters(state) {
            return state.inputFilters
        },

        globalIsLoading(state) {
            return state.isLoading
        },
        results(state) {
            return state.results
        },
        velocity(state) {
            return state.velocity
        },
        velocityPermitsAlerts(state) {
            return state.velocity?.week < 100
        },
        resultsCount(state) {
            return state?.resultsObject?.meta?.count
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
            return api.createUrl(state.entityType, getters.searchQuery, true)
        },
        searchApiUrlForDisplay(state, getters) {
            return api.createUrl(state.entityType, getters.searchQuery, false)
        },
        searchParamsAsStringToWatch(state, getters) {
            const copy = [...state.resultsFilters, state.textSearch]
            copy.sort()
            return JSON.stringify(copy)
        },
        searchFacetConfigs(state) {
            return facetConfigs()
                .filter(config => {
                    return config.entityType === state.entityType  //s.indexOf(state.entityType) > -1
                })
        },
        inputFiltersAsString(state, getters) {
            const copy = [...state.inputFilters]
            copy.sort()
            return filtersAsUrlStr(copy, state.entityType)
        },
        allOaStatusFiltersAreActive(state) {
            const oaStatusFilter = state.resultsFilters.find(f => f.key === "oa_status")
        },
        filtersZoom(state) {
            return state.filtersZoom
        },
        facetsByCategory(state) {

            // .filter(c => {
            //     const filters = this.resultsFilters.filter(f => f.key === c.key)
            //     // hide the noOptions facets unless they have selected filters
            //     return !c.noOptions || filters.length
            // })


            return function (searchString) {
                return facetsByCategory(state.entityType, searchString)

            }

        },

    },
})
