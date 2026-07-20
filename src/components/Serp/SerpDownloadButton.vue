<template>
  <div class="d-inline-flex align-center">
    <!-- Standalone download icon in the results header row (#440 r5) — graduated
         out of the results kebab. Downloads the current result set (or the
         selection, when one is scoped). Logic ported verbatim from the old
         SerpResultsKebab download item. -->
    <v-tooltip location="bottom" :text="tooltipText" content-class="linear-tooltip">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          size="small"
          :aria-label="tooltipText"
          @click="handleDownloadClick"
        >
          <v-icon color="grey-darken-1">mdi-tray-arrow-down</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- Hidden export button (dialogs are teleported, so they still work) -->
    <serp-results-export-button ref="exportButtonRef" class="d-none" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import filters from '@/filters';
import { entityConfigs } from '@/entityConfigs';
import { urlBase } from '@/apiConfig';
import { exportToCsv } from '@/utils/csvExport';
import { resolveExportSelection } from '@/utils/selectionExport';

import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';

defineOptions({ name: 'SerpDownloadButton' });

const props = defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();

const exportButtonRef = ref(null);

const entityType = computed(() => store.getters.entityType);
const exportMode = computed(() => entityConfigs[entityType.value]?.exportMode || 'async');

const formattedResultsCount = computed(() => {
  const count = props.resultsObject?.meta?.count;
  return count ? filters.toPrecision(count) : '0';
});

const exportSelection = computed(() => resolveExportSelection(store.state.selection));
const isSelectionScopedDownload = computed(
  () => exportMode.value === 'async' && exportSelection.value.scoped
);

const tooltipText = computed(() =>
  isSelectionScopedDownload.value
    ? `Export ${exportSelection.value.count} selected ${filters.pluralize(entityType.value, exportSelection.value.count)}`
    : `Export ${formattedResultsCount.value} ${filters.pluralize(entityType.value, 2)}`
);

const snackbar = (val) => store.commit('snackbar', val);

function handleDownloadClick() {
  if (exportMode.value === 'client') {
    handleClientSideExport();
  } else {
    exportButtonRef.value?.openExportDialog();
  }
}

async function handleClientSideExport() {
  const config = entityConfigs[entityType.value];
  const columns = config?.exportColumns;
  if (!columns) return;

  snackbar('Exporting...');

  const params = { mailto: 'ui@openalex.org' };
  if (route.query.filter) params.filter = route.query.filter;
  if (route.query.search) params.search = route.query.search;
  if (route.query.sort) params.sort = route.query.sort;

  const date = new Date().toISOString().split('T')[0];
  const filename = `openalex_${entityType.value}_${date}.csv`;

  try {
    const count = await exportToCsv({
      url: `${urlBase.api}/${entityType.value}`,
      params,
      columns,
      filename,
      perPage: 200,
      maxPages: 10,
      axiosOptions: {},
    });
    snackbar(`Exported ${count} ${entityType.value}.`);
  } catch (e) {
    console.error('Client-side export failed:', e);
    snackbar('Export failed. Please try again.');
  }
}
</script>
