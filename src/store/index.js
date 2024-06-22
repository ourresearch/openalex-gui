import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";

Vue.use(Vuex)


const stateDefaults = function () {
    const ret = {
        entityType: "works",
        activeFilter: null,
        activeFilterKey: null,
        newFilterKey: null,
        // resultsEntityType: "works",


        filterObjects: [],
        appliedFilterObjects: [],

        textSearch: "",
        page: 1,
        results: [],
        resultsObject: null,
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

        zoomIdsStack: [],
        zoomDataResponses: [],

        // other
        exportProgressUrl: null,

        filterOptionChipOpenMenu: null,
        isApiEditorShowing: false,
        showColumns: [
            "publication_year",
            "type",
            "open_access.is_oa",
            "cited_by_count",
        ],

        serpTabs: [
            {
                id: null,
                name: null,
                query: undefined,
            }
        ],

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
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },

    },
    actions: {
    },
    getters: {
        apiDialogUrl(state) {
            return state.apiDialogUrl
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
        globalIsLoading(state) {
            return state.isLoading
        },
        results(state) {
            return state.results
        },
        resultsCount(state) {
            return state?.resultsObject?.meta?.count
        },
        // adds stuff just used by the ui
        textSearch(state, getters) {
            return state.textSearch
        },
        zoomId(state) {
            return state.zoomIdsStack.slice(-1)[0] // last item in stack
        },
        filtersZoom(state) {
            return state.filtersZoom
        },
        facetsByCategory(state) {
            return function (searchString) {
                return facetsByCategory(state.entityType, searchString)

            }

        },

    },
})
