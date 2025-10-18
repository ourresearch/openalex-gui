<template>
  <span class="inline-editor">
    <v-btn
      icon
      :size="size"
      variant="text"
      @click="openDialog"
    >
      <v-icon size="small">mdi-pencil</v-icon>
    </v-btn>

    <v-dialog v-model="isDialogOpen" max-width="480" z-index="10000">
      <v-card flat>
        <v-card-title class="d-flex align-center">
          <span>{{ dialogTitle }}</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-radio-group v-model="selectedValue" hide-details>
            <v-radio
              :value="true"
              :label="currentValue ? 'Yes (current value)' : 'Yes'"
              color="primary"
            ></v-radio>
            <v-radio
              :value="false"
              :label="!currentValue ? 'No (current value)' : 'No'"
              color="primary"
            ></v-radio>
          </v-radio-group>

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
import { computed, ref, unref } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { urlBase, axiosConfig } from '@/apiConfig';
import filters from '@/filters';

defineOptions({ name: 'BooleanInlineEditor' });

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
  size: {
    type: String,
    default: 'small',
  },
});

const emit = defineEmits(['updated']);

const store = useStore();

const isDialogOpen = ref(false);
const selectedValue = ref(false);
const submitError = ref(null);
const isSubmitting = ref(false);

const userEmail = computed(() => store.getters['user/userEmail']);

const facet = computed(() => unref(props.facetConfig));

const entityId = computed(() => {
  const id = props.entity?.id;
  if (!id) return null;
  return id.startsWith('https://openalex.org/')
    ? id.replace('https://openalex.org/', '')
    : id;
});

const currentValue = computed(() => props.entity?.[props.property]);
const currentValueLabel = computed(() => {
  if (currentValue.value === null || currentValue.value === undefined) return 'None';
  return currentValue.value ? 'Yes' : 'No';
});

const propertyDisplayName = computed(() => {
  return filters.capitalize(facet.value?.displayName || props.property);
});

const dialogTitle = computed(() => `${propertyDisplayName.value}?`);

const isSaveDisabled = computed(() => {
  if (isSubmitting.value) return true;
  return selectedValue.value === currentValue.value;
});

const openDialog = () => {
  submitError.value = null;
  selectedValue.value = !!currentValue.value;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  if (isSubmitting.value) return;
  isDialogOpen.value = false;
  submitError.value = null;
  selectedValue.value = false;
};

const submit = async () => {
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
    property_value: selectedValue.value,
    submitter_email: userEmail.value,
  };

  try {
    console.log('Submitting boolean correction with payload:', payload);
    const response = await axios.post(`${urlBase.correctionsApi}/v2/corrections`, payload, axiosConfig({ userAuth: true }));
    console.log('Correction submitted successfully:', response);
    
    // Refresh corrections list to show pending status
    await store.dispatch('user/fetchCorrections');
    
    store.commit('snackbar', 'Correction submitted');
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
</script>

<style scoped>
.inline-editor {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}
</style>
