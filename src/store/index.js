import { createStore } from 'vuex';
import axios from 'axios';
import user from "@/store/user.store";
import { entityConfigs } from '@/entityConfigs';
import { facetsByCategory } from '@/facetConfigUtils';
import { urlBase, axiosConfig } from '@/apiConfig';
import { api } from '@/api';

// Conversion: 1 credit = $0.0001 (10,000 credits = $1)
const CREDIT_TO_USD = 0.0001;

export function formatUsd(dollars, decimals = 2) {
    if (dollars == null) return '$0.00';
    return '$' + Number(dollars).toFixed(decimals);
}

export function creditsToUsd(credits) {
    if (credits == null) return 0;
    return Math.round(credits * CREDIT_TO_USD * 10000) / 10000;
}

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
        oqlViewMode: localStorage.getItem('oql-view-mode') ? JSON.parse(localStorage.getItem('oql-view-mode')) : 'filters',
        isInitialLoad: true, // used to for bypassing cache on freshloads
        // Centralized query object - fetched once on page load, used by all view modes
        queryObject: null,
        queryObjectLoading: false,
        queryObjectError: null,
        showEntityPageStats: false, // show "Key stats" and "Top works" on entity pages
        plans: [], // available plans loaded at app boot
        defaultApiMaxPerDay: 10000, // default credits per day for users without a plan
        rateLimitData: null,
        pendingPurchaseCredits: 0, // optimistic credits awaiting webhook
        baselineOnetimeBalance: null, // real balance from first fetch after purchase
        featureFlags: {
            aliceFeatures: localStorage.getItem('featureFlag-aliceFeatures') === 'true',
        },
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
        setOqlViewMode(state, value) {
            state.oqlViewMode = value;
            localStorage.setItem('oql-view-mode', JSON.stringify(value));
        },
        setQueryObject(state, queryObject) {
            state.queryObject = queryObject;
            state.queryObjectError = null;
        },
        setQueryObjectLoading(state, loading) {
            state.queryObjectLoading = loading;
        },
        setQueryObjectError(state, error) {
            state.queryObjectError = error;
            state.queryObject = null;
        },
        clearQueryObject(state) {
            state.queryObject = null;
            state.queryObjectError = null;
            state.queryObjectLoading = false;
        },
        setPlans(state, plans) {
            state.plans = plans;
        },
        setDefaultApiMaxPerDay(state, value) {
            state.defaultApiMaxPerDay = value;
        },
        setPendingPurchaseCredits(state, credits) {
            state.pendingPurchaseCredits = credits;
            state.baselineOnetimeBalance = null; // reset; first fetch will set it
        },
        setRateLimitData(state, data) {
            // If there are pending optimistic credits (purchase awaiting webhook),
            // merge them into incoming data so they aren't overwritten by stale fetches.
            if (state.pendingPurchaseCredits > 0 && data) {
                const realBalance = data.onetime_credits_balance || 0;

                if (state.baselineOnetimeBalance === null) {
                    // First fetch after purchase — save as baseline
                    state.baselineOnetimeBalance = realBalance;
                }

                if (realBalance >= state.baselineOnetimeBalance + state.pendingPurchaseCredits) {
                    // Real data increased by at least the purchase amount — webhook processed
                    state.pendingPurchaseCredits = 0;
                    state.baselineOnetimeBalance = null;
                } else {
                    // Webhook hasn't processed yet — add pending credits to both legacy and USD fields
                    const pendingUsd = creditsToUsd(state.pendingPurchaseCredits);
                    data = {
                        ...data,
                        onetime_credits_balance: realBalance + state.pendingPurchaseCredits,
                        onetime_credits_remaining: (data.onetime_credits_remaining || 0) + state.pendingPurchaseCredits,
                        prepaid_balance_usd: (data.prepaid_balance_usd || 0) + pendingUsd,
                        prepaid_remaining_usd: (data.prepaid_remaining_usd || 0) + pendingUsd,
                    };
                }
            }
            state.rateLimitData = data;
        },
        setFeatureFlag(state, { flag, value }) {
            state.featureFlags[flag] = value;
            localStorage.setItem(`featureFlag-${flag}`, value);
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
        async fetchRateLimitData({ commit, state }, options) {
            const fresh = options?.fresh;
            const apiKey = state.user?.apiKey;
            if (!apiKey) return;
            try {
                const url = fresh
                    ? `${urlBase.api}/rate-limit?fresh=1`
                    : `${urlBase.api}/rate-limit`;
                const resp = await axios.get(url, axiosConfig());
                commit('setRateLimitData', resp.data?.rate_limit || null);
            } catch (e) {
                console.warn('Failed to fetch rate limit data:', e);
            }
        },
        async fetchQueryObject({ commit }, { entityType, filter, sort, sample }) {
            commit('setQueryObjectLoading', true);
            try {
                const response = await api.getQuery({
                    entity_type: entityType,
                    filter: filter || null,
                    sort: sort || null,
                    sample: sample ? parseInt(sample, 10) : null,
                });
                commit('setQueryObject', response);
            } catch (e) {
                commit('setQueryObjectError', e.message || 'Failed to fetch query');
            } finally {
                commit('setQueryObjectLoading', false);
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
        oqlViewMode(state) {
            return state.oqlViewMode;
        },
        queryObject(state) {
            return state.queryObject;
        },
        queryObjectLoading(state) {
            return state.queryObjectLoading;
        },
        queryObjectError(state) {
            return state.queryObjectError;
        },
        rateLimitData(state) {
            return state.rateLimitData;
        },
        defaultDailyBudgetUsd(state) {
            return creditsToUsd(state.defaultApiMaxPerDay);
        },
        featureFlags(state) {
            return { ...state.featureFlags, newSearch: state.featureFlags.aliceFeatures };
        },
    },
})
