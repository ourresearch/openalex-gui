<template>
  <v-dialog v-model="dialogOpen" max-width="600" scrollable>
    <v-card rounded>
      <v-card-title class="d-flex align-center justify-space-between">
        Remove observed names
        <v-btn icon variant="text" size="small" @click="dialogOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4" style="min-height: 200px; max-height: 60vh;">
        <p class="text-body-2 text-medium-emphasis mb-4">
          These are the names this profile has been seen under in the literature.
          Removing a name removes every work attached to it from your profile.
          This can't be undone here (you can still re-add individual works later).
        </p>

        <!-- Building the name → works mapping -->
        <div v-if="loading" class="d-flex flex-column align-center py-8">
          <v-progress-circular indeterminate color="primary" class="mb-3" />
          <div class="text-body-2 text-medium-emphasis">
            Counting works for each name<span v-if="progress.total">
              ({{ progress.done }} / {{ progress.total }})</span
            >…
          </div>
        </div>

        <div v-else-if="!nameRows.length" class="text-body-2 text-medium-emphasis py-8 text-center">
          No removable observed names found.
        </div>

        <template v-else>
          <div class="d-flex align-center mb-1">
            <v-checkbox
              :model-value="allSelected"
              :indeterminate="someSelected && !allSelected"
              density="compact"
              hide-details
              label="Select all"
              @update:model-value="toggleAll"
            />
          </div>
          <v-divider class="mb-1" />
          <v-list density="compact" class="py-0">
            <v-list-item
              v-for="row in nameRows"
              :key="row.name"
              class="px-0"
              @click="toggle(row.name)"
            >
              <template #prepend>
                <v-checkbox
                  :model-value="selected.has(row.name)"
                  density="compact"
                  hide-details
                  @update:model-value="toggle(row.name)"
                  @click.stop
                />
              </template>
              <v-list-item-title>{{ row.name }}</v-list-item-title>
              <template #append>
                <span class="text-body-2 text-medium-emphasis">
                  {{ row.count.toLocaleString() }}
                  work{{ row.count === 1 ? '' : 's' }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <span v-if="submitting && progress.total" class="text-body-2 text-medium-emphasis ml-2">
          Removing… {{ progress.done }} / {{ progress.total }}
        </span>
        <v-spacer />
        <v-btn variant="text" rounded :disabled="submitting" @click="dialogOpen = false">
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          rounded
          :disabled="!selected.size || submitting"
          :loading="submitting"
          @click="onRemove"
        >
          Remove
          <template v-if="selectedWorkCount">
            ({{ selectedWorkCount.toLocaleString() }}
            work{{ selectedWorkCount === 1 ? '' : 's' }})
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'ObservedNamesEditor' });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ name, count, workIds, removableIds }] — already filtered to removable.
  nameRows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  progress: { type: Object, default: () => ({ done: 0, total: 0 }) },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const dialogOpen = ref(props.modelValue);
const selected = ref(new Set());

watch(() => props.modelValue, (v) => { dialogOpen.value = v; });
watch(dialogOpen, (v) => {
  emit('update:modelValue', v);
  if (v) selected.value = new Set(); // fresh selection each open
});

const selectableNames = computed(() => props.nameRows.map((r) => r.name));
const allSelected = computed(
  () => selectableNames.value.length > 0 && selected.value.size === selectableNames.value.length
);
const someSelected = computed(() => selected.value.size > 0);
const selectedWorkCount = computed(() => {
  const ids = new Set();
  props.nameRows
    .filter((r) => selected.value.has(r.name))
    .forEach((r) => r.removableIds.forEach((id) => ids.add(id)));
  return ids.size;
});

function toggle(name) {
  const next = new Set(selected.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  selected.value = next;
}
function toggleAll() {
  selected.value = allSelected.value ? new Set() : new Set(selectableNames.value);
}
function onRemove() {
  if (!selected.value.size) return;
  emit('submit', [...selected.value]);
}

// Close once a submit finishes (submitting flips back to false while open).
watch(() => props.submitting, (now, was) => {
  if (was && !now && dialogOpen.value) dialogOpen.value = false;
});
</script>
