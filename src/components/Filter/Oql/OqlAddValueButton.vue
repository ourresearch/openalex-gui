<template>
  <v-btn
    icon
    size="x-small"
    variant="outlined"
    class="oql-add-btn ml-1"
    density="compact"
    @click="openDialog"
  >
    <v-icon size="small">mdi-plus</v-icon>
  </v-btn>

  <v-dialog v-model="isDialogOpen" max-width="600">
    <v-card>
      <v-toolbar density="compact" color="transparent">
        <v-toolbar-title class="text-body-1">
          Add {{ columnDisplayName }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <v-text-field
          v-model="searchString"
          :label="`Search ${columnDisplayName}...`"
          variant="outlined"
          density="compact"
          class="mx-4 mt-4"
          hide-details
          autofocus
          clearable
        />

        <filter-select-add-option
          :filter-key="columnId"
          :is-open="isDialogOpen"
          :search-string="searchString"
          :defer-updates="true"
          :local-selection="localSelection"
          @toggle-selection="toggleSelection"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end pa-4">
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="applySelections"
          :disabled="localSelection.length === 0"
        >
          Add ({{ localSelection.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'OqlAddValueButton' });

const emit = defineEmits(['add']);

const props = defineProps({
  clauseMeta: {
    type: Object,
    required: true
  }
});

// State
const isDialogOpen = ref(false);
const searchString = ref('');
const localSelection = ref([]);

// Computed
const columnId = computed(() => props.clauseMeta?.column_id);
const columnDisplayName = computed(() => props.clauseMeta?.column_display_name || 'value');

// Methods
function openDialog() {
  isDialogOpen.value = true;
  searchString.value = '';
  localSelection.value = [];
}

function closeDialog() {
  isDialogOpen.value = false;
  searchString.value = '';
  localSelection.value = [];
}

function toggleSelection(value) {
  const index = localSelection.value.indexOf(value);
  if (index === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(index, 1);
  }
}

function applySelections() {
  if (localSelection.value.length > 0) {
    emit('add', {
      columnId: columnId.value,
      values: [...localSelection.value],
      sourcePointer: props.clauseMeta?.source_pointer
    });
  }
  closeDialog();
}
</script>

<style lang="scss" scoped>
.oql-add-btn {
  opacity: 0.6;
  vertical-align: middle;

  &:hover {
    opacity: 1;
  }
}
</style>
