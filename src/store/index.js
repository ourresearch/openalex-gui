import { createStore } from 'vuex';
import axios from 'axios';
import user from "@/store/user.store";
import { entityConfigs } from '@/entityConfigs';
import { facetsByCategory } from '@/facetConfigUtils';
import { urlBase, axiosConfig } from '@/apiConfig';

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
        exportProgressUrl: null,
        filterOptionChipOpenMenu: null,
        isApiEditorShowing: false,
        useV2: false,
        isInitialLoad: true, // used to for bypassing cache on freshloads
        showEntityPageStats: false, // show "Key stats" and "Top works" on entity pages
        plans: [], // available plans loaded at app boot
        defaultApiMaxPerDay: 100000, // default API limit for users without a plan
    }
    return ret;
}


export default createStore({
    state: stateDefaults(),
    modules: {
        user,
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
        setUseV2(state, value) {
            state.useV2 = value;
        },
        setShowEntityPageStats(state, value) {
            state.showEntityPageStats = value;
        },
        setPlans(state, plans) {
            state.plans = plans;
        },
        setDefaultApiMaxPerDay(state, value) {
            state.defaultApiMaxPerDay = value;
        },
    },  
    actions: {
        async fetchPlans({ commit }) {
            try {
                const res = await axios.get(
                    `${urlBase.userApi}/plans`,
                    axiosConfig({ userAuth: true })
                );
                commit('setPlans', res.data.results || []);
                if (res.data.meta?.default_api_max_per_day) {
                    commit('setDefaultApiMaxPerDay', res.data.meta.default_api_max_per_day);
                }
            } catch (e) {
                console.error('Failed to fetch plans:', e);
            }
        },
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
        textSearch(state) {
            return state.textSearch;
        },
        zoomId(state) {
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
        isLocalEnv() {
            return window.location.hostname === "localhost";
        },
        isStagingEnv() {
            return window.location.hostname === "staging.openalex.org";
        },
        isProductionEnv() {
            return window.location.hostname === "openalex.org";
        },
        environment(getters) {
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
        plans(state) {
            return state.plans;
        },
    },
})
