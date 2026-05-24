<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    location="bottom end"
    offset="6"
  >
    <template #activator="{ props: activator }">
      <v-btn
        v-bind="activator"
        :disabled="disabled || enumerationBlocked"
        icon
        variant="text"
        size="small"
        class="collection-toolbar-btn"
      >
        <v-icon :icon="buttonIcon" />
        <v-tooltip activator="parent" location="bottom">
          {{ tooltipText }}
        </v-tooltip>
      </v-btn>
    </template>

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

      <div v-if="!filteredCollections.length" class="px-4 py-6 text-center text-body-2 text-grey">
        <template v-if="!collections.length">No {{ entityTypeSingular }} collections yet.</template>
        <template v-else>No collections match "{{ search }}".</template>
      </div>

      <div v-else class="collection-scroll">
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          class="collection-row"
          :class="{ 'is-pending': pendingCollectionId === collection.id }"
          @click="onClickCollection(collection)"
        >
          <v-icon :icon="rowIcon" size="18" class="mr-2 collection-row-icon" />
          <div class="collection-row-name text-truncate">{{ collection.display_name }}</div>
          <div v-if="collection.entity_count != null" class="collection-row-count text-caption text-grey">
            {{ collection.entity_count }}
          </div>
        </div>
      </div>

      <v-divider />

      <div v-if="mode === 'add'" class="footer-row" @click="onNewCollection">
        <v-icon size="18" class="mr-2">mdi-plus</v-icon>
        Create collection
      </div>
      <div class="footer-row" @click="onManage">
        <v-icon size="18" class="mr-2">mdi-cog-outline</v-icon>
        Manage collections
      </div>
    </v-card>
  </v-menu>

  <collection-quick-create-dialog
    v-if="mode === 'add'"
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

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (v) => v === "add" || v === "remove",
  },
  entityType: { type: String, required: true },
  // Full ES URLs from the SERP. Canonicalized to short form below.
  selectedIds: { type: Array, default: () => [] },
  enumerationBlocked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["applied"]);

const store = useStore();
const router = useRouter();

const open = ref(false);
const search = ref("");
const showQuickCreate = ref(false);
const pendingCollectionId = ref(null);

const collections = computed(() => store.state.collections?.collections || []);

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

const filteredCollections = computed(() => {
  const term = search.value.trim().toLowerCase();
  return collections.value
    .filter((l) => l.entity_type === props.entityType)
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

const buttonIcon = computed(() =>
  props.mode === "add" ? "mdi-tag-plus-outline" : "mdi-tag-minus-outline"
);
const rowIcon = computed(() => (props.mode === "add" ? "mdi-plus" : "mdi-minus"));
const tooltipText = computed(() => {
  if (props.enumerationBlocked) {
    return props.mode === "add"
      ? "Pick rows individually to collection"
      : "Pick rows individually to remove collections";
  }
  if (props.disabled) {
    return props.mode === "add"
      ? "Select rows to collection"
      : "Select rows to remove collections";
  }
  return props.mode === "add" ? "Add collection" : "Remove collection";
});

function nounFor(n) {
  return n === 1 ? entityTypeSingular.value : (props.entityType || "");
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  search.value = "";
  if (!store.state.collections?.loaded && !store.state.collections?.loading) {
    await store.dispatch("collections/fetchAll");
  }
});

async function onClickCollection(collection) {
  if (props.enumerationBlocked) return;
  const ids = selectedShortIds.value;
  if (!ids.length || pendingCollectionId.value) return;
  pendingCollectionId.value = collection.id;
  try {
    if (props.mode === "add") {
      const resp = await store.dispatch("collections/addEntities", {
        id: collection.id, entity_ids: ids,
      });
      // server returns {added, already_present, rejected_wrong_type};
      // for snackbar we want the total now-in-label count for this op.
      const n = (resp?.added ?? 0) + (resp?.already_present ?? 0);
      store.commit("snackbar", `Added "${collection.display_name}" to ${n} ${nounFor(n)}.`);
    } else {
      const resp = await store.dispatch("collections/removeEntities", {
        id: collection.id, entity_ids: ids,
      });
      const n = resp?.removed ?? 0;
      store.commit("snackbar", `Removed "${collection.display_name}" from ${n} ${nounFor(n)}.`);
    }
    open.value = false;
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
  // Open dialog. v-menu may auto-close due to v-dialog overlay; that's fine —
  // after dialog success the @created flow emits @applied and we don't reopen.
  showQuickCreate.value = true;
}

function onManage() {
  open.value = false;
  router.push("/settings/collections");
}

function onQuickCreated() {
  // Dialog already created + assigned the collection server-side and the store
  // bumped entityMutationCounter. Bubble up so the parent clears selection.
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
  padding: 4px 12px;
  cursor: pointer;
  font-size: 14px;
  gap: 4px;
}
.collection-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.collection-row.is-pending {
  opacity: 0.6;
  pointer-events: none;
}
.collection-row-icon {
  opacity: 0.5;
}
.collection-row-name {
  flex: 1 1 auto;
  min-width: 0;
}
.collection-row-count {
  flex: 0 0 auto;
  padding-left: 8px;
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
