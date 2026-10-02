<template>
  <!-- The entity header's primary action (#1507): one labeled "Add to collection"
       button. Logged in, it opens the same collection menu the search page uses
       (search, per-collection Add / Remove, Create collection), told which
       collections this entity is already in. Logged out, it goes to log in. -->
  <collection-action-menu
    v-if="userId"
    :entity-type="entityType"
    :selected-ids="[entityId]"
    :member-collection-ids="memberCollectionIds"
    label="Add to collection"
    :z-index="zIndex"
  />
  <v-btn
    v-else
    variant="outlined"
    rounded
    prepend-icon="mdi-folder-plus-outline"
    class="collection-labeled-btn"
    @click="goToLogin"
  >
    Add to collection
    <v-tooltip activator="parent" location="bottom" :z-index="zIndex ?? undefined">
      Log in to add this to a collection
    </v-tooltip>
  </v-btn>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import * as openalexId from "@/openalexId";
import CollectionActionMenu from "@/components/Collection/CollectionActionMenu.vue";

defineOptions({ name: "EntityCollectionButton" });

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  // Only the entity fly-in sets this (it forces z-index 10000).
  zIndex: { type: Number, default: null },
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const userId = computed(() => store.getters["user/userId"]);

// props.entityType is the GUI page type; collections use the users-api name
// (identical except `types` → `work-types`).
const collectionEntityType = computed(() =>
  openalexId.toCollectionEntityType(props.entityType)
);

// The stored collection id form: bare code, canonical case (oxjob #396).
const shortId = computed(() =>
  props.entityId ? (openalexId.toCollectionEntityId(props.entityId) || props.entityId) : ""
);

// Refetch when an Add/Remove anywhere mutates membership, so each row's
// Add / Remove state stays right after the user acts.
const entityMutationCounter = computed(
  () => store.state.collections?.entityMutationCounter || 0
);

const memberCollectionIds = ref([]);

async function fetchMembership() {
  if (!userId.value || !shortId.value) {
    memberCollectionIds.value = [];
    return;
  }
  try {
    // Batched and cached in the store; the cache clears on every membership change.
    const collections = await store.dispatch("collections/fetchEntityCollections", shortId.value);
    memberCollectionIds.value = (collections || [])
      .filter((c) => c.entity_type === collectionEntityType.value)
      .map((c) => c.id);
  } catch (e) {
    memberCollectionIds.value = [];
  }
}

watch(
  () => [userId.value, shortId.value, props.entityType, entityMutationCounter.value],
  fetchMembership,
  { immediate: true }
);

function goToLogin() {
  router.push({ name: "Login", query: { redirect: route.fullPath } });
}
</script>
