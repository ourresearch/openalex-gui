import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";
import axios from "axios";
import router from "@/router";
import {search} from "@/store/search.store";
import YAML from 'yaml'


Vue.use(Vuex);

const stateDefaults = function () {
    const ret = {
        q: "",
        isLoading: false,
        snackbarIsOpen: false,
        snackbarColor: undefined,
        zoomId: null,
        uiVariant: null, // for testing UI variations
        testQueries: [],
    }
    return ret;
}


export default new Vuex.Store({
    state: stateDefaults(),
    modules: {
        user,
        search,
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
        setZoomId(state, id) {
            state.zoomId = id;
        }

    },
    actions: {
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
        environment(state, getters) {
            if (getters.isLocalEnv) {
                return "local"
            } else if (getters.isStagingEnv) {
                return "staging"
            } else if (getters.isProductionEnv) {
                return "production"
            } else {
                return "unknown"
            }
        },
    },
})
