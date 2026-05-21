import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";

const apiBaseUrl = urlBase.userApi;

export default {
    namespaced: true,
    state: {
        labels: [],
        loaded: false,
        loading: false,
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
        clear(state) {
            state.labels = [];
            state.loaded = false;
            state.loading = false;
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

        async create({ commit }, { display_name, description, entity_type, entity_ids }) {
            const resp = await axios.post(
                `${apiBaseUrl}/me/labels`,
                { display_name, description: description || "", entity_type, entity_ids: entity_ids || [] },
                axiosConfig({ userAuth: true })
            );
            commit("addLabel", resp.data);
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
        },

        async fetchEntities(_ctx, { id, page = 1, per_page = 200 }) {
            const resp = await axios.get(
                `${apiBaseUrl}/me/labels/${id}/entities?page=${page}&per_page=${per_page}`,
                axiosConfig({ userAuth: true })
            );
            return resp.data;
        },
    },
};
