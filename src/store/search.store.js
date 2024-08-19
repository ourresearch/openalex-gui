import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";
import {getConfigs} from "@/oaxConfigs";
import {makeFilterBranch, makeFilterLeaf} from "@/components/Query/query";

Vue.use(Vuex)

const baseQuery = () => ({
    filters: [
        makeFilterBranch("works", true)
    ],
    summarize: false,
    summarize_by: null,
    sort_by: {
        column_id: "display_name",
        direction: "asc",
    },
    return: getConfigs().works.showOnTablePage,
})
const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        query: {
            ...baseQuery(),
        },

        is_ready: false,
        results_header: [],
        results_body: [],
        results_meta: null,

        // reminder:
        // Every time the URL changes, I get the search with that ID and
        // keep pulling till I get results.


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
        addFilter({state}, {filter, parent}) {
            console.log("adding filter", filter, parent)
            state.query.filters.push(filter)
            state.query.filters.find(f => f.id === parent)?.children?.push(filter.id)
        },
        setFilter({state}, newFilter) {
            const filterToChange = state.query.filters.find(f => f.id === newFilter.id)
            Object.keys(newFilter).forEach(key => {
                Vue.set(filterToChange, key, newFilter[key])
                // filterToChange[key] = newFilter[key]
            })
        },
        deleteFilter: function ({state}, id) {
            console.log("deleteFilter", id)
            const parent = state.query.filters.find(f => f.children.includes(id))
            parent.children = parent.children.filter((key) => key !== id)
            state.query.filters = state.query.filters.filter((f) => f.id !== id)
        },


        toggleSummarize(context) {
            context.state.query.summarize = !context.state.query.summarize
            // no matter what, clear any summarize_by filters
            context.state.query.filters = context.state.query.filters.filter(f => f.subjectEntity === "works")

            // turn on summarize
            if (context.state.query.summarize) {
                context.state.query.sort_by.direction = null
                context.state.query.sort_by.column_id = null
                context.state.query.return = []
            }
            // turn off summarize
            else {
                context.state.query.summarize_by = null
                context.state.query.sort_by.column_id = "display_name"
                context.state.query.sort_by.direction = "asc"
                context.state.query.return = getConfigs().works.showOnTablePage
            }
        },
        setSummarizeBy(context, columnId) {
            // clear any summarize_by filters
            context.state.query.filters = context.state.query.filters.filter(f => f.subjectEntity === "works")
            context.state.query.summarize_by = columnId
            if (columnId) {
                context.state.query.return = getConfigs()[columnId].showOnTablePage
                context.state.query.sort_by.column_id = "display_name"
                context.state.query.sort_by.direction = "asc"
                const filter = makeFilterBranch(columnId, true)
                context.dispatch("addFilter", {filter, parent: undefined})
            } else {
                context.state.query.return = []
            }
        },
        setSortByColumnId(context, columnId) {
            context.state.query.sort_by.column_id = columnId
        },
        addReturnColumn(context, columnId) {
            context.state.query.return.push(columnId)
        },
        deleteReturnColumn(context, columnId) {
            context.state.query.return = context.state.query.return.filter((col) => col !== columnId)
        },


        createSearch: async function (context, oql) {
            // const query = await getQueryFromOql(oql)
            const query = {q: oql}


            const url = "https://api.openalex.org/searches"
            const resp = await axios.post(url, query)
            console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },
        getSearch: async function (context, id) {
            const url = `https://api.openalex.org/searches/${id}`
            const resp = await axios.get(url)

            // this part is a hack...in the future, we'll just get the query from the search
            const query = await getQueryFromOql(resp.data.q)
            const searchResp = {
                ...stateDefaults(),
                id: id,
                query,
                results_header: resp.data.results.header,
                results_body: resp.data.results.body,
                results_meta: resp.data.meta,
                is_ready: resp.data.is_ready,
            }

            // replace the state with the new search
            context.commit("replaceState", searchResp)
        },
    },
    getters: {
        resultsHeader: (state) => state.results_header,
        resultsBody: (state) => state.results_body,
        resultsMeta: (state) => state.results_meta,

        query: (state) => state.query,
        isQuerySingleRow: (state) => state.query.summarize && !state.query.summarize_by,
        returnedEntityType: (state) => {
            if (state.query.summarize_by) {
                return state.query.summarize_by
            } else if (state.query.summarize) {
                return null
            } else {
                return "works"
            }
        },
        filterRoots: (state) => state.query.filters.filter(f => f.isRoot),


    },
}
