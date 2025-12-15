<template>
  <span>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" @click="openExportDialog('csv')">
          <Download class="h-5 w-5 text-muted-foreground" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span v-if="isResultsExportDisabled">Too many items to download (max 100k)</span>
        <span v-else-if="!isLoggedIn">Log in to export results</span>
        <span v-else>Export results</span>
      </TooltipContent>
    </Tooltip>

    <Dialog v-model:open="isDialogOpen.exportResults">
      <DialogContent class="max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Export results</DialogTitle>
        </DialogHeader>
        
        <div v-if="exportObj.progress === null" class="py-4 space-y-4">
          <RadioGroup v-model="exportFormat">
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label for="csv">Spreadsheet (.csv)</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="ris" id="ris" />
              <Label for="ris">Endnote format (.ris)</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="wos-plaintext" id="wos" />
              <Label for="wos">Text format (.txt)</Label>
            </div>
          </RadioGroup>
          
          <div v-show="exportFormat === 'csv'" class="flex items-center space-x-2 ml-2">
            <Checkbox id="truncate" :checked="areColumnsTruncated" @update:checked="areColumnsTruncated = $event" />
            <Label for="truncate" class="text-sm">Shorten column values for Excel compatibility?</Label>
          </div>
          
          <Alert v-if="exportEstimatedTime" variant="warning">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              Since there are many records, the export will take up to {{ exportEstimatedTime }}.
            </AlertDescription>
          </Alert>
        </div>
        
        <div v-else-if="exportObj.progress < 1" class="py-5">
          Export in progress...
          <span class="font-bold">{{ filters.toPrecision(exportObj.progress * 100) }}%</span> complete
        </div>
        
        <div v-else class="py-5">
          Export complete!
        </div>
        
        <DialogFooter>
          <Button variant="ghost" @click="isDialogOpen.exportResults = false">Cancel</Button>
          <Button
            v-if="exportObj.progress < 1"
            :disabled="exportObj.progress !== null"
            @click="startExport"
          >
            Start export
          </Button>
          <Button v-else @click="downloadExport">
            <Download class="h-4 w-4 mr-1" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </span>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import { Download, AlertTriangle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

import filters from '@/filters';
import { urlBase, axiosConfig } from '@/apiConfig';

const store = useStore();
const route = useRoute();
const router = useRouter();

const isDialogOpen = ref({ exportResults: false });
const exportFormat = ref(null);
const areColumnsTruncated = ref(false);
const exportId = ref(null);
const exportObj = ref({ progress: null });

const resultsCount = computed(() => store.state?.resultsObject?.meta?.count ?? 0);
const userId = computed(() => store.getters['user/userId']);
const isLoggedIn = computed(() => !!userId.value);

const isResultsExportDisabled = computed(() => resultsCount.value > 100000);

// Check if export is finished - support both old (result_url) and new (status) API responses
const isExportFinished = computed(() => {
  return exportObj.value.status === 'completed' || 
         exportObj.value.status === 'finished' ||
         !!exportObj.value.result_url;
});

const exportEstimatedTime = computed(() => {
  const count = resultsCount.value;
  if (count < 200) return null;
  if (count < 6600) return 'one minute';
  if (count < 33000) return 'five minutes';
  if (count < 66000) return 'ten minutes';
  return 'fifteen minutes';
});

// Methods
function openExportDialog(format) {
  if (!isLoggedIn.value) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  isDialogOpen.value.exportResults = true;
  exportFormat.value = format;
}

async function startExport() {
  exportObj.value.progress = 0;
  const filterStr = route.query.filter;
  const params = new URLSearchParams({
    filter: filterStr,
    format: exportFormat.value,
    truncate: areColumnsTruncated.value,
  });
  
  // Include XPAC works if the parameter is set in the URL
  if (route.query.include_xpac === 'true') {
    params.set('include_xpac', 'true');
  }

  try {
    const resp = await axios.get(
      `${urlBase.userApi}/export/works?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );
    console.log('startExport resp:', resp);
    exportId.value = resp.data.id;
  } catch (error) {
    console.error('Export failed:', error);
    store.commit('snackbar', 'Export failed. Please try again.');
    cleanupExport();
  }
}

function cleanupExport() {
  exportObj.value = { progress: null };
  exportFormat.value = null;
  exportId.value = null;
  isDialogOpen.value.exportResults = false;
}

async function downloadExport() {
  // result_url now contains a presigned S3 URL, open it directly
  if (exportObj.value.result_url) {
    window.open(exportObj.value.result_url, '_blank');
  }
  cleanupExport();
  store.commit('snackbar', 'Export downloaded');
}

// Watchers
watch(exportFormat, () => {
  areColumnsTruncated.value = false;
});

// Polling logic
let intervalId;
onMounted(() => {
  intervalId = setInterval(async () => {
    if (!exportId.value || !userId.value) return;
    try {
      const resp = await axios.get(
        `${urlBase.userApi}/users/${userId.value}/exports/${exportId.value}`,
        axiosConfig({ userAuth: true })
      );
      console.log('checking export progress; got this back:', resp.data);
      exportObj.value = resp.data;
      if (isExportFinished.value) {
        // result_url now contains presigned S3 URL directly from the API
        exportObj.value.progress = 1;
        // Stop polling once export is finished
        exportId.value = null;
      }
    } catch (err) {
      console.error('Failed to check export progress:', err);
    }
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
</script>
