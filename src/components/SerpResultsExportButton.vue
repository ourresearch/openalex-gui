<template>
  <span>
    <v-tooltip location="top">
      <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon @click="openExportDialog('csv')">
            <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
          </v-btn>
      </template>
      <div v-if="isResultsExportDisabled">
        Too many items to download (max 100k)
      </div>
      <div v-else>Export results</div>
    </v-tooltip>
    <v-dialog v-model="isDialogOpen.exportResults" max-width="350" :persistent="exportObj.progress !== null">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            Export results
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <div v-if="exportObj.progress === null" class="pa-4 py-0">
          <!-- Radio group for format selection -->
          <v-radio-group v-model="exportFormat">
            <v-radio
              label="Spreadsheet (.csv)"
              value="csv"
            />
            <v-radio
              label="Endnote format (.ris)"
              value="ris"
            />
            <v-radio
              label="Text format (.txt)"
              value="wos-plaintext"
            />
          </v-radio-group>
          
          <!-- Separate checkbox that appears when CSV is selected -->
          <div v-show="exportFormat === 'csv'" class="ml-2 mt-n4 mb-4">
            <v-checkbox
              density="compact"
              hide-details
              v-model="areColumnsTruncated"
              label="Shorten column values for Excel compatibility?"
              @click.stop
            />
          </div>
            <v-alert v-if="exportEstimatedTime" type="warning" text>
              Since there are many records, the export will take up to {{ exportEstimatedTime }}.
            </v-alert>
        </div>
        <div v-else-if="exportObj.progress < 1" class="pa-5">
          Export in progress...
          <span class="font-weight-bold">{{ filters.toPrecision(exportObj.progress * 100) }}%</span> complete
        </div>
        <div v-else class="pa-5">
          Export complete!
        </div>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn variant="text" rounded @click="isDialogOpen.exportResults = false">Cancel</v-btn>
          <v-btn
              v-if="exportObj.progress < 1"
              :disabled="exportObj.progress !== null"
              color="primary"
              rounded
              @click="startExport"
          >
            Start export
          </v-btn>
          <v-btn
              v-else
              color="primary"
              rounded
              :href="exportObj.result_url"
              target="_blank"
              @click="clickDownloadButton"
          >
            <v-icon start>mdi-tray-arrow-down</v-icon>
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import axios from 'axios';
import filters from '@/filters';

const store = useStore();
const route = useRoute();

const isDialogOpen = ref({ exportResults: false });
const exportFormat = ref(null);
const areColumnsTruncated = ref(false);
const exportProgressUrl = ref('');
const exportObj = ref({ progress: null });

const resultsCount = computed(() => store.state?.resultsObject?.meta?.count ?? 0);

const isResultsExportDisabled = computed(() => resultsCount.value > 100000);

const isExportFinished = computed(() => !!exportObj.value.result_url);

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

  try {
    const resp = await axios.get(`https://export.openalex.org/works?${params.toString()}`);
    console.log('startExport resp:', resp);
    exportProgressUrl.value = resp.data.progress_url;
  } catch (error) {
    console.error('Export failed:', error);
    store.commit('snackbar', 'Export failed. Please try again.');
    cleanupExport();
  }
}

function cleanupExport() {
  exportObj.value = { progress: null };
  exportFormat.value = null;
  exportProgressUrl.value = '';
  isDialogOpen.value.exportResults = false;
}

function clickDownloadButton() {
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
    if (!exportProgressUrl.value) return;
    try {
      const resp = await axios.get(exportProgressUrl.value);
      console.log('checking export progress; got this back:', resp.data);
      exportObj.value = resp.data;
      if (isExportFinished.value) {
        exportProgressUrl.value = '';
        exportObj.value.progress = 1;
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
