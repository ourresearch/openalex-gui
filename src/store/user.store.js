import axios from "axios";
import router from "../router";
import {url} from "@/url";
import {entity} from "@/entity";

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


export const user = {
    namespaced: true,

    state: {
        id: "",
        name: "",
        email: "",
        authorId: "",
        savedSearches: [],
        isSaving: false,

        renameId: null,
        editAlertId: null,
        activeSearchId: null,

        isSignupDialogOpen: false,
        isLoginDialogOpen: false,
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token)
        },
        setIsSignupDialogOpen(state, val) {
            state.isLoginDialogOpen = false
            state.isSignupDialogOpen = val
        },
        setIsLoginDialogOpen(state, val) {
            state.isSignupDialogOpen = false
            state.isLoginDialogOpen = val
        },

        setRenameId(state, id) {
            state.renameId = id
        },
        setEditAlertId(state, id) {
            state.editAlertId = id
        },
        setActiveSearchId(state, id) {
            state.activeSearchId = id
        },
        logout(state) {
            state.id = ""
            state.name = ""
            state.email = ""
            state.savedSearches = []
            state.collections = []
            state.authorId = ""
            localStorage.removeItem("token")
            router.push("/")
        },
        setFromApiResp(state, apiResp) {
            state.id = apiResp.id
            state.name = apiResp.name
            state.email = apiResp.email
            state.authorId = apiResp.author_id
        },

    },
    actions: {

        // **************************************************
        // USER PROPER
        // **************************************************

        // create
        async createUser({commit, dispatch, state, getters}, {email, name, password}) {
            const id = shortUuid.generate()
            const postData = {
                email,
                display_name: name,
                password,
            }
            console.log("user/createUser sending this:", postData)
            const resp = await axios.post(
                apiBaseUrl + "/user/" + id,
                postData,
            )
            console.log("user/createUser got this back:", resp)
            commit("setToken", resp.data.access_token)
            commit("setFromApiResp", resp.data.user)
            await dispatch("fetchSavedSearches")
        },

        // read
        async fetchUser({commit, dispatch, state, getters}) {
            const resp = await axios.get(
                apiBaseUrl + "/user",
                axiosConfig()
            )
            commit("setFromApiResp", resp.data)

            // hack for now, these should be in the user object
            await dispatch("fetchSavedSearches")
            await dispatch("fetchCollections")

        },

        // read
        async loginUser({commit, dispatch, state, getters}, {email, password}) {
            console.log("user.store loginUser", email, password)
            const resp = await axios.post(
                apiBaseUrl + "/user/login",
                {email, password}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },

        async loginWithMagicToken({commit, dispatch, getters}, magicToken) {
            console.log("user.store loginWithMagicToken", magicToken)
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
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
        // CLAIM PROFILE
        // **************************************************

        async setAuthorId({commit, dispatch, state, getters}, authorId) {
            const myUrl = apiBaseUrl + `/user/${getters.userId}/author/${authorId}`
            console.log("user.store setAuthorId", authorId, myUrl)
            const resp = await axios.post(
                myUrl,
                {},
                axiosConfig()
            )
            console.log("user.store setAuthorId resp: ", resp)
            await dispatch("fetchUser")
        },
        async deleteAuthorId({commit, dispatch, state, getters}) {
            const authorId = state.authorId
            const myUrl = apiBaseUrl + `/user/${getters.userId}/author/${authorId}`
            console.log("user.store deleteAuthorId", authorId, myUrl)
            const resp = await axios.delete(
                myUrl,
                axiosConfig()
            )
            console.log("user.store deleteAuthorId resp: ", resp)
            await dispatch("fetchUser")
            commit("snackbar", "Profile unclaimed", {root: true})
        },

        // **************************************************
        // SAVED SEARCHES
        // **************************************************


        // create
        async createSearch({commit, dispatch, state, rootState}, {search_url, name, description, has_alert}) {
            const id = shortUuid.generate()

            // add id to search_url
            const searchUrlObj = new URL(search_url)
            searchUrlObj.searchParams.set("id", id)
            search_url = searchUrlObj.toString()

            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {
                    search_url,
                    name,
                    description,
                    has_alert: has_alert ?? false
                },
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            await url.pushSearchUrlToRoute(router, search_url)
        },
        // create
        async createSearchFromTemplate({commit, dispatch, state, rootState}, id) {
            rootState.isLoading = true
            const searchToCopy = {
                ...state.savedSearches.find(s => s.id === id),
            }
            searchToCopy.name = "Copy of " + searchToCopy.name
            await dispatch("createSearch", searchToCopy)
            commit("snackbar", "Search copied", {root: true})
            rootState.isLoading = false
        },


        // read
        async fetchSavedSearches({commit, state}) {
            const resp = await axios.get(
                apiBaseUrl + "/saved-search",
                axiosConfig()
            )
            const sorted = [
                ...resp.data
            ].sort((a, b) => {
                return a.updated > b.updated ? -1 : 1
            })

            state.savedSearches = sorted
        },

        // read
        async openSavedSearch({commit, state, getters}, id) {
            const savedSearchToOpen = state.savedSearches.find((s => s.id === id))
            return await url.pushToRoute(
                router,
                url.urlObjectFromSearchUrl(savedSearchToOpen?.search_url)
            )
        },


        // update
        async updateSearchDescription({commit, dispatch, state, rootState}, {id, description}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, description},
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Description updated", {root: true})
        },
        // update
        async updateSearchName({commit, dispatch, state, rootState}, {id, name}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, name},
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search renamed", {root: true})
        },

        // update
        async updateSearchUrl({commit, dispatch, state, rootState}, {id, search_url}) {
            state.isSaving = true
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, search_url},
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search saved", {root: true})
            state.isSaving = false
        },
        // update
        async updateSearchAlert({commit, dispatch, state, rootState}, {id, has_alert}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, has_alert},
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            const snackbarString = has_alert ? "Alert added" : "Alert removed"
            commit("snackbar", snackbarString, {root: true})
        },


        // delete
        async deleteSavedSearch({commit, dispatch, rootState}, id) {
            rootState.isLoading = true
            const myUrl = apiBaseUrl + `/saved-search/${id}`
            const resp = await axios.delete(
                myUrl,
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search deleted", {root: true})
            rootState.isLoading = false
            await url.pushToRoute(router, "/me/searches")
            commit("setActiveSearchId", undefined)

        },



        // **************************************************
        // COLLECTIONS
        // **************************************************


        // create
        async createCollection({commit, dispatch, state, rootState}, {ids, name, description}) {
            if (!ids.length) return // don't create empty collections

            const id = shortUuid.generate()
            // const myEntityType = entity.getType(ids[0], rootState.config)
            "/user/{userId}/collections/{collectionId}"
            const myUrl = `https://api.openalex.org/user/${state.id}/collections/${id}`
            const resp = await axios.post(myUrl,{
                ids,
                name,
                description: "test",
            }, axiosConfig())

            await dispatch("fetchUser")
        },


        // read
        async fetchCollections({commit, state}) {
            const myUrl = apiBaseUrl + `/user/${state.id}/collections`
            const resp = await axios.get(
                myUrl,
                axiosConfig()
            )
           state.collections = resp.data
        },

        // update: implement later



        // delete
        async deleteCollection({commit, dispatch, rootState}, id) {
            rootState.isLoading = true
            const myUrl = apiBaseUrl + `/saved-search/${id}`
            const resp = await axios.delete(
                myUrl,
                axiosConfig(),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search deleted", {root: true})
            rootState.isLoading = false
            await url.pushToRoute(router, "/me/searches")
            commit("setActiveSearchId", undefined)

        },




    },
    getters: {
        userName: (state) => state.name,
        userId: (state) => state.id,
        userEmail: (state) => state.email,

        userAuthorId: (state) => state.authorId,

        userSavedSearches: (state) => state.savedSearches,
        userCollections: (state) => state.collections,

        isUserSaving: (state) => state.isSaving,
        renameId: (state) => state.renameId,
        editAlertId: (state) => state.editAlertId,

        isSignupDialogOpen: (state) => state.isSignupDialogOpen,
        isLoginDialogOpen: (state) => state.isLoginDialogOpen,

        activeSearchId: (state) => state.activeSearchId,
        activeSearchObj: (state, getters) => state.savedSearches.find(s => s.id === state.activeSearchId),
        activeSearchUrl: (state, getters) => getters.activeSearchObj?.search_url,
        activeSearchDescription: (state, getters) => getters.activeSearchObj?.description,
        activeSearchName: (state, getters) => getters.activeSearchObj?.name,
        activeSearchHasAlert: (state, getters) => getters.activeSearchObj?.has_alert,
    }
}