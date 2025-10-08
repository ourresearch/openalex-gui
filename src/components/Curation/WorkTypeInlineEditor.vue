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

    <v-dialog v-model="isDialogOpen" max-width="480" style="z-index:999999999999999999;">
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
            v-model="selectedOption"
            :items="typeOptions"
            item-title="display_name"
            item-value="id"
            return-object
            :label="`Select type`"
            variant="solo-filled"
            flat
            density="comfortable"
            :loading="isLoadingTypes"
            :disabled="isLoadingTypes"
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
import { computed, ref, unref, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { api } from '@/api';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'WorkTypeInlineEditor' });

const props = defineProps({
  work: {
    type: Object,
    required: true,
  },
  facetConfig: {
    type: [Object, Function],
    required: true,
  },
});

const emit = defineEmits(['updated']);

const store = useStore();

const isDialogOpen = ref(false);
const selectedOption = ref(null);
const submitError = ref(null);
const isSubmitting = ref(false);
const typeOptions = ref([]);
const isLoadingTypes = ref(false);
const loadError = ref(null);

const librarian = computed(() => store.getters['user/isLibrarian']);
const admin = computed(() => store.getters['user/isAdmin']);
const canAutoApprove = computed(() => librarian.value || admin.value);
const userEmail = computed(() => store.getters['user/userEmail']);

const facet = computed(() => unref(props.facetConfig));
const facetEntityId = computed(() => facet.value?.entityId || 'types');
const facetEntityIdLabel = computed(() => facetEntityId.value.replace(/_/g, ' '));

const workId = computed(() => {
  const id = props.work?.id;
  if (!id) return null;
  return id.startsWith('https://openalex.org/')
    ? id.replace('https://openalex.org/', '')
    : id;
});

const currentValue = computed(() => props.work?.type);
const currentValueLabel = computed(() => currentValue.value || 'None');

const dialogTitle = computed(() => 'Edit Work Type');

const isSaveDisabled = computed(() => {
  if (isSubmitting.value) return true;
  if (!selectedOption.value) return true;
  return normalizeOptionId(selectedOption.value.id) === normalizeOptionId(currentValue.value);
});

const openDialog = () => {
  submitError.value = null;
  // Set initial selection to current value
  const currentId = normalizeOptionId(currentValue.value);
  selectedOption.value = typeOptions.value.find(opt => opt.id === currentId) || null;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  if (isSubmitting.value) return;
  isDialogOpen.value = false;
  submitError.value = null;
  selectedOption.value = null;
};

const loadTypes = async () => {
  isLoadingTypes.value = true;
  loadError.value = null;

  try {
    const response = await api.get('types', { 'per-page': 200 });
    const results = response?.results || [];
    typeOptions.value = results.map(item => ({
      id: normalizeOptionId(item.id),
      display_name: item.display_name || normalizeOptionId(item.id),
    }));
  } catch (error) {
    console.error('Error loading types:', error);
    loadError.value = 'Failed to load work types. Please try again.';
  } finally {
    isLoadingTypes.value = false;
  }
};

const normalizeOptionId = (value) => {
  if (!value) return value;
  let normalized = value;
  normalized = normalized.replace('https://openalex.org/', '');
  normalized = normalized.replace(/^types\//i, '');
  return normalized;
};

const submit = async () => {
  if (!selectedOption.value) return;
  if (!workId.value) {
    submitError.value = 'Unable to determine work ID for this correction.';
    return;
  }
  if (!userEmail.value) {
    submitError.value = 'You must be logged in to submit a correction.';
    return;
  }

  isSubmitting.value = true;
  submitError.value = null;

  const payload = {
    entity: 'works',
    entity_id: workId.value,
    property: 'type',
    property_value: normalizeOptionId(selectedOption.value.id),
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

onMounted(() => {
  loadTypes();
});
</script>

<style scoped>
.inline-editor {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
}

.selected-option {
  display: flex;
  align-items: center;
}
</style>
