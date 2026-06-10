<template>
  <div class="serp-input-container">
    <!-- Top-right cluster: admin dice + mode selector, OUTSIDE the search box,
         aligned to the column's right margin. -->
    <div class="d-flex align-center mb-2">
      <v-spacer />
      <serp-dice-button class="mr-1" />
      <serp-mode-menu
        :model-value="mode"
        :basic-disabled="!canUseSimple"
        @update:model-value="onModeSelect"
      />
    </div>

    <!-- Per-mode input -->
    <template v-if="mode === 'simple' || mode === 'old'">
      <search-box single-row style="width: 100%;" class="mb-4" />

      <search-error-alert v-if="searchError" :message="searchError" class="mb-4" />

      <complex-query-card v-if="isComplexQuery" class="mb-4" @view-oql="onModeSelect('oql')" />
      <div v-else-if="!hasFiltersAvailable" class="d-flex align-center mb-4" style="min-height: 40px; margin-left: 20px;">
        <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
      </div>
      <template v-else>
        <novice-filter-chips v-if="showChips" />
        <filter-list v-else class="mt-0 mb-4" />
      </template>
    </template>

    <template v-else-if="mode === 'builder'">
      <oql-query-builder
        :key="oqlComponentKey"
        :seed-oql="seedOql"
        :entity="entityType"
        :show-header="false"
        :inline-run="false"
        run-label="Run"
        @run="onOqlRun"
      />
      <search-error-alert v-if="searchError" :message="searchError" class="mb-4 mt-4" />
    </template>

    <template v-else-if="mode === 'oql'">
      <oql-query-editor
        :key="oqlComponentKey"
        :seed-oql="seedOql"
        :show-header="false"
        :show-snippets="false"
        :show-preview="false"
        :inline-run="false"
        run-label="Run"
        @run="onOqlRun"
      />
      <search-error-alert v-if="searchError" :message="searchError" class="mb-4 mt-4" />
    </template>

    <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />

    <!-- Results header row (same content as today, plus the new ⋮ kebab) -->
    <div v-if="!searchError" class="d-flex align-center pl-1 pb-2" style="margin-top: 32px;">
      <v-checkbox-btn
        v-if="!isTableView"
        class="results-header-checkbox mr-1"
        density="compact"
        :model-value="masterChecked"
        :indeterminate="masterIndeterminate"
        @update:model-value="onMasterClick"
      />
      <span class="text-body-2 text-medium-emphasis">{{ resultsCountLabel }}</span>
      <v-spacer />
      <collection-action-menu
        :entity-type="entityType"
        :selected-ids="effectiveSelectedIds"
        :enumeration-blocked="enumerationBlocked"
        class="ml-1"
        @applied="onCollectionsApplied"
      />
      <novice-sort-button class="ml-1" />
      <serp-results-kebab :results-object="resultsObject" class="ml-1" />
    </div>

    <selection-banner v-if="!searchError" class="mb-2" />

    <v-card v-if="!searchError" variant="outlined" class="bg-white">
      <results-table
        v-if="resultsObject?.results && isTableView"
        :results-object="resultsObject"
        :entity-type="entityType"
        @filter-column="onColumnFilter"
      />

      <div v-else-if="resultsObject?.results" class="results-container">
        <serp-results-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          :result="result"
          selectable
        />
      </div>

      <div
        v-if="resultsObject?.meta?.count === 0"
        class="text-medium-emphasis text-center py-8"
      >
        Try adjusting your search or filters.
      </div>

      <sliding-pagination
        v-if="showPagination"
        class="pb-8 pt-4"
        v-model="page"
        :count="resultsObject?.meta?.count || 0"
        :per-page="url.getPerPage()"
      />
    </v-card>

    <add-filter v-if="isTableView" ref="columnFilterRef" headless />

    <!-- Lossy mode-switch warning -->
    <v-dialog v-model="lossyDialog.open" max-width="440">
      <v-card rounded>
        <v-card-title>Switch to {{ lossyDialog.label }}?</v-card-title>
        <v-card-text>
          This query uses advanced logic that {{ lossyDialog.label }} mode can't fully
          represent. Switching may drop part of your query.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded @click="lossyDialog.open = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="confirmLossySwitch">Switch anyway</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr } from '@/filterConfigs';
import { basicCanRepresent } from '@/components/Filter/basicFilterMode';
import { entityConfigs } from '@/entityConfigs';
import { facetConfigs } from '@/facetConfigs';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import SelectionBanner from '@/components/SelectionBanner.vue';
import CollectionActionMenu from '@/components/Collection/CollectionActionMenu.vue';
import { useSelectionContext } from '@/composables/useSelectionContext';
import { useMasterSelection } from '@/composables/useMasterSelection';
import FilterList from '@/components/Filter/FilterList.vue';
import AddFilter from '@/components/Filter/AddFilter.vue';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import ComplexQueryCard from '@/components/ComplexQueryCard.vue';
import NoviceSortButton from '@/components/NoviceSortButton.vue';
import SerpApiEditor from '@/components/SerpApiEditor.vue';
import SearchBox from '@/components/SearchBox.vue';
import SearchErrorAlert from '@/components/SearchErrorAlert.vue';
import SerpDiceButton from '@/components/SerpDiceButton.vue';
import SerpModeMenu from '@/components/Serp/SerpModeMenu.vue';
import SerpResultsKebab from '@/components/Serp/SerpResultsKebab.vue';
import OqlQueryBuilder from '@/components/Oql/OqlQueryBuilder.vue';
import OqlQueryEditor from '@/components/Oql/OqlQueryEditor.vue';

defineOptions({ name: 'SerpInputContainer' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const entityType = computed(() => store.getters.entityType);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const isTableView = computed(() => url.isTableView(route));

// ---- mode ('simple' | 'old' | 'builder' | 'oql') --------------------------
const MODES = ['simple', 'old', 'builder', 'oql'];
const explicitMode = computed(() =>
  MODES.includes(route.query.mode) ? route.query.mode : null
);
// Default = Simple for a flat query; Builder when the URL carries ?oql= or the
// query is too complex for basic chips and no explicit ?mode= is set. Explicit
// ?mode= always wins.
const mode = computed(() => {
  if (explicitMode.value) return explicitMode.value;
  if (route.query.oql || !basicRepresentable.value) return 'builder';
  return 'simple';
});
// Simple is available only when the query can be shown as basic chips: not a
// complex (non-URL-expressible) ?oql= query, AND the flat filters are
// chip-representable. A complex ?oql= query keeps the filter param empty, so the
// filter-only check alone would wrongly report it representable (#440).
const canUseSimple = computed(() => !isComplexQuery.value && basicRepresentable.value);
// Simple shows chips; Old shows the legacy FilterList. A "simple" selection on a
// non-representable query falls back to the advanced list (Simple is disabled in
// the menu, but a stale ?mode=simple URL could still land here).
const showChips = computed(() => mode.value === 'simple' && canUseSimple.value);

function onModeSelect(newMode) {
  if (newMode === mode.value) return;
  // Warn before a lossy switch: leaving an advanced (?oql=, non-URL-expressible)
  // query for a chip/list mode that can't represent it.
  const goingToSimpleOrOld = newMode === 'simple' || newMode === 'old';
  const lossy = goingToSimpleOrOld
    && !!route.query.oql
    && props.resultsObject?.meta?.x_query
    && props.resultsObject.meta.x_query.url == null;
  if (lossy) {
    lossyDialog.open = true;
    lossyDialog.target = newMode;
    lossyDialog.label = newMode === 'simple' ? 'Simple' : 'Old';
    return;
  }
  applyMode(newMode);
}

const lossyDialog = reactive({ open: false, target: null, label: '' });
function confirmLossySwitch() {
  lossyDialog.open = false;
  if (lossyDialog.target) applyMode(lossyDialog.target);
}

function applyMode(newMode) {
  url.pushToRoute(router, {
    name: 'Serp',
    params: { entityType: entityType.value },
    query: { ...route.query, mode: newMode },
  });
}

// ---- OQL seeding for Builder / OQL modes ----------------------------------
const QUERY_KEYS = [
  'filter', 'sort',
  'search', 'search.exact', 'search.semantic',
  'search.title', 'search.title.exact',
  'search.title_and_abstract', 'search.title_and_abstract.exact',
];
const queryParams = computed(() => {
  const q = {};
  for (const k of QUERY_KEYS) if (route.query[k]) q[k] = route.query[k];
  return q;
});
const queryObject = computed(() => store.getters.queryObject);
// The OQL to hand the builder/editor: the live ?oql= if present, else the
// server-translated OQL of the current chip/URL query.
const seedOql = computed(() => route.query.oql || queryObject.value?.oql || '');
// Remount the builder/editor when the seed changes (mode switch / new query) so
// they re-seed cleanly; user edits don't change the seed, so no mid-edit remount.
const oqlComponentKey = computed(() => `${mode.value}:${seedOql.value}`);

function refreshQueryObject() {
  // Builder/editor seed straight from ?oql= when present; otherwise translate the
  // live URL query so seedOql is ready when the user switches into those modes.
  if (route.query.oql) return;
  store.dispatch('fetchQueryObject', {
    entityType: entityType.value,
    query: queryParams.value,
  });
}
watch([entityType, () => JSON.stringify(queryParams.value)], refreshQueryObject);
onMounted(refreshQueryObject);

function onOqlRun(oql) {
  const trimmed = (oql || '').trim();
  if (!trimmed) return;
  store.commit('setOqlSubmitError', null);
  // Run via the existing Serp.vue ?oql= submit path; keep the current mode so the
  // user stays in Builder/OQL after running.
  url.pushToRoute(router, {
    name: 'Serp',
    params: { entityType: entityType.value },
    query: { oql: trimmed, mode: mode.value },
  });
}

// ---- filters / representability -------------------------------------------
const hasFiltersAvailable = computed(() =>
  facetConfigs(entityType.value).some((c) => c.actions?.includes('filter'))
);
const isComplexQuery = computed(() => {
  const xq = props.resultsObject?.meta?.x_query;
  return !!route.query.oql && !!xq && xq.url == null;
});
const basicRepresentable = computed(() =>
  basicCanRepresent(entityType.value, filtersFromUrlStr(entityType.value, route.query.filter))
);

// ---- results header / counts ----------------------------------------------
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();
const columnFilterRef = ref(null);
function onColumnFilter(baseKey) {
  columnFilterRef.value?.openForKey(baseKey);
}

const entityDisplayName = computed(
  () => entityConfigs[entityType.value]?.displayName || entityType.value
);
const selectedCount = computed(() => store.getters['selection/selectedCount']);
const resultsCountLabel = computed(() => {
  if (!props.resultsObject?.meta) return '';
  if (isSemanticSearch.value) return '50 most semantically similar works';
  const count = props.resultsObject.meta.count;
  if (count === 0) return 'There are no results for this search.';
  const formatted = filters.toPrecision(count);
  const isRounded = Number(formatted.replace(/,/g, '')) !== count;
  const prefix = isRounded ? 'about ' : '';
  const base = `${prefix}${formatted} ${entityDisplayName.value}`;
  if (selectedCount.value > 0) {
    return `${selectedCount.value.toLocaleString()} selected of ${base}`;
  }
  return base;
});

// ---- pagination -----------------------------------------------------------
const showPagination = computed(
  () => (props.resultsObject?.meta?.count || 0) > url.getPerPage()
);
const page = computed({
  get() {
    return props.resultsObject?.meta?.page ?? 1;
  },
  set(val) {
    url.setPage(val === 1 ? undefined : val);
  },
});

useSelectionContext(() => props.resultsObject);

// ---- collections wiring ----------------------------------------------------
const selection = computed(() => store.state.selection);
const effectiveSelectedIds = computed(() => {
  const s = selection.value;
  if (s.selectAllMode) {
    const excluded = new Set(s.excludedIds);
    return s.loadedIds.filter((id) => !excluded.has(id));
  }
  return [...s.selectedIds];
});
const enumerationBlocked = computed(() => {
  const s = selection.value;
  return s.selectAllMode && s.totalCount > s.loadedIds.length;
});
function onCollectionsApplied() {
  store.commit('selection/deselectAll');
}
watch(
  () => props.resultsObject?.results,
  () => {
    store.commit('collections/clearPageCollections');
  }
);
</script>

<style scoped>
.results-header-checkbox {
  flex: 0 0 auto;
  width: auto;
}
</style>
