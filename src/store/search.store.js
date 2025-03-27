import Vue from 'vue'
import Vuex from 'vuex'
import _ from "lodash"
import router from "@/router";
import {api} from "@/api";
import tracking from "@/tracking";
import {getConfigs} from "@/oaxConfigs";
import {baseQuery, queryTitle} from "@/query";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";


Vue.use(Vuex);

const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        submittedQuery: {...baseQuery()}, // query that has been submitted to the API
        query: {...baseQuery()}, // In progress query, update with each UI change
        is_completed: false,
        results_header: [],
        results_body: [],
        results_meta: null,
        backend_error: null,
        redshift_sql: null,
        selectedIds: [],
        isEntireSearchSelected: false,
        pageTitle: null,
        isSearchCanceled: false,
        metricsColumnPercentage: 40,
    };
    return ret;
};


const pushSafe = async function (route) {
    // Preserve `ui` param if it exists
    const uiVariant = window.vm.$store.state.uiVariant;
    const newRoute = {
        ...route,
        query: {
            ...route.query,  // Keep any query params in the destination
            ...(uiVariant ? { ui: uiVariant } : {})  // Add ui param only if it exists
        }
    };
        
    await router.push(newRoute)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e;
            }
        });
};


export const search = {
    namespaced: true,
    state: stateDefaults(),
    mutations: {
        setNewSearchByQuery(state, query) {
            Object.assign(state, stateDefaults());
            state.submittedQuery = _.cloneDeep(query);
            state.query = _.cloneDeep(query);
        },
        setQuery(state, query) {
            state.submittedQuery = _.cloneDeep(query);
            state.query = _.cloneDeep(query);
            state.oql = queryToOQL(query);  
        },
        setSearchId(state, id) {
            state.id = id;
        },
        setSearchResults(state, { header, body, meta, redshift_sql }) {
            state.results_header = header;
            state.results_body = body;
            state.results_meta = meta;
            state.redshift_sql = redshift_sql;
        },
        setSearchCompleted(state, value) {
            state.is_completed = value;
        },
        setSearchSql(state, sql) {
            state.redshift_sql = sql;
        },
        setBackendError(state, error) {
            state.backend_error = error;
        },
        setIsSearchCanceled(state, value) {
            state.isSearchCanceled = value;
        },
        setPageTitle(state, pageTitle) {
            state.pageTitle = pageTitle;
        },
        setSummarize(state, entity) {
            //console.log("setSummarize", entity);
            const newQuery = {
                ...baseQuery(entity),
                filter_works: state.query.filter_works,
            };
            //console.log("setSummarize", newQuery);
            state.query = newQuery;
        },
        setFilterWorks(state, filters) {
            console.log("setFilterWorks", filters)
            state.query.filter_works = filters;
        },
        setFilterAggs(state, filters) {
            state.query.filter_aggs = filters;
        },
        setSortBy(state, {column_id, direction}) {
            state.query.sort_by_column = column_id;
            state.query.sort_by_order = direction;
        },
        addReturnColumn(state, columnId) {
            if (!state.query.show_columns.includes(columnId)) {
                state.query.show_columns.push(columnId)
                state.query.show_columns.sort((a, b) => 
                    // Sort metrics columns to the end
                    (a.includes("(") - b.includes("(")) || a.localeCompare(b)
                );
            }
        },
        deleteReturnColumn(state, columnId) {
            if (state.query.show_columns.length === 1) { return; }
            
            state.query.show_columns = state.query.show_columns.filter((col) => col !== columnId);
            if (state.query.sort_by_column === columnId) {
                state.query.sort_by_column = state.query.show_columns.slice(-1)[0];
            }
        },
        setSelectedIds(state, ids) {
            state.selectedIds = ids;
        },
        setEntireSearchSelected(state, value) {
            state.isEntireSearchSelected = value;
        },
        setMetricsColumnPercentage(state, percentage) {
            state.metricsColumnPercentage = percentage;
        },
    },
    actions: {
        createSearchFromOql: async function ({dispatch}, oql) {
            //console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql);
            return await dispatch("createSearchFromQuery", query);
        },
        createSearchFromQuery: async function ({state, commit, dispatch}, query) {
            //console.log("createSearchFromQuery", query);
            
            // temporary loading state while waiting of ID from API call
            await router.replace({name: 'search', params: {id: null}});
            
            const cachedData = api.findQueryInCache(query);
            
            if (cachedData && cachedData.is_completed && cachedData.id) {                
                // Set the search ID and data from cache without resetting the state
                commit('setSearchId', cachedData.id);
                dispatch('setSearchData', cachedData);
                
                await pushSafe({
                    name: 'search',
                    params: {id: cachedData.id}
                });
            
                return;
            }
            
            // If not in cache or not completed, reset the state and proceed normally
            commit('setNewSearchByQuery', query);
            dispatch("makePageTitle");
            
            try {
                // Create the search to get the ID
                const response = await api.createSearch(query);
                
                if (response.data.id) {
                    const searchId = response.data.id;
                    
                    // Set the search ID and query
                    commit('setSearchId', searchId);
                    commit('setQuery', response.data.query);
                    
                    // Navigate to the search results page
                    await pushSafe({
                        name: 'search',
                        params: {id: searchId}
                    });
                }
            } catch (error) {
                commit('setBackendError', error);
                commit('setSearchCompleted', true);
            }
        },
        createNewSearch: async function ({dispatch}) {
            return await dispatch("createSearchFromQuery", baseQuery());
        },
        createSearch: async function ({state, dispatch}) {
            return await dispatch("createSearchFromQuery", state.query);
        },
        resetToSubmittedQuery: function ({state, commit, dispatch}) {
            console.log("Resetting to submitted query");
            commit('setQuery', state.submittedQuery);
            dispatch('createSearchFromQuery', state.submittedQuery);
        },
        getSearch: async function ({state, commit, dispatch}, {id, bypass_cache, is_polling}) {
            commit('setSearchId', id);
            
            // Check the cache first if we're not explicitly bypassing it
            const cachedData = api.getSearchFromCache(id);
            if (!bypass_cache && cachedData) {
                dispatch('setSearchData', cachedData);
                return;
            }

            // If not in cache or bypassing cache, proceed with the API call
            try {
                const data = await api.getSearch(state.id, {bypass_cache, is_polling});

                if (state.id !== data.id) {
                    // A new id has been requested since this request started, so ignore
                    return;
                }

                dispatch('setSearchData', data);

            } catch (error) {
                commit('setBackendError', error);
                commit('setSearchCompleted', true);
            }
        },
        setSearchData: function({state, commit, dispatch}, data) {
            if (!_.isEqual(state.submittedQuery, data.query)) {
                commit('setQuery', data.query);
                dispatch("makePageTitle");
            }
            
            commit('setSearchSql', data.redshift_sql);
            
            if (data.is_completed) {
                commit('setSearchResults', {
                    header: data.results_header ?? [],
                    body: data.results ?? [],
                    meta: data.meta,
                    redshift_sql: data.redshift_sql
                });
            }
            
            if (data.backend_error) {
                commit('setBackendError', data.backend_error);
            }
            
            commit('setSearchCompleted', data.is_completed);
            
            if (data.is_completed) {
                tracking.trackSearch(data);
            }
        },
        makePageTitle: async function ({state, commit}) {
            const pageTitle = await queryTitle(state.submittedQuery);
            console.log("Setting Page Title: " + pageTitle);
            commit('setPageTitle', pageTitle);
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,
        submittedQuery: (state) => state.submittedQuery,
        query: (state) => state.query,
        querySubjectEntity: (state) => {
            return state.query.get_rows === "summary" ? "works" : state.query.get_rows;
        },
        queryColumnsConfigs: (state, getters) => {
            if (!state.query.show_columns) { return []; }
            const columnsToReturn = state.query.show_columns.map((col) => {
                const ret = getters.querySubjectEntityConfig.columns[col];
                if (!ret) {
                    throw new Error(`No column found for ${getters.querySubjectEntity}.columns.${col}`);
                }
                return ret;
            });
            if (!columnsToReturn?.length){
                throw new Error(`No columns at all found for ${getters.querySubjectEntity}`);
            }
            return columnsToReturn;
        },
        querySubjectEntityConfig: (state) => {
            const entity = state.query.get_rows === "summary" ? "works" : state.query.get_rows;
            return getConfigs()[entity];
        },
        queryOql: (state) => state.oql,
        querySql: (state) => state.redshift_sql,
        hasQueryChanged: (state) => !(_.isEqual(state.query, state.submittedQuery)),
        isBaseQuery: (state) => _.isEqual(state.submittedQuery, baseQuery()),
        queryIsCompleted: (state) => state.is_completed,
        queryBackendError: (state) => state.backend_error,
        isQuerySingleRow: (state) => state.query.get_rows === "summary",
        isSearchCanceled: (state) => state.isSearchCanceled,
        hasResults: (state, getters) => !getters.hasQueryChanged && !getters.isSearchCanceled && getters.queryIsCompleted,
        selectedIds: (state) => state.selectedIds,
        isEntireSearchSelected: (state) => state.isEntireSearchSelected,
        metricsColumnPercentage: (state) => state.metricsColumnPercentage,
    },
};