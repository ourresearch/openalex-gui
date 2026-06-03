<template>
  <div v-if="isOwner" class="collection-name-editor">
    <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom start">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="text"
          size="x-small"
          class="ml-2 edit-btn"
          icon
          aria-label="Rename collection"
        >
          <v-icon size="16">mdi-pencil-outline</v-icon>
        </v-btn>
      </template>

      <v-card min-width="320" max-width="420" rounded>
        <v-card-title class="text-body-1 font-weight-bold">
          Rename collection
        </v-card-title>
        <v-card-text class="pt-2">
          <v-text-field
            v-model="editedName"
            density="compact"
            variant="outlined"
            counter="30"
            maxlength="30"
            autofocus
            :error-messages="errorMessage"
            @keyup.enter="save"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" size="small" rounded @click="menuOpen = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            rounded
            :disabled="!canSave"
            :loading="isSaving"
            @click="save"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'CollectionNameEditor' });

const props = defineProps({
  currentName: {
    type: String,
    default: '',
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
  // Async persist handler supplied by the parent (it owns collections/update so
  // it can keep its own collection object + page title in sync). Must return a
  // promise; a rejection is surfaced inline and keeps the menu open.
  onSave: {
    type: Function,
    required: true,
  },
});

const menuOpen = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const editedName = ref(props.currentName);

const canSave = computed(() => {
  const trimmed = editedName.value.trim();
  const isNoop = trimmed === (props.currentName || '').trim();
  return !!trimmed && !isNoop;
});

watch(() => props.currentName, (newVal) => {
  editedName.value = newVal;
});

watch(menuOpen, (open) => {
  if (open) {
    editedName.value = props.currentName;
    errorMessage.value = '';
  }
});

async function save() {
  if (!canSave.value) return;
  isSaving.value = true;
  errorMessage.value = '';
  try {
    await props.onSave(editedName.value.trim());
    menuOpen.value = false;
  } catch (e) {
    errorMessage.value = e?.response?.data?.message || 'Could not rename. Please try again.';
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.collection-name-editor {
  display: inline-flex;
  align-items: center;
  align-self: center;
}

.edit-btn {
  opacity: 0.4;
  transition: opacity 0.15s;
}

.edit-btn:hover {
  opacity: 1;
}
</style>
