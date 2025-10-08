<template>
  <span class="inline-editor">
    <v-btn
      icon
      size="small"
      variant="text"
      @click="openDialog"
    >
      <v-icon size="small">mdi-pencil</v-icon>
    </v-btn>

    <v-dialog v-model="isDialogOpen" max-width="480">
      <v-card flat>
        <v-card-title class="d-flex align-center">
          <span>{{ dialogTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <div class="text-caption text-grey-darken-1 mb-4">
            Current value: {{ currentValueLabel }}
          </div>

          <v-autocomplete
            v-model="selectedOptionId"
            :items="options"
            item-title="display_name"
            item-value="id"
            :label="`Select ${propertyDisplayName}`"
            variant="solo-filled"
            flat
            density="comfortable"
            :loading="isLoadingOptions"
            :disabled="isLoadingOptions"
            hide-details="auto"
            clearable
          ></v-autocomplete>

          <v-alert
            v-if="loadError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            {{ loadError }}
          </v-alert>

          <v-alert
            v-if="submitError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            {{ submitError }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="isSaveDisabled"
            :loading="isSubmitting"
            @click="submit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup>
import { computed, ref, unref, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import ISO6391 from 'iso-639-1';

import { api } from '@/api';
import { urlBase, axiosConfig } from '@/apiConfig';
import filters from '@/filters';

defineOptions({ name: 'PropertyInlineEditor' });

const props = defineProps({
  entity: {
    type: Object,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  property: {
    type: String,
    required: true,
  },
  facetConfig: {
    type: [Object, Function],
    required: true,
  },
});

const emit = defineEmits(['updated']);

const store = useStore();
const route = useRoute();
const router = useRouter();

const isDialogOpen = ref(false);
const selectedOptionId = ref(null);
const submitError = ref(null);
const isSubmitting = ref(false);
const options = ref([]);
const isLoadingOptions = ref(false);
const loadError = ref(null);

const userEmail = computed(() => store.getters['user/userEmail']);

const facet = computed(() => unref(props.facetConfig));
const facetEntityId = computed(() => facet.value?.entityId);

const entityId = computed(() => {
  const id = props.entity?.id;
  if (!id) return null;
  return id.startsWith('https://openalex.org/')
    ? id.replace('https://openalex.org/', '')
    : id;
});

const currentValue = computed(() => props.entity?.[props.property]);
const currentValueLabel = computed(() => {
  if (!currentValue.value) return 'None';
  if (typeof currentValue.value === 'string') return currentValue.value;
  return currentValue.value.display_name || currentValue.value.id || 'None';
});

const propertyDisplayName = computed(() => {
  return filters.capitalize(facet.value?.displayName || props.property);
});

const dialogTitle = computed(() => `Edit ${propertyDisplayName.value}`);

const isSaveDisabled = computed(() => {
  if (isSubmitting.value) return true;
  if (!selectedOptionId.value) return true;
  return normalizeOptionId(selectedOptionId.value) === normalizeOptionId(currentValue.value);
});

const openDialog = async () => {

  
  submitError.value = null;
  isDialogOpen.value = true;
  
  // Load options if not already loaded
  if (options.value.length === 0) {
    await loadOptions();
  }
  
  // Wait for Vue to update the DOM
  await nextTick();
  
  // Set initial selection to current value
  const currentId = normalizeOptionId(currentValue.value);
  console.log('Opening dialog. Current value:', currentValue.value, 'Normalized:', currentId);
  console.log('Available options:', options.value.length, 'options');
  selectedOptionId.value = currentId;
  console.log('Selected option ID:', selectedOptionId.value);
};

const closeDialog = () => {
  if (isSubmitting.value) return;
  isDialogOpen.value = false;
  submitError.value = null;
  selectedOptionId.value = null;
};

const loadOptions = async () => {
  if (!facetEntityId.value) {
    loadError.value = 'No data source configured for this property.';
    return;
  }

  isLoadingOptions.value = true;
  loadError.value = null;

  try {
    console.log(`Loading options from API endpoint: ${facetEntityId.value}`);
    const response = await api.get(facetEntityId.value, { 'per-page': 200 });
    const results = response?.results || [];
    console.log(`Loaded ${results.length} options:`, results);
    
    options.value = results.map(item => {
      const normalizedId = normalizeOptionId(item.id);
      const displayName = item.display_name || normalizedId;
      
      return {
        id: normalizedId,
        display_name: displayName,
      };
    });
    
    console.log(`Processed options:`, options.value);
  } catch (error) {
    console.error('Error loading options:', error);
    loadError.value = `Failed to load ${propertyDisplayName.value} options. Please try again.`;
  } finally {
    isLoadingOptions.value = false;
  }
};

const normalizeOptionId = (value) => {
  if (!value) return value;
  if (typeof value === 'object') {
    value = value.id || value.value;
  }
  let normalized = String(value);
  normalized = normalized.replace('https://openalex.org/', '');
  // Remove entity type prefix (e.g., 'types/', 'languages/')
  normalized = normalized.replace(/^[a-z]+\//i, '');
  return normalized;
};

const submit = async () => {
  if (!selectedOptionId.value) return;
  if (!entityId.value) {
    submitError.value = 'Unable to determine entity ID for this correction.';
    return;
  }
  if (!userEmail.value) {
    submitError.value = 'You must be logged in to submit a correction.';
    return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  const payload = {
    entity: props.entityType,
    entity_id: entityId.value,
    property: props.property,
    property_value: normalizeOptionId(selectedOptionId.value),
    submitter_email: userEmail.value,
  };

  try {
    console.log('Submitting correction with payload:', payload);
    const response = await axios.post(`${urlBase.correctionsApi}/v2/corrections`, payload, axiosConfig({ userAuth: true }));
    console.log('Correction submitted successfully:', response);
    
    // Refresh corrections list to show pending status
    await store.dispatch('user/fetchCorrections');
    
    store.commit('snackbar', 'Your correction has been received and will be processed within a few days. Thank you for your help.');
    emit('updated', payload.property_value);
    closeDialog();
  } catch (error) {
    console.error('Error submitting correction:', error);
    console.error('Error response:', error.response);
    console.error('Error message:', error.message);
    const errorMessage = error?.response?.data?.detail 
      || error?.response?.data?.message 
      || error?.message 
      || 'There was an error submitting your correction. Please try again later.';
    submitError.value = errorMessage;
  } finally {
    isSubmitting.value = false;
  }
};

// Load options on mount is removed - we now load on dialog open
</script>

<style scoped>
.inline-editor {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
}
</style>
