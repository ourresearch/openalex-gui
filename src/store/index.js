import Vue from 'vue'
import Vuex from 'vuex'
import {user} from "@/store/user.store";
import {search} from "@/store/search.store";


Vue.use(Vuex);

const stateDefaults = function () {
    const ret = {
        entityType: "works",
        activeFilter: null,
        activeFilterKey: null,
        newFilterKey: null,
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
        snackbarIsOpen: false,
        snackbarMsg: "",
        snackbarIcon: null,
        snackbarColor: undefined,
        zoomId: null,
        apiDialogIsOpen: true,
        apiDialogUrl: "",
        showFiltersDrawer: false,
        facetZoom: null,
        facetsListDialogIsOpen: false,
        zoomIdsStack: [],
        zoomDataResponses: [],
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
        isDevEnv: false,
        uiVariant: 'sentence-worksfirst', // for testing UI variations
        isInitialLoad: true, // used to for bypassing cache on freshloads
        testQueries: [],
    }
    return ret;
}


export default new Vuex.Store({
    state: stateDefaults(),
    modules: {
        user,
        search,
    },
    mutations: {
        setApiDialogUrl(state, url) {
            state.apiDialogUrl = url;
        },
        snackbar(state, arg) {
            state.snackbarIsOpen = true;
            if (typeof arg === "string") {
                state.snackbarMsg = arg;
            } else {
                state.snackbarMsg = arg.msg;
                state.snackbarColor = arg.color;
            }
        },
        closeSnackbar(state) {
            state.snackbarMsg = "";
            state.snackbarIsOpen = false;
            state.snackbarColor = undefined;
        },
        setGlobalIsLoading(state, isLoading) {
            state.isLoading = !!isLoading;
        },
        toggleFiltersDrawer(state) {
            state.showFiltersDrawer = !state.showFiltersDrawer;
        },
        setZoomId(state, id) {
            state.zoomId = id;
        },
        setEntityType(state, entityType) {
            state.entityType = entityType;
        },
        setIsInitialLoad(state, isInitialLoad) {
            state.isInitialLoad = isInitialLoad;
        },
        setUiVariant(state, uiVariant) {
            state.uiVariant = uiVariant;
        },
    },  
    actions: {
    },
    getters: {
        apiDialogUrl(state) {
            return state.apiDialogUrl;
        },
        entityType(state) {
            return state.entityType;
        },
        entityConfig(state) {
            return entityConfigs[state.entityType];
        },
        showFiltersDrawer(state) {
            return state.showFiltersDrawer;
        },
        facetZoom(state) {
            return state.facetZoom;
        },
        globalIsLoading(state) {
            return state.isLoading;
        },
        results(state) {
            return state.results;
        },
        resultsCount(state) {
            return state?.resultsObject?.meta?.count;
        },
        // adds stuff just used by the ui
        textSearch(state, getters) {
            return state.textSearch;
        },
        zoomId(state) {
            // return state.zoomIdsStack.slice(-1)[0]; // last item in stack
            return state.zoomId;
        },
        filtersZoom(state) {
            return state.filtersZoom
        },
        facetsByCategory(state) {
            return function (searchString) {
                return facetsByCategory(state.entityType, searchString);
            };
        },
        uiVariant(state) {
            return state.uiVariant;
        },
        isLocalEnv(state) {
            return window.location.hostname === "localhost";
        },
        isStagingEnv(state) {
            return window.location.hostname === "staging.openalex.org";
        },
        isProductionEnv(state) {
            return window.location.hostname === "openalex.org";
        },
        environment(state, getters) {
            if (getters.isLocalEnv) {
                return "local";
            } else if (getters.isStagingEnv) {
                return "staging";
            } else if (getters.isProductionEnv) {
                return "production";
            } else {
                return "unknown";
            }
        },
    },
})
