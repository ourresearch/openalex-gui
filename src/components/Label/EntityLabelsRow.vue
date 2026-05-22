<template>
  <div
    v-if="shouldShow && myLabels.length"
    class="entity-labels-row"
    :class="compact ? 'is-compact' : 'mb-3'"
  >
    <span v-if="!compact" class="text-body-2 text-grey mr-2">Your labels:</span>
    <v-chip
      v-for="label in myLabels"
      :key="label.id"
      :size="compact ? 'x-small' : 'small'"
      variant="flat"
      label
      :class="compact ? 'mr-1 oa-label-chip' : 'mr-1 mb-1 oa-label-chip'"
    >
      {{ label.display_name }}
    </v-chip>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";
import * as openalexId from "@/openalexId";

defineOptions({ name: "EntityLabelsRow" });

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  // Compact mode: drop the "Your labels:" prefix, use x-small chips. Used by
  // the SERP per-row chip strip; the entity-detail-page surface keeps the
  // default (non-compact) layout.
  compact: { type: Boolean, default: false },
});

const store = useStore();

const myLabels = ref([]);
const loaded = ref(false);

const userId = computed(() => store.getters["user/userId"]);
const labelsFlagEnabled = computed(() => !!store.getters.featureFlags?.labels);
const shouldShow = computed(() => !!userId.value && labelsFlagEnabled.value && loaded.value);

// Watched so chip rows refresh after a SERP-level Add/Remove/Create-and-assign
// or a label deletion. See labels.store.js bumpEntityMutations.
const entityMutationCounter = computed(
  () => store.state.labels?.entityMutationCounter || 0
);

const shortId = computed(() => {
  if (!props.entityId) return "";
  if (openalexId.isValidId(props.entityId)) {
    return openalexId.toDisplayFormat(props.entityId, "short") || props.entityId;
  }
  return props.entityId;
});

async function fetchLabels() {
  if (!userId.value || !labelsFlagEnabled.value || !shortId.value) {
    myLabels.value = [];
    loaded.value = false;
    if (props.compact) {
      store.commit("labels/setPageEntityLabels", {
        entityId: shortId.value,
        labels: [],
      });
    }
    return;
  }
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/me/labels?entity_id=${encodeURIComponent(shortId.value)}&per_page=100`,
      axiosConfig({ userAuth: true })
    );
    myLabels.value = (resp.data?.results || []).filter(
      (l) => l.entity_type === props.entityType
    );
  } catch (e) {
    myLabels.value = [];
  } finally {
    loaded.value = true;
    if (props.compact) {
      // Tell ExpertSerp's hasLabelsOnPage computed whether this row is
      // contributing any labels to the visible page. Map auto-clears
      // empties so the computed accurately reflects state.
      store.commit("labels/setPageEntityLabels", {
        entityId: shortId.value,
        labels: myLabels.value,
      });
    }
  }
}

watch(
  () => [
    userId.value,
    labelsFlagEnabled.value,
    shortId.value,
    props.entityType,
    entityMutationCounter.value,
  ],
  fetchLabels,
  { immediate: true }
);
</script>

<style scoped>
.entity-labels-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.entity-labels-row.is-compact {
  margin-top: 4px;
  gap: 2px;
}
/* Linear-style label pill: muted gray, white text, non-interactive. */
.entity-labels-row :deep(.oa-label-chip) {
  background-color: #6b7280;
  color: #fff;
  cursor: default;
}
</style>
