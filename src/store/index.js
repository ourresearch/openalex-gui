import Vue from 'vue'
import Vuex from 'vuex'
// import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {facetsByCategory} from "../facetConfigs";
import {user} from "@/store/user.store";

Vue.use(Vuex)


const stateDefaults = function () {
    const ret = {
        q: "",
        isLoading: false,
        isDevEnv: false,

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
        snackbar(state, arg, icon) {
            state.snackbarIsOpen = true;
            if (typeof arg === "string") {
                state.snackbarMsg = arg
                return
            }
            state.snackbarMsg = arg.msg
            state.snackbarIcon = arg.icon
        },
        closeSnackbar(state) {
            state.snackbarMsg = ""
            state.snackbarIsOpen = false
        },
        setGlobalIsLoading(state, isLoading) {
            state.isLoading = !!isLoading
        },

    },
    actions: {
    },
    getters: {
        globalIsLoading(state) {
            return state.isLoading
        },
    },
})
