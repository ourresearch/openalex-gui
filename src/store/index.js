import Vue from 'vue'
import Vuex from 'vuex'

import {api} from "../api";
import {makeUrl} from "../urls";

Vue.use(Vuex)

const allEntityTypes = function(){
    return ["work", "author", "institution", "venue", "concept"]
}

const makeSearchFilters = function () {
    return [
        {
            id: "country",
            value: undefined,
            entityTypes: ["work", "author", "institution"],
            displayName: "Country",

        },
        {
            id: "display_name",
            value: undefined,
            entityTypes: allEntityTypes(),
            displayName: "Name",
        },
        {
            id: "year",
            value: undefined,
            entityTypes: ["work"],
            displayName: "Year",
        },
    ]
}


export default new Vuex.Store({
    state: {
        entityType: "work",
        filters: makeSearchFilters(),
        results: [],
        isLoading: false,
    },
    mutations: {

    },
    actions: {
        // eslint-disable-next-line no-unused-vars
        async updateTextSearch({commit, getters, dispatch, state}, q) {
            console.log("updating text search", q)
            state.filters.find(f => f.id === "display_name").value = q
            // const resp = await api.get(
            //     getters.entityTypeAsPath,
            //     getters.searchParams
            //     )
            // state.results = resp.results
        }
    },
    getters: {

        // simple search getters

        searchEntityType(state) {
            return state.entityType
        },
        searchFilters(state) {
            return state.searchFilters
        },
        searchResults(state) {
            return state.results
        },
        searchIsLoading(state) {
            return state.results
        },

        // search getters that modify things or do some kind of work

        serpUrl(state, getters){
            console.log("serpUrl")
            return makeUrl(
                getters.entityTypeAsPath,
                getters.searchParams
            )
        },
        searchTerm(state){
            state.filters.find(f => f.id === "display_name").value
        },
        entityTypeAsPath(state){
            return `/${state.entityType}s`
        },
        searchParams(state){
            console.log("state.filter", state.filters)
            const filters = state.filters
                .filter(f => {
                    return typeof f.value !== "undefined"
                })
                .map(f => {
                    return `${f.id}:${f.value}`
                })
                .join(",")

            return {filters}

        },

    },
    modules: {}
})
