<template>
  <div class="label-details">
    <router-link to="/me/labels" class="inline-flex items-center text-primary hover:underline text-sm mb-2 ml-1">
      <ArrowLeft class="h-4 w-4 mr-1" />
      All Labels
    </router-link>

    <Card class="rounded-lg pt-6">
      <div class="flex items-start justify-between px-5 pb-5 border-b">
        <div class="flex-1">
          <div>
            <span v-if="labelData" class="text-xl font-semibold flex items-center gap-2">
              <Tag class="h-5 w-5 text-muted-foreground" />
              {{ labelData.name }}
              <span class="text-sm font-normal text-muted-foreground ml-2">
                {{ labelData.ids.length}} {{ labelData.entity_type }}
              </span>
            </span>
            <span v-else class="text-xl font-semibold flex items-center gap-2">
              <Tag class="h-5 w-5" />
              Label not found
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            @click="deleteLabel"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            @click="showEditDialog = true"
          >
            <Pencil class="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
      
      <CardContent v-if="!displayNamesLoaded" class="py-4">
        Loading...
      </CardContent>
      
      <CardContent v-else-if="!labelData" class="py-4">
        Label not found.
      </CardContent>
      
      <div v-else-if="labelData.ids.length" class="border-b py-3">
        <button
          v-for="(id, index) in labelData.ids"
          :key="id"
          class="w-full flex items-center justify-between px-8 py-2 hover:bg-accent text-left"
          @click="clickRow(id)"
        > 
          <span>
            <span class="mr-1 inline-block min-w-[16px]">{{ index + 1 }}.</span>
            {{ entityDisplayName(id) }}
          </span>
          
          <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="removeId(id)">
            <X class="h-4 w-4" />
          </Button>
        </button>
      </div>

      <div v-if="labelData" class="flex w-full">
        <div class="flex-[1.5] flex flex-col justify-center px-6 py-5">
          <div class="text-sm mb-2">Add {{ labelData.entity_type }}:</div>
          <entity-autocomplete
            :entityType="labelData.entity_type"
            @entity-selected="addId($event.id)"
          />
        </div>
        <div class="flex-1 flex items-center justify-center px-6 py-10 border-l">
          <Button @click="showBulkUploadDialog = true">
            <Upload class="h-4 w-4 mr-2" />
            Upload {{ filters.capitalize(labelData.entity_type) }} List
          </Button>
        </div>
      </div>

      <!-- Edit Dialog -->
      <Dialog :open="showEditDialog" @update:open="showEditDialog = $event">
        <DialogContent class="sm:max-w-[600px] p-0">
          <label-create
            v-if="showEditDialog"
            :edit-id="labelId"
            :full="true"
            @close="showEditDialog = false"
          />
        </DialogContent>
      </Dialog>

      <!-- Bulk Upload Dialog -->
      <Dialog :open="showBulkUploadDialog" @update:open="showBulkUploadDialog = $event">
        <DialogContent class="sm:max-w-[600px] p-0">
          <label-bulk-upload
            v-if="showBulkUploadDialog"
            :label-id="labelId"
            @close="showBulkUploadDialog = false"
          />
        </DialogContent>
      </Dialog>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft, Tag, Trash2, Pencil, X, Upload } from 'lucide-vue-next';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { api } from '@/api';
import filters from '@/filters';

import EntityAutocomplete from '@/components/EntityAutocomplete.vue';
import LabelCreate from '@/components/Label/LabelCreate.vue';
import LabelBulkUpload from '@/components/Label/LabelBulkUpload.vue';

defineOptions({ name: 'LabelDetails' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const showEditDialog = ref(false);
const showBulkUploadDialog = ref(false);
const displayNamesLoaded = ref(false);

const labelId = computed(() => route.params.labelId || null);
const userCollections = computed(() => store.getters['user/userCollections']);
const labelData = computed(() => userCollections.value.find(coll => coll.id === labelId.value));

const entityDisplayName = (id) => api.getEntityFromCache(id)?.display_name ?? '';
const clickRow = (id) => { store.state.zoomId = id };
const loadAllDisplayNames = async () => {
  const calls = labelData.value?.ids?.map(id => api.getEntity(id)) ?? [];
  await Promise.all(calls);
  displayNamesLoaded.value = true;
};

const useLabelActions = () => {
  const updateCollectionIds = (payload) =>
    store.dispatch('user/updateCollectionIds', payload);

  const deleteCollection = (id) =>
    store.dispatch('user/deleteCollection', id);

  const addId = async (id) => {
    const newIds = [...new Set([...labelData.value.ids, id])];
    await api.getEntity(id);
    await updateCollectionIds({ collectionId: labelId.value, ids: newIds });
  };

  const removeId = async (id) => {
    const newIds = labelData.value.ids.filter(existingId => existingId !== id);
    await updateCollectionIds({ collectionId: labelId.value, ids: newIds });
  };

  const deleteLabel = async () => {
    const resp = await deleteCollection(labelId.value);
    if (resp) {
      router.push('/me/labels');
    }
  };

  return { addId, removeId, deleteLabel };
};

// Usage
const { addId, removeId, deleteLabel } = useLabelActions();

// Watch for label changes
watch(labelData, 
  async () => {
    displayNamesLoaded.value = false;
    await loadAllDisplayNames();
  },
  { immediate: true });

</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>