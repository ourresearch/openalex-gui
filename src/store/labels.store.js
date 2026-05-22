import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";

const apiBaseUrl = urlBase.userApi;

export default {
    namespaced: true,
    state: {
        labels: [],
        loaded: false,
        loading: false,
        // Bumped whenever a label's entity membership changes (add/remove
        // entities, delete label, create-with-entity_ids). Watched by
        // EntityLabelsRow so per-row chips refresh after a SERP-level apply.
        entityMutationCounter: 0,
    },
    mutations: {
        setLabels(state, labels) {
            state.labels = labels || [];
            state.loaded = true;
        },
        addLabel(state, label) {
            state.labels = [...state.labels, label];
        },
        updateLabel(state, label) {
            state.labels = state.labels.map(l => l.id === label.id ? { ...l, ...label } : l);
        },
        removeLabel(state, id) {
            state.labels = state.labels.filter(l => l.id !== id);
        },
        setLoading(state, b) {
            state.loading = b;
        },
        bumpEntityMutations(state) {
            state.entityMutationCounter += 1;
        },
        clear(state) {
            state.labels = [];
            state.loaded = false;
            state.loading = false;
            state.entityMutationCounter = 0;
        },
    },
    getters: {
        all: (state) => state.labels,
        byId: (state) => (id) => state.labels.find(l => l.id === id),
        sortedAlphabetical: (state) =>
            [...state.labels].sort((a, b) =>
                (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
            ),
    },
    actions: {
        async fetchAll({ commit, rootState }) {
            if (!rootState.user?.id) {
                commit("setLabels", []);
                return [];
            }
            commit("setLoading", true);
            try {
                // /me/labels paginates; per_page max 100. v1 cap is 100 per user so one page is enough.
                const resp = await axios.get(
                    `${apiBaseUrl}/me/labels?per_page=100`,
                    axiosConfig({ userAuth: true })
                );
                const labels = resp.data.results || [];
                commit("setLabels", labels);
                return labels;
            } finally {
                commit("setLoading", false);
            }
        },

        async create({ commit }, payload = {}) {
            // POST /me/labels has two shapes (server picks by whether
            // source_label_id is present). Mirror them here so callers can
            // pass the union of fields and the server decides:
            //   - normal create: { display_name, description?, entity_type, entity_ids }
            //   - snapshot fork: { source_label_id, display_name? }
            const { display_name, description, entity_type, entity_ids, source_label_id } = payload;
            const body = source_label_id
                ? { source_label_id, ...(display_name ? { display_name } : {}) }
                : {
                    display_name,
                    description: description || "",
                    entity_type,
                    entity_ids: entity_ids || [],
                };
            const resp = await axios.post(
                `${apiBaseUrl}/me/labels`,
                body,
                axiosConfig({ userAuth: true })
            );
            commit("addLabel", resp.data);
            // create-with-entity_ids changes per-entity memberships
            const createdEntityCount = (resp.data?.entity_count ?? 0);
            if (createdEntityCount > 0) commit("bumpEntityMutations");
            return resp.data;
        },

        async fetchPublic(_ctx, id) {
            const resp = await axios.get(
                `${apiBaseUrl}/labels/${id}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },

        async update({ commit }, { id, display_name, description }) {
            const body = {};
            if (display_name !== undefined) body.display_name = display_name;
            if (description !== undefined) body.description = description;
            const resp = await axios.patch(
                `${apiBaseUrl}/me/labels/${id}`,
                body,
                axiosConfig({ userAuth: true })
            );
            commit("updateLabel", resp.data);
            return resp.data;
        },

        async remove({ commit }, id) {
            await axios.delete(
                `${apiBaseUrl}/me/labels/${id}`,
                axiosConfig({ userAuth: true })
            );
            commit("removeLabel", id);
            commit("bumpEntityMutations");
        },

        async addEntities({ commit, state }, { id, entity_ids }) {
            const resp = await axios.post(
                `${apiBaseUrl}/me/labels/${id}/entities`,
                { entity_ids },
                axiosConfig({ userAuth: true })
            );
            // server returns counts; bump local entity_count
            const label = state.labels.find(l => l.id === id);
            if (label) {
                commit("updateLabel", {
                    id,
                    entity_count: (label.entity_count || 0) + (resp.data?.added || 0),
                });
            }
            commit("bumpEntityMutations");
            return resp.data;
        },

        async removeEntities({ commit, state }, { id, entity_ids }) {
            const resp = await axios.delete(
                `${apiBaseUrl}/me/labels/${id}/entities`,
                { ...axiosConfig({ userAuth: true }), data: { entity_ids } }
            );
            const label = state.labels.find(l => l.id === id);
            if (label) {
                commit("updateLabel", {
                    id,
                    entity_count: Math.max(0, (label.entity_count || 0) - (resp.data?.removed || 0)),
                });
            }
            commit("bumpEntityMutations");
            return resp.data;
        },

        async removeEntity({ commit, state }, { id, entity_id }) {
            await axios.delete(
                `${apiBaseUrl}/me/labels/${id}/entities/${encodeURIComponent(entity_id)}`,
                axiosConfig({ userAuth: true })
            );
            const label = state.labels.find(l => l.id === id);
            if (label) {
                commit("updateLabel", {
                    id,
                    entity_count: Math.max(0, (label.entity_count || 0) - 1),
                });
            }
            commit("bumpEntityMutations");
        },

        async fetchEntities(_ctx, { id, page = 1, per_page = 200 }) {
            // Entity listings live on the public endpoint — there is no
            // /me/labels/:id/entities route. Auth header is harmless on the
            // public path and lets ad-hoc local-dev tokens through.
            const resp = await axios.get(
                `${apiBaseUrl}/labels/${id}/entities?page=${page}&per_page=${per_page}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },
    },
};
