import _ from "lodash"
import {api} from "@/api";
import { navigation } from "@/navigation"; 
import tracking from "@/tracking";
import {getConfigs} from "@/oaxConfigs";
import {baseQuery, makeUnderlyingWorksQuery, areCoreQuriesEqual} from "@/query"; 
import {queryTitle} from "@/utils/queryTitle"; 
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";

const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        submittedQuery: {...baseQuery()}, // query that has been submitted to the API
        query: {...baseQuery()}, // In progress query, updates with each UI change
        is_completed: false,
        results_header: [],
        results_body: [],
        results_meta: null,
        results_works_count: null,
        results_timestamps: null,
        backend_error: null,
        redshift_sql: null,
        selectedIds: [],
        stashedQueryState: null,
        isEntireSearchSelected: false,
        pageTitle: null,
        isSearchCanceled: false,
    };
    return ret;
};


export default {
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
        setSearchResults(state, { header, body, meta, timestamps, redshift_sql }) {
            state.results_header = header;
            state.results_body = body;
            state.results_meta = meta;
            state.results_timestamps = timestamps;
            state.redshift_sql = redshift_sql;
        },
        setSearchCompleted(state, value) {
            state.is_completed = value;
        },
        setSearchSql(state, sql) {
            state.redshift_sql = sql;
        },
        setBackendError(state, error) {
            console.trace("setBackendError");
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
            state.query.filter_works = _.cloneDeep(filters);
        },
        setFilterAggs(state, filters) {
            state.query.filter_aggs = _.cloneDeep(filters);
        },
        setSortBy(state, {column_id, direction}) {
            state.query.sort_by_column = column_id;
            state.query.sort_by_order = direction;
        },
        addReturnColumn(state, columnId) {
            if (!state.query.show_columns.includes(columnId)) {
                // Separate data and metrics columns
                const dataColumns = state.query.show_columns.filter(col => !col.includes("("));
                const metricsColumns = state.query.show_columns.filter(col => col.includes("("));
                
                // Add new column to the appropriate group
                if (columnId.includes("(")) {
                    metricsColumns.push(columnId);
                } else {
                    dataColumns.push(columnId);
                }
                const newColumns = [...dataColumns, ...metricsColumns];
                state.query.show_columns = newColumns;
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
        setResultsWorksCount(state, count) {
            state.results_works_count = count;
        },
        setStashedQueryState(state, queryState) {
            state.stashedQueryState = _.cloneDeep(queryState);
        },
    },
    actions: {
        createSearchFromQuery: async function ({commit, dispatch, rootState}, query) {
            //console.log("createSearchFromQuery", query);
            
            // Push temporary loading state while waiting of ID from API call
            await navigationPush({name: 'search', params: {id: null}}, rootState);
            
            const cachedData = api.findQueryInCache(query);
            
            if (cachedData && cachedData.is_completed && cachedData.id) {                
                console.log("createSearch found cached search for: " + cachedData.id);
                // Set the search ID and data from cache without resetting the state
                commit('setSearchId', cachedData.id);
                dispatch('setSearchData', cachedData);
                
                // Replace loading state with null ID with actual ID
                await navigationReplace({name: 'search', params: {id: cachedData.id}}, rootState);
            
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

                    // Replace loading state null ID with actual ID
                    await navigationReplace({name: 'search', params: {id: searchId}}, rootState);
                    
                    if (query.get_rows !== "works" && query.get_rows !== "summary") {
                        dispatch('prefetchUnderlyingWorksQuery', query); // Prefetch underlying works query
                    }

                } else {
                     // Handle cases where the API might not return an ID as expected
                     console.error("API did not return a search ID.");
                     commit('setBackendError', new Error("Search creation failed."));
                     commit('setSearchCompleted', true);
                }
            } catch (error) {
                commit('setBackendError', error);
                commit('setSearchCompleted', true);
            }
        },
        createSearchFromOql: async function ({dispatch}, oql) {
            //console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql);
            return await dispatch("createSearchFromQuery", query);
        },
        getSearch: async function ({state, commit, dispatch}, {id, bypass_cache, is_polling}) {
            if (!id) { return; }
            
            commit('setSearchId', id);
            
            // Check the cache first if we're not explicitly bypassing it
            const cachedData = api.getSearchFromCache(id);
            if (!bypass_cache && cachedData) {
                console.log("getSearch found cached search for: " + id);
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
                    timestamps: data.timestamps,
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
        prefetchUnderlyingWorksQuery: async function({commit, state}, query) {
            const worksQuery = makeUnderlyingWorksQuery(query);
            const options = {
                bypass_cache: true,
                is_test: false,
            };
            const resp = await api.createSearch(worksQuery, options);
            if (resp.data.id) {
                // Poll for results, do nothing but stock cache
                const poll = setInterval(async () => {
                    const data = await api.getSearch(resp.data.id, {is_polling: true});
                    if (data.is_completed) {
                        if (areCoreQuriesEqual(data.query, state.submittedQuery)) {
                            console.log("Setting results works count: " + data.meta.count);
                            commit('setResultsWorksCount', data.meta.count);
                        }
                        clearInterval(poll);
                    }
                }, 500);
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
        createUnderlyingWorksQuery: async function ({state, commit, dispatch}) {
            const newQuery = makeUnderlyingWorksQuery(state.query);
            const queryState = _.cloneDeep(state);
            await dispatch('createSearchFromQuery', newQuery);
            commit('setStashedQueryState', queryState);
        },
        addFilter: function ({state, commit}, {filterGroup, filterKey}) {
            const action = filterGroup === 'works' ? 'setFilterWorks' : 'setFilterAggs';
            const existingFilters = filterGroup === 'works' ? state.query.filter_works : state.query.filter_aggs;

            const filter = {"column_id": filterKey, "value": null};

            commit(action, [...existingFilters, filter]);
        },
        deleteFilterByPath({ commit, state }, { targetKey, path }) {
            const mutationName = targetKey === 'filter_works' ? 'setFilterWorks' : 'setFilterAggs';
            if (!state.query[targetKey]) return;
            
            const filtersClone = _.cloneDeep(state.query[targetKey]);

            let parentArray = filtersClone;
            for (let i = 0; i < path.length - 1; i++) {
                let currentSegment = parentArray[path[i]];
                if (typeof currentSegment === 'object' && currentSegment !== null && 'filters' in currentSegment && path[i + 1] === 'filters') {
                    parentArray = currentSegment.filters;
                    i++;
                } else {
                    parentArray = currentSegment;
                }
                if (!parentArray) return;
            }

            const indexToRemove = path[path.length - 1];

            if (Array.isArray(parentArray) && Number.isInteger(indexToRemove) && indexToRemove >= 0 && indexToRemove < parentArray.length) {
                parentArray.splice(indexToRemove, 1);
                commit(mutationName, filtersClone);
            }
        },
        makePageTitle: async function ({state, commit}) {
            const pageTitle = await queryTitle(state.submittedQuery);
            console.log("Setting Page Title: " + pageTitle);
            commit('setPageTitle', pageTitle);
        },
        clearSelected({commit, state, rootState}) {
            commit("selectEntityWorkIds", [])

            // When clearing selection, update the URL to remove the 'select' param
            const uiVariant = rootState.uiVariant;
            const route = {
                name: state.searchId ? 'search' : 'home', // Stay on search if ID exists, else home
                params: { ...window.vm.$route.params }, // Keep existing params (like search id)
                query: {
                    ...window.vm.$route.query, // Keep existing query params
                    select: undefined, // Remove the select param
                    ...(uiVariant ? { ui: uiVariant } : {}) // Keep ui variant if present
                }
            };
            // Use replace to avoid polluting history
            navigation.replace(route);
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,
        resultsWorksCount: (state) => state.results_works_count,
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
        stashedQueryState: (state) => state.stashedQueryState,
    },
};

const navigationPush = async (route, rootState) => {
    const uiVariant = rootState.uiVariant;
    const newRoute = {
        ...route,
        query: {
            ...route.query,
            ...(uiVariant ? { ui: uiVariant } : {})
        }
    };
    await navigation.push(newRoute);
};

const navigationReplace = async (route, rootState) => {
    const uiVariant = rootState.uiVariant;
    const newRoute = {
        ...route,
        query: {
            ...route.query,
            ...(uiVariant ? { ui: uiVariant } : {})
        }
    };
    await navigation.replace(newRoute);
};