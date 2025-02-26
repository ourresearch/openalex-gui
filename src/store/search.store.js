import Vue from 'vue'
import Vuex from 'vuex'
import _ from "lodash"
import router from "@/router";
import {api} from "@/api";
import tracking from "@/tracking";
import {getConfigs} from "@/oaxConfigs";
import {baseQuery} from "@/components/Query/query";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";


Vue.use(Vuex);


const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        query: {...baseQuery()},
        is_completed: false,
        results_header: [],
        results_body: [],
        results_meta: null,
        backend_error: null,
        redshift_sql: null,
    };
    return ret;
};


const pushSafe = async function (route) {
    await router.push(route)
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
        // FILTER
        setFilterWorks(state, filters) {
            state.query.filter_works = filters;
        },
        setFilterAggs(state, filters) {
            state.query.filter_aggs = filters;
        },
        setNewSearchByQuery(state, query) {
            Object.assign(state, stateDefaults());
            state.query = query;
        },
        setNewSearchById(state, id) {
            Object.assign(state, stateDefaults());
            state.id = id;
        },
        setQuery(state, query) {
            state.query = query;
            state.oql = queryToOQL(query);
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
        setSummarize(state, entity) {
            console.log("setSummarize", entity);
            const newQuery = {
                ...baseQuery(entity),
                filter_works: state.query.filter_works,
            };
            console.log("setSummarize", newQuery);
            state.query = newQuery;
        },
        // SORT
        setSortBy(state, {column_id, direction}) {
            state.query.sort_by_column = column_id;
            state.query.sort_by_order = direction;
        },
        // RETURN COLUMNS
        addReturnColumn(state, columnId) {
            if (!state.query.show_columns.includes(columnId)) {
                state.query.show_columns.push(columnId);
            }
        },
        deleteReturnColumn(state, columnId) {
            if (state.query.show_columns.length === 1) { return; }
            
            state.query.show_columns = state.query.show_columns.filter((col) => col !== columnId);
            if (state.query.sort_by_column === columnId) {
                state.query.sort_by_column = state.query.show_columns.slice(-1)[0];
            }
        },
    },
    actions: {
        // CREATE AND READ SEARCH
        createSearchFromOql: async function ({dispatch}, oql) {
            //console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql);
            return await dispatch("createSearchFromQuery", query);
        },
        createSearchFromQuery: async function ({commit, dispatch}, query) {
            console.log("createSearchFromQuery", query);
            commit('setNewSearchByQuery', query);

            try {
                const response = await api.createSearch(query);
                
                if (response.data.id) {
                    await pushSafe({
                        name: 'search',
                        params: {id: response.data.id}
                    });
                    commit('setQuery', response.data.query);
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
        getSearch: async function ({state, commit}, {id, bypass_cache}) {
            if (id !== state.id) {
                // New ID first seen from server
                commit('setNewSearchById', id);
            }

            try {
                const data = await api.getSearch(state.id, {bypass_cache});

                if (state.id !== data.id) {
                    // A new id has been requested since this request started, so ignore
                    return;
                }

                if (!_.isEqual(state.query, data.query)) {
                    // Set query data from API if it's different
                    commit('setQuery', data.query);
                }

                commit('setSearchSql', data.redshift_sql);

                if (data.is_completed) {
                    commit('setSearchResults', {
                        header: data.results_header ?? [],
                        body: data.results ?? [],
                        meta: data.meta,
                        redshift_sql: data.redshift_sql
                    });
                    tracking.trackSearch(data);
                }

                if (data.backend_error) {
                    commit('setBackendError', data.backend_error);
                }

                commit('setSearchCompleted', data.is_completed);

            } catch (error) {
                commit('setBackendError', error);
                commit('setSearchCompleted', true);
            }
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,
        query: (state) => state.query,
        querySubjectEntity: (state) => {
            if (state.query.get_rows === "summary") return "works";
            else return state.query.get_rows;
        },
        queryColumnsConfigs: (state, getters) => {
            if (!state.query.show_columns) { return []; }
            const columnsToReturn = state.query.show_columns.map((col) => {
                const ret = getters.querySubjectEntityConfig.columns[col]
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
        querySubjectEntityConfig: (state, getters) => {
            return getConfigs()[getters.querySubjectEntity];
        },
        queryIsCompleted: (state) => state.is_completed,
        queryBackendError: (state) => state.backend_error,
        queryOql: (state) => state.oql,
        querySql: (state) => state.redshift_sql,
        isQuerySingleRow: (state) => state.query.get_rows === "summary",
        filterRoots: (state) => state.query.filters.filter(f => f.isRoot),
        worksFilters: (state) => state.query.filters.filter(f => f.subjectEntity === "works"),
        entityFilters: (state) => state.query.filters.filter(f => f.subjectEntity !== "works"),
    },
};