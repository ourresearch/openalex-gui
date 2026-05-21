<template>
  <div v-if="shouldShow && myLabels.length" class="entity-labels-row mb-3">
    <span class="text-body-2 text-grey mr-2">Your labels:</span>
    <v-chip
      v-for="label in myLabels"
      :key="label.id"
      size="small"
      variant="outlined"
      class="mr-1 mb-1"
      :to="filterRouteForLabel(label)"
      prepend-icon="mdi-label-outline"
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
});

const store = useStore();

const myLabels = ref([]);
const loaded = ref(false);

const userId = computed(() => store.getters["user/userId"]);
const labelsFlagEnabled = computed(() => !!store.getters.featureFlags?.labels);
const shouldShow = computed(() => !!userId.value && labelsFlagEnabled.value && loaded.value);

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
  }
}

watch(
  () => [userId.value, labelsFlagEnabled.value, shortId.value, props.entityType],
  fetchLabels,
  { immediate: true }
);

function filterRouteForLabel(label) {
  return `/${label.entity_type}?filter=label:${label.id}`;
}
</script>

<style scoped>
.entity-labels-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
