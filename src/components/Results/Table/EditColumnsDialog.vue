<template>
  <v-dialog v-model="isOpen" max-width="920" scroll-strategy="none">
    <v-card class="bg-white" elevation="8">
      <!-- Title bar -->
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">Edit columns</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- The three-column editor body (search | categories | properties | chips)
           lives in ColumnEditorPanel (shared with the export dialog, job #304).
           Here it edits a local ordered DRAFT; nothing reaches the table until
           Apply. Remounted each open (v-if) so search + focus reset. -->
      <div class="px-4 pb-2">
        <column-editor-panel
          v-if="isOpen"
          v-model="draftKeys"
          :entity-type="entityType"
          height="60vh"
        />
      </div>

      <!-- Deferred-commit footer -->
      <v-divider />
      <v-card-actions class="pa-3 justify-end">
        <v-btn variant="plain" class="text-black" @click="close">Cancel</v-btn>
        <v-btn variant="flat" color="black" :disabled="!hasChanges" @click="applyChanges">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import ColumnEditorPanel from '@/components/Results/Table/ColumnEditorPanel.vue';

defineOptions({ name: 'EditColumnsDialog' });

// The "Edit columns" dialog — the column-mode property browser, distinct from the
// filter picker (NoviceFilterDialog, 2-column). It wraps the shared
// ColumnEditorPanel with dialog chrome + deferred-commit: all edits mutate a
// local ordered draft and nothing reaches the table until Apply.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entityType: { type: String, required: true },
  // The table's current ordered column keys. Seeds the draft on open.
  selectedKeys: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'apply']);

const isOpen = ref(false);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => { if (!v) emit('update:modelValue', false); });

// ---- ordered draft (deferred-commit) ----
const draftKeys = ref([]);
const hasChanges = computed(() => {
  const a = draftKeys.value;
  const b = props.selectedKeys;
  // Order matters here (drag reorder is a real change), so compare positionally.
  return a.length !== b.length || a.some((k, i) => k !== b[i]);
});

function applyChanges() {
  emit('apply', [...draftKeys.value]);
  isOpen.value = false;
}
function close() {
  isOpen.value = false;
}

// ---- open/close lifecycle ----
watch(isOpen, (open) => {
  if (open) {
    // Snapshot the current columns into the ordered draft. Nothing leaves the
    // dialog until Apply.
    draftKeys.value = [...props.selectedKeys];
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
  }
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
});
</script>
