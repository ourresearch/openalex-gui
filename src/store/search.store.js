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
import {oqlToQuery} from "@/oqlParse/oqlParse";

Vue.use(Vuex)
function convertFlatToRecursive(flatTree) {
  const treeMap = new Map(flatTree.map(item => [item.id, { ...item, children: [], isRoot: false }]));

  const root = [];

  flatTree.forEach(item => {
    if (item?.children?.length > 0) {
      item.children.forEach(childId => {
        const childNode = treeMap.get(childId);
        treeMap.get(item.id).children.push(childNode);
      });
    }
  });

  flatTree.forEach(item => {
    if (!flatTree.some(node => node?.children?.includes(item.id))) {
      const rootNode = treeMap.get(item.id);
      rootNode.isRoot = true;
      root.push(rootNode);
    }
  });

  return root;
}

function deleteNode(tree, idToDelete) {
    const idsToDelete = new Set();

    function findNodesToDelete(nodeId) {
        idsToDelete.add(nodeId);
        const node = tree.find(n => n.id === nodeId);
        if (node && Array.isArray(node.children)) {
            node.children.forEach(childId => findNodesToDelete(childId));
        }
    }

    findNodesToDelete(idToDelete);

    return tree
        .filter(node => !idsToDelete.has(node.id))
        .map(node => ({
            ...node,
            children: Array.isArray(node.children) ? node.children.filter(childId => !idsToDelete.has(childId)) : []
        }));
}



const baseQuery = () => ({
    filters: [
        makeFilterBranch("works")
    ],
    summarize_by: null,
    sort_by: {
        column_id: "display_name",
        direction: "asc",
    },
    return_columns: getConfigs().works.showOnTablePage,
})
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

        // FILTER
        addFilter({state}, {filter, parentId}) {
            console.log("adding  filter", filter, parentId)
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
            state.query.filters = newFilters
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
                console.log("setSummarize: clear everything, we're listing all works", columnId)
                state.query.summarize_by = null
                state.query.sort_by.column_id = "display_name"
                state.query.sort_by.direction = "asc"
                state.query.return_columns = getConfigs().works.showOnTablePage


            } else if (columnId === "all") {
                console.log("setSummarize: summarize all works together", columnId)
                state.query.summarize_by = null
                state.query.sort_by.direction = null
                state.query.sort_by.column_id = null
                state.query.return_columns = []

            } else {
                console.log("setSummarize: summarize by a specific column", columnId)
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
            console.log("setFromQueryObject", query)

            dispatch("setSummarize", query.summarize_by) // do this first because it sets defaults for the other stuff
            if (query.sort_by) dispatch("setSortBy", query.sort_by)
            if (query.return_columns) state.query.return_columns = query.return_columns
            if (query.filters) dispatch("setAllFilters", query.filters)
        },

        setSearchFromOql: async function ({state}, oql) {
            console.log("setSearchFromOql", oql, oqlToQuery(oql))
        },



        // CREATE AND READ SEARCH
        createSearch: async function ({state}) {
            state.is_ready = false
            const url = "https://api.openalex.org/searches"
            const resp = await axios.post(url, {query: state.query})
            console.log("Created search", resp.data)
            await pushSafe({name: 'search', params: {id: resp.data.id}})
        },


        getSearch: async function (context, id) {
            context.state.is_ready = false
            const url = `https://api.openalex.org/searches/${id}`
            const resp = await axios.get(url)
            // this part is a hack...in the future, we'll just get the query from the search
            const searchResp = {
                ...stateDefaults(),
                id: id,
                query: resp.data.query,
                results_header: resp.data.results.header ?? [],
                results_body: resp.data.results.body ?? [],
                results_meta: resp.data.meta,
                is_ready: resp.data.is_ready,
            }

            // replace the state with the new search
            context.commit("replaceState", searchResp)
            context.state.originalFilters = _.cloneDeep(context.state.query.filters)
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
        worksFiltersRoot: (state) => state.query.filters.find(f => f.subjectEntity === "works" && f.isRoot),
        summarizeByFiltersRoot: (state) => state.query.filters.find(f => f.subjectEntity !== "works"),
        filtersRecursive: (state) => {
            return convertFlatToRecursive(state.query.filters)
        },
        filtersAreDirty: (state) => {
            return !_.isEqual(state.query.filters, state.originalFilters)
        }


    },
}
