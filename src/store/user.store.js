import axios from "axios";
import {url} from "@/url";
import {api} from "@/api";
import {navigation} from '@/navigation';
import {urlBase, axiosConfig} from "@/apiConfig.js"
import * as openalexId from "@/openalexId";
import {sanitizeRedirectPath} from "@/util";
import {bootUser, readUserCache, writeUserCache, clearUserCache} from "@/store/userBoot";

const shortUuid = require('short-uuid');

const apiBaseUrl = urlBase.userApi

// Newest in-flight GET /saved-search, or null (oxjob #860; see ensureSavedSearches).
let savedSearchesInFlight = null
// Newest in-flight fetchUser, or null (see ensureUser).
let userInFlight = null

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
        retiredApiKey: null,
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
        // True once /saved-search has returned at least once this session
        // (oxjob #860: the list loads in the background after /users/me, so an
        // empty list is not "no saved searches" until this is set).
        savedSearchesLoaded: false,
        // True once the LIVE /users/me has been applied this session (as
        // opposed to the localStorage copy restored at boot). Role-gated
        // routes wait for this; see router.beforeEach.
        userLive: false,
        userFromCache: false,
        columnViews: [],
        facetViews: [],
        corrections: [],
        isSaving: false,
        renameId: null,
        editAlertId: null,
        activeSearchId: null,
        impersonatingUserId: null,
        impersonatingUserName: null,
    },
    mutations: {
        setToken(state, token) {
            // A new token means a (possibly different) account: never let the
            // previous account's cached /me boot under it.
            clearUserCache(localStorage)
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
            state.savedSearchesLoaded = false
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
            state.userLive = false
            state.userFromCache = false
            localStorage.removeItem("token")
            clearUserCache(localStorage)
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
            state.retiredApiKey = apiResp.retired_api_key || null
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
        // oxjob #860: the router guard awaits this before resolving the FIRST
        // route, and App.vue paints no chrome until then. So only /users/me is
        // awaited here (the guards need userId/isAdmin/organizationRole); the
        // saved-search list, corrections and rate-limit data load in the
        // background. Anything that needs the saved-search list to be complete
        // awaits `ensureSavedSearches` (the SERP's ?id= restore does).
        // Returns `{me, settled}` — `settled` resolves once the background
        // loads have all finished, for callers that want to wait.
        async fetchUser({commit, dispatch, state}) {
            // Restore impersonation from localStorage on page refresh
            commit('restoreImpersonation');

            const p = bootUser({
                fetchMe: async () => {
                    const resp = await axios.get(
                        apiBaseUrl + "/users/me",
                        axiosConfig({userAuth: true})
                    )
                    return resp.data
                },
                applyMe: (data) => {
                    commit("setFromApiResp", data)
                    commit("setFeatureFlags", data.feature_flags || [], { root: true })
                    state.userLive = true
                    state.userFromCache = false
                    // Stale-while-revalidate copy for the next boot. Not while
                    // impersonating: that body is the target user's, not ours.
                    if (!state.impersonatingUserId) {
                        writeUserCache(localStorage, localStorage.getItem("token"), data)
                    }
                },
                background: [
                    () => dispatch("fetchSavedSearches"),
                    () => dispatch("fetchCorrections"),
                    () => dispatch("fetchRateLimitData", null, { root: true }),
                ],
            })
            userInFlight = p
            p.catch(() => {}).then(() => {
                if (userInFlight === p) userInFlight = null
            })
            return p
        },

        // Resolve once any in-flight fetchUser has settled (never rejects).
        // For code that must know whether a token-holder is really logged in
        // before acting (the SERP's ?id= restore) now that public routes no
        // longer wait for /users/me.
        ensureUser() {
            return userInFlight ? userInFlight.catch(() => {}) : Promise.resolve()
        },

        // Boot from the localStorage copy of the last /users/me (same token
        // only). Returns true if a user was restored. The live /me still runs
        // right after and overwrites everything here.
        restoreUserFromCache({commit, state}) {
            if (state.id) return true
            if (localStorage.getItem('impersonatingUserId')) return false
            const me = readUserCache(localStorage, localStorage.getItem("token"))
            if (!me) return false
            commit("setFromApiResp", me)
            commit("setFeatureFlags", me.feature_flags || [], { root: true })
            state.userFromCache = true
            return true
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
            // oxjob #290: store the api_key as the universal auth credential
            // (was the JWT access_token). users-api accepts api_key on the same
            // Bearer header, and unlike the JWT it survives the Cloudflare proxy
            // (fixes the #266 collection-filter footgun). Fall back to the JWT
            // only if api_key is somehow absent.
            commit("setToken", resp.data.api_key || resp.data.access_token)
            await dispatch("fetchUser")
            // Return the response body so callers can tailor copy — e.g. an org
            // invite acceptance carries created_account / organization_name (#317).
            return resp.data
        },

        async requestSignupEmail(_, signupObj) {
            const body = {
                email: signupObj.email,
                display_name: signupObj.displayName,
            }
            // Where to send them after they click the emailed link (oxjob #855).
            // Sanitized here as well as server-side: cheap, and it keeps a
            // hostile value from leaving the browser at all. users-api drops
            // anything it doesn't like without failing the signup, so an older
            // backend simply ignores this field.
            const redirect = sanitizeRedirectPath(signupObj.redirect, null)
            if (redirect) {
                body.redirect = redirect
            }
            // Cloudflare Turnstile token (oxjob #252 Phase 4). Backend
            // rejects 403 turnstile_required if missing on prod; in local
            // dev the backend skips the check when TURNSTILE_SECRET is unset.
            if (signupObj.turnstileToken) {
                body.turnstile_token = signupObj.turnstileToken
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
        // `payload` is either a bare email string (the long-standing shape) or
        // {email, redirect} since oxjob #855. Accepting both keeps any caller
        // that hasn't been updated working unchanged.
        async requestLoginEmail(_, payload) {
            const {email, redirect: rawRedirect} = (typeof payload === 'string')
                ? {email: payload}
                : (payload || {})
            const body = { email }
            const redirect = sanitizeRedirectPath(rawRedirect, null)
            if (redirect) {
                body.redirect = redirect
            }
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
        // is an array of {entity, entity_id, property, action, value}, or a
        // single such object. The backend authorizes claim-owners for their
        // own claimed author only. oxjob #187.
        //
        // Returns `{ rows, skipped, errors }`:
        //   - rows: the committed Curation objects (created or dedup-matched)
        //   - skipped: per-item no-ops ({index, reason}) — desired state
        //              already held in live OpenAlex data, nothing committed
        //   - errors: per-item failures ({index, status, error}) — usually
        //             validation/auth/503 verification timeouts
        //
        // Wire shapes (oxjob #291):
        //   - Single-object POST: 201 bare curation OR 200 {skipped, reason}.
        //   - Array POST: 207 Multi-Status with {summary, results: [{index,
        //     status, curation, skipped, reason, error}, ...]}.
        // We collapse both into the same `{rows, skipped, errors}` so callers
        // don't have to know the wire shape.
        async submitAuthorCurations(_ctx, curations) {
            try {
                const resp = await axios.post(
                    apiBaseUrl + `/curations`,
                    curations,
                    axiosConfig({userAuth: true})
                )
                const rows = []
                const skipped = []
                const errors = []
                if (Array.isArray(curations)) {
                    const items = resp.data?.results || []
                    items.forEach((it) => {
                        if (it.curation) rows.push(it.curation)
                        if (it.skipped) skipped.push({index: it.index, reason: it.reason})
                        // per-item 503/422/400 → surface as error; don't throw
                        if (it.status >= 400) errors.push({index: it.index, status: it.status, error: it.error})
                    })
                } else if (resp.data?.skipped) {
                    skipped.push({index: 0, reason: resp.data.reason})
                } else if (resp.data) {
                    rows.push(resp.data)
                }
                return {rows, skipped, errors}
            } catch (e) {
                if (e?.response?.status === 429) {
                    throw new Error("You've reached today's limit of 1000 works added — please try again tomorrow.")
                }
                // 503 here is a request-level fail-closed (the no-op verifier
                // can no longer be reached at all). Per-item 503s in a 207
                // come back in `errors`, not as a throw. oxjob #199 / #291.
                if (e?.response?.status === 503) {
                    throw new Error(e?.response?.data?.message || "Couldn't verify your change right now. Please try again in a moment.")
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

        async rotateApiKey({commit, state}, grace) {
            const myUrl = apiBaseUrl + `/users/${state.id}/api-key/rotate`
            const resp = await axios.post(
                myUrl,
                // oxjob #830: grace keeps the old key serving API requests
                // until it expires (it stops authenticating GUI sessions
                // immediately either way).
                { grace: grace || 'now' },
                axiosConfig({userAuth: true})
            )
            commit("setFromApiResp", resp.data)
            // oxjob #290: the api_key IS the session credential now, so rotating
            // it must update the stored token — otherwise the GUI keeps sending
            // the old (now-invalid) key and every request 401s.
            if (resp.data.api_key) {
                commit("setToken", resp.data.api_key)
            }
            return resp.data.api_key
        },

        async expireRetiredApiKey({commit, state}) {
            const myUrl = apiBaseUrl + `/users/${state.id}/api-key/retired`
            const resp = await axios.delete(myUrl, axiosConfig({userAuth: true}))
            commit("setFromApiResp", resp.data)
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
        fetchSavedSearches({state}) {
            const p = (async () => {
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
                state.savedSearchesLoaded = true;
            })()
            // Track the newest in-flight fetch so ensureSavedSearches can join
            // it (oxjob #860). Not deduped on purpose: the post-write callers
            // ("have to update the list") must always hit the server again.
            savedSearchesInFlight = p
            p.catch(() => {}).then(() => {
                if (savedSearchesInFlight === p) savedSearchesInFlight = null
            })
            return p
        },

        // Resolve once the saved-search list is known for this session: joins
        // an in-flight fetch, starts one if none has happened yet, and is a
        // no-op when the list is already loaded (oxjob #860).
        ensureSavedSearches({state, dispatch}) {
            if (savedSearchesInFlight) return savedSearchesInFlight
            if (state.savedSearchesLoaded) return Promise.resolve()
            return dispatch("fetchSavedSearches")
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
        async updateSearchFrequency({commit, dispatch, state}, {id, alert_frequency}) {
            const oldSearchObj = state.savedSearches.find(s => s.id === id)
            const resp = await axios.put(
                apiBaseUrl + "/saved-search/" + id,
                {...oldSearchObj, alert_frequency},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSavedSearches") // have to update the list
            commit("snackbar", "Alert frequency updated", {root: true})
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
        // SERP VIEWS (saved table-column + stats configurations,
        // oxjobs #602/#626) — kind: 'columns' | 'facets'
        // **************************************************

        async fetchSerpViews({state}, kind = 'columns') {
            const resp = await axios.get(
                apiBaseUrl + "/serp-view?kind=" + kind,
                axiosConfig({userAuth: true})
            )
            const sorted = [...resp.data].sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            if (kind === 'facets') state.facetViews = sorted;
            else state.columnViews = sorted;
        },
        async createSerpView({dispatch}, {entity_type, kind = 'columns', name, columns, sort_by}) {
            const id = shortUuid.generate()
            const resp = await axios.put(
                apiBaseUrl + "/serp-view/" + id,
                {entity_type, kind, name, columns, sort_by},
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSerpViews", kind)
            return resp;
        },
        async deleteSerpView({commit, dispatch}, {id, kind = 'columns'}) {
            const resp = await axios.delete(
                apiBaseUrl + `/serp-view/${id}`,
                axiosConfig({userAuth: true}),
            )
            await dispatch("fetchSerpViews", kind)
            commit("snackbar", "View deleted", {root: true})
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
        // CORRECTIONS
        // **************************************************


        // create
        async createCorrection(_, correctionObj) {
            console.log("user.store createCorrection", correctionObj)
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
        savedSearchesLoaded: (state) => state.savedSearchesLoaded,
        userLive: (state) => state.userLive,
        userFromCache: (state) => state.userFromCache,
        userColumnViews: (state) => state.columnViews,
        userFacetViews: (state) => state.facetViews,
        userCorrections: (state) => state.corrections,
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