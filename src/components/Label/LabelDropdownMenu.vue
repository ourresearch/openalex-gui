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
        :disabled="disabled"
        variant="text"
        size="small"
        prepend-icon="mdi-label-outline"
      >
        Labels
      </v-btn>
    </template>

    <v-card flat rounded width="320" class="label-dropdown">
      <div class="px-3 py-2">
        <v-text-field
          ref="searchInput"
          v-model="search"
          density="compact"
          hide-details
          variant="outlined"
          placeholder="Search labels"
          prepend-inner-icon="mdi-magnify"
          autofocus
        />
      </div>

      <v-divider />

      <div v-if="enumerationBlocked" class="px-4 py-3 text-body-2 text-grey">
        Apply labels works on a single page at a time.
        Clear "select all" or pick rows individually to continue.
      </div>

      <div v-else-if="!filteredLabels.length" class="px-4 py-6 text-center text-body-2 text-grey">
        <template v-if="!labels.length">No {{ entityTypeSingular }} labels yet.</template>
        <template v-else>No labels match "{{ search }}".</template>
      </div>

      <div v-else class="label-scroll">
        <div
          v-for="label in filteredLabels"
          :key="label.id"
          class="label-row"
          :class="{ 'is-pending': pendingLabelId === label.id }"
          @click="onToggle(label)"
        >
          <v-checkbox-btn
            density="compact"
            :model-value="rowState(label.id) === 'all'"
            :indeterminate="rowState(label.id) === 'some'"
            :disabled="pendingLabelId === label.id"
            @click.stop="onToggle(label)"
          />
          <div class="label-row-name text-truncate">
            {{ label.display_name }}
          </div>
          <div v-if="label.entity_count != null" class="label-row-count text-caption text-grey">
            {{ label.entity_count }}
          </div>
        </div>
      </div>

      <v-divider />

      <div class="footer-row" @click="onNewLabel">
        <v-icon size="18" class="mr-2">mdi-plus</v-icon>
        New label
      </div>
      <div class="footer-row" @click="onManage">
        <v-icon size="18" class="mr-2">mdi-cog-outline</v-icon>
        Manage labels
      </div>
    </v-card>
  </v-menu>

  <label-create-wizard
    v-model="showWizard"
    :initial-entity-type="entityType"
    :initial-entity-ids="selectedShortIds"
    @created="onWizardCreated"
  />
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import LabelCreateWizard from "@/components/Label/LabelCreateWizard.vue";
import * as openalexId from "@/openalexId";

defineOptions({ name: "LabelDropdownMenu" });

const props = defineProps({
  entityType: { type: String, required: true },
  // List of currently-selected IDs in the SERP (typically full ES URLs
  // like https://openalex.org/W123). The dropdown normalizes to the
  // short form (W123) before talking to users-api, which stores IDs
  // in short form. See workspace AGENTS.md "Cross-Service Patterns".
  selectedIds: { type: Array, default: () => [] },
  // True when the parent is in selectAllMode AND the actual ID list
  // can't be enumerated client-side. Disables the apply/remove path
  // because we'd need a server-side enumerate endpoint we don't have.
  enumerationBlocked: { type: Boolean, default: false },
  // True if the parent has no selection at all.
  disabled: { type: Boolean, default: false },
});

const store = useStore();
const router = useRouter();

const open = ref(false);
const search = ref("");
const showWizard = ref(false);
const pendingLabelId = ref(null);

// Cache: label_id -> Set of entity_ids the label contains. Populated
// lazily when the dropdown opens so we don't bombard users-api on
// every SERP load.
const labelEntities = ref({});
const entitiesFetched = ref({});
const fetching = ref(false);

const labels = computed(() => store.state.labels?.labels || []);

// Convert ES-style full URLs to the short form users-api expects.
// Anything that doesn't parse as a known OpenAlex id is left as-is.
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

const filteredLabels = computed(() => {
  const term = search.value.trim().toLowerCase();
  return labels.value
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
  if (t.endsWith("s")) return t.slice(0, -1);
  return t;
});

watch(open, async (isOpen) => {
  if (!isOpen) return;
  search.value = "";
  await nextTick();
  // Make sure we have the label list itself.
  if (!store.state.labels?.loaded && !store.state.labels?.loading) {
    await store.dispatch("labels/fetchAll");
  }
  // Lazy-fetch each label's entity list. One pass per dropdown open.
  fetching.value = true;
  try {
    for (const label of filteredLabels.value) {
      if (entitiesFetched.value[label.id]) continue;
      await ensureLabelEntities(label.id);
    }
  } finally {
    fetching.value = false;
  }
});

async function ensureLabelEntities(labelId) {
  if (entitiesFetched.value[labelId]) return;
  try {
    const resp = await store.dispatch("labels/fetchEntities", {
      id: labelId, per_page: 200,
    });
    // Public /labels/:id/entities returns entity_ids inline (short form).
    const ids = resp.entity_ids || [];
    labelEntities.value = { ...labelEntities.value, [labelId]: new Set(ids) };
    entitiesFetched.value = { ...entitiesFetched.value, [labelId]: true };
  } catch (e) {
    // Best-effort: leave tri-state unknown. Don't snackbar here — too noisy.
  }
}

function rowState(labelId) {
  const set = labelEntities.value[labelId];
  const ids = selectedShortIds.value;
  if (!set || !ids.length) return "none";
  let inLabel = 0;
  for (const id of ids) {
    if (set.has(id)) inLabel++;
  }
  if (inLabel === 0) return "none";
  if (inLabel === ids.length) return "all";
  return "some";
}

async function onToggle(label) {
  if (props.enumerationBlocked) return;
  const ids = selectedShortIds.value;
  if (!ids.length) return;
  if (pendingLabelId.value) return;

  await ensureLabelEntities(label.id);

  const state = rowState(label.id);
  pendingLabelId.value = label.id;
  try {
    if (state === "all") {
      await store.dispatch("labels/removeEntities", {
        id: label.id, entity_ids: ids,
      });
      const set = labelEntities.value[label.id] || new Set();
      for (const id of ids) set.delete(id);
      labelEntities.value = { ...labelEntities.value, [label.id]: set };
      store.commit("snackbar", `Removed from ${label.display_name}.`);
    } else {
      await store.dispatch("labels/addEntities", {
        id: label.id, entity_ids: ids,
      });
      const set = labelEntities.value[label.id] || new Set();
      for (const id of ids) set.add(id);
      labelEntities.value = { ...labelEntities.value, [label.id]: set };
      store.commit("snackbar", `Added to ${label.display_name}.`);
    }
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not update label.",
      color: "error",
    });
  } finally {
    pendingLabelId.value = null;
  }
}

function onNewLabel() {
  open.value = false;
  showWizard.value = true;
}

function onManage() {
  open.value = false;
  router.push("/settings/labels");
}

function onWizardCreated() {
  // Refresh labels so the new one shows up next dropdown open.
  store.dispatch("labels/fetchAll");
  // Force a refetch of entity lists next open.
  entitiesFetched.value = {};
}
</script>

<style scoped>
.label-dropdown {
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}
.label-scroll {
  overflow-y: auto;
  max-height: 320px;
}
.label-row {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 14px;
  gap: 4px;
}
.label-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.label-row.is-pending {
  opacity: 0.6;
  pointer-events: none;
}
.label-row-name {
  flex: 1 1 auto;
  min-width: 0;
}
.label-row-count {
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
