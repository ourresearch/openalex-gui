import axios from "axios";
import {url} from "@/url";
import {api} from "@/api";
import {navigation} from '@/navigation';
import {urlBase, axiosConfig} from "@/apiConfig.js"
import * as openalexId from "@/openalexId";

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
        isSiteCurator: false,
        apiKey: null,
        plan: null,
        planExpiresAt: null,
        organizationId: null,
        organizationName: null,
        organizationRole: null,
        organizationPlan: null,
        activeBoost: null,
        rateThrottled: false,
        orgRateThrottled: false,
        emails: [],
        claim: null,
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
                return existing;
            });
            state.labelLastModified = {
                ...state.labelLastModified,
                [collectionId]: Date.now()
            };
        },
        deleteCollection(state, id) {
            state.collections = state.collections.filter(coll => coll.id !== id);
        },
        setCorrections(state, corrections) {
            state.corrections = corrections;
        },
        setAuthorIdDirect(state, authorId) {
            state.authorId = authorId;
        },
        logout(state) {
            state.id = ""
            state.name = ""
            state.email = ""
            state.emails = []
            state.savedSearches = []
            state.collections = []
            state.corrections = []
            state.authorId = ""
            state.plan = null
            state.planExpiresAt = null
            state.isSiteCurator = false
            state.organizationId = null
            state.organizationName = null
            state.organizationRole = null
            state.organizationPlan = null
            state.rateThrottled = false
            state.orgRateThrottled = false
            state.claim = null
            localStorage.removeItem("token")
            navigation.push("/")
        },
        setFromApiResp(state, apiResp) {
            state.id = apiResp.id
            state.name = apiResp.display_name
            state.email = apiResp.email
            state.isAdmin = apiResp.is_admin
            state.isLibrarian = apiResp.is_librarian
            state.isSiteCurator = apiResp.is_site_curator
            state.authorId = apiResp.author_id
            state.apiKey = apiResp.api_key || null
            state.plan = apiResp.plan || null
            state.planExpiresAt = apiResp.plan_expires_at || null
            state.organizationId = apiResp.organization_id || null
            state.organizationName = apiResp.organization_name || null
            state.organizationRole = apiResp.organization_role || null
            state.organizationPlan = apiResp.organization_plan || null
            state.activeBoost = apiResp.active_boost || null
            state.rateThrottled = !!apiResp.rate_throttled
            state.orgRateThrottled = !!apiResp.org_rate_throttled
            state.emails = apiResp.emails || []
            state.claim = apiResp.claim || null
        },
        setEmails(state, emails) {
            state.emails = emails || []
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
            commit("setFeatureFlags", resp.data.feature_flags || [], { root: true })

            await dispatch("fetchSavedSearches");
            await dispatch("fetchCorrections");
            dispatch("fetchRateLimitData", null, { root: true });

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
        // EMAILS
        // **************************************************

        async fetchEmails({commit}) {
            const resp = await axios.get(
                apiBaseUrl + "/users/me/emails",
                axiosConfig({userAuth: true})
            )
            commit("setEmails", resp.data.emails || [])
            return resp.data.emails || []
        },

        async addEmail({dispatch}, email) {
            const body = {email}
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            await axios.post(
                apiBaseUrl + "/users/me/emails",
                body,
                axiosConfig({userAuth: true})
            )
            await dispatch("fetchEmails")
        },

        async removeEmail({dispatch}, emailId) {
            await axios.delete(
                apiBaseUrl + `/users/me/emails/${emailId}`,
                axiosConfig({userAuth: true})
            )
            // server may have auto-promoted a new primary — refresh whole user
            await dispatch("fetchUser")
        },

        async makePrimary({dispatch}, emailId) {
            await axios.post(
                apiBaseUrl + `/users/me/emails/${emailId}/make-primary`,
                {},
                axiosConfig({userAuth: true})
            )
            await dispatch("fetchUser")
        },

        async resendVerification({dispatch}, emailId) {
            const body = {}
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            await axios.post(
                apiBaseUrl + `/users/me/emails/${emailId}/resend-verification`,
                body,
                axiosConfig({userAuth: true})
            )
            await dispatch("fetchEmails")
        },

        // Admin: manage another user's emails. Caller re-fetches the target user.
        async adminAddEmail(_ctx, {userId, email}) {
            const body = {email}
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            await axios.post(
                apiBaseUrl + `/users/${userId}/emails`,
                body,
                axiosConfig({userAuth: true})
            )
        },

        async adminRemoveEmail(_ctx, {userId, emailId}) {
            await axios.delete(
                apiBaseUrl + `/users/${userId}/emails/${emailId}`,
                axiosConfig({userAuth: true})
            )
        },

        async adminMakePrimary(_ctx, {userId, emailId}) {
            await axios.post(
                apiBaseUrl + `/users/${userId}/emails/${emailId}/make-primary`,
                {},
                axiosConfig({userAuth: true})
            )
        },

        async adminResendVerification(_ctx, {userId, emailId}) {
            const body = {}
            if (window.location.hostname === 'localhost') {
                body.localhost = window.location.port || '8080'
            }
            await axios.post(
                apiBaseUrl + `/users/${userId}/emails/${emailId}/resend-verification`,
                body,
                axiosConfig({userAuth: true})
            )
        },

        async verifyEmail({dispatch}, token) {
            const resp = await axios.post(
                apiBaseUrl + "/users/verify-email",
                {token}
            )
            // verify is anonymous; refresh only if signed in
            if (localStorage.getItem("token")) {
                await dispatch("fetchUser")
            }
            return resp.data
        },

        // **************************************************
        // CLAIM PROFILE
        // **************************************************

        async setAuthorId({dispatch, getters}, payload) {
            // Accepts either a string authorId (legacy) or {authorId, evidence}.
            // The backend requires non-empty `evidence` (max 2000 chars after bleach).
            const authorId = typeof payload === 'string' ? payload : payload.authorId
            const evidence = typeof payload === 'string' ? '' : (payload.evidence || '')
            const myUrl = apiBaseUrl + `/users/${getters.userId}/author/${authorId}`
            const resp = await axios.post(
                myUrl,
                { evidence },
                axiosConfig({userAuth: true})
            )
            await dispatch("fetchUser")
            return resp.data  // {auto_approved, claim_id, message}
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

        // Submit one or more author curations (POST /curations). `curations`
        // is an array of {entity, entity_id, property, action, value}. The
        // backend authorizes claim-owners for their own claimed author only.
        // Returns the array of created/existing curation rows. oxjob #187.
        async submitAuthorCurations(_ctx, curations) {
            try {
                const resp = await axios.post(
                    apiBaseUrl + `/curations`,
                    curations,
                    axiosConfig({userAuth: true})
                )
                return resp.data
            } catch (e) {
                if (e?.response?.status === 429) {
                    throw new Error("You've reached today's limit of 1000 works added — please try again tomorrow.")
                }
                throw new Error(e?.response?.data?.message || "Couldn't submit your change. Please try again.")
            }
        },

        // Fetch the logged-in user's own works curations for one claimed
        // author (GET /curations; a regular user only ever sees their own).
        // `value` on both works/replace (add) and works/remove is the author
        // OpenAlex id, so filtering by it returns exactly this author's
        // add/remove rows. Pages through all results. oxjob #187.
        async fetchAuthorCurations(_ctx, authorId) {
            const perPage = 100
            let page = 1
            const all = []
            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const resp = await axios.get(
                        apiBaseUrl + `/curations`,
                        {
                            ...axiosConfig({userAuth: true}),
                            params: {value: authorId, per_page: perPage, page},
                        }
                    )
                    const results = resp.data?.results || []
                    all.push(...results)
                    const totalPages = resp.data?.meta?.total_pages || 1
                    if (page >= totalPages || results.length === 0) break
                    page += 1
                }
                return all.filter(c => c.entity === 'works')
            } catch (e) {
                // Reconciliation is best-effort; never block the page on it.
                console.warn('fetchAuthorCurations failed', e)
                return []
            }
        },

        // Cancel a pending curation (DELETE /curations/<id>; the owner may
        // delete their own). Used by the per-badge undo. oxjob #187.
        async deleteAuthorCuration(_ctx, curationId) {
            await axios.delete(
                apiBaseUrl + `/curations/${curationId}`,
                axiosConfig({userAuth: true})
            )
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

        async rotateApiKey({commit, state}) {
            const myUrl = apiBaseUrl + `/users/${state.id}/api-key/rotate`
            const resp = await axios.post(
                myUrl,
                {},
                axiosConfig({userAuth: true})
            )
            commit("setFromApiResp", resp.data)
            return resp.data.api_key
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

        // delete (stays on SERP, strips ?id from URL)
        async unsaveCurrentSearch({commit, dispatch}, id) {
            const myUrl = apiBaseUrl + `/saved-search/${id}`
            await axios.delete(
                myUrl,
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches")
            commit("snackbar", "Search unsaved", {root: true})
            commit("setActiveSearchId", undefined);
            // Strip ?id from current URL, stay on SERP
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("id");
            await navigation.replace(newUrl.pathname + newUrl.search);
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
        userClaim: (state) => state.claim,
        pendingClaim: (state) =>
            state.claim && !state.claim.auto_approved ? state.claim : null,
        hasAnyClaim: (state) => !!(state.authorId || state.claim),
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
        isAdmin: (state) => state.isAdmin || state.email?.trim() === 'jalperin@sfu.ca',
        isLibrarian: (state) => state.isLibrarian,
        isSiteCurator: (state) => state.isSiteCurator,
        hasSiteWideAccess: (state, getters) => getters.isAdmin || state.isSiteCurator,
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
            
            // Normalize entity ID using openalexId module
            const normalizedId = openalexId.getShortId(entityId) || entityId;
            
            return state.corrections.some(correction => 
                correction.entity_id === normalizedId && 
                correction.property === property && 
                !correction.is_live
            );
        },
    }
};