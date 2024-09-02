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

        is_ready: null,
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
const getQueryFromOql = async function (oql) {
    const url = "https://api.openalex.org/query?q=" + oql
    const resp = await axios.get(url)
    console.log("got response back from justin", resp.data)
    const queryParts = resp.data.query.jsonQuery.json_query
    const ret = {
        ...baseQuery(),
        // oql: oql,
        ...queryParts,
    }
    return ret

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
        setFilter({state}, newFilter) {
            const filterToChange = state.query.filters.find(f => f.id === newFilter.id)
            Object.keys(newFilter).forEach(key => {
                Vue.set(filterToChange, key, newFilter[key])
            })
        },
        deleteFilter: function ({state, dispatch}, id) {
            console.log("deleteFilter", id)
            state.query.filters = deleteNode(state.query.filters, id)
        },

        setAllFilters({state}, newFilters) {
            state.query.filters = _.cloneDeep(newFilters)
        },
        clearAllFilters({state}) {
            state.query.filters = [makeFilterBranch("works")]
            state.query.filters = [makeFilterBranch("works")]
        },


        // SUMMARIZE
        setSummarize({state, dispatch}, columnId) {
            // no matter what, clear all the summarize_by filters
            dispatch("setAllFilters", state.query.filters.filter(f => f.subjectEntity === "works"))

            if (!columnId) {
                state.query.summarize_by = null
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.return_columns = getConfigs().works.showOnTablePage


            } else if (columnId === "all") {
                state.query.summarize_by = null
                state.query.sort_by.direction = null
                state.query.sort_by.column_id = null
                state.query.return_columns = []

            } else {
                state.query.summarize_by = columnId
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.return_columns = getConfigs()[columnId].showOnTablePage
                const filter = makeFilterBranch(columnId, true)
                dispatch("addFilter", {filter, parentId: undefined})
            }
        },


        // SORT
        setSortBy({state}, {column_id, direction}) {
            state.query.sort_by.column_id = column_id
            state.query.sort_by.direction = direction
        },


        // RETURN COLUMNS
        addReturnColumn({state}, columnId) {
            state.query.return_columns.push(columnId)
        },
        deleteReturnColumn({state}, columnId) {
            state.query.return_columns = state.query.return_columns.filter((col) => col !== columnId)
        },


        // SET MANY THINGS AT ONCE
        setFromQueryObject({state, dispatch}, query) {

             // do this first because it sets defaults for the other stuff
            dispatch("setSummarize", query.summarize_by)

            // now, if necessary, we overwrite the defaults that were set by setSummarize:
            if (query.sort_by) dispatch("setSortBy", query.sort_by)
            if (query.return_columns) state.query.return_columns = query.return_columns
            if (query.filters) dispatch("setAllFilters", cleanFilters(query.filters))

            // we use these to check if the user has changed the filters
            state.originalFilters = _.cloneDeep(state.query.filters)
        },

        createSearchFromOql: async function ({state, dispatch}, oql) {
            console.log("createSearchFromOql", oql, oqlToQuery(oql))
            const query = oqlToQuery(oql)
            dispatch("setFromQueryObject", query)
            dispatch("createSearch")

            // const url = "https://api.openalex.org/searches"
            // const resp = await axios.post(url, {query})
            // console.log("Created search", resp.data)
            // await pushSafe({name: 'search', params: {id: resp.data.id}})
        },


        // CREATE AND READ SEARCH
        createSearch: async function ({state, getters}) {
            console.log("createSearch", getters.query)
            const queryWithCleanFilters = {
                ...getters.query,
                filters: cleanFilters(getters.query.filters)
            }
            state.is_ready = false
            const url = "https://api.openalex.org/searches"
            const resp = await axios.post(url, {query: queryWithCleanFilters})
            console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },


        getSearch: async function ({state, dispatch, commit, getters}, id) {
            state.is_ready = false
            state.id = id
            const resp = await axios.get(getters.searchApiUrl)


            // start from a clean slate:
            commit("replaceState", stateDefaults())

            // set the simple stuff from the response
            state.id = id
            state.oql = queryToOQL(resp.data.query)
            state.results_header = resp.data.results_header ?? []
            state.results_body = resp.data.results ?? []
            state.results_meta = resp.data.meta
            state.is_ready = resp.data.is_ready

            // we have to be a bit careful because the server does't always return a full Query object
            dispatch("setFromQueryObject", resp.data.query)
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,

        query: (state) => state.query,
        queryColumns: (state, getters) => state.query.return_columns.map((col) => getters.querySubjectEntityConfig.columns[col]),
        querySubjectEntity: (state) => {
            if (!state.query.summarize_by) return "works"
            else if (state.query.summarize_by === "all") return null
            else return state.query.summarize_by

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
