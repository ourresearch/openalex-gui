import axios from "axios";
import {url} from "@/url";
import {api} from "@/api";
import {navigation} from '@/navigation';
import {urlBase, axiosConfig} from "@/apiConfig.js"

const shortUuid = require('short-uuid');

const apiBaseUrl = urlBase.userApi

export default {
    namespaced: true,
    state: {
        id: "",
        name: "",
        email: "",
        authorId: "",
        isAdmin: false,
        isTester: false,
        savedSearches: [],
        collections: [],
        corrections: [],
        labelLastModified: {},
        isSaving: false,
        renameId: null,
        editAlertId: null,
        activeSearchId: null,
        isSignupDialogOpen: false,
        isLoginDialogOpen: false,
        showPasswordResetErrorMessage: false,
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token);
        },
        setIsSignupDialogOpen(state, val) {
            val && (state.isLoginDialogOpen = false);
            state.isSignupDialogOpen = val;
        },
        setIsLoginDialogOpen(state, val) {
            val && (state.isSignupDialogOpen = false);
            state.isLoginDialogOpen = val;
        },
        setShowPasswordResetErrorMessage(state, val) {
            state.showPasswordResetErrorMessage = val;
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
        setCollectionsData(state, collections) {
            state.collections = collections;
        },
        addCollection(state, coll) {
            state.collections.push(coll);
        },
        updateCollectionData(state, coll) {
            state.collections = state.collections.map(existing => {
                return existing.id === coll.id ? {...existing, ...coll} : existing
            });
        },
        updateCollectionIds(state, {collectionId, ids}) {
            state.collections = state.collections.map(existing => {
                if (existing.id === collectionId) {
                    return {
                        ...existing,
                        ids: [...ids]
                    };
                }
                state.labelLastModified = {
                    ...state.labelLastModified,
                    [collectionId]: Date.now()
                };
                api.invalidateCacheForLabel(collectionId);
                return existing;
            });
        },
        deleteCollection(state, id) {
            state.collections = state.collections.filter(coll => coll.id !== id);
        },
        logout(state) {
            state.id = ""
            state.name = ""
            state.email = ""
            state.savedSearches = []
            state.collections = []
            state.corrections = []
            state.authorId = ""
            localStorage.removeItem("token")
            navigation.push("/")
        },
        setFromApiResp(state, apiResp) {
            state.id = apiResp.id
            state.name = apiResp.name
            state.email = apiResp.email
            state.isAdmin = apiResp.is_admin
            state.isTester = apiResp.is_tester
            state.authorId = apiResp.author_id
        },
    },
    actions: {

        // **************************************************
        // USER PROPER
        // **************************************************

        // create
        async createUser({commit, dispatch}, {email, name, password}) {
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
        async fetchUser({commit, dispatch}) {
            const resp = await axios.get(
                apiBaseUrl + "/user",
                axiosConfig({userAuth: true})
            )
            commit("setFromApiResp", resp.data)

            // hack for now, these should be in the user object
            await dispatch("fetchSavedSearches")
            await dispatch("fetchCollections")
            // await dispatch("fetchCorrections")

        },

        // read
        async loginUser({commit, dispatch}, {email, password}) {
            console.log("user.store loginUser", email, password)
            const resp = await axios.post(
                apiBaseUrl + "/user/login",
                {email, password}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },

        async loginWithMagicToken({commit, dispatch}, magicToken) {
            console.log("user.store loginWithMagicToken", magicToken)
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },

        async requestSignupEmail(_, signupObj) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email: signupObj.email,
                    display_name: signupObj.displayName,
                },
            )
            return resp
        },
        async requestLoginEmail(_, email) {
            const resp = await axios.post(
                apiBaseUrl + "/user/magic-login-request",
                {
                    email
                }
            )
            return resp
        },
        async requestPasswordReset(_, email) {
            const resp = await axios.post(
                apiBaseUrl + "/password/request-reset",
                {
                    email
                }
            )
            return resp
        },
        async resetPassword(_, {token, password}) {
            console.log("user.store resetPassword", password + " / " + token);

            const resp = await axios.post(
                apiBaseUrl + "/password/reset",
                {
                    token,
                    password
                }
            );
            return resp;
        },

        // **************************************************
        // CLAIM PROFILE
        // **************************************************

        async setAuthorId({dispatch, getters}, authorId) {
            const myUrl = apiBaseUrl + `/user/${getters.userId}/author/${authorId}`
            console.log("user.store setAuthorId", authorId, myUrl)
            const resp = await axios.post(
                myUrl,
                {},
                axiosConfig({userAuth: true})
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
                axiosConfig({userAuth: true})
            )
            console.log("user.store deleteAuthorId resp: ", resp)
            await dispatch("fetchUser")
            commit("snackbar", "Profile unclaimed", {root: true})
        },

        // **************************************************
        // SAVED SEARCHES
        // **************************************************


        // create
        async createSearch({dispatch}, {search_url, name, description, has_alert}) {
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
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            await url.pushSearchUrlToRoute(navigation, search_url);
            return resp;
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
        async fetchSavedSearches({state}) {
            const resp = await axios.get(
                apiBaseUrl + "/saved-search",
                axiosConfig({userAuth: true})
            )
            const sorted = [
                ...resp.data
            ].sort((a, b) => {
                return a.updated > b.updated ? -1 : 1
            })

            state.savedSearches = sorted;
        },

        // read
        async openSavedSearch({state}, id) {
            const savedSearchToOpen = state.savedSearches.find((s => s.id === id))
            return await url.pushToRoute(
                navigation,
                url.urlObjectFromSearchUrl(savedSearchToOpen?.search_url)
            )
        },
        // update
        async updateSearchDescription({commit, dispatch, state}, {id, description}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, description},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Description updated", {root: true})
            return resp;
        },
        // update
        async updateSearchName({commit, dispatch, state}, {id, name}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, name},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search renamed", {root: true})
            return resp;
        },

        // update
        async updateSearchUrl({commit, dispatch, state}, {id, search_url}) {
            state.isSaving = true
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, search_url},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search saved", {root: true})
            state.isSaving = false;
            return resp;
        },
        // update
        async updateSearchAlert({commit, dispatch, state}, {id, has_alert}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, has_alert},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            const snackbarString = has_alert ? "Alert added" : "Alert removed"
            commit("snackbar", snackbarString, {root: true});
            return resp;
        },


        // delete
        async deleteSavedSearch({commit, dispatch, rootState}, id) {
            rootState.isLoading = true
            const myUrl = apiBaseUrl + `/saved-search/${id}`
            const resp = await axios.delete(
                myUrl,
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Search deleted", {root: true})
            rootState.isLoading = false
            await url.pushToRoute(navigation, "/me/searches")
            commit("setActiveSearchId", undefined);
            return resp;
        },

        // **************************************************
        // COLLECTIONS
        // **************************************************

        // create
        async createCollection({commit, state}, {ids, name, description, entity_type}) {
            const myUrl = apiBaseUrl + `/user/${state.id}/collections`;
            const resp = await axios.post(myUrl, {
                ids,
                name,
                entity_type,
                description,
            }, axiosConfig({userAuth: true}));
            
            commit("addCollection", resp.data);
        },

        // read
        async fetchCollections({commit, state}) {
            const myUrl = apiBaseUrl + `/user/${state.id}/collections`;
            const resp = await axios.get(myUrl, axiosConfig({userAuth: true}));
            commit("setCollectionsData", resp.data);
        },

        // update
        async updateCollectionIds({commit, state}, {collectionId, ids}) {
            commit("updateCollectionIds", {collectionId, ids});
            const myUrl = apiBaseUrl + `/user/${state.id}/collections/${collectionId}`
            const resp = await axios.patch(myUrl, {
                ids,
            }, axiosConfig({userAuth: true}))
        
            return resp;
            // TODO Rollback on error
        },

        async updateCollection({commit, state}, {id, name, description, entity_type}) {
            commit("updateCollectionData", {id, name, description, entity_type});
            const myUrl = apiBaseUrl + `/user/${state.id}/collections/${id}`
            const resp = await axios.patch(myUrl, {
                name,
                description,
                entity_type,
            }, axiosConfig({userAuth: true}))
            
            return resp;
            // TODO Rollback on error
        },
        
        // delete
        async deleteCollection({commit, state, getters}, id) {
            const label = getters.getCollection(id);
            if (!label) { return; }
            let msg = "Are you sure you want to delete this label";
            if (label.ids.length) {
            msg += ` and its ${label.ids.length} ${label.entity_type}`;
            } 
            msg += "?";
            if (!confirm(msg)) { return false; }

            commit("deleteCollection", id); // Optimitic
            commit("snackbar", "Label deleted.", {root: true});

            const myUrl = apiBaseUrl + `/user/${state.id}/collections/${id}`;
            const resp = await axios.delete(
                myUrl,
                axiosConfig({userAuth: true}),
            );
            return resp;

            // TODO Rollback on error

        },


        // **************************************************
        // CORRECTIONS
        // **************************************************


        // create
        async createCorrection(_, correctionObj) {
            console.log("user.store createCorrection", correctionObj)

           /*
            const myUrl = apiBaseUrl + `/user/${state.id}/collections`
           const resp = await axios.post(myUrl, {
               ids,
               name,
               description,
           }, axiosConfig())
          
           await sleep(500)  // hack to give the server time to update
           await dispatch("fetchUser");
           return resp;
           */
        },

        // read
        async fetchCorrections({state}) {
            const myUrl = apiBaseUrl + `/user/${state.id}/corrections`
            const resp = await axios.get(
                myUrl,
                axiosConfig({userAuth: true})
            )
            state.corrections = resp.data
        },
        async deleteCorrection(_, id) {
            console.log("user.store deleteCorrection", id)
        },
    },
    getters: {
        userName: (state) => state.name,
        userId: (state) => state.id,
        userEmail: (state) => state.email,
        userAuthorId: (state) => state.authorId,
        userSavedSearches: (state) => state.savedSearches,
        userCorrections: (state) => state.corrections,
        userCollections: (state) => state.collections,
        getCollection: (state) => (collectionId) => {
            return state.collections.find(coll => coll.id === collectionId);
        },
        getCollectionsByType: (state) => (entityType) => {
            return state.collections.filter(coll => coll.entity_type === entityType);
        },
        isAdmin: (state) => state.isAdmin,
        isTester: (state) => state.isTester,
        isUserSaving: (state) => state.isSaving,
        renameId: (state) => state.renameId,
        editAlertId: (state) => state.editAlertId,
        isSignupDialogOpen: (state) => state.isSignupDialogOpen,
        isLoginDialogOpen: (state) => state.isLoginDialogOpen,
        showPasswordResetErrorMessage: (state) => state.showPasswordResetErrorMessage,
        activeSearchId: (state) => state.activeSearchId,
        activeSearchObj: (state) => state.savedSearches.find(s => s.id === state.activeSearchId),
    }
};