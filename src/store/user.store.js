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
        isLibrarian: false,
        apiKey: null,
        plan: null,
        planExpiresAt: null,
        organizationId: null,
        organizationName: null,
        organizationRole: null,
        organizationPlan: null,
        savedSearches: [],
        collections: [],
        corrections: [],
        labelLastModified: {},
        isSaving: false,
        renameId: null,
        editAlertId: null,
        activeSearchId: null,
        impersonatingUserId: null,
        impersonatingUserName: null,
    },
    mutations: {
        setToken(state, token) {
            localStorage.setItem("token", token);
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
        setImpersonation(state, { userId, userName }) {
            state.impersonatingUserId = userId;
            state.impersonatingUserName = userName;
            if (userId) {
                localStorage.setItem('impersonatingUserId', userId);
                localStorage.setItem('impersonatingUserName', userName || '');
            } else {
                localStorage.removeItem('impersonatingUserId');
                localStorage.removeItem('impersonatingUserName');
            }
        },
        restoreImpersonation(state) {
            state.impersonatingUserId = localStorage.getItem('impersonatingUserId') || null;
            state.impersonatingUserName = localStorage.getItem('impersonatingUserName') || null;
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
        setCorrections(state, corrections) {
            state.corrections = corrections;
        },
        logout(state) {
            state.id = ""
            state.name = ""
            state.email = ""
            state.savedSearches = []
            state.collections = []
            state.corrections = []
            state.authorId = ""
            state.plan = null
            state.planExpiresAt = null
            state.organizationId = null
            state.organizationName = null
            state.organizationRole = null
            state.organizationPlan = null
            localStorage.removeItem("token")
            navigation.push("/")
        },
        setFromApiResp(state, apiResp) {
            state.id = apiResp.id
            state.name = apiResp.display_name
            state.email = apiResp.email
            state.isAdmin = apiResp.is_admin
            state.isLibrarian = apiResp.is_librarian
            state.authorId = apiResp.author_id
            state.apiKey = apiResp.api_key || null
            state.plan = apiResp.plan || null
            state.planExpiresAt = apiResp.plan_expires_at || null
            state.organizationId = apiResp.organization_id || null
            state.organizationName = apiResp.organization_name || null
            state.organizationRole = apiResp.organization_role || null
            state.organizationPlan = apiResp.organization_plan || null
        },
    },
    actions: {

        // **************************************************
        // USER PROPER
        // **************************************************

        // read
        async fetchUser({commit, dispatch}) {
            // Restore impersonation from localStorage on page refresh
            commit('restoreImpersonation');
            
            const resp = await axios.get(
                apiBaseUrl + "/users/me",
                axiosConfig({userAuth: true})
            )
            commit("setFromApiResp", resp.data)

            // hack for now, these should be in the user object
            await dispatch("fetchSavedSearches")
            await dispatch("fetchCollections")
            await dispatch("fetchCorrections")

        },
        
        async startImpersonation({ commit, dispatch }, { userId, userName }) {
            commit('setImpersonation', { userId, userName });
            await dispatch('fetchUser');
        },
        
        async stopImpersonation({ commit, dispatch }) {
            commit('setImpersonation', { userId: null, userName: null });
            await dispatch('fetchUser');
        },

        async loginWithMagicToken({commit, dispatch}, magicToken) {
            console.log("user.store loginWithMagicToken", magicToken)
            const resp = await axios.post(
                apiBaseUrl + "/users/magic-login",
                {token: magicToken}
            )
            commit("setToken", resp.data.access_token)
            await dispatch("fetchUser")
        },

        async requestSignupEmail(_, signupObj) {
            const body = {
                email: signupObj.email,
                display_name: signupObj.displayName,
            }
            // Add localhost port for local development
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            const resp = await axios.post(
                apiBaseUrl + "/users/magic-login-request",
                body,
            )
            return resp
        },
        async requestLoginEmail(_, email) {
            const body = { email }
            // Add localhost port for local development
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            const resp = await axios.post(
                apiBaseUrl + "/users/magic-login-request",
                body
            )
            return resp
        },

        // **************************************************
        // CLAIM PROFILE
        // **************************************************

        async setAuthorId({dispatch, getters}, authorId) {
            const myUrl = apiBaseUrl + `/users/${getters.userId}/author/${authorId}`
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
            const myUrl = apiBaseUrl + `/users/${getters.userId}/author/${authorId}`
            console.log("user.store deleteAuthorId", authorId, myUrl)
            const resp = await axios.delete(
                myUrl,
                axiosConfig({userAuth: true})
            )
            console.log("user.store deleteAuthorId resp: ", resp)
            await dispatch("fetchUser")
            commit("snackbar", "Profile unclaimed", {root: true})
        },

        async updateName({commit, dispatch, state}, name) {
            const myUrl = apiBaseUrl + `/users/${state.id}`
            await axios.patch(
                myUrl,
                { display_name: name },
                axiosConfig({userAuth: true})
            )
            commit("setFromApiResp", { ...state, display_name: name })
            commit("snackbar", "Name updated", {root: true})
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
            const myUrl = apiBaseUrl + `/users/${state.id}/collections`;
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
            const myUrl = apiBaseUrl + `/users/${state.id}/collections`;
            const resp = await axios.get(myUrl, axiosConfig({userAuth: true}));
            commit("setCollectionsData", resp.data);
        },

        // update
        async updateCollectionIds({commit, state}, {collectionId, ids}) {
            commit("updateCollectionIds", {collectionId, ids});
            const myUrl = apiBaseUrl + `/users/${state.id}/collections/${collectionId}`
            const resp = await axios.patch(myUrl, {
                ids,
            }, axiosConfig({userAuth: true}))
        
            return resp;
            // TODO Rollback on error
        },

        async updateCollection({commit, state}, {id, name, description, entity_type}) {
            commit("updateCollectionData", {id, name, description, entity_type});
            const myUrl = apiBaseUrl + `/users/${state.id}/collections/${id}`
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

            const myUrl = apiBaseUrl + `/users/${state.id}/collections/${id}`;
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
            const myUrl = apiBaseUrl + `/users/${state.id}/collections`
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
        async fetchCorrections({state, commit}) {
            if (!state.email) {
                console.log('No user email, skipping corrections fetch');
                return;
            }

            try {
                const params = new URLSearchParams({
                    submitter_email: state.email,
                    per_page: 200,
                    sort_order: 'desc',
                });
                
                const resp = await axios.get(
                    `${urlBase.correctionsApi}/v2/corrections?${params.toString()}`
                );
                
                commit('setCorrections', resp.data.results || []);
            } catch (error) {
                console.error('Error fetching corrections:', error);
                commit('setCorrections', []);
            }
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
        apiKey: (state) => state.apiKey,
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
        isLibrarian: (state) => state.isLibrarian,
        isOrgOwner: (state) => state.organizationRole === 'owner',
        organizationId: (state) => state.organizationId,
        organizationName: (state) => state.organizationName,
        isUserSaving: (state) => state.isSaving,
        renameId: (state) => state.renameId,
        editAlertId: (state) => state.editAlertId,
        activeSearchId: (state) => state.activeSearchId,
        activeSearchObj: (state) => state.savedSearches.find(s => s.id === state.activeSearchId),
        impersonatingUserId: (state) => state.impersonatingUserId,
        impersonatingUserName: (state) => state.impersonatingUserName,
        isImpersonating: (state) => !!state.impersonatingUserId,
        // Check if there's a pending (not yet live) correction for an entity+property
        hasPendingCorrection: (state) => (entityId, property) => {
            if (!entityId || !property) return false;
            
            // Normalize entity ID (remove https://openalex.org/ prefix if present)
            const normalizedId = entityId.startsWith('https://openalex.org/') 
                ? entityId.replace('https://openalex.org/', '') 
                : entityId;
            
            return state.corrections.some(correction => 
                correction.entity_id === normalizedId && 
                correction.property === property && 
                !correction.is_live
            );
        },
    }
};