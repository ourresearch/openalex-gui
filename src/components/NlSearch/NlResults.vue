<template>
  <!-- What, then how (oxjob #1744, Jason 2026-10-21): a calculation's answer has two tabs,
       its Groups (Chart | Table) and the Works they're counted from (List | Table); a plain
       list is only works (List | Table). Tabs for what, a small toggle for how, as Notion,
       Airtable and GitHub Projects do (and #1745's records-and-groups research). Switching
       never re-runs the query; every view reads the same response. -->
  <div class="nl-results">
    <div class="nl-results-bar">
      <v-tabs
        v-if="isPipeline"
        :model-value="tab"
        density="compact"
        color="primary"
        class="nl-tabs"
        @update:model-value="setTab"
      >
        <v-tab value="groups" class="text-none nl-tab">{{ groupsLabel }}</v-tab>
        <v-tab value="works" class="text-none nl-tab">{{ worksLabel }}</v-tab>
      </v-tabs>
      <span v-else class="nl-results-count">{{ countLabel }}</span>
      <v-spacer />
      <!-- One toggle per tab (keyed), so neither ever holds the other's value. -->
      <v-btn-toggle
        v-if="tab === 'groups'"
        key="groups"
        :model-value="how"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="nl-format-toggle"
        @update:model-value="setHow"
      >
        <v-btn value="chart" size="small" class="text-none" prepend-icon="mdi-chart-bar">Chart</v-btn>
        <v-btn value="table" size="small" class="text-none" prepend-icon="mdi-table">Table</v-btn>
      </v-btn-toggle>
      <v-btn-toggle
        v-else
        key="works"
        :model-value="how"
        mandatory
        density="compact"
        variant="outlined"
        divided
        class="nl-format-toggle"
        @update:model-value="setHow"
      >
        <v-btn value="list" size="small" class="text-none" prepend-icon="mdi-format-list-bulleted">List</v-btn>
        <v-btn value="table" size="small" class="text-none" prepend-icon="mdi-table">Table</v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="searchError" />

    <!-- Groups as a chart: #1745's component (it picks the best chart and offers the others). -->
    <v-card v-else-if="tab === 'groups' && how === 'chart'" variant="outlined" class="bg-white nl-chart-card">
      <component
        :is="chartComponent"
        v-if="chartComponent && resultsObject"
        :oql="shownOql"
        :results-object="resultsObject"
        :drillable="isPipeline"
        @drill="onDrill"
      />
      <div v-else-if="!chartComponent" class="nl-empty">
        <v-icon size="28" class="mb-2" color="grey">mdi-chart-box-outline</v-icon>
        <div>Charts are coming later today.</div>
      </div>
    </v-card>

    <!-- Groups as a table: groups and calculated columns. It heads itself with the count. -->
    <oql-pipeline-results v-else-if="tab === 'groups'" :results-object="resultsObject" />

    <!-- A list of things: today's table and list rows. (A calculation's Works tab is below.) -->
    <v-card v-else-if="!isPipeline" variant="outlined" class="bg-white">
      <div class="results-card-head d-flex align-center">
        <v-spacer />
        <serp-download-button :results-object="resultsObject" class="ml-1" />
        <add-column v-if="how === 'table'" :entity-type="entityType">
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
        v-if="resultsObject?.results && how === 'table'"
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

    <!-- A calculation's works: mounted the first time the tab opens, then kept, so moving
         between Groups and Works, or List and Table, never refetches them. -->
    <v-card
      v-if="isPipeline && !searchError && worksOpened"
      v-show="tab === 'works'"
      variant="outlined"
      class="bg-white"
    >
      <nl-works-list
        :results-object="resultsObject"
        :drill="drill"
        :mode="view.works"
        @clear-drill="drill = null"
        @filter-column="onColumnFilter"
      />
    </v-card>

    <add-filter v-if="tab === 'works' && how === 'table'" ref="columnFilterRef" headless />
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
import { chartLoader, DEFAULT_VIEW } from '@/components/NlSearch/nlChart';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import AddFilter from '@/components/Filter/AddFilter.vue';
import AddColumn from '@/components/Results/Table/AddColumn.vue';
import SerpResultsKebab from '@/components/Serp/SerpResultsKebab.vue';
import SerpDownloadButton from '@/components/Serp/SerpDownloadButton.vue';
import OqlPipelineResults from '@/components/Serp/OqlPipelineResults.vue';
import NlWorksList from '@/components/NlSearch/NlWorksList.vue';

defineOptions({ name: 'NlResults' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
  // {tab: 'groups' | 'works', groups: 'chart' | 'table', works: 'list' | 'table'} (nlChart.js).
  view: { type: Object, default: () => ({ ...DEFAULT_VIEW }) },
});
const emit = defineEmits(['update:view']);

const store = useStore();
const route = useRoute();

const chartComponent = chartLoader ? defineAsyncComponent(chartLoader) : null;

const entityType = computed(() => store.getters.entityType);
const shownOql = computed(() => store.getters.shownOql || route.query.oql || '');
const isPipeline = computed(() => isPipelineResponse(props.resultsObject));
const inOqlMode = computed(() => !!store.getters.featureFlags['oql'] && !!route.query.oql);

// The open tab (a plain list has only Works, whatever tab a calculation left open) and its format.
const tab = computed(() => (isPipeline.value && props.view.tab === 'groups' ? 'groups' : 'works'));
const how = computed(() => (tab.value === 'groups' ? props.view.groups : props.view.works));
const HOWS = { groups: ['chart', 'table'], works: ['list', 'table'] };
function setTab(t) {
  if (HOWS[t] && t !== props.view.tab) emit('update:view', { ...props.view, tab: t });
}
function setHow(h) {
  if (HOWS[tab.value].includes(h)) emit('update:view', { ...props.view, [tab.value]: h });
}

// List vs table also picks the classic route's page size (url.getPerPage); keep the store
// in step, session-only, as the Basic/Advanced modes do.
watch(how, (f) => {
  store.commit('setSerpResultsView', { value: f === 'table' ? 'table' : 'list', persist: false });
}, { immediate: true });

// A calculation's tabs carry its counts: "24 groups" (no count when there are no splits, just
// one number) and "12.3K works", the works the groups are counted from.
const groupsLabel = computed(() => {
  const meta = props.resultsObject?.meta || {};
  if (!(meta.splits || []).length) return 'Groups';
  const n = meta.groups_count ?? 0;
  return `${n.toLocaleString()} ${n === 1 ? 'group' : 'groups'}`;
});
const worksLabel = computed(() => {
  const n = props.resultsObject?.meta?.count || 0;
  return `${filters.toPrecision(n)} ${n === 1 ? 'work' : 'works'}`;
});

const countLabel = computed(() => {
  const meta = props.resultsObject?.meta;
  if (!meta) return '';
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

// A group clicked in the chart: the Works tab shows that group's works until it's cleared
// or the answer changes. A new answer unmounts an unopened Works tab, so it never fetches
// works nobody looks at.
const drill = ref(null);
const worksOpened = ref(false);
watch(tab, (t) => { if (t === 'works') worksOpened.value = true; }, { immediate: true });
watch(() => props.resultsObject, () => {
  drill.value = null;
  worksOpened.value = tab.value === 'works';
});
function onDrill(d) {
  drill.value = d;
  emit('update:view', { ...props.view, tab: 'works', works: 'list' });
}

const columnFilterRef = ref(null);
function onColumnFilter(baseKey) {
  columnFilterRef.value?.openForKey(baseKey);
}
</script>

<style scoped>
.nl-results-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin: 14px 0 8px;
}
.nl-results-count {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
.nl-format-toggle {
  height: 32px !important;
}
.nl-tabs {
  flex: 0 1 auto;
  min-width: 0;
}
.nl-tab {
  letter-spacing: normal;
  font-size: 14px;
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
