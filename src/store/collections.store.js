import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";

const apiBaseUrl = urlBase.userApi;
// Defense-in-depth: never trust callers to have pre-validated a collection id.
// `fetchPublic`/`fetchEntities` accept route-param values; even mutation
// helpers, where the id originates server-side, are encoded so a future
// caller can't accidentally smuggle path segments (security review M8).
const enc = encodeURIComponent;

export default {
    namespaced: true,
    state: {
        collections: [],
        loaded: false,
        loading: false,
        // Bumped whenever a collection's entity membership changes (add/remove
        // entities, delete collection, create-with-entity_ids). Watched by
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
                // /me/collections paginates; per_page max 100. v1 cap is 100 per user so one page is enough.
                const resp = await axios.get(
                    `${apiBaseUrl}/me/collections?per_page=100`,
                    axiosConfig({ userAuth: true })
                );
                const collections = resp.data.results || [];
                commit("setCollections", collections);
                return collections;
            } finally {
                commit("setLoading", false);
            }
        },

        async create({ commit }, payload = {}) {
            // Collections v1.1 (oxjob #228 QA-040): collections are now private, the
            // public-page Copy-to-my-collections fork flow is gone. POST /me/collections
            // accepts only the normal-create shape.
            const { display_name, description, entity_type, entity_ids } = payload;
            const body = {
                display_name,
                description: description || "",
                entity_type,
                entity_ids: entity_ids || [],
            };
            const resp = await axios.post(
                `${apiBaseUrl}/me/collections`,
                body,
                axiosConfig({ userAuth: true })
            );
            commit("addCollection", resp.data);
            // create-with-entity_ids changes per-entity memberships
            const createdEntityCount = (resp.data?.entity_count ?? 0);
            if (createdEntityCount > 0) commit("bumpEntityMutations");
            return resp.data;
        },

        async fetchPublic(_ctx, id) {
            // Auth header is required (collections are private). The route name
            // remains `fetchPublic` for historical reasons and to keep call
            // sites stable.
            const resp = await axios.get(
                `${apiBaseUrl}/collections/${enc(id)}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },

        async update({ commit }, { id, display_name, description }) {
            const body = {};
            if (display_name !== undefined) body.display_name = display_name;
            if (description !== undefined) body.description = description;
            const resp = await axios.patch(
                `${apiBaseUrl}/me/collections/${enc(id)}`,
                body,
                axiosConfig({ userAuth: true })
            );
            commit("updateCollection", resp.data);
            return resp.data;
        },

        async remove({ commit }, id) {
            await axios.delete(
                `${apiBaseUrl}/me/collections/${enc(id)}`,
                axiosConfig({ userAuth: true })
            );
            commit("removeCollection", id);
            commit("bumpEntityMutations");
        },

        async addEntities({ commit, state }, { id, entity_ids }) {
            const resp = await axios.post(
                `${apiBaseUrl}/me/collections/${enc(id)}/entities`,
                { entity_ids },
                axiosConfig({ userAuth: true })
            );
            // server returns counts; bump local entity_count
            const collection = state.collections.find(l => l.id === id);
            if (collection) {
                commit("updateCollection", {
                    id,
                    entity_count: (collection.entity_count || 0) + (resp.data?.added || 0),
                });
            }
            commit("bumpEntityMutations");
            return resp.data;
        },

        async removeEntities({ commit, state }, { id, entity_ids }) {
            const resp = await axios.delete(
                `${apiBaseUrl}/me/collections/${enc(id)}/entities`,
                { ...axiosConfig({ userAuth: true }), data: { entity_ids } }
            );
            const collection = state.collections.find(l => l.id === id);
            if (collection) {
                commit("updateCollection", {
                    id,
                    entity_count: Math.max(0, (collection.entity_count || 0) - (resp.data?.removed || 0)),
                });
            }
            commit("bumpEntityMutations");
            return resp.data;
        },

        async removeEntity({ commit, state }, { id, entity_id }) {
            await axios.delete(
                `${apiBaseUrl}/me/collections/${enc(id)}/entities/${enc(entity_id)}`,
                axiosConfig({ userAuth: true })
            );
            const collection = state.collections.find(l => l.id === id);
            if (collection) {
                commit("updateCollection", {
                    id,
                    entity_count: Math.max(0, (collection.entity_count || 0) - 1),
                });
            }
            commit("bumpEntityMutations");
        },

        async fetchEntities(_ctx, { id, page = 1, per_page = 200 }) {
            // Entity listings live on the public endpoint — there is no
            // /me/collections/:id/entities route. Auth header is harmless on the
            // public path and lets ad-hoc local-dev tokens through.
            const resp = await axios.get(
                `${apiBaseUrl}/collections/${enc(id)}/entities?page=${page}&per_page=${per_page}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },
    },
};
