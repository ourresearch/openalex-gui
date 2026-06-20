import { createStore } from 'vuex';
import axios from 'axios';
import user from "@/store/user.store";
import selection from "@/store/selection.store";
import collections from "@/store/collections.store";
import oqlBuilder from "@/store/oqlBuilder.store";
import query from "@/store/query.store";
import { entityConfigs } from '@/entityConfigs';
import { facetsByCategory } from '@/facetConfigUtils';
import { urlBase, axiosConfig } from '@/apiConfig';
import { api } from '@/api';

// Conversion: 1 credit = $0.0001 (10,000 credits = $1)
const CREDIT_TO_USD = 0.0001;

export function formatUsd(dollars, decimals = 3) {
    if (dollars == null) return '$0.' + '0'.repeat(decimals);
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
        useV2: false,
        // SERP page size (results per page). List and table view keep INDEPENDENT
        // sizes so changing one never bleeds into the other (table wants dense
        // pages, list wants fewer tall cards). Persisted to localStorage; list
        // defaults 10, table defaults 100. url.js getPerPage picks by current view;
        // a deep-link `per_page` is adopted into the active view's size as a session
        // override (persist:false) without overwriting the saved preference.
        serpPageSize: parseInt(localStorage.getItem('serp-page-size'), 10) || 10,
        serpTablePageSize: parseInt(localStorage.getItem('serp-table-page-size'), 10) || 100,
        // SERP results presentation (list vs table) — recipient-local CHROME, kept
        // OFF the URL (#492). This reactive store is the source of truth so the
        // toggle updates the UI with no navigation; persisted to localStorage
        // (key `oax.resultsView`, zd#8973). url.isTableView reads this; a legacy
        // inbound `?view=table` is seeded here then stripped (see Serp.vue).
        serpResultsView: localStorage.getItem('oax.resultsView') === 'table' ? 'table' : 'list',
        // The "Show API query" overlay (#492) — session-only chrome, never
        // persisted, off the URL. Seeded from a legacy `?view=api` link, then
        // stripped. (Replaces the vestigial `isApiEditorShowing` flag below.)
        serpShowApi: false,
        // SERP basic/advanced mode SESSION override (#492 Phase 2) — recipient-local
        // chrome, OFF the URL. null = use the durable per-device pref (localStorage
        // `serpMode`). Set by an explicit mode switch (reactive, no navigation) and
        // seeded session-only from a legacy inbound `?mode=` (then the param is
        // stripped, see Serp.vue) so a shared link never rewrites a recipient's pref.
        serpModeOverride: null,
        // SERP sidebar group-by widget layout, keyed by entity type (#492 Phase 4).
        // Session-only chrome, OFF the URL (charter decision 33 — OQL can't represent
        // an ad-hoc widget layout; a real dashboard is the future home). An unset
        // entity falls back to entityConfigs `groupByDefaults` (see url.getGroupBy);
        // an empty array means the user cleared all widgets (distinct from unset).
        // Seeded session-only from a legacy inbound `?group_by=` (then stripped, see
        // Serp.vue) so a shared link no longer reproduces the sender's widget layout.
        serpGroupBy: {},
        isInitialLoad: true, // used to for bypassing cache on freshloads
        // Centralized query object - fetched once on page load, used by all view modes
        queryObject: null,
        queryObjectLoading: false,
        queryObjectError: null,
        // Structured validation error from the last OQL submit (#373), surfaced
        // inline in the OQL panel. Shape: {valid:false, errors:[{message,position,…}]}.
        oqlSubmitError: null,
        showEntityPageStats: true, // show metric rows + group-bys + works section on entity pages
        plans: [], // available plans loaded at app boot
        defaultApiMaxPerDay: 10000, // default credits per day for users without a plan
        rateLimitData: null,
        rateLimitLastFetchedAt: null,
        featureFlags: {},
        creditLimitDialogIsOpen: false,
    }
    return ret;
}


// Clear per-user store modules when the user logs out. Without this,
// signing in as user B in the same tab briefly renders user A's collections
// until something dispatches collections/fetchAll (security review M7).
const clearPerUserStateOnLogout = (store) => {
    store.subscribe((mutation) => {
        if (mutation.type === 'user/logout') {
            store.commit('collections/clear');
        }
    });
};

export default createStore({
    state: stateDefaults(),
    modules: {
        user,
        selection,
        collections,
        oqlBuilder,
        query,
    },
    plugins: [clearPerUserStateOnLogout],
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
        showCreditLimitDialog(state) {
            state.creditLimitDialogIsOpen = true;
        },
        closeCreditLimitDialog(state) {
            state.creditLimitDialogIsOpen = false;
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
        // persist:true for an explicit user pick (writes the durable preference);
        // persist:false for a session-only override adopted from a URL `per_page`.
        setSerpPageSize(state, { value, persist }) {
            state.serpPageSize = value;
            if (persist) localStorage.setItem('serp-page-size', String(value));
        },
        setSerpTablePageSize(state, { value, persist }) {
            state.serpTablePageSize = value;
            if (persist) localStorage.setItem('serp-table-page-size', String(value));
        },
        // #492: results presentation (list/table). persist:true writes the durable
        // localStorage pref; a bare/legacy load seeds the reactive state without it.
        setSerpResultsView(state, { value, persist }) {
            state.serpResultsView = value === 'table' ? 'table' : 'list';
            if (persist) {
                try { localStorage.setItem('oax.resultsView', state.serpResultsView); }
                catch (e) { /* private mode / quota — best-effort */ }
            }
        },
        // #492: the "Show API query" overlay. Session-only — never persisted.
        setSerpShowApi(state, value) {
            state.serpShowApi = !!value;
        },
        // #492 Phase 2: the basic/advanced session override. Session-only — the
        // durable pref is localStorage `serpMode`, written separately on a switch.
        setSerpModeOverride(state, value) {
            state.serpModeOverride = (value === 'basic' || value === 'advanced') ? value : null;
        },
        // #492 Phase 4: the SERP sidebar group-by widget layout, per entity type.
        // Reassign the object so Vuex sees the change; store a copy so callers that
        // mutate the returned array (e.g. drag-reorder splice) can't corrupt state.
        setSerpGroupBy(state, { entityType, keys }) {
            state.serpGroupBy = {
                ...state.serpGroupBy,
                [entityType]: Array.isArray(keys) ? [...keys] : [],
            };
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
        setOqlSubmitError(state, error) {
            state.oqlSubmitError = error;
        },
        setPlans(state, plans) {
            state.plans = plans;
        },
        setDefaultApiMaxPerDay(state, value) {
            state.defaultApiMaxPerDay = value;
        },
        setRateLimitData(state, data) {
            state.rateLimitData = data;
            state.rateLimitLastFetchedAt = Date.now();
        },
        setFeatureFlags(state, flagNames) {
            const flags = {};
            for (const name of flagNames) {
                flags[name] = true;
            }
            // Merge in locally-persisted flags (for UI-defined flags not yet in backend)
            try {
                const localFlags = JSON.parse(localStorage.getItem('localFeatureFlags') || '[]');
                for (const name of localFlags) {
                    flags[name] = true;
                }
            } catch (e) { /* ignore parse errors */ }
            state.featureFlags = flags;
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
        async fetchQueryObject({ commit }, { entityType, query, oqo, oql }) {
            commit('setQueryObjectLoading', true);
            try {
                // When an `oqo` (or `oql`) is given, translate THAT exact query — used
                // in OQL-submit mode to render the name-annotated canonical OQL of the
                // executed query (#378 C4 / decision 14: display names are resolved by
                // this on-demand translate service, not baked into the execute response's
                // bare-ID meta.x_query.oql). Otherwise translate the live chip query.
                const response = await api.getQuery(
                    oqo != null || oql != null
                        ? { oqo, oql }
                        : { entity_type: entityType, query: query || {} }
                );
                commit('setQueryObject', response);
            } catch (e) {
                // /query returns 400 with a structured validation message on a bad
                // query — surface that, not the generic axios "status code 400".
                const msg = e.response?.data?.validation?.errors?.[0]?.message
                    || e.response?.data?.message
                    || e.message
                    || 'Failed to fetch query';
                commit('setQueryObjectError', msg);
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
        queryObject(state) {
            return state.queryObject;
        },
        queryObjectLoading(state) {
            return state.queryObjectLoading;
        },
        queryObjectError(state) {
            return state.queryObjectError;
        },
        oqlSubmitError(state) {
            return state.oqlSubmitError;
        },
        rateLimitData(state) {
            return state.rateLimitData;
        },
        defaultDailyBudgetUsd(state) {
            return creditsToUsd(state.defaultApiMaxPerDay);
        },
        featureFlags(state) {
            const flags = { ...state.featureFlags };
            delete flags.noviceMode;
            return flags;
        },
    },
})
