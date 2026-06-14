// Vuex module for the no-code OQL builder (oxjob #428).
//
// OQO is the single source of truth. The builder COMPONENT owns the editable tree
// AND all per-query state (the rendered oql/oxurl/validation/rendering/seedError
// live in component-local refs — see OqlQueryBuilder.vue). This module is now a
// STATELESS service layer + a process-wide property-catalog cache:
//   - loadProperties/propsFor: fetch + cache the /properties catalog per entity.
//   - renderOqo: OQO -> OQL (GET /query/oqo/<json>); returns the rendered payload.
//   - seedFromOql: raw OQL -> OQO (GET /query/oql/<oql>); returns { oqo, oql, ... }.
//
// Why stateless render/parse: the builder is a self-contained `v-model:oql`
// component (oxjob #428 — for the side-by-side "view code" dialog in #440). Two
// builders can be mounted at once (e.g. the SERP page + a dialog); if the rendered
// OQL / validation lived in this singleton they'd clobber each other. Only the
// property cache is legitimately global (it's an immutable-per-entity lookup).
//
// state() is a FUNCTION (per-store isolation; see feedback_vuex_module_state_function).

import { api } from "@/api";
import { getProperties } from "@/components/OqlPlayground/oqlEditorApi";

export default {
  namespaced: true,
  state: () => ({
    propertiesByEntity: {},   // entity -> { col: Property } (process-wide cache)
    propertiesLoading: false,
  }),
  getters: {
    propsFor: (state) => (entity) => state.propertiesByEntity[entity] || null,
  },
  mutations: {
    setProperties(state, { entity, props }) {
      state.propertiesByEntity = { ...state.propertiesByEntity, [entity]: props };
    },
    setPropertiesLoading(state, v) { state.propertiesLoading = v; },
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
    // Stateless: returns { oql, oxurl, validation }. On a 400 the diagnostics ride
    // in the response body, so normalise that into the same shape rather than
    // throwing — the caller stores it in its local validation ref.
    async renderOqo(_ctx, oqo) {
      try {
        const data = await api.getQuery({ oqo });
        return { oql: data.oql || "", oxurl: data.oxurl || "",
                 oql_render_v2: data.oql_render_v2 || null,
                 validation: data.validation || null };
      } catch (e) {
        const body = e?.response?.data || {};
        return {
          oql: body.oql || "",
          oxurl: body.oxurl || "",
          oql_render_v2: body.oql_render_v2 || null,
          validation: body.validation || { valid: false, errors: [{ message: String(e) }] },
        };
      }
    },

    // Raw OQL -> OQO (seed the builder from a shared search or the editable panel).
    // Stateless: on success returns { oqo, oql, oxurl, validation }; on parse
    // failure returns { error } (the caller keeps its last-good tree + surfaces it).
    async seedFromOql(_ctx, oql) {
      try {
        const data = await api.getQuery({ oql });
        if (data && data.oqo) {
          return { oqo: data.oqo, oql: data.oql, oxurl: data.oxurl,
                   oql_render_v2: data.oql_render_v2 || null,
                   validation: data.validation };
        }
        return { error: "Could not parse that OQL." };
      } catch (e) {
        const body = e?.response?.data || {};
        const diag = (body.diagnostics && body.diagnostics[0]) ||
          (body.validation && body.validation.errors && body.validation.errors[0]);
        return { error: (diag && diag.message) || "Invalid OQL." };
      }
    },
  },
};
