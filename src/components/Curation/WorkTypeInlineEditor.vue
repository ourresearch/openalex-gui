<template>
  <span class="inline-editor">
    <Button variant="ghost" size="icon" class="h-8 w-8" @click="openDialog">
      <Pencil class="h-4 w-4" />
    </Button>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
        </DialogHeader>

        <div class="py-4">
          <div class="text-xs text-muted-foreground mb-4">
            Current value: {{ currentValueLabel }}
          </div>

          <Popover v-model:open="isTypeSelectOpen">
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" class="w-full justify-between" :disabled="isLoadingTypes">
                <span v-if="selectedOption">{{ selectedOption.display_name }}</span>
                <span v-else class="text-muted-foreground">Select type...</span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search types..." />
                <CommandEmpty>No type found.</CommandEmpty>
                <CommandGroup class="max-h-[300px] overflow-auto">
                  <CommandItem
                    v-for="option in typeOptions"
                    :key="option.id"
                    :value="option.id"
                    @select="selectType(option)"
                  >
                    <Check class="mr-2 h-4 w-4" :class="selectedOption?.id === option.id ? 'opacity-100' : 'opacity-0'" />
                    {{ option.display_name }}
                  </CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <Alert v-if="loadError" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ loadError }}</AlertDescription>
          </Alert>

          <Alert v-if="submitError" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>{{ submitError }}</AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="ghost" @click="closeDialog">Cancel</Button>
          <Button :disabled="isSaveDisabled" @click="submit">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </span>
</template>

<script setup>
import { computed, ref, unref, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Pencil, Check, ChevronsUpDown, AlertCircle, Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
const isTypeSelectOpen = ref(false);
const selectedOption = ref(null);
const submitError = ref(null);
const isSubmitting = ref(false);
const typeOptions = ref([]);
const isLoadingTypes = ref(false);
const loadError = ref(null);

const selectType = (option) => {
  selectedOption.value = option;
  isTypeSelectOpen.value = false;
};

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
