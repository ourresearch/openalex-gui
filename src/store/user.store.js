import axios from "axios";

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
        emailAlerts: [],
        savedSearches: [],
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token)
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
    },
    actions: {
        async loginWithMagicToken({commit, dispatch, getters}, magicToken) {
            console.log("user.store loginWithMagicToken", magicToken)
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },
        async createEmailAlert({commit, dispatch, state}, alertObject) {
            console.log("user.store createEmailAlert", alertObject)
            const resp = await axios.post(
                apiBaseUrl + "/alert/work/new",
                alertObject,
                axiosConfig()
            )
            console.log("user.store createEmailAlert done", resp)
            await dispatch("fetchEmailAlerts") // have to update the list
        },
        async createSavedSearch({commit, dispatch, state}, searchObj) {
            console.log("user.store createSavedSearch", searchObj)
            const resp = await axios.post(
                apiBaseUrl + "/saved-search/new",
                searchObj,
                axiosConfig(),
            )
            console.log("user.store createSavedSearch done", resp)
            await dispatch("fetchSavedSearches") // have to update the list
        },
        async fetchUser({commit, dispatch, getters}) {
            console.log("fetching user")
            const resp = await axios.get(
                apiBaseUrl + "/user/me",
                axiosConfig()
            )
            console.log("got a user api response", resp)

            commit("setFromApiResp", resp.data)
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

        async fetchEmailAlerts({commit, state}) {
            console.log("fetchEmailAlerts go")
            const resp = await axios.get(
                apiBaseUrl + "/alert/work",
                axiosConfig()
            )
            console.log("fetchEmailAlerts response", resp.data)
            state.emailAlerts = resp.data.alerts
        },

        async fetchSavedSearches({commit, state}) {
            console.log("fetchSavedSearches go")
            const resp = await axios.get(
                apiBaseUrl + "/saved-search",
                axiosConfig()
            )
            console.log("fetchSavedSearches response", resp.data)
            state.savedSearches = resp.data.saved_searches
        },

    },
    getters: {
        userName: (state) => state.name,
        userId: (state) => state.id,
        userEmail: (state) => state.email,
        userEmailAlerts: (state) => state.emailAlerts,
        userSavedSearches: (state) => state.savedSearches,
    }
}