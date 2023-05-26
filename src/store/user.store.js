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
    state: {
        userId: "",
        userNamed: "",
        userEmail: "",
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token)
        },
        logout(state) {
            state.userId = ""
            state.userName = ""
            state.userEmail = ""
            localStorage.removeItem("token")
        },
        setFromApiResp(state, apiResp) {
            state.userId = apiResp.id
            state.userName = apiResp.name
            state.userEmail = apiResp.email
        },
    },
    actions: {
        async loginWithMagicToken({commit, dispatch, getters}, magicToken) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },
        async fetchUser({commit, dispatch, getters}) {
            const resp = await axios.get(
                apiBaseUrl + "/user/me",
                axiosConfig()
            )
            commit("setFromApiResp", resp.data)
        },
        async reqeustSignupEmail({commit, dispatch, getters}, signupObj) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email: signupObj.email,
                    display_name: signupObj.displayName,
                }
            )
            return resp
        },
        async reqeustLoginEmail({commit, dispatch, getters}, email) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email
                }
            )
            return resp
        },

    },
    getters: {
        userName: (state) => state.name,
        userId: (state) => state.id,
        userEmail: (state) => state.email,
    }
}