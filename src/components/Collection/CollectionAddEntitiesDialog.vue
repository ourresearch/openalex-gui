<template>
  <!-- "Add to collection" dialog (oxjob #366). Reuses the advanced-filter-palette
       value picker (EntityValuePicker) in its entitiesOnly mode: search-as-you-type,
       multi-select, selected rows float to the top, "X selected" bottom-left,
       Cancel/Apply. On Apply we add the picked entities to THIS collection instead
       of writing a SERP filter. -->
  <v-dialog
    :model-value="modelValue"
    :fullscreen="smAndDown"
    max-width="600"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <entity-value-picker
      v-if="modelValue"
      entities-only
      :load-entities="loadEntities"
      :on-apply="onApply"
      max-height="80vh"
      @close="$emit('update:modelValue', false)"
    />
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useDisplay } from "vuetify";

import { api } from "@/api";
import * as openalexId from "@/openalexId";
import { entityConfigs } from "@/entityConfigs";
import EntityValuePicker from "@/components/Filter/EntityValuePicker.vue";

defineOptions({ name: "CollectionAddEntitiesDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  collection: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);

const store = useStore();
const { smAndDown } = useDisplay();

const entityType = computed(() => props.collection?.entity_type);
// entityConfigs is keyed by GUI type names (`types`, not `work-types`).
const entityPlural = computed(
  () => entityConfigs?.[openalexId.fromCollectionEntityType(entityType.value)]?.displayName
    || entityType.value || "entities"
);

// Search-as-you-type loader for the picker: autocomplete over the collection's
// entity_type. Rows are { value (full OpenAlex ID), displayValue, count, hint }.
async function loadEntities(searchStr) {
  const results = await api.getAutocomplete(entityType.value, { q: searchStr || "" });
  return (results || [])
    .filter((r) => r.id && r.display_name)
    .map((r) => ({
      value: r.id,
      displayValue: r.display_name,
      count: r.works_count ?? null,
      hint: r.hint || "",
    }));
}

// Apply: the picker hands us the selected full IDs; collections/addEntities wants
// short ids (e.g. I123). The membership mutation bumps entityMutationCounter, so
// the collection page refetches its members on its own.
async function onApply(entityValues) {
  const shortIds = (entityValues || [])
    // Stored collection id form: bare code, canonical case (oxjob #396).
    .map((v) => openalexId.toCollectionEntityId(v) || v)
    .filter(Boolean);
  if (!shortIds.length) return;
  try {
    const resp = await store.dispatch("collections/addEntities", {
      id: props.collection.id,
      entity_ids: shortIds,
    });
    const added = resp?.added ?? shortIds.length;
    store.commit(
      "snackbar",
      added
        ? `Added ${added} ${added === 1 ? singular(entityPlural.value) : entityPlural.value.toLowerCase()}.`
        : "Those are already in this collection."
    );
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not add to collection.",
      color: "error",
    });
  }
}

function singular(plural) {
  // Prefer the config's real singular ("countries" → "country"); the naive
  // de-s fallback mangles -ies plurals ("countrie", oxjob #396).
  const cfg = entityConfigs?.[openalexId.fromCollectionEntityType(entityType.value)];
  if (cfg?.displayNameSingular) return cfg.displayNameSingular.toLowerCase();
  const p = (plural || "").toLowerCase();
  return p.endsWith("s") ? p.slice(0, -1) : p;
}
</script>
