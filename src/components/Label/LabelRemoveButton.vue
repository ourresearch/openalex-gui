<template>
  <span>
    <v-btn
      :disabled="disabled || enumerationBlocked || distinctLabels.length === 0"
      icon
      variant="text"
      size="small"
      class="label-toolbar-btn"
      @click="onClick"
    >
      <v-icon icon="mdi-tag-minus-outline" />
      <v-tooltip activator="parent" location="bottom">
        {{ tooltipText }}
      </v-tooltip>
    </v-btn>

    <!-- Step 1 (only shown when selection's works carry 2+ distinct labels):
         pick which label the user means to remove. -->
    <v-dialog v-model="showPick" max-width="480">
      <v-card>
        <v-card-title>Select label to remove</v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">
            There are multiple labels on the selected works. Which one do you want to remove?
          </div>
          <v-radio-group v-model="pickedLabelId" hide-details>
            <v-radio
              v-for="lbl in distinctLabels"
              :key="lbl.id"
              :label="lbl.display_name"
              :value="lbl.id"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPick = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!pickedLabelId"
            @click="onPickConfirm"
          >
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Step 2 (always): final remove confirmation. -->
    <v-dialog v-model="showConfirm" max-width="480">
      <v-card>
        <v-card-title>Remove label</v-card-title>
        <v-card-text>
          Are you sure you want to remove the label
          <strong>{{ pendingLabel?.display_name }}</strong>
          from the selected
          {{ selectedIds.length }}
          {{ selectedIds.length === 1 ? entityTypeSingular : entityType }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="pending" @click="showConfirm = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="pending"
            @click="onConfirm"
          >
            Remove label
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import * as openalexId from "@/openalexId";

defineOptions({ name: "LabelRemoveButton" });

const props = defineProps({
  entityType: { type: String, required: true },
  // Full ES URLs from the SERP (e.g. "https://openalex.org/W123..."). The
  // store keys pageLabelsByEntity by short id, so convert before lookup.
  selectedIds: { type: Array, default: () => [] },
  enumerationBlocked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["applied"]);

const store = useStore();

const showPick = ref(false);
const showConfirm = ref(false);
const pickedLabelId = ref(null);
const pending = ref(false);

const entityTypeSingular = computed(() => {
  const t = props.entityType || "";
  return t.endsWith("s") ? t.slice(0, -1) : t;
});

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

// All distinct labels that appear on at least one selected row, derived from
// the labels.store pageLabelsByEntity map (populated by SERP per-row label
// chips as the page loads).
const distinctLabels = computed(() => {
  const byId = new Map();
  const map = store.state.labels?.pageLabelsByEntity || {};
  for (const sid of selectedShortIds.value) {
    const labels = map[sid] || [];
    for (const lbl of labels) {
      if (lbl?.id && !byId.has(lbl.id)) byId.set(lbl.id, lbl);
    }
  }
  return [...byId.values()].sort((a, b) =>
    (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
  );
});

const pendingLabel = computed(() =>
  distinctLabels.value.find((l) => l.id === pickedLabelId.value) || null
);

const tooltipText = computed(() => {
  if (props.enumerationBlocked) return "Pick rows individually to remove labels";
  if (props.disabled) return "Select rows to remove labels";
  if (distinctLabels.value.length === 0) return "No labels on the selected rows";
  return "Remove label";
});

function onClick() {
  if (distinctLabels.value.length === 0) return;
  if (distinctLabels.value.length === 1) {
    pickedLabelId.value = distinctLabels.value[0].id;
    showConfirm.value = true;
  } else {
    pickedLabelId.value = null;
    showPick.value = true;
  }
}

function onPickConfirm() {
  if (!pickedLabelId.value) return;
  showPick.value = false;
  showConfirm.value = true;
}

async function onConfirm() {
  const lbl = pendingLabel.value;
  const ids = selectedShortIds.value;
  if (!lbl || !ids.length) {
    showConfirm.value = false;
    return;
  }
  pending.value = true;
  try {
    const resp = await store.dispatch("labels/removeEntities", {
      id: lbl.id,
      entity_ids: ids,
    });
    const n = resp?.removed ?? 0;
    const noun = n === 1 ? entityTypeSingular.value : (props.entityType || "");
    store.commit("snackbar", `Removed "${lbl.display_name}" from ${n} ${noun}.`);
    showConfirm.value = false;
    emit("applied");
  } catch (e) {
    store.commit("snackbar", {
      msg: e.response?.data?.message || "Could not remove label.",
      color: "error",
    });
  } finally {
    pending.value = false;
  }
}
</script>
