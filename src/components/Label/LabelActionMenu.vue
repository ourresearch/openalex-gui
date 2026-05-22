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
      >
        <v-icon>{{ buttonIcon }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ tooltipText }}
        </v-tooltip>
      </v-btn>
    </template>

    <v-card flat rounded width="320" class="label-action-menu">
      <div class="px-3 py-2">
        <v-text-field
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

      <div v-if="!filteredLabels.length" class="px-4 py-6 text-center text-body-2 text-grey">
        <template v-if="!labels.length">No {{ entityTypeSingular }} labels yet.</template>
        <template v-else>No labels match "{{ search }}".</template>
      </div>

      <div v-else class="label-scroll">
        <div
          v-for="label in filteredLabels"
          :key="label.id"
          class="label-row"
          :class="{ 'is-pending': pendingLabelId === label.id }"
          @click="onClickLabel(label)"
        >
          <v-icon size="18" class="mr-2 label-row-icon">{{ rowIcon }}</v-icon>
          <div class="label-row-name text-truncate">{{ label.display_name }}</div>
          <div v-if="label.entity_count != null" class="label-row-count text-caption text-grey">
            {{ label.entity_count }}
          </div>
        </div>
      </div>

      <v-divider />

      <div v-if="mode === 'add'" class="footer-row" @click="onNewLabel">
        <v-icon size="18" class="mr-2">mdi-plus</v-icon>
        Create label
      </div>
      <div class="footer-row" @click="onManage">
        <v-icon size="18" class="mr-2">mdi-cog-outline</v-icon>
        Manage labels
      </div>
    </v-card>
  </v-menu>

  <label-quick-create-dialog
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
import LabelQuickCreateDialog from "@/components/Label/LabelQuickCreateDialog.vue";
import * as openalexId from "@/openalexId";

defineOptions({ name: "LabelActionMenu" });

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
const pendingLabelId = ref(null);

const labels = computed(() => store.state.labels?.labels || []);

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

const buttonIcon = computed(() =>
  props.mode === "add" ? "mdi-label-plus-outline" : "mdi-label-minus-outline"
);
const rowIcon = computed(() => (props.mode === "add" ? "mdi-plus" : "mdi-minus"));
const tooltipText = computed(() => {
  if (props.enumerationBlocked) {
    return props.mode === "add"
      ? "Pick rows individually to label"
      : "Pick rows individually to remove labels";
  }
  if (props.disabled) {
    return props.mode === "add"
      ? "Select rows to label"
      : "Select rows to remove labels";
  }
  return props.mode === "add" ? "Add label" : "Remove label";
});

function nounFor(n) {
  const plural = props.entityType || "";
  const singular = plural.endsWith("s") ? plural.slice(0, -1) : plural;
  return n === 1 ? singular : plural;
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  search.value = "";
  if (!store.state.labels?.loaded && !store.state.labels?.loading) {
    await store.dispatch("labels/fetchAll");
  }
});

async function onClickLabel(label) {
  if (props.enumerationBlocked) return;
  const ids = selectedShortIds.value;
  if (!ids.length || pendingLabelId.value) return;
  pendingLabelId.value = label.id;
  try {
    if (props.mode === "add") {
      const resp = await store.dispatch("labels/addEntities", {
        id: label.id, entity_ids: ids,
      });
      // server returns {added, already_present, rejected_wrong_type};
      // for snackbar we want the total now-in-label count for this op.
      const n = (resp?.added ?? 0) + (resp?.already_present ?? 0);
      store.commit("snackbar", `Added "${label.display_name}" to ${n} ${nounFor(n)}.`);
    } else {
      const resp = await store.dispatch("labels/removeEntities", {
        id: label.id, entity_ids: ids,
      });
      const n = resp?.removed ?? 0;
      store.commit("snackbar", `Removed "${label.display_name}" from ${n} ${nounFor(n)}.`);
    }
    open.value = false;
    emit("applied");
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
  // Open dialog. v-menu may auto-close due to v-dialog overlay; that's fine —
  // after dialog success the @created flow emits @applied and we don't reopen.
  showQuickCreate.value = true;
}

function onManage() {
  open.value = false;
  router.push("/settings/labels");
}

function onQuickCreated() {
  // Dialog already created + assigned the label server-side and the store
  // bumped entityMutationCounter. Bubble up so the parent clears selection.
  emit("applied");
}
</script>

<style scoped>
.label-action-menu {
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
.label-row-icon {
  opacity: 0.5;
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
