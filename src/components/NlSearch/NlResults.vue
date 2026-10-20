<template>
  <!-- The answer in three formats (oxjob #1744): Table, List, Chart. Switching formats never
       re-runs the query; each format reads the same response. -->
  <div class="nl-results">
    <div class="nl-results-bar">
      <!-- The calculation table heads itself with the same count (and the price). -->
      <span v-if="!(isPipeline && format === 'table')" class="nl-results-count">{{ countLabel }}</span>
      <v-spacer />
      <v-btn-toggle
        :model-value="format"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="nl-format-toggle"
        @update:model-value="(f) => emit('update:format', f)"
      >
        <v-btn value="table" size="small" class="text-none" prepend-icon="mdi-table">Table</v-btn>
        <v-btn value="list" size="small" class="text-none" prepend-icon="mdi-format-list-bulleted">List</v-btn>
        <v-btn value="chart" size="small" class="text-none" prepend-icon="mdi-chart-bar">Chart</v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="searchError" />

    <!-- Chart: #1745's component (it picks the best chart and offers the others). -->
    <v-card v-else-if="format === 'chart'" variant="outlined" class="bg-white nl-chart-card">
      <component
        :is="chartComponent"
        v-if="chartComponent && resultsObject"
        :oql="shownOql"
        :results-object="resultsObject"
      />
      <div v-else-if="!chartComponent" class="nl-empty">
        <v-icon size="28" class="mb-2" color="grey">mdi-chart-box-outline</v-icon>
        <div>Charts are coming later today.</div>
      </div>
    </v-card>

    <!-- A calculation: groups and calculated columns. -->
    <template v-else-if="isPipeline">
      <oql-pipeline-results v-if="format === 'table'" :results-object="resultsObject" />
      <v-card v-else variant="outlined" class="bg-white">
        <nl-group-list :results-object="resultsObject" />
      </v-card>
    </template>

    <!-- A list of things: today's table and list rows. -->
    <v-card v-else variant="outlined" class="bg-white">
      <div class="results-card-head d-flex align-center">
        <v-spacer />
        <serp-download-button :results-object="resultsObject" class="ml-1" />
        <add-column v-if="format === 'table'" :entity-type="entityType">
          <template #activator="{ props: colBtnProps }">
            <v-btn v-bind="colBtnProps" icon variant="text" size="small" class="ml-1" aria-label="Edit columns">
              <v-icon size="20" color="grey-darken-1">mdi-view-column-outline</v-icon>
              <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">Edit columns</v-tooltip>
            </v-btn>
          </template>
        </add-column>
        <serp-results-kebab class="ml-1" />
      </div>
      <v-divider />

      <results-table
        v-if="resultsObject?.results && format === 'table'"
        :results-object="resultsObject"
        :entity-type="entityType"
        @filter-column="onColumnFilter"
      />
      <div v-else-if="resultsObject?.results" class="results-container">
        <serp-results-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          :result="result"
        />
      </div>

      <div v-if="resultsObject?.meta?.count === 0" class="nl-empty">
        Nothing matches. Loosen the query, or ask the chat to broaden it.
      </div>

      <sliding-pagination
        v-if="showPagination"
        v-model="page"
        class="pb-8 pt-4"
        :count="resultsObject?.meta?.count || 0"
        :per-page="url.getPerPage()"
      />
    </v-card>

    <add-filter v-if="format === 'table'" ref="columnFilterRef" headless />
  </div>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { entityConfigs } from '@/entityConfigs';
import { isPipelineResponse } from '@/oqlPipeline';
import { useSelectionContext } from '@/composables/useSelectionContext';
import { chartLoader } from '@/components/NlSearch/nlChart';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import AddFilter from '@/components/Filter/AddFilter.vue';
import AddColumn from '@/components/Results/Table/AddColumn.vue';
import SerpResultsKebab from '@/components/Serp/SerpResultsKebab.vue';
import SerpDownloadButton from '@/components/Serp/SerpDownloadButton.vue';
import OqlPipelineResults from '@/components/Serp/OqlPipelineResults.vue';
import NlGroupList from '@/components/NlSearch/NlGroupList.vue';

defineOptions({ name: 'NlResults' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
  format: { type: String, default: 'list' },
});
const emit = defineEmits(['update:format']);

const store = useStore();
const route = useRoute();

const chartComponent = chartLoader ? defineAsyncComponent(chartLoader) : null;

const entityType = computed(() => store.getters.entityType);
const shownOql = computed(() => store.getters.shownOql || route.query.oql || '');
const isPipeline = computed(() => isPipelineResponse(props.resultsObject));
const inOqlMode = computed(() => !!store.getters.featureFlags['oql'] && !!route.query.oql);

// List vs table also picks the classic route's page size (url.getPerPage); keep the store
// in step, session-only, as the Basic/Advanced modes do.
watch(() => props.format, (f) => {
  store.commit('setSerpResultsView', { value: f === 'table' ? 'table' : 'list', persist: false });
}, { immediate: true });

const countLabel = computed(() => {
  const meta = props.resultsObject?.meta;
  if (!meta) return '';
  if (isPipeline.value) {
    const groups = meta.groups_count;
    const from = `${filters.toPrecision(meta.count || 0)} ${meta.count === 1 ? 'work' : 'works'}`;
    if (!(meta.splits || []).length) return `Calculated over ${from}`;
    return `${(groups ?? 0).toLocaleString()} groups, from ${from}`;
  }
  const count = meta.count;
  if (count === 0) return 'No results';
  const name = entityConfigs[entityType.value]?.displayName || entityType.value;
  const formatted = filters.toPrecision(count);
  const about = Number(String(formatted).replace(/,/g, '')) !== count ? 'about ' : '';
  return `${about}${formatted} ${name}`;
});

const showPagination = computed(() => (props.resultsObject?.meta?.count || 0) > url.getPerPage());
const page = computed({
  get() {
    return props.resultsObject?.meta?.page ?? 1;
  },
  set(val) {
    if (inOqlMode.value) {
      store.dispatch('query/setPage', { page: val, perPage: url.getPerPage() });
      return;
    }
    url.setPage(val === 1 ? undefined : val);
  },
});

useSelectionContext(() => props.resultsObject);

const columnFilterRef = ref(null);
function onColumnFilter(baseKey) {
  columnFilterRef.value?.openForKey(baseKey);
}
</script>

<style scoped>
.nl-results-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 8px;
}
.nl-results-count {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
.nl-format-toggle {
  height: 32px !important;
}
.nl-chart-card {
  min-height: 420px;
  padding: 12px;
}
.nl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 16px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 14px;
}
.nl-chart-card .nl-empty {
  min-height: 380px;
}
.results-card-head {
  padding: 4px 8px;
  min-height: 44px;
}
</style>
