import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";
// Every collection the API returns goes through normalizeCollection (oxjob #1524).
import { normalizeCollection } from "@/collectionShape.js";

// The collections API on api.openalex.org (oxjob #1515): one resource per collection,
// its members under /members. Components go through this store, never raw URLs.
const collectionsUrl = `${urlBase.collectionsApi}/collections`;
// The API takes at most 100 IDs in a query string (?member_ids=).
const MAX_IDS_PER_QUERY = 100;
// Defense-in-depth: never trust callers to have pre-validated a collection id.
// `fetchPublic`/`fetchEntities` accept route-param values; even mutation
// helpers, where the id originates server-side, are encoded so a future
// caller can't accidentally smuggle path segments (security review M8).
const enc = encodeURIComponent;

// ---- per-entity membership batcher (oxjob #564) -----------------------------
// SERP rows each ask "which of my collections contain entity X?". As a per-row
// GET that turned every 25-row list render into a request storm. Rows now
// dispatch `fetchEntityCollections`; ids arriving in the same ~25ms window are
// coalesced into ONE `member_ids=` batch request (the API annotates each
// collection with `matching_member_ids`), and results are cached per entity for
// the session. `bumpEntityMutations` clears the cache — rows watch the counter
// and re-dispatch, so a post-mutation page costs one fresh batch.
const _entityCollectionsCache = new Map(); // shortId -> [collection, ...]
let _pendingEntityIds = new Map();         // shortId -> [{resolve, reject}, ...]
let _flushTimer = null;

async function _flushEntityCollectionsBatch() {
    const pending = _pendingEntityIds;
    _pendingEntityIds = new Map();
    _flushTimer = null;
    const ids = [...pending.keys()];
    // The API caps member_ids at 100 per request; a SERP page is ≤100 rows so
    // this is one chunk in practice.
    for (let i = 0; i < ids.length; i += MAX_IDS_PER_QUERY) {
        const chunk = ids.slice(i, i + MAX_IDS_PER_QUERY);
        try {
            const resp = await axios.get(
                `${collectionsUrl}?member_ids=${chunk.map(enc).join(",")}&per_page=100`,
                axiosConfig({ userAuth: true })
            );
            // The server echoes each requested id in matching_member_ids, so ids
            // not present in ANY collection resolve to [] — cache those too, or
            // every empty row would refetch.
            const byEntity = new Map(chunk.map((id) => [id, []]));
            for (const collection of (resp.data?.results || []).map(normalizeCollection)) {
                for (const eid of collection.matching_member_ids || []) {
                    if (byEntity.has(eid)) byEntity.get(eid).push(collection);
                }
            }
            for (const id of chunk) {
                _entityCollectionsCache.set(id, byEntity.get(id));
                for (const w of pending.get(id)) w.resolve(byEntity.get(id));
            }
        } catch (e) {
            // Don't cache failures — the next dispatch retries.
            for (const id of chunk) {
                for (const w of pending.get(id)) w.reject(e);
            }
        }
    }
}

function clearEntityCollectionsCache() {
    _entityCollectionsCache.clear();
}

export default {
    namespaced: true,
    state: {
        collections: [],
        loaded: false,
        loading: false,
        // Bumped whenever a collection's membership changes (add/remove
        // members, delete collection, create with members). Watched by
        // EntityCollectionsRow so per-row chips refresh after a SERP-level apply.
        entityMutationCounter: 0,
        // Compact EntityCollectionsRow instances (SERP rows) write their resolved
        // collection list here as they fetch. Keyed by short entity_id (e.g. W123).
        // Used by ExpertSerp to gate the Remove menu's visibility — only
        // surface it when at least one visible row has at least one collection.
        pageCollectionsByEntity: {},
    },
    mutations: {
        setCollections(state, collections) {
            state.collections = collections || [];
            state.loaded = true;
        },
        addCollection(state, collection) {
            state.collections = [...state.collections, collection];
        },
        updateCollection(state, collection) {
            state.collections = state.collections.map(l => l.id === collection.id ? { ...l, ...collection } : l);
        },
        removeCollection(state, id) {
            state.collections = state.collections.filter(l => l.id !== id);
        },
        setLoading(state, b) {
            state.loading = b;
        },
        bumpEntityMutations(state) {
            state.entityMutationCounter += 1;
            // Memberships changed — drop the batcher's per-entity cache so the
            // rows' counter-watchers refetch fresh data (oxjob #564).
            clearEntityCollectionsCache();
        },
        setPageEntityCollections(state, { entityId, collections }) {
            if (collections && collections.length) {
                state.pageCollectionsByEntity = {
                    ...state.pageCollectionsByEntity,
                    [entityId]: collections,
                };
            } else if (state.pageCollectionsByEntity[entityId]) {
                const next = { ...state.pageCollectionsByEntity };
                delete next[entityId];
                state.pageCollectionsByEntity = next;
            }
        },
        clearPageCollections(state) {
            state.pageCollectionsByEntity = {};
        },
        clear(state) {
            state.collections = [];
            state.loaded = false;
            state.loading = false;
            state.entityMutationCounter = 0;
            state.pageCollectionsByEntity = {};
            clearEntityCollectionsCache();
        },
    },
    getters: {
        all: (state) => state.collections,
        byId: (state) => (id) => state.collections.find(l => l.id === id),
        sortedAlphabetical: (state) =>
            [...state.collections].sort((a, b) =>
                (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
            ),
    },
    actions: {
        async fetchAll({ commit, rootState }) {
            if (!rootState.user?.id) {
                commit("setCollections", []);
                return [];
            }
            commit("setLoading", true);
            try {
                // GET /collections pages at 100 at most; the cap is 100 per user so one page is enough.
                const resp = await axios.get(
                    `${collectionsUrl}?per_page=100`,
                    axiosConfig({ userAuth: true })
                );
                const collections = (resp.data.results || []).map(normalizeCollection);
                commit("setCollections", collections);
                return collections;
            } finally {
                commit("setLoading", false);
            }
        },

        // Which of the user's collections contain `entityId` (a short id, e.g.
        // W123)? Batched + cached — see the batcher block at the top of this
        // file. Resolves [] for logged-out users and unknown/empty ids.
        fetchEntityCollections({ rootState }, entityId) {
            if (!rootState.user?.id || !entityId) return Promise.resolve([]);
            if (_entityCollectionsCache.has(entityId)) {
                return Promise.resolve(_entityCollectionsCache.get(entityId));
            }
            return new Promise((resolve, reject) => {
                if (!_pendingEntityIds.has(entityId)) _pendingEntityIds.set(entityId, []);
                _pendingEntityIds.get(entityId).push({ resolve, reject });
                if (!_flushTimer) _flushTimer = setTimeout(_flushEntityCollectionsBatch, 25);
            });
        },

        async create({ commit }, payload = {}) {
            // Normal create. Making a copy of another collection is `copy` below.
            const { display_name, description, entity_type, member_ids } = payload;
            const body = {
                display_name,
                description: description || "",
                entity_type,
                member_ids: member_ids || [],
            };
            const resp = await axios.post(
                collectionsUrl,
                body,
                axiosConfig({ userAuth: true })
            );
            const collection = normalizeCollection(resp.data);
            commit("addCollection", collection);
            // creating with members changes per-entity memberships
            if ((collection?.member_count ?? 0) > 0) commit("bumpEntityMutations");
            return collection;
        },

        // Make a copy (oxjob #646): snapshot a collection the user can read (their
        // own, or one shared by link) into a new private collection they own. Only
        // ever called from an explicit click, never on page load or after a login
        // redirect (labels-v1 security review H1).
        async copy({ commit }, sourceId) {
            const resp = await axios.post(
                collectionsUrl,
                { copy_of: sourceId },
                axiosConfig({ userAuth: true })
            );
            const collection = normalizeCollection(resp.data);
            commit("addCollection", collection);
            if ((collection?.member_count ?? 0) > 0) commit("bumpEntityMutations");
            return collection;
        },

        // Private, or shared by link (oxjob #646). Owner only.
        async setAccess({ commit }, { id, access }) {
            const resp = await axios.patch(
                `${collectionsUrl}/${enc(id)}`,
                { access },
                axiosConfig({ userAuth: true })
            );
            const collection = normalizeCollection(resp.data);
            commit("updateCollection", collection);
            return collection;
        },

        async fetchPublic(_ctx, id) {
            // Readable by the owner (and admins) when private, and by anyone, logged
            // in or not, when shared by link (oxjob #646). The auth header rides along
            // when there is one; the response says whether the caller can edit
            // (`can_edit`). The name `fetchPublic` is historical.
            const resp = await axios.get(
                `${collectionsUrl}/${enc(id)}`,
                axiosConfig({ userAuth: true })
            );
            return normalizeCollection(resp.data);
        },

        async update({ commit }, { id, display_name, description }) {
            const body = {};
            if (display_name !== undefined) body.display_name = display_name;
            if (description !== undefined) body.description = description;
            const resp = await axios.patch(
                `${collectionsUrl}/${enc(id)}`,
                body,
                axiosConfig({ userAuth: true })
            );
            const collection = normalizeCollection(resp.data);
            commit("updateCollection", collection);
            return collection;
        },

        async remove({ commit }, id) {
            await axios.delete(
                `${collectionsUrl}/${enc(id)}`,
                axiosConfig({ userAuth: true })
            );
            commit("removeCollection", id);
            commit("bumpEntityMutations");
        },

        // Add members: {added, already_present, member_count}.
        async addEntities({ commit }, { id, member_ids }) {
            const resp = await axios.post(
                `${collectionsUrl}/${enc(id)}/members`,
                { member_ids },
                axiosConfig({ userAuth: true })
            );
            commit("updateCollection", { id, member_count: resp.data?.member_count });
            commit("bumpEntityMutations");
            return resp.data;
        },

        // Remove members, 100 per request (they ride in the query string):
        // {removed, member_count}.
        async removeEntities({ commit }, { id, member_ids }) {
            let removed = 0;
            let member_count;
            for (let i = 0; i < member_ids.length; i += MAX_IDS_PER_QUERY) {
                const chunk = member_ids.slice(i, i + MAX_IDS_PER_QUERY);
                const resp = await axios.delete(
                    `${collectionsUrl}/${enc(id)}/members?member_ids=${chunk.map(enc).join(",")}`,
                    axiosConfig({ userAuth: true })
                );
                removed += resp.data?.removed || 0;
                member_count = resp.data?.member_count;
            }
            if (member_count !== undefined) commit("updateCollection", { id, member_count });
            commit("bumpEntityMutations");
            return { removed, member_count };
        },

        async removeEntity({ commit, state }, { id, member_id }) {
            try {
                await axios.delete(
                    `${collectionsUrl}/${enc(id)}/members/${enc(member_id)}`,
                    axiosConfig({ userAuth: true })
                );
            } catch (e) {
                // Already gone is the outcome the caller wanted.
                if (e.response?.data?.code !== "member_not_found") throw e;
            }
            const collection = state.collections.find(l => l.id === id);
            if (collection) {
                commit("updateCollection", {
                    id,
                    member_count: Math.max(0, (collection.member_count || 0) - 1),
                });
            }
            commit("bumpEntityMutations");
        },

        // A page of members: {meta: {count, page, per_page}, results: [{id, added_at}]}.
        async fetchEntities(_ctx, { id, page = 1, per_page = 200 }) {
            const resp = await axios.get(
                `${collectionsUrl}/${enc(id)}/members?page=${page}&per_page=${per_page}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },
    },
};
