<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="onDialogToggle"
    max-width="780"
    persistent
    scrollable
  >
    <v-card flat rounded class="wizard-card">
      <v-card-title class="d-flex align-center">
        <span>New label</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="onCancel" :disabled="creating">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-stepper
          v-model="step"
          flat
          alt-labels
          hide-actions
          class="bg-transparent"
        >
          <v-stepper-header>
            <v-stepper-item :value="1" title="Type" :complete="step > 1" />
            <v-divider />
            <v-stepper-item :value="2" title="IDs" :complete="step > 2" />
            <v-divider />
            <v-stepper-item :value="3" title="Review" :complete="step > 3" />
            <v-divider />
            <v-stepper-item :value="4" title="Name" />
          </v-stepper-header>

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
                  :counter="MAX_INPUT_LINES"
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
                  <span class="text-caption text-grey">{{ inputLineCount }} line(s)</span>
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

const MAX_INPUT_LINES = 10000;

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
const displayName = ref("");
const description = ref("");
const apiError = ref("");
const step2Error = ref("");
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
const resolveProgress = computed(() =>
  resolveTotal.value ? (resolveDone.value / resolveTotal.value) * 100 : 0
);
const matchedCount = computed(() => resolvedRows.value.filter(r => !!r.resolved).length);

const canAdvance = computed(() => {
  if (step.value === 1) return !!entityType.value;
  if (step.value === 2) return inputLineCount.value > 0 && inputLineCount.value <= MAX_INPUT_LINES;
  if (step.value === 3) return matchedCount.value > 0 && !resolving.value;
  return true;
});

watch(
  () => props.modelValue,
  (open) => {
    if (open) reset();
  }
);

function reset() {
  step.value = 1;
  entityType.value = "works";
  rawIds.value = "";
  resolvedRows.value = [];
  resolveDone.value = 0;
  resolveTotal.value = 0;
  displayName.value = "";
  description.value = "";
  apiError.value = "";
  step2Error.value = "";
  step3Error.value = "";
  creating.value = false;
  resolving.value = false;
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
    step2Error.value = "";
    if (inputLineCount.value > MAX_INPUT_LINES) {
      step2Error.value = `Too many lines (${inputLineCount.value}). Max ${MAX_INPUT_LINES.toLocaleString()}.`;
      return;
    }
    step.value = 3;
    await runResolution();
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

async function runResolution() {
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
  :deep(.v-stepper-header) {
    box-shadow: none;
  }
}
</style>
