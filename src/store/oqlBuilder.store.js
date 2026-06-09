// Vuex module for the no-code OQL builder (oxjob #428).
//
// OQO is the single source of truth. The builder component owns the editable tree
// and commits a full OQO here; this module renders it to OQL server-side
// (GET /query/oqo/<json>) and parses shared OQL back to OQO (GET /query/oql/<oql>)
// — both pure endpoints, so the visual tree and the OQL text can't drift.
//
// state() is a FUNCTION (per-store isolation; see feedback_vuex_module_state_function).

import { api } from "@/api";
import { getProperties } from "@/components/OqlPlayground/oqlEditorApi";

export default {
  namespaced: true,
  state: () => ({
    propertiesByEntity: {},   // entity -> { col: Property }
    propertiesLoading: false,
    oql: "",                  // [Name]-annotated canonical OQL (rendered from oqo)
    oxurl: "",
    validation: null,         // { valid, errors[], warnings[] }
    rendering: false,
    seedError: null,          // parse error when seeding from raw OQL
    seededOqo: null,          // set by seedFromOql; the builder watches this to rebuild its tree
  }),
  getters: {
    propsFor: (state) => (entity) => state.propertiesByEntity[entity] || null,
    isValid: (state) => !!(state.validation && state.validation.valid),
  },
  mutations: {
    setProperties(state, { entity, props }) {
      state.propertiesByEntity = { ...state.propertiesByEntity, [entity]: props };
    },
    setPropertiesLoading(state, v) { state.propertiesLoading = v; },
    setRendered(state, { oql, oxurl, validation }) {
      state.oql = oql || "";
      state.oxurl = oxurl || "";
      state.validation = validation || null;
      state.rendering = false;
    },
    setRendering(state, v) { state.rendering = v; },
    setSeedError(state, e) { state.seedError = e; },
    setSeededOqo(state, oqo) { state.seededOqo = oqo; },
  },
  actions: {
    // Fetch + cache the property catalog for an entity (once).
    async loadProperties({ state, commit }, entity) {
      if (state.propertiesByEntity[entity]) return state.propertiesByEntity[entity];
      commit("setPropertiesLoading", true);
      try {
        const data = await getProperties(entity);
        const props = (data && data.properties && data.properties[entity]) || {};
        commit("setProperties", { entity, props });
        return props;
      } finally {
        commit("setPropertiesLoading", false);
      }
    },

    // OQO -> OQL (the "View/Copy as OQL" panel). Debounced by the caller.
    async renderOqo({ commit }, oqo) {
      commit("setRendering", true);
      try {
        const data = await api.getQuery({ oqo });
        commit("setRendered", {
          oql: data.oql,
          oxurl: data.oxurl,
          validation: data.validation,
        });
        return data;
      } catch (e) {
        // /query/oqo 400s carry the validation/diagnostics in the body
        const body = e?.response?.data || {};
        commit("setRendered", {
          oql: body.oql || "",
          oxurl: body.oxurl || "",
          validation: body.validation || { valid: false, errors: [{ message: String(e) }] },
        });
        return body;
      }
    },

    // Raw OQL -> OQO (seed the builder from a shared search or the editable panel).
    // On success sets seededOqo (the builder rebuilds its tree from it). On parse
    // failure keeps the last-good tree and surfaces seedError.
    async seedFromOql({ commit }, oql) {
      commit("setSeedError", null);
      try {
        const data = await api.getQuery({ oql });
        if (data && data.oqo) {
          commit("setSeededOqo", data.oqo);
          commit("setRendered", { oql: data.oql, oxurl: data.oxurl, validation: data.validation });
          return data.oqo;
        }
        commit("setSeedError", "Could not parse that OQL.");
        return null;
      } catch (e) {
        const body = e?.response?.data || {};
        const diag = (body.diagnostics && body.diagnostics[0]) ||
          (body.validation && body.validation.errors && body.validation.errors[0]);
        commit("setSeedError", (diag && diag.message) || "Invalid OQL.");
        return null;
      }
    },
  },
};
