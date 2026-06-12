<template>
  <v-btn
    ref="activatorRef"
    icon
    variant="text"
    size="small"
    class="collection-toolbar-btn"
    @click="onActivatorClick"
  >
    <v-icon icon="mdi-folder-outline" />
    <!-- tooltipClass: the flag-on SERP passes 'linear-tooltip' (#440 r12);
         default empty keeps the app-standard tooltip everywhere else. -->
    <v-tooltip activator="parent" location="bottom" :content-class="tooltipClass || undefined">
      Add to or remove from collection
    </v-tooltip>
  </v-btn>

  <v-menu
    v-model="menuOpen"
    :activator="activatorRef"
    :open-on-click="false"
    :close-on-content-click="false"
    location="bottom end"
    offset="6"
  >
    <v-card flat rounded width="320" class="collection-action-menu">
      <div class="px-3 py-2">
        <v-text-field
          v-model="search"
          density="compact"
          hide-details
          variant="outlined"
          placeholder="Search collections"
          prepend-inner-icon="mdi-magnify"
          autofocus
        />
      </div>

      <v-divider />

      <div v-if="!collectionsLoaded" class="px-4 py-6 text-center text-body-2 text-grey">
        Loading…
      </div>
      <div v-else-if="!entityTypeCollections.length" class="px-4 py-6 text-center text-body-2 text-grey">
        No {{ entityTypeSingular }} collections yet.
      </div>
      <div v-else-if="!filteredCollections.length" class="px-4 py-6 text-center text-body-2 text-grey">
        No collections match "{{ search }}".
      </div>

      <div v-else class="collection-scroll">
        <template v-for="collection in filteredCollections" :key="collection.id">
          <!-- Uniform state (add or remove): row is directly clickable. -->
          <div
            v-if="rowState(collection) !== 'mixed'"
            class="collection-row"
            :class="{ 'is-pending': pendingCollectionId === collection.id }"
            @click="onApply(collection, rowState(collection))"
          >
            <div class="collection-row-name text-truncate">{{ collection.display_name }}</div>
            <span class="collection-row-affordance">
              {{ rowState(collection) === 'add' ? 'Add' : 'Remove' }}
            </span>
          </div>

          <!-- Mixed state: hover-or-click anywhere on the row opens an Add/Remove submenu. -->
          <v-menu
            v-else
            :model-value="expandedRowId === collection.id"
            @update:model-value="(v) => onSubmenuToggle(collection.id, v)"
            submenu
            open-on-hover
            location="end"
            :offset="2"
          >
            <template #activator="{ props: subProps }">
              <div
                v-bind="subProps"
                class="collection-row"
                :class="{ 'is-pending': pendingCollectionId === collection.id }"
              >
                <div class="collection-row-name text-truncate">{{ collection.display_name }}</div>
                <v-icon icon="mdi-chevron-right" size="20" class="collection-row-chevron" />
              </div>
            </template>
            <v-list density="compact" min-width="120">
              <v-list-item @click="onApply(collection, 'add')">Add</v-list-item>
              <v-list-item @click="onApply(collection, 'remove')">Remove</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </div>

      <v-divider />

      <div class="footer-row" @click="onNewCollection">
        <v-icon size="18" class="mr-2">mdi-plus</v-icon>
        Create collection
      </div>
      <div class="footer-row" @click="onManage">
        <v-icon size="18" class="mr-2">mdi-cog-outline</v-icon>
        Manage collections
      </div>
    </v-card>
  </v-menu>

  <!-- Friendly teaching dialogs (button is never disabled — these fire on click) -->

  <v-dialog v-model="noSelectionDialog" max-width="440">
    <v-card>
      <v-card-title>Select rows first</v-card-title>
      <v-card-text>
        Pick one or more {{ entityType || 'items' }} on this page, then add them to a
        collection or remove them from one.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="noSelectionDialog = false">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="enumerationBlockedDialog" max-width="440">
    <v-card>
      <v-card-title>Select rows individually</v-card-title>
      <v-card-text>
        Collections work one row at a time. Uncheck <strong>Select all</strong> and
        pick rows individually before adding them to a collection.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="enumerationBlockedDialog = false">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="overCapDialog" max-width="440">
    <v-card>
      <v-card-title>Too many rows selected</v-card-title>
      <v-card-text>
        Collections hold up to {{ MAX_ENTITIES_PER_COLLECTION.toLocaleString() }} items.
        You selected {{ selectedShortIds.length.toLocaleString() }} — reduce your
        selection and try again.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="overCapDialog = false">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="overflowDialog" max-width="480">
    <v-card>
      <v-card-title>This would exceed the collection cap</v-card-title>
      <v-card-text>
        <strong>{{ overflowCollection?.display_name }}</strong> already has
        {{ overflowCollection?.entity_count?.toLocaleString() }} items. Adding
        {{ overflowAddCount.toLocaleString() }} more would push it past the
        {{ MAX_ENTITIES_PER_COLLECTION.toLocaleString() }} cap.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="overflowDialog = false">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <collection-quick-create-dialog
    v-model="showQuickCreate"
    :entity-type="entityType"
    :entity-ids="selectedShortIds"
    @created="onQuickCreated"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import CollectionQuickCreateDialog from "@/components/Collection/CollectionQuickCreateDialog.vue";
import * as openalexId from "@/openalexId";

defineOptions({ name: "CollectionActionMenu" });

// Mirrors openalex-users-api collection_validators.MAX_ENTITIES_PER_COLLECTION.
const MAX_ENTITIES_PER_COLLECTION = 1000;

const props = defineProps({
  entityType: { type: String, required: true },
  // Full ES URLs from the SERP. Canonicalized to short form below.
  selectedIds: { type: Array, default: () => [] },
  enumerationBlocked: { type: Boolean, default: false },
  // Optional tooltip content-class (#440 r12): flag-on SERP passes
  // 'linear-tooltip'; default keeps the app-standard tooltip style.
  tooltipClass: { type: String, default: '' },
});
const emit = defineEmits(["applied"]);

const store = useStore();
const router = useRouter();

const activatorRef = ref(null);
const menuOpen = ref(false);
const search = ref("");
const showQuickCreate = ref(false);
const pendingCollectionId = ref(null);
const expandedRowId = ref(null);

const noSelectionDialog = ref(false);
const enumerationBlockedDialog = ref(false);
const overCapDialog = ref(false);
const overflowDialog = ref(false);
const overflowCollection = ref(null);
const overflowAddCount = ref(0);

const collections = computed(() => store.state.collections?.collections || []);
const collectionsLoaded = computed(() => !!store.state.collections?.loaded);

const selectedShortIds = computed(() => {
  const out = [];
  for (const id of props.selectedIds) {
    if (openalexId.isValidId(id)) {
      const short = openalexId.toDisplayFormat(id, "short");
      if (short) out.push(short);
    } else if (id) {
      out.push(id);
    }
  }
  return out;
});

const entityTypeCollections = computed(() =>
  collections.value.filter((l) => l.entity_type === props.entityType)
);

const filteredCollections = computed(() => {
  const term = search.value.trim().toLowerCase();
  return entityTypeCollections.value
    .filter((l) => {
      if (!term) return true;
      const name = (l.display_name || "").toLowerCase();
      const desc = (l.description || "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    })
    .sort((a, b) =>
      (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
    );
});

const entityTypeSingular = computed(() => {
  const t = props.entityType || "";
  return t.endsWith("s") ? t.slice(0, -1) : t;
});

// State per-collection given the current selection: 'add' (no selected entities
// are in the collection), 'remove' (all are in), or 'mixed' (some are).
// Sourced from pageCollectionsByEntity, populated by per-row EntityCollectionsRow
// instances on the SERP. Only authoritative for currently-rendered rows; in
// select-all mode `enumerationBlocked` gates the menu from opening at all.
function rowState(collection) {
  const map = store.state.collections?.pageCollectionsByEntity || {};
  let inCount = 0;
  for (const sid of selectedShortIds.value) {
    const list = map[sid] || [];
    if (list.some((c) => c.id === collection.id)) inCount++;
  }
  const total = selectedShortIds.value.length;
  if (inCount === 0) return "add";
  if (inCount === total) return "remove";
  return "mixed";
}

function nounFor(n) {
  return n === 1 ? entityTypeSingular.value : (props.entityType || "");
}

function onActivatorClick() {
  if (selectedShortIds.value.length === 0) {
    noSelectionDialog.value = true;
    return;
  }
  if (props.enumerationBlocked) {
    enumerationBlockedDialog.value = true;
    return;
  }
  if (selectedShortIds.value.length > MAX_ENTITIES_PER_COLLECTION) {
    overCapDialog.value = true;
    return;
  }
  menuOpen.value = !menuOpen.value;
}

watch(menuOpen, async (isOpen) => {
  if (!isOpen) {
    expandedRowId.value = null;
    return;
  }
  search.value = "";
  if (!store.state.collections?.loaded && !store.state.collections?.loading) {
    await store.dispatch("collections/fetchAll");
  }
});

function onSubmenuToggle(id, isOpen) {
  if (isOpen) expandedRowId.value = id;
  else if (expandedRowId.value === id) expandedRowId.value = null;
}

async function onApply(collection, op) {
  if (pendingCollectionId.value) return;
  const ids = selectedShortIds.value;
  if (!ids.length || (op !== "add" && op !== "remove")) return;

  if (op === "add") {
    // Estimate the actual add count by excluding rows already in this
    // collection (pageCollectionsByEntity is authoritative for the rendered
    // page, which is also what's selectable).
    const map = store.state.collections?.pageCollectionsByEntity || {};
    const toAdd = ids.filter((sid) => {
      const list = map[sid] || [];
      return !list.some((c) => c.id === collection.id);
    });
    const projected = (collection.entity_count || 0) + toAdd.length;
    if (projected > MAX_ENTITIES_PER_COLLECTION) {
      overflowCollection.value = collection;
      overflowAddCount.value = toAdd.length;
      overflowDialog.value = true;
      expandedRowId.value = null;
      return;
    }
  }

  pendingCollectionId.value = collection.id;
  expandedRowId.value = null;
  try {
    if (op === "add") {
      const resp = await store.dispatch("collections/addEntities", {
        id: collection.id, entity_ids: ids,
      });
      const n = (resp?.added ?? 0) + (resp?.already_present ?? 0);
      store.commit("snackbar", `Added "${collection.display_name}" to ${n} ${nounFor(n)}.`);
    } else {
      const resp = await store.dispatch("collections/removeEntities", {
        id: collection.id, entity_ids: ids,
      });
      const n = resp?.removed ?? 0;
      store.commit("snackbar", `Removed "${collection.display_name}" from ${n} ${nounFor(n)}.`);
    }
    menuOpen.value = false;
    emit("applied");
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not update collection.",
      color: "error",
    });
  } finally {
    pendingCollectionId.value = null;
  }
}

function onNewCollection() {
  menuOpen.value = false;
  showQuickCreate.value = true;
}

function onManage() {
  menuOpen.value = false;
  router.push("/settings/collections");
}

function onQuickCreated() {
  emit("applied");
}
</script>

<style scoped>
.collection-action-menu {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}
.collection-scroll {
  overflow-y: auto;
  max-height: 320px;
}
.collection-row {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  gap: 8px;
}
.collection-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.collection-row.is-pending {
  opacity: 0.6;
  pointer-events: none;
}
.collection-row-name {
  flex: 1 1 auto;
  min-width: 0;
}
.collection-row-affordance {
  flex: 0 0 auto;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.54);
}
.collection-row:hover .collection-row-affordance {
  color: rgba(0, 0, 0, 0.87);
}
.collection-row-chevron {
  flex: 0 0 auto;
  opacity: 0.54;
}
.footer-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
}
.footer-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
</style>

<style>
/* When disabled, drop the Vuetify grey overlay — icon-only buttons in the
   SERP toolbar should never carry a background, just dim the icon. */
.collection-toolbar-btn.v-btn.v-btn--disabled {
  background-color: transparent !important;
  opacity: 0.4;
}
.collection-toolbar-btn.v-btn.v-btn--disabled .v-btn__overlay {
  opacity: 0 !important;
}
</style>
