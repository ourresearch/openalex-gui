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
    get_works_where: {
        0: makeFilterBranch(0)
    },
    summarize: false,
    summarize_by: null,
    summarize_by_where: {
        0: makeFilterBranch(0)
    },
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
        toggleSummarize(state) {
            state.query.summarize = !state.query.summarize
            if (state.query.summarize) {
                state.query.sort_by.direction = null
                state.query.sort_by.column_id = null
            } else {
                state.query.summarize_by_where = {}
                state.query.summarize_by = null
            }
        },
        toggleSortByDirection(state) {
            state.query.sort_by.direction = state.query.sort_by.direction === "asc" ? "desc" : "asc"
        },
    },
    actions: {
        addFilter(context, {filter, queryPart}) {
            console.log("adding filter", queryPart)
            if (!["summarize_by_where", "get_works_where"].includes(queryPart)) {
                throw new Error("Invalid queryPart arg for search.store.actions addFilter")
            }
            const highestId = Math.max(...Object.keys(context.state.query[queryPart]))
            Vue.set(context.state.query[queryPart], highestId + 1, filter)
        },
        setFilter(context, {filter, queryPart}) {
            if (!["summarize_by_where", "get_works_where"].includes(queryPart)) {
                throw new Error("Invalid queryPart arg for search.store.actions addFilter")
            }
            Vue.set(context.state.query[queryPart], filter.id, filter)
        },
        deleteFilter: function (context, {id, queryPart}) {
            if (!["summarize_by_where", "get_works_where"].includes(queryPart)) {
                throw new Error("Invalid queryPart arg for search.store.actions addFilter")
            }

            const me = context.state.query[queryPart][id]
            const myParent = context.state.query[queryPart][me.parent]
            console.log("deleting", id, myParent)
            myParent.children = myParent.children.filter((key) => key !== id)
            Vue.delete(context.state.query[queryPart], id)

        },


        toggleSummarize(context) {
            context.state.query.summarize = !context.state.query.summarize

            // turn on summarize
            if (context.state.query.summarize) {
                context.state.query.sort_by.direction = null
                context.state.query.sort_by.column_id = null
                context.state.query.return = []
            }
            // turn off summarize
            else {
                context.state.query.summarize_by_where = {
                    0: makeFilterBranch(0)
                }
                context.state.query.summarize_by = null
                context.state.query.sort_by.column_id = "display_name"
                context.state.query.sort_by.direction = "asc"
                context.state.query.return = getConfigs().works.showOnTablePage
            }
        },
        setSummarizeBy(context, columnId) {
            context.state.query.summarize_by = columnId
            context.state.query.summarize_by_where = {
                0: makeFilterBranch(0)
            }
            if (columnId) {
                context.state.query.return = getConfigs()[columnId].showOnTablePage
                context.state.query.sort_by.column_id = "display_name"
                context.state.query.sort_by.direction = "asc"
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


    },
}
