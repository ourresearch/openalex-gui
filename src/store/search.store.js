import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import router from "@/router";
import {api} from "@/api";
import {getConfigs} from "@/oaxConfigs";
import {
    makeFilterBranch,
    makeFilterLeaf,
    baseQuery,
    convertFlatToRecursive,
    deleteNode, cleanFilters, deleteRootNodes, oqlToQueryWrapper, queryToOqlWrapper,
} from "@/components/Query/query";
import {oqlToQuery, queryToOQL} from "@/oqlParse/oqlParse";


Vue.use(Vuex)


const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        query: {
            ...baseQuery(),
        },
        originalFilters: [],
        is_completed: null,
        results_header: [],
        results_body: [],
        results_meta: null,
        backend_error: null,
    }
    return ret
}


const pushSafe = async function (route) {
    await router.push(route)
        .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
                throw e
            }
        })
}


export const search = {
    namespaced: true,
    state: stateDefaults(),
    mutations: {
        replaceState(state, newState) {
            Object.keys(newState).forEach(key => {
                state[key] = newState[key];
            });
        },
        toggleSortByDirection(state) {
            state.query.sort_by.direction = state.query.sort_by.direction === "asc" ? "desc" : "asc"
        },
    },
    actions: {
        // FILTER
        addFilter({state}, {filter, parentId}) {
            state.query.filters.push(filter)
            state.query.filters.find(f => f.id === parentId)?.children?.push(filter.id)
        },
        deleteFilter: function ({state}, id) {
            console.log("deleteFilter", id)
            state.query.filters = deleteNode(state.query.filters, id)
        },
        setAllFilters({state}, newFilters) {
            state.query.filters = _.cloneDeep(newFilters)
        },

        // SUMMARIZE
        setSummarize({state, dispatch}, columnId) {
            const newQuery = {
                get_rows: columnId,
                filter_works: state.query.filter_works,
            }
            dispatch("createSearchFromQuery", newQuery)
        },

        // SORT
        setSortBy({state}, {column_id, direction}) {
            state.query.sort_by_column = column_id
            state.query.sort_by_order = direction
        },

        // RETURN COLUMNS
        addReturnColumn({state}, columnId) {
            state.query.show_columns.push(columnId)
        },
        deleteReturnColumn({state}, columnId) {
            state.query.show_columns = state.query.show_columns.filter((col) => col !== columnId)
            if (state.query.sort_by_column === columnId) {
                state.query.sort_by_column = state.query.show_columns.slice(-1)[0]
            }
        },

        // SET MANY THINGS AT ONCE
        setFromQueryObject({state}, query) {
            state.query = query
        },

        // CREATE AND READ SEARCH
        createSearchFromOql: async function ({dispatch}, oql) {
            //console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql)
            return await dispatch("createSearchFromQuery", query)
        },

        createSearchFromQuery: async function ({state}, query) {
            state.is_completed = false
            state.query = query
            state.oql = queryToOQL(query)
            const resp = await api.createSearch(query)
            //console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },

        createSearch: async function ({dispatch, state}) {
            return await dispatch("createSearchFromQuery", state.query)
        },

        getSearch: async function ({state, getters}, id) {
            state.id = id
            state.is_completed = false

            // get the search from the API
            const data = await api.getSearch(state.id)

            // set the state from the response
            state.is_completed = data.is_completed
            state.oql = queryToOQL(data.query)
            state.backend_error = data.backend_error
            state.results_header = data.results_header ?? []
            state.results_body = data.results ?? []
            state.results_meta = data.meta
            state.query = data.query
        },

        clearSearch({state}) {
            console.log("Clearing Search")
            Object.assign(state, stateDefaults())
        }
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,

        query: (state) => state.query,
        queryColumns: (state, getters) => {
            const columnsToReturn = state.query.show_columns.map((col) => {
                const ret = getters.querySubjectEntityConfig.columns[col]
                if (!ret) {
                    throw new Error(`No column found for ${getters.querySubjectEntity}.columns.${col}`)
                }
                return ret
            });
            if (!columnsToReturn?.length){
                    throw new Error(`No columns at all found for ${getters.querySubjectEntity}`)
            }
            return columnsToReturn
        },
        querySubjectEntity: (state) => {
            if (state.query.get_rows === "summary") return "works"
            else return state.query.get_rows
        },
        querySubjectEntityConfig: (state, getters) => {
            return getConfigs()[getters.querySubjectEntity]
        },
        isQuerySingleRow: (state) => state.query.get_rows === "summary",
        filterRoots: (state) => state.query.filters.filter(f => f.isRoot),
        worksFilters: (state) => state.query.filters.filter(f => f.subjectEntity === "works"),
        entityFilters: (state) => state.query.filters.filter(f => f.subjectEntity !== "works"),
    },
}