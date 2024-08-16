import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";

Vue.use(Vuex)


const stateDefaults = function () {
    const ret = {
        q: "",
        isLoading: false,
        snackbarIsOpen: false,
        snackbarColor: undefined,
        zoomId: null,


    }
    return ret
}


export default new Vuex.Store({
    // state: stateDefaults(),
    state: stateDefaults(),
    modules: {
        user,
    },
    mutations: {
        snackbar(state, arg) {
            state.snackbarIsOpen = true
            if (typeof arg === "string") {
                state.snackbarMsg = arg
            } else {
                state.snackbarMsg = arg.msg
                state.snackbarColor = arg.color
            }
        },
        closeSnackbar(state) {
            state.snackbarMsg = ""
            state.snackbarIsOpen = false
            state.snackbarColor = undefined
        },
        setGlobalIsLoading(state, isLoading) {
            state.isLoading = !!isLoading
        },

    },
    actions: {
        createSearch: async function (context, oql) {
            const resp = await axios.post(
                "https://api.openalex.org/searches",
                {
                    q: oql,
                })
            await router.push({name: 'search', params: {id: resp.data.id}})
                .catch((e) => {
                    if (e.name !== "NavigationDuplicated") {
                        throw e
                    }
                })
        },
    },
    getters: {
        globalIsLoading(state) {
            return state.isLoading
        },
        isLocalEnv(state) {
            return window.location.hostname === "localhost"
        },
        isStagingEnv(state) {
            return window.location.hostname === "staging.openalex.org"
        },
        isProductionEnv(state) {
            return window.location.hostname === "openalex.org"
        },
    },
})
