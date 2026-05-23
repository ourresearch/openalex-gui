<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="onDialogToggle"
    max-width="780"
    persistent
    scrollable
  >
    <v-card flat rounded class="wizard-card">
      <v-card-title class="d-flex align-center pb-2">
        <span>Create label</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="onCancel" :disabled="creating">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-stepper
        v-model="step"
        flat
        alt-labels
        hide-actions
        class="bg-transparent wizard-stepper-header-only"
      >
        <v-stepper-header>
          <v-stepper-item
            :value="1"
            title="Type"
            :complete="step > 1"
            :editable="true"
          />
          <v-divider />
          <v-stepper-item
            :value="2"
            title="IDs"
            :complete="step > 2"
            :editable="canVisitStep(2)"
          />
          <v-divider />
          <v-stepper-item
            :value="3"
            title="Review"
            :complete="step > 3"
            :editable="canVisitStep(3)"
          />
          <v-divider />
          <v-stepper-item
            :value="4"
            title="Name"
            :editable="canVisitStep(4)"
          />
        </v-stepper-header>
      </v-stepper>

      <v-divider class="wizard-edge-divider" />

      <v-card-text class="pa-0">
        <v-stepper
          v-model="step"
          flat
          hide-actions
          class="bg-transparent"
        >
          <v-stepper-window>
            <!-- Step 1 -->
            <v-stepper-window-item :value="1">
              <div class="pa-4">
                <div class="text-body-2 text-grey mb-3">
                  Each label collects one entity type. Pick what this label will contain.
                </div>
                <v-select
                  v-model="entityType"
                  :items="entityTypeOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  label="Entity type"
                  hide-details
                />
              </div>
            </v-stepper-window-item>

            <!-- Step 2 -->
            <v-stepper-window-item :value="2">
              <div class="pa-4">
                <div class="text-body-2 text-grey mb-3">
                  Paste up to {{ MAX_INPUT_LINES.toLocaleString() }} IDs, one per line.
                  Accepts OpenAlex IDs and
                  <span v-if="externalIdHint">{{ externalIdHint }}</span>
                  <span v-else>OpenAlex URLs</span>.
                </div>
                <v-textarea
                  v-model="rawIds"
                  variant="outlined"
                  density="compact"
                  rows="10"
                  placeholder="W2741809807&#10;https://openalex.org/A5023888391&#10;10.1234/example-doi"
                  hide-details
                />
                <div class="mt-2 d-flex align-center">
                  <v-btn variant="text" size="small" prepend-icon="mdi-upload" @click="openFilePicker">
                    Upload CSV / TXT
                  </v-btn>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    style="display: none"
                    @change="onFileChosen"
                  />
                  <v-spacer />
                  <span
                    class="text-caption"
                    :class="overLimit ? 'text-error' : 'text-grey'"
                  >
                    {{ inputLineCount.toLocaleString() }} / {{ MAX_INPUT_LINES.toLocaleString() }}
                  </span>
                </div>
                <div v-if="step2Error" class="text-error text-body-2 mt-2">{{ step2Error }}</div>
              </div>
            </v-stepper-window-item>

            <!-- Step 3 -->
            <v-stepper-window-item :value="3">
              <div class="pa-4">
                <div v-if="resolving" class="mb-3">
                  <div class="d-flex align-center text-body-2 text-grey mb-2">
                    <span>Resolving IDs… {{ resolveDone }} / {{ resolveTotal }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="resolveProgress"
                    color="primary"
                    height="6"
                    rounded
                  />
                </div>
                <label-match-table v-else :rows="resolvedRows" />
                <div v-if="step3Error" class="text-error text-body-2 mt-3">{{ step3Error }}</div>
              </div>
            </v-stepper-window-item>

            <!-- Step 4 -->
            <v-stepper-window-item :value="4">
              <div class="pa-4">
                <div class="text-body-2 text-grey mb-3">
                  {{ matchedCount }} entit{{ matchedCount === 1 ? "y" : "ies" }} will be added.
                  Give your label a name.
                </div>
                <v-text-field
                  v-model="displayName"
                  autofocus
                  variant="outlined"
                  density="compact"
                  label="Name"
                  maxlength="100"
                  counter="100"
                  :error-messages="apiError"
                />
                <v-textarea
                  v-model="description"
                  variant="outlined"
                  density="compact"
                  label="Description (optional)"
                  maxlength="500"
                  counter="500"
                  rows="3"
                  class="mt-2"
                />
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn variant="text" :disabled="creating || step === 1" @click="back">Back</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="onCancel" :disabled="creating">Cancel</v-btn>
        <v-btn
          v-if="step < 4"
          variant="flat"
          color="primary"
          :disabled="!canAdvance || resolving"
          @click="next"
        >
          Next
        </v-btn>
        <v-btn
          v-else
          variant="flat"
          color="primary"
          :loading="creating"
          :disabled="!displayName.trim() || matchedCount === 0"
          @click="create"
        >
          Create label
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { resolveIds } from "@/labelResolve";
import LabelMatchTable from "@/components/Label/LabelMatchTable.vue";

const SUPPORTED_TYPES = [
  { value: "works", title: "Works" },
  { value: "authors", title: "Authors" },
  { value: "sources", title: "Sources" },
  { value: "institutions", title: "Institutions" },
  { value: "topics", title: "Topics" },
  { value: "sdgs", title: "SDGs" },
  { value: "funders", title: "Funders" },
  { value: "publishers", title: "Publishers" },
  { value: "keywords", title: "Keywords" },
  { value: "concepts", title: "Concepts" },
];

const EXTERNAL_HINTS = {
  works: "DOIs",
  authors: "ORCIDs",
  institutions: "RORs",
  sources: "ISSNs",
};

const MAX_INPUT_LINES = 1000;

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "created"]);

const store = useStore();

const step = ref(1);
const entityType = ref("works");
const rawIds = ref("");
const resolving = ref(false);
const resolveDone = ref(0);
const resolveTotal = ref(0);
const resolvedRows = ref([]);
// Cache key for the most recent successful resolution. Skip the network
// round-trip if the user revisits step 3 without changing the inputs.
const resolvedCacheKey = ref("");
const displayName = ref("");
const description = ref("");
const apiError = ref("");
const step3Error = ref("");
const creating = ref(false);
const fileInput = ref(null);

const entityTypeOptions = SUPPORTED_TYPES;
const externalIdHint = computed(() => EXTERNAL_HINTS[entityType.value] || "");

const inputLines = computed(() =>
  rawIds.value
    .split(/\r?\n|,/)
    .map(s => s.trim())
    .filter(Boolean)
);
const inputLineCount = computed(() => inputLines.value.length);
const overLimit = computed(() => inputLineCount.value > MAX_INPUT_LINES);
const resolveProgress = computed(() =>
  resolveTotal.value ? (resolveDone.value / resolveTotal.value) * 100 : 0
);
const matchedCount = computed(() => resolvedRows.value.filter(r => !!r.resolved).length);

// Reactive client-side validation message for step 2 — flips on instantly
// when the line count exceeds the cap.
const step2Error = computed(() => {
  if (overLimit.value) {
    return `Too many lines (${inputLineCount.value.toLocaleString()}). Max ${MAX_INPUT_LINES.toLocaleString()}.`;
  }
  return "";
});

const canAdvance = computed(() => {
  if (step.value === 1) return !!entityType.value;
  if (step.value === 2) return inputLineCount.value > 0 && !overLimit.value;
  if (step.value === 3) return matchedCount.value > 0 && !resolving.value;
  return true;
});

function canVisitStep(n) {
  if (n <= step.value) return true;
  if (n === 2) return !!entityType.value;
  if (n === 3) return inputLineCount.value > 0 && !overLimit.value;
  if (n === 4) return matchedCount.value > 0 && !resolving.value;
  return false;
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) reset();
  }
);

// If the user goes back to step 2 and changes the IDs (or changes entity_type
// on step 1), the cached resolution is no longer valid; clear it so the next
// step-3 visit re-runs resolution.
watch([rawIds, entityType], () => {
  if (resolvedCacheKey.value && resolvedCacheKey.value !== resolutionCacheKey()) {
    resolvedRows.value = [];
    resolvedCacheKey.value = "";
  }
});

// Jump directly to a step via the stepper header (clickable steps).
watch(step, async (to, from) => {
  if (to === 3 && from !== 3) {
    await runResolutionIfNeeded();
  }
});

function reset() {
  step.value = 1;
  entityType.value = "works";
  rawIds.value = "";
  resolvedRows.value = [];
  resolvedCacheKey.value = "";
  resolveDone.value = 0;
  resolveTotal.value = 0;
  displayName.value = "";
  description.value = "";
  apiError.value = "";
  step3Error.value = "";
  creating.value = false;
  resolving.value = false;
}

function resolutionCacheKey() {
  return `${entityType.value}::${rawIds.value}`;
}

function onDialogToggle(v) {
  if (!v && !creating.value) emit("update:modelValue", false);
}

function onCancel() {
  if (creating.value) return;
  emit("update:modelValue", false);
}

function openFilePicker() {
  fileInput.value?.click();
}

async function onFileChosen(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  // CSV: take first column. TXT: one ID per line.
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  let lines;
  if (ext === "csv") {
    lines = text
      .split(/\r?\n/)
      .map(row => row.split(",")[0]?.trim())
      .filter(Boolean);
  } else {
    lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  rawIds.value = lines.join("\n");
  // reset the file input so the same file can be re-picked
  ev.target.value = "";
}

async function next() {
  if (step.value === 2) {
    if (overLimit.value) return;
    step.value = 3;
    return;
  }
  if (step.value === 1) {
    step.value = 2;
    return;
  }
  if (step.value === 3) {
    step.value = 4;
    return;
  }
}

function back() {
  if (step.value > 1) step.value--;
}

async function runResolutionIfNeeded() {
  const key = resolutionCacheKey();
  // Cached: skip the network round-trip when user revisits step 3 with the
  // same inputs (e.g. step 3 → 4 → 3).
  if (resolvedCacheKey.value === key && resolvedRows.value.length) return;
  resolving.value = true;
  resolveDone.value = 0;
  resolveTotal.value = inputLines.value.length;
  resolvedRows.value = [];
  step3Error.value = "";
  try {
    const rows = await resolveIds(inputLines.value, entityType.value, {
      concurrency: 8,
      onProgress: (done, total) => {
        resolveDone.value = done;
        resolveTotal.value = total;
      },
    });
    resolvedRows.value = rows;
    resolvedCacheKey.value = key;
  } catch (e) {
    step3Error.value = `Resolution failed: ${e.message || e}`;
  } finally {
    resolving.value = false;
  }
}

async function create() {
  apiError.value = "";
  creating.value = true;
  try {
    const entity_ids = resolvedRows.value
      .map(r => r.resolved)
      .filter(Boolean);
    // Dedupe (defensive — the API also dedupes via composite PK).
    const unique = [...new Set(entity_ids)];
    const label = await store.dispatch("labels/create", {
      display_name: displayName.value.trim(),
      description: description.value,
      entity_type: entityType.value,
      entity_ids: unique,
    });
    store.commit("snackbar", "Label created.");
    emit("created", label);
    emit("update:modelValue", false);
  } catch (e) {
    apiError.value = e.response?.data?.message || e.message || "Failed to create label.";
  } finally {
    creating.value = false;
  }
}
</script>

<style lang="scss" scoped>
.wizard-card {
  // Remove Vuetify's default stepper-header shadow — we use a real divider
  // below it instead so the boundary spans the full dialog width.
  :deep(.v-stepper-header) {
    box-shadow: none;
  }
  // Default inactive step dot: subtle but readable.
  :deep(.v-stepper-item__avatar.v-avatar) {
    background-color: #e0e0e0 !important;
    color: rgba(0, 0, 0, 0.72) !important;
  }
  // Completed step: medium grey so the check icon contrasts.
  :deep(.v-stepper-item--complete .v-stepper-item__avatar.v-avatar) {
    background-color: #757575 !important;
    color: #fff !important;
  }
  // Selected (current) step: DARK so it pops vs. the lighter neighbors.
  :deep(.v-stepper-item--selected .v-stepper-item__avatar.v-avatar) {
    background-color: rgba(0, 0, 0, 0.87) !important;
    color: #fff !important;
  }
  // Make every step look clickable when it's reachable (Vuetify's
  // `editable` already wires the click; this just feeds the cursor cue).
  :deep(.v-stepper-item--editable) {
    cursor: pointer;
  }
}
.wizard-stepper-header-only :deep(.v-stepper) {
  padding: 0;
}
.wizard-edge-divider {
  // Sits between the stepper header and the body. Edge-to-edge — the dialog
  // card has no horizontal padding here, so an unboxed v-divider already
  // spans full width; this class just adds a touch of vertical breathing.
  margin: 0;
}
</style>
