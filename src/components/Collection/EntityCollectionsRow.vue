<template>
  <div
    v-if="shouldShow && myCollections.length"
    class="entity-collections-row"
    :class="compact ? 'is-compact' : 'mb-3'"
  >
    <span v-if="!compact" class="text-body-2 text-grey mr-2">Your collections:</span>
    <v-chip
      v-for="collection in myCollections"
      :key="collection.id"
      :size="compact ? 'x-small' : 'small'"
      variant="flat"
      collection
      :class="compact ? 'mr-1 oa-collection-chip' : 'mr-1 mb-1 oa-collection-chip'"
    >
      {{ collection.display_name }}
    </v-chip>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";
import * as openalexId from "@/openalexId";

defineOptions({ name: "EntityCollectionsRow" });

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  // Compact mode: drop the "Your collections:" prefix, use x-small chips. Used by
  // the SERP per-row chip strip; the entity-detail-page surface keeps the
  // default (non-compact) layout.
  compact: { type: Boolean, default: false },
  // Write fetched collections into the collections.store.pageCollectionsByEntity map so
  // ExpertSerp can gate the Remove-label button on "any visible row has a
  // collection." Only the SERP per-row instances should opt into this; the
  // entity-detail-page surface must not pollute that map.
  trackPageCollections: { type: Boolean, default: false },
});

const store = useStore();

const myCollections = ref([]);
const loaded = ref(false);

const userId = computed(() => store.getters["user/userId"]);
const collectionsFlagEnabled = computed(() => !!store.getters.featureFlags?.collections);
const shouldShow = computed(() => !!userId.value && collectionsFlagEnabled.value && loaded.value);

// Watched so chip rows refresh after a SERP-level Add/Remove/Create-and-assign
// or a collection deletion. See collections.store.js bumpEntityMutations.
const entityMutationCounter = computed(
  () => store.state.collections?.entityMutationCounter || 0
);

const shortId = computed(() => {
  if (!props.entityId) return "";
  if (openalexId.isValidId(props.entityId)) {
    return openalexId.toDisplayFormat(props.entityId, "short") || props.entityId;
  }
  return props.entityId;
});

async function fetchCollections() {
  if (!userId.value || !collectionsFlagEnabled.value || !shortId.value) {
    myCollections.value = [];
    loaded.value = false;
    if (props.trackPageCollections) {
      store.commit("collections/setPageEntityCollections", {
        entityId: shortId.value,
        collections: [],
      });
    }
    return;
  }
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/me/collections?entity_id=${encodeURIComponent(shortId.value)}&per_page=100`,
      axiosConfig({ userAuth: true })
    );
    myCollections.value = (resp.data?.results || []).filter(
      (l) => l.entity_type === props.entityType
    );
  } catch (e) {
    myCollections.value = [];
  } finally {
    loaded.value = true;
    if (props.trackPageCollections) {
      // Tell ExpertSerp's hasCollectionsOnPage computed whether this row is
      // contributing any collections to the visible page. Map auto-clears
      // empties so the computed accurately reflects state.
      store.commit("collections/setPageEntityCollections", {
        entityId: shortId.value,
        collections: myCollections.value,
      });
    }
  }
}

watch(
  () => [
    userId.value,
    collectionsFlagEnabled.value,
    shortId.value,
    props.entityType,
    entityMutationCounter.value,
  ],
  fetchCollections,
  { immediate: true }
);
</script>

<style scoped>
.entity-collections-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.entity-collections-row.is-compact {
  margin-top: 4px;
  gap: 2px;
}
/* Linear-style collection pill: muted gray, white text, non-interactive. */
.entity-collections-row :deep(.oa-collection-chip) {
  background-color: #6b7280;
  color: #fff;
  cursor: default;
}
</style>
