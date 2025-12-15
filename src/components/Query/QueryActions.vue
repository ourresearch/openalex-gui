<template>
  <span class="query-actions flex items-center gap-1">    
   
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" :disabled="!selectedIds.length" @click="exportResults">
          <Download class="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export</TooltipContent>
    </Tooltip>
   
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <label-menu :icon="true" :selectedIds="fullSelectedIds" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Labels</TooltipContent>
    </Tooltip>

    <!-- DownloadDialogs -->
    <Dialog v-model:open="isDownloadDialogOpen">
      <DialogContent class="max-w-[500px]">
        <download-dialog 
          :resultsCount="resultsMeta?.count" 
          :isOpen="isDownloadDialogOpen"
          @close="isDownloadDialogOpen = false"
        />
      </DialogContent>
    </Dialog>

  </span>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { Download } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { entity } from '@/entity';
import * as oaxSearch from '@/oaxSearch';

import LabelMenu from '@/components/Label/LabelMenu.vue';
import DownloadDialog from '@/components/Download/DownloadDialog.vue';

defineOptions({ name: 'QueryActions' });

const store = useStore();

const isDownloadDialogOpen = ref(false);

const resultsMeta = computed(() => store.getters['search/resultsMeta']);
const resultsHeader = computed(() => store.getters['search/resultsHeader']);
const resultsBody = computed(() => store.getters['search/resultsBody']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);
const selectedIds = computed(() => store.getters['search/selectedIds']);
const isEntireSearchSelected = computed(() => store.getters['search/isEntireSearchSelected']);

// Derived: full selected IDs
const fullSelectedIds = computed(() => {
  return selectedIds.value.map(id =>
    entity.fullId(id, querySubjectEntity.value)
  );
});

// Methods
function exportResults() {
  if (isEntireSearchSelected.value) {
    isDownloadDialogOpen.value = true;
  } else {
    exportSelectedAsCsv();
  }
}

function exportSelectedAsCsv() {
  const selectedRows = resultsBody.value.filter(row =>
    selectedIds.value.includes(row.id)
  );
  const csv = oaxSearch.jsonToCsv(resultsHeader.value, selectedRows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected.csv';
  a.click();
}
</script>


<style scoped>
.query-actions {
  text-align: right;
}
.query-actions > * {
  position: relative;
  top: -6px;
  margin-right: -8px;
}
</style>