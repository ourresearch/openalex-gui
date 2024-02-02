import axios from "axios";
import router from "../router";
import {url} from "@/url";

const shortUuid = require('short-uuid');


const axiosConfig = function () {
    const token = localStorage.getItem("token")
    const headers = {}
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    return {
        headers: headers
    }
}
const apiBaseUrl = "https://user.openalex.org"

const makeDefaultSerpTab = function () {
    return {
        searchUrl: "https://openalex.org/works",
        id: null,
    }
}

export const user = {
    namespaced: true,

    state: {
        id: "",
        name: "",
        email: "",
        savedSearches: [],
        serpTabs: [makeDefaultSerpTab()],
        serpTabIndex: 0,
        isSaving: false,

        renameId: null,
        activeSearchId: null,
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token)
        },
        setRenameId(state, id){
          state.renameId = id
        },
        setActiveSearchId(state, id){
          state.activeSearchId = id
        },
        logout(state) {
            state.id = ""
            state.name = ""
            state.email = ""
            localStorage.removeItem("token")

        },
        setFromApiResp(state, apiResp) {
            state.id = apiResp.id
            state.name = apiResp.name
            state.email = apiResp.email
        },
        removeSerpTab(state, index) {
            console.log("remove serp tab", index)
            if (state.serpTabs.length === 1) {
                state.serpTabs = [makeDefaultSerpTab()]
                return
            }

        },
        // createSerpTab(state, tabObj) {
        //     const newTab = tabObj ?? makeDefaultSerpTab()
        //
        //     state.serpTabs = [...state.serpTabs, newTab]
        //     state.serpTabIndex = state.serpTabs.length - 1
        // },


    },
    actions: {

        // **************************************************
        // USER PROPER
        // **************************************************
        async loginWithMagicToken({commit, dispatch, getters}, magicToken) {
            console.log("user.store loginWithMagicToken", magicToken)
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },
        async fetchUser({commit, dispatch, state, getters}) {
            const resp = await axios.get(
                apiBaseUrl + "/user/me",
                axiosConfig()
            )
            commit("setFromApiResp", resp.data)
            await dispatch("fetchSavedSearches")
            await router.push("/")
        },
        async requestSignupEmail({commit, dispatch, getters}, signupObj) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email: signupObj.email,
                    display_name: signupObj.displayName,
                },
            )
            return resp
        },
        async requestLoginEmail({commit, dispatch, getters}, email) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email
                }
            )
            return resp
        },


        // **************************************************
        // SAVED SEARCHES
        // **************************************************


        // create
        async createSearch({commit, dispatch, state, rootState}, {search_url, has_alert}) {
            rootState.isLoading = true
            const id = shortUuid.generate()
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {
                    search_url,
                    has_alert: has_alert ?? false
                },
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            rootState.isLoading = false
        },


        // update
        async saveActiveSearch({commit, dispatch, state}) {
            state.isSaving = true
            const id = state.activeSearchId
            const search_url = 'https://openalex.org' + router.currentRoute.fullPath
            const putData = {id, search_url}
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                putData,
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            state.isSaving = false
        },


        // update
        async renameSearch({commit, dispatch, state, rootState}, {id, name}) {
            rootState.isLoading = true
            const searchObj = state.savedSearches.find(s => s.id === id)


            const oldUrl = searchObj.search_url

            const newSearchObj = {
                id,
                search_url: url.setUrlName(oldUrl, name)
            }
            console.log("renameSearch setting this new object", newSearchObj)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                newSearchObj,
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            rootState.isLoading = true
        },



        // read
        async fetchSavedSearches({commit, state}) {
            const resp = await axios.get(
                apiBaseUrl + "/saved-search",
                axiosConfig()
            )
            const sorted = [
                ...resp.data
            ].sort((a,b) =>{
                return a.updated > b.updated ? -1 : 1
            })

            state.savedSearches = sorted
        },



        // delete
        async deleteSavedSearch({commit, dispatch, rootState}, id) {
            console.log("user.store deleteSavedSearch", id)
            rootState.isLoading = true
            const myUrl = apiBaseUrl + `/saved-search/${id}`
            const resp = await axios.delete(
                myUrl,
                axiosConfig(),
            )
            console.log("user.store deleteSavedSearch done", resp)
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search deleted", {root: true})
            rootState.isLoading = false
            await url.pushToRoute(router, "/me/searches")

        },


        // **************************************************
        // TABS
        // **************************************************

        async selectSerpTab({state}, index) {
            console.log("selectSerpTab", index)
            state.serpTabIndex = index
            const myUrl = state.serpTabs[index].searchUrl
            const query = Object.fromEntries(new URL(myUrl).searchParams);
            await url.pushToRoute(router, {
                name: "Serp",
                params: {entityType: "works"}, // hardcoded for now
                query
            })
        },
        createSerpTab({state, dispatch}, tabObj) {
            const newTab = tabObj ?? makeDefaultSerpTab()
            state.serpTabs = [...state.serpTabs, newTab]
            const newIndex = state.serpTabs.length - 1
            dispatch("selectSerpTab", newIndex)
        },
        copyCurrentSerpTab({state, dispatch}) {
            const currentTabObj = {
                ...state.serpTabs[state.serpTabIndex],
                id: null,
            }
            state.serpTabs = [...state.serpTabs, currentTabObj]
            const newIndex = state.serpTabs.length - 1
            dispatch("selectSerpTab", newIndex)
        },
        async saveCurrentSerpTab({state, dispatch}) {
            const args = {
                search_url: 'https://openalex.org' + router.currentRoute.fullPath
            }
            const currentTabObj = state.serpTabs[state.serpTabIndex]
            currentTabObj.id = await dispatch("createSavedSearch", args) // won't work, this is gone

        },
        removeSerpTab({state, dispatch}, indexToDelete) {
            const newIndex = Math.min(
                state.serpTabIndex,
                state.serpTabs.length - 2
            )
            state.serpTabs = state.serpTabs.filter((tab, i) => {
                return i !== indexToDelete
            })
            dispatch("selectSerpTab", newIndex)
        },


        async updateCurrentSerpTab({state}, newQuery) {
            const currentTabObj = state.serpTabs[state.serpTabIndex]
            currentTabObj.searchUrl = 'https://openalex.org' + router.currentRoute.fullPath
            if (currentTabObj.id) {
            }
        },


    },
    getters: {
        userName: (state) => state.name,
        userId: (state) => state.id,
        userEmail: (state) => state.email,

        userSavedSearches: (state) => state.savedSearches,

        serpTabs: (state) => state.serpTabs,
        serpTabIndex: (state) => state.serpTabIndex,
        isCurrentSerpTabSaved: (state) => {
            return !!state.serpTabs[state.serpTabIndex].id
        },
        isUserSaving: (state) => state.isSaving,
        renameId: (state) => state.renameId,
        activeSearchId: (state) => state.activeSearchId,
    }
}