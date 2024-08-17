import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";

Vue.use(Vuex)


const emptyQuery = {
    get_works_where: {},
    summarize: false,
    summarize_by: null,
    summarize_by_where: {},
    sort_by: {
        column_id: "display_name",
        direction: null,
    },
    return: [],
}
const stateDefaults = function () {
    const ret = {
        id: null,
        oql: "",
        query: {
            ...emptyQuery,
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
    const ret =  {
        ...emptyQuery,
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
            if (!state.query.summarize) {
                state.query.summarize_by = null
                state.query.summarize_by_where = {}
            }
        }
    },
    actions: {
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
    },
}
