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
        >
          <v-icon size="16">mdi-pencil-outline</v-icon>
        </v-btn>
      </template>

      <v-card min-width="300" max-width="400" rounded>
        <v-card-title class="text-body-1 font-weight-bold">
          Change display name
        </v-card-title>
        <v-card-text class="pt-0">
          <div class="text-caption text-medium-emphasis mb-3">
            Select from your known name variants:
          </div>
          <v-radio-group
            v-model="selectedName"
            hide-details
            density="compact"
          >
            <v-radio
              v-for="name in allNames"
              :key="name"
              :label="name"
              :value="name"
              density="compact"
            />
          </v-radio-group>

          <div class="text-caption text-medium-emphasis mt-3">
            Don't see the right name?
            <a href="mailto:support@openalex.org">Contact support</a>
          </div>
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
            :disabled="selectedName === currentDisplayName"
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
  alternateNames: {
    type: Array,
    default: () => [],
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update-name']);

const menuOpen = ref(false);
const isSaving = ref(false);
const selectedName = ref(props.currentDisplayName);

// Combine current name + alternates, deduplicated
const allNames = computed(() => {
  const names = new Set();
  if (props.currentDisplayName) names.add(props.currentDisplayName);
  if (props.alternateNames) {
    props.alternateNames.forEach(n => names.add(n));
  }
  return Array.from(names);
});

watch(() => props.currentDisplayName, (newVal) => {
  selectedName.value = newVal;
});

async function saveDisplayName() {
  if (selectedName.value === props.currentDisplayName) return;
  isSaving.value = true;
  try {
    emit('update-name', selectedName.value);
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
}

.edit-btn {
  opacity: 0.4;
  transition: opacity 0.15s;
}

.edit-btn:hover {
  opacity: 1;
}
</style>
