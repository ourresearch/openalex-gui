import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";
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
            // no matter what, clear all the summarize_by filters
            dispatch("setAllFilters", state.query.filters.filter(f => f.subjectEntity === "works"))

            if (!columnId) {
                state.query.summarize_by = null
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.show_columns = getConfigs().works.showOnTablePage


            } else if (columnId === "all") {
                state.query.summarize_by = null
                state.query.sort_by.direction = null
                state.query.sort_by.column_id = null
                state.query.show_columns = []

            } else {
                state.query.summarize_by = columnId
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.show_columns = getConfigs()[columnId].showOnTablePage
                const filter = makeFilterBranch(columnId, true)
                dispatch("addFilter", {filter, parentId: undefined})
            }
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
        },


        // SET MANY THINGS AT ONCE
        setFromQueryObject({state}, query) {
            state.query = query
        },

        createSearchFromOql: async function ({dispatch}, oql) {
            console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql)
            dispatch("setFromQueryObject", query)
            dispatch("createSearch")
        },


        // CREATE AND READ SEARCH
        createSearch: async function ({state}) {
            state.is_completed = false
            const url = "https://api.openalex.org/searches"
            const resp = await axios.post(url, {query: state.query})
            console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },


        getSearch: async function ({state, getters}, id) {
            state.id = id
            state.is_completed = false

            // get the search from the API
            const resp = await axios.get(getters.searchApiUrl)


            // set the state from the response
            state.is_completed = resp.data.is_completed
            state.oql = queryToOQL(resp.data.query)
            state.results_header = resp.data.results_header ?? []
            state.results_body = resp.data.results ?? []
            state.results_meta = resp.data.meta
            state.query = resp.data.query
        },
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
        isQuerySingleRow: (state) => state.query.summarize_by === "all",
        filterRoots: (state) => state.query.filters.filter(f => f.isRoot),
        worksFilters: (state) => state.query.filters.filter(f => f.subjectEntity === "works"),
        entityFilters: (state) => state.query.filters.filter(f => f.subjectEntity !== "works"),

        searchApiUrl: (state) => {
            return `https://api.openalex.org/searches/${state.id}`
        },


    },
}
