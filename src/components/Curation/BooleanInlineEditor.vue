<template>
  <span class="inline-flex items-center ml-0.5">
    <Button
      variant="ghost"
      :size="size === 'x-small' ? 'sm' : 'icon'"
      :class="size === 'x-small' ? 'h-6 w-6 p-0' : ''"
      @click="openDialog"
    >
      <Pencil :class="size === 'x-small' ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>

    <Dialog :open="isDialogOpen" @update:open="val => !val && closeDialog()">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
        </DialogHeader>

        <div class="py-4 space-y-3">
          <div class="flex items-center space-x-2">
            <input
              type="radio"
              id="yes"
              :value="true"
              v-model="selectedValue"
              class="h-4 w-4"
            />
            <label for="yes" class="text-sm">
              {{ currentValue ? 'Yes (current value)' : 'Yes' }}
            </label>
          </div>
          <div class="flex items-center space-x-2">
            <input
              type="radio"
              id="no"
              :value="false"
              v-model="selectedValue"
              class="h-4 w-4"
            />
            <label for="no" class="text-sm">
              {{ !currentValue ? 'No (current value)' : 'No' }}
            </label>
          </div>

          <Alert v-if="submitError" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ submitError }}</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="closeDialog">Cancel</Button>
          <Button
            :disabled="isSaveDisabled"
            @click="submit"
          >
            <template v-if="isSubmitting">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            </template>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </span>
</template>

<script setup>
import { computed, ref, unref } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Pencil, AlertCircle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
/* Styles handled via Tailwind classes */
</style>
