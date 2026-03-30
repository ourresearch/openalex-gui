<template>
  <div v-if="isOwner" class="full-name-editor mt-1">
    <div class="d-flex align-center">
      <span class="text-body-2 text-medium-emphasis mr-1">Full name:</span>
      <span class="text-body-2 font-weight-medium">{{ currentFullName || 'Not set' }}</span>

      <v-tooltip location="top" max-width="280">
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            size="14"
            class="ml-1"
            color="grey"
          >
            mdi-information-outline
          </v-icon>
        </template>
        Your full name is used for matching purposes when adding works to your profile.
        Select the longest accurate name you currently use.
      </v-tooltip>

      <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom start">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="text"
            size="x-small"
            class="ml-1 edit-btn"
            icon
          >
            <v-icon size="16">mdi-pencil-outline</v-icon>
          </v-btn>
        </template>

        <v-card min-width="300" max-width="400" rounded>
          <v-card-title class="text-body-1 font-weight-bold">
            Set full name
          </v-card-title>
          <v-card-text class="pt-0">
            <div class="text-caption text-medium-emphasis mb-3">
              Select the longest accurate name you currently use:
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
              :disabled="selectedName === currentFullName"
              :loading="isSaving"
              @click="saveFullName"
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'AuthorFullNameEditor' });

const props = defineProps({
  currentFullName: {
    type: String,
    default: '',
  },
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

const emit = defineEmits(['update-full-name']);

const menuOpen = ref(false);
const isSaving = ref(false);
const selectedName = ref(props.currentFullName || '');

// Combine current display name + alternates, deduplicated
const allNames = computed(() => {
  const names = new Set();
  if (props.currentDisplayName) names.add(props.currentDisplayName);
  if (props.alternateNames) {
    props.alternateNames.forEach(n => names.add(n));
  }
  // Sort by length descending so the longest names are first
  return Array.from(names).sort((a, b) => b.length - a.length);
});

watch(() => props.currentFullName, (newVal) => {
  selectedName.value = newVal || '';
});

async function saveFullName() {
  if (selectedName.value === props.currentFullName) return;
  isSaving.value = true;
  try {
    emit('update-full-name', selectedName.value);
    menuOpen.value = false;
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.full-name-editor {
  padding-left: 4px;
}

.edit-btn {
  opacity: 0.4;
  transition: opacity 0.15s;
}

.edit-btn:hover {
  opacity: 1;
}
</style>
