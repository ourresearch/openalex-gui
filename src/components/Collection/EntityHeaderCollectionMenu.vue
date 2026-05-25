<template>
  <v-btn
    icon
    variant="plain"
    aria-label="Collection actions"
    @click="onActivatorClick"
    ref="activatorRef"
  >
    <v-icon>mdi-dots-vertical</v-icon>
    <v-tooltip activator="parent" location="bottom">Collection actions</v-tooltip>
  </v-btn>

  <v-menu
    v-model="menuOpen"
    :activator="activatorRef"
    :open-on-click="false"
    :close-on-content-click="false"
    location="bottom end"
    offset="6"
  >
    <v-card flat rounded min-width="220" class="kebab-menu-card">
      <!-- Add to collection — always shown -->
      <v-menu submenu open-on-hover location="end" :offset="2">
        <template #activator="{ props: subProps }">
          <div v-bind="subProps" class="kebab-row">
            <v-icon size="18" class="mr-2">mdi-folder-plus-outline</v-icon>
            <span class="flex-grow-1">Add to collection</span>
            <v-icon size="20">mdi-chevron-right</v-icon>
          </div>
        </template>
        <v-card flat rounded min-width="240" class="kebab-submenu">
          <div
            v-if="!collectionsLoaded"
            class="px-4 py-3 text-body-2 text-grey"
          >Loading…</div>
          <div
            v-else-if="!addableCollections.length"
            class="px-4 py-3 text-body-2 text-grey"
          >{{ allInCollections ? `Already in every ${entityTypeSingular} collection.` : `No ${entityTypeSingular} collections yet.` }}</div>
          <div v-else>
            <div
              v-for="collection in addableCollections"
              :key="collection.id"
              class="kebab-row sub-row"
              :class="{ 'is-pending': pendingCollectionId === collection.id }"
              @click="onAdd(collection)"
            >
              {{ collection.display_name }}
            </div>
          </div>
        </v-card>
      </v-menu>

      <!-- Remove from collection — only when this entity is in one or more -->
      <v-menu
        v-if="removableCollections.length"
        submenu
        open-on-hover
        location="end"
        :offset="2"
      >
        <template #activator="{ props: subProps }">
          <div v-bind="subProps" class="kebab-row">
            <v-icon size="18" class="mr-2">mdi-folder-minus-outline</v-icon>
            <span class="flex-grow-1">Remove from collection</span>
            <v-icon size="20">mdi-chevron-right</v-icon>
          </div>
        </template>
        <v-card flat rounded min-width="240" class="kebab-submenu">
          <div
            v-for="collection in removableCollections"
            :key="collection.id"
            class="kebab-row sub-row"
            :class="{ 'is-pending': pendingCollectionId === collection.id }"
            @click="onAskRemove(collection)"
          >
            {{ collection.display_name }}
          </div>
        </v-card>
      </v-menu>
    </v-card>
  </v-menu>

  <v-dialog v-model="removeDialog" max-width="480">
    <v-card flat rounded>
      <v-card-title>Remove from collection?</v-card-title>
      <v-card-text>
        Remove this {{ entityTypeSingular }} from
        <strong>{{ removeCollection?.display_name }}</strong>?
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="!!pendingCollectionId" @click="removeDialog = false">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="error"
          :loading="pendingCollectionId === removeCollection?.id"
          @click="onConfirmRemove"
        >Remove</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { urlBase, axiosConfig } from "@/apiConfig.js";
import * as openalexId from "@/openalexId";

defineOptions({ name: "EntityHeaderCollectionMenu" });

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
});

const store = useStore();

const activatorRef = ref(null);
const menuOpen = ref(false);
const removeDialog = ref(false);
const removeCollection = ref(null);
const pendingCollectionId = ref(null);

const myEntityCollections = ref([]);
const myEntityCollectionsLoaded = ref(false);

const userId = computed(() => store.getters["user/userId"]);
const flagOn = computed(() => !!store.getters.featureFlags?.collections);

const collectionsLoaded = computed(
  () => !!store.state.collections?.loaded && myEntityCollectionsLoaded.value
);

const allUserCollections = computed(() =>
  (store.state.collections?.collections || []).filter(
    (c) => c.entity_type === props.entityType
  )
);

const inCollectionIds = computed(
  () => new Set(myEntityCollections.value.map((c) => c.id))
);

const addableCollections = computed(() =>
  allUserCollections.value
    .filter((c) => !inCollectionIds.value.has(c.id))
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" }))
);

const removableCollections = computed(() =>
  [...myEntityCollections.value].sort((a, b) =>
    (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
  )
);

const allInCollections = computed(
  () => allUserCollections.value.length > 0 && addableCollections.value.length === 0
);

const entityTypeSingular = computed(() => {
  const t = props.entityType || "";
  return t.endsWith("s") ? t.slice(0, -1) : t;
});

const shortId = computed(() => {
  if (!props.entityId) return "";
  if (openalexId.isValidId(props.entityId)) {
    return openalexId.toDisplayFormat(props.entityId, "short") || props.entityId;
  }
  return props.entityId;
});

// Refetch when an Add/Remove anywhere mutates membership — keeps the
// kebab's "in / not in" partition fresh after the user acts.
const entityMutationCounter = computed(
  () => store.state.collections?.entityMutationCounter || 0
);

async function fetchMyEntityCollections() {
  if (!userId.value || !flagOn.value || !shortId.value) {
    myEntityCollections.value = [];
    myEntityCollectionsLoaded.value = false;
    return;
  }
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/me/collections?entity_id=${encodeURIComponent(shortId.value)}&per_page=100`,
      axiosConfig({ userAuth: true })
    );
    myEntityCollections.value = (resp.data?.results || []).filter(
      (c) => c.entity_type === props.entityType
    );
  } catch (e) {
    myEntityCollections.value = [];
  } finally {
    myEntityCollectionsLoaded.value = true;
  }
}

watch(
  () => [userId.value, flagOn.value, shortId.value, props.entityType, entityMutationCounter.value],
  fetchMyEntityCollections,
  { immediate: true }
);

function onActivatorClick() {
  menuOpen.value = !menuOpen.value;
  if (menuOpen.value && !store.state.collections?.loaded && !store.state.collections?.loading) {
    store.dispatch("collections/fetchAll");
  }
}

async function onAdd(collection) {
  if (pendingCollectionId.value) return;
  pendingCollectionId.value = collection.id;
  try {
    await store.dispatch("collections/addEntities", {
      id: collection.id,
      entity_ids: [shortId.value],
    });
    store.commit("snackbar", `Added to "${collection.display_name}".`);
    menuOpen.value = false;
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not add to collection.",
      color: "error",
    });
  } finally {
    pendingCollectionId.value = null;
  }
}

function onAskRemove(collection) {
  removeCollection.value = collection;
  removeDialog.value = true;
  menuOpen.value = false;
}

async function onConfirmRemove() {
  if (!removeCollection.value || pendingCollectionId.value) return;
  const collection = removeCollection.value;
  pendingCollectionId.value = collection.id;
  try {
    await store.dispatch("collections/removeEntities", {
      id: collection.id,
      entity_ids: [shortId.value],
    });
    store.commit("snackbar", `Removed from "${collection.display_name}".`);
    removeDialog.value = false;
    removeCollection.value = null;
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not remove from collection.",
      color: "error",
    });
  } finally {
    pendingCollectionId.value = null;
  }
}
</script>

<style scoped>
.kebab-menu-card {
  padding: 4px 0;
}
.kebab-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  gap: 4px;
}
.kebab-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.kebab-row.is-pending {
  opacity: 0.6;
  pointer-events: none;
}
.kebab-submenu {
  padding: 4px 0;
  max-height: 320px;
  overflow-y: auto;
}
.sub-row {
  padding: 6px 12px;
}
</style>
