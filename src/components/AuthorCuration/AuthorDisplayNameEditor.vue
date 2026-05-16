<template>
  <div v-if="isOwner" class="display-name-editor">
    <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom start">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="text"
          size="x-small"
          class="ml-2 edit-btn"
          icon
          aria-label="Edit display name"
        >
          <v-icon size="16">mdi-pencil-outline</v-icon>
        </v-btn>
      </template>

      <v-card min-width="320" max-width="420" rounded>
        <v-card-title class="text-body-1 font-weight-bold">
          Change display name
        </v-card-title>
        <v-card-text class="pt-0">
          <div class="text-caption text-medium-emphasis mb-3">
            How your name appears on your OpenAlex profile. This is cosmetic
            and does not affect which works are attributed to you.
          </div>
          <v-text-field
            v-model="editedName"
            label="Display name"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            @keyup.enter="saveDisplayName"
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
            @click="saveDisplayName"
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

defineOptions({ name: 'AuthorDisplayNameEditor' });

const props = defineProps({
  currentDisplayName: {
    type: String,
    default: '',
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update-name']);

const menuOpen = ref(false);
const isSaving = ref(false);
const editedName = ref(props.currentDisplayName);

const canSave = computed(() => {
  const trimmed = editedName.value.trim();
  return !!trimmed && trimmed !== props.currentDisplayName;
});

watch(() => props.currentDisplayName, (newVal) => {
  editedName.value = newVal;
});

watch(menuOpen, (open) => {
  if (open) editedName.value = props.currentDisplayName;
});

async function saveDisplayName() {
  if (!canSave.value) return;
  isSaving.value = true;
  try {
    emit('update-name', editedName.value.trim());
    menuOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.display-name-editor {
  display: inline-flex;
  align-items: center;
  align-self: flex-end;
}

.edit-btn {
  opacity: 0.4;
  transition: opacity 0.15s;
}

.edit-btn:hover {
  opacity: 1;
}
</style>
