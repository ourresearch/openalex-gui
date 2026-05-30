<template>
  <v-container fluid class="pt-0">
    <!-- Desktop two-column layout -->
    <template v-if="mdAndUp">
      <serp-right-toolbar :results-object="resultsObject" style="margin-top: 14px; margin-bottom: 6px;" />
      <v-row>
        <v-col :cols="url.isTableView($route) ? 9 : 6">
          <search-box style="width: 100%;" class="mb-4" />

          <!-- Filters: no filters available, or normal -->
          <div v-if="!hasFiltersAvailable" class="d-flex align-center mb-4" style="min-height: 40px; margin-left: 20px;">
            <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
          </div>
          <template v-else>
            <template v-if="filterMode === 'basic'">
              <div class="d-flex align-center ga-1 mb-4">
                <div class="flex-grow-1">
                  <novice-filter-chips />
                </div>
                <filter-style-menu :filter-mode="filterMode" @set-mode="setFilterMode" />
              </div>
            </template>
            <filter-list v-else class="mt-0 mb-4">
              <template #toolbar-append>
                <filter-style-menu :filter-mode="filterMode" @set-mode="setFilterMode" />
              </template>
            </filter-list>
          </template>

          <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />

          <!-- Header row above the card.
               List view: [master checkbox] count · spacer · collection · sort.
               Table view: count · spacer · collection · sort (the master
               checkbox + "add column" live in the table's own header row). -->
          <div class="d-flex align-center pl-1 pb-2" style="margin-top: 84px;">
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
          </div>

          <!-- Select-all banner sits between the header row and the card -->
          <selection-banner class="mb-2" />

          <!-- Results card -->
          <v-card variant="outlined" class="bg-white">
            <!-- API error (e.g. wrong-entity-type collection filter, malformed boolean) -->
            <div
              v-if="searchError"
              class="text-error text-body-2 d-flex align-start px-4 py-6"
              role="alert"
            >
              <v-icon size="18" class="mr-2 mt-1" color="error">mdi-alert-circle-outline</v-icon>
              <div>{{ searchError }}</div>
            </div>

            <!-- Results table -->
            <results-table
              v-else-if="resultsObject?.results && isTableView"
              :results-object="resultsObject"
              :entity-type="entityType"
              @add-column="onAddColumn"
            />

            <!-- Results list -->
            <div v-else-if="resultsObject?.results" class="results-container">
              <serp-results-list-item
                v-for="result in resultsObject.results"
                :key="result.id"
                :result="result"
                selectable
              />
            </div>

            <!-- No results -->
            <div
              v-if="!searchError && resultsObject?.meta?.count === 0"
              class="text-medium-emphasis text-center py-8"
            >
              Try adjusting your search or filters.
            </div>

            <!-- Pagination -->
            <sliding-pagination
              v-if="!searchError && showPagination"
              class="pb-8 pt-4"
              v-model="page"
              :count="resultsObject?.meta?.count || 0"
              :per-page="url.getPerPage()"
            />
          </v-card>
        </v-col>
        <v-col :cols="url.isTableView($route) ? 3 : 6">
          <template v-if="isSemanticSearch">
            <div class="d-flex align-center justify-center text-body-2" style="color: rgba(0,0,0,0.3); margin-top: calc(50vh - 200px);">
              <v-icon size="18" class="mr-2">mdi-information-outline</v-icon>
              Semantic search doesn't support faceting.
            </div>
          </template>
          <!-- The group-by/stats rail. Always shown beside results (the old
               `report` show/hide toggle was removed from the UI). -->
          <group-by-views v-else :results-object="resultsObject" hide-toolbar hide-results-count />
        </v-col>
      </v-row>
    </template>

    <!-- Fallback: stacked layout (mobile) -->
    <template v-else>
      <serp-right-toolbar :results-object="resultsObject" style="margin-top: 14px; margin-bottom: 6px;" />
      <div class="d-flex justify-center mb-4 mt-2">
        <search-box style="max-width: 800px; width: 100%;" />
      </div>

      <!-- Mobile: filter chips/list + toggle -->
      <div class="mx-auto" style="max-width: 800px; width: 100%;">
        <!-- Filters: no filters available, or normal -->
        <div v-if="!hasFiltersAvailable" class="d-flex align-center mb-4" style="min-height: 40px; margin-left: 20px;">
          <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
        </div>
        <template v-else>
          <template v-if="filterMode === 'basic'">
            <div class="d-flex align-center ga-1 mb-4">
              <div class="flex-grow-1">
                <novice-filter-chips />
              </div>
              <filter-style-menu :filter-mode="filterMode" @set-mode="setFilterMode" />
            </div>
          </template>
          <filter-list v-else class="mt-0 mb-4">
            <template #toolbar-append>
              <filter-style-menu :filter-mode="filterMode" @set-mode="setFilterMode" />
            </template>
          </filter-list>
        </template>
      </div>

      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <!-- Mobile: stacked results (list only — table view is desktop-only) -->
      <div class="mx-auto" style="max-width: 800px; width: 100%;">
        <!-- Header row above the card: master checkbox · count · spacer · collection · sort -->
        <div class="d-flex align-center pl-1 pb-2" style="margin-top: 84px;">
          <v-checkbox-btn
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
        </div>

        <selection-banner class="mb-2" />

        <v-card variant="outlined" class="bg-white">
          <!-- API error (e.g. wrong-entity-type collection filter, malformed boolean) -->
          <div
            v-if="searchError"
            class="text-error text-body-2 d-flex align-start px-4 py-6"
            role="alert"
          >
            <v-icon size="18" class="mr-2 mt-1" color="error">mdi-alert-circle-outline</v-icon>
            <div>{{ searchError }}</div>
          </div>

          <div v-else-if="resultsObject?.results">
            <serp-results-list-item
              v-for="result in resultsObject.results"
              :key="result.id"
              :result="result"
              selectable
            />
          </div>
          <div
            v-if="!searchError && resultsObject?.meta?.count === 0"
            class="text-medium-emphasis text-center py-8"
          >
            Try adjusting your search or filters.
          </div>
          <sliding-pagination
            v-if="!searchError && showPagination"
            class="pb-8 pt-4"
            v-model="page"
            :count="resultsObject?.meta?.count || 0"
            :per-page="url.getPerPage()"
          />
        </v-card>
      </div>
    </template>

    <!-- Snackbar for filter mode switching -->
    <v-snackbar v-model="filterModeSnackbar" :timeout="4000" location="bottom">
      Some advanced filters were removed when switching to basic mode
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr, filtersAsUrlStr } from '@/filterConfigs';
import { getFacetConfig } from '@/facetConfigUtils';
import { entityConfigs } from '@/entityConfigs';
import { facetConfigs } from '@/facetConfigs';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import ResultsTable from '@/components/Results/ResultsTable.vue';
import SlidingPagination from '@/components/SlidingPagination.vue';
import SelectionBanner from '@/components/SelectionBanner.vue';
import CollectionActionMenu from '@/components/Collection/CollectionActionMenu.vue';
import { useSelectionContext } from '@/composables/useSelectionContext';
import { useMasterSelection } from '@/composables/useMasterSelection';
import GroupByViews from '@/components/GroupByViews.vue';
import FilterList from '@/components/Filter/FilterList.vue';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import NoviceSortButton from '@/components/NoviceSortButton.vue';
import SerpRightToolbar from '@/components/SerpRightToolbar.vue';
import SerpApiEditor from '@/components/SerpApiEditor.vue';
import SearchBox from '@/components/SearchBox.vue';
import FilterStyleMenu from '@/components/FilterStyleMenu.vue';

defineOptions({ name: 'ExpertSerp' });

const props = defineProps({
  resultsObject: Object,
  searchError: String,
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const isTableView = computed(() => url.isTableView(route));
const entityType = computed(() => store.getters.entityType);

// Master "select all on page" checkbox — shown in the header row for list view
// (the table view renders its own master checkbox in the table header).
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();

// Column picker is Phase 4; for now the table's "+" just snackbars its intent.
function onAddColumn() {
  store.commit('snackbar', 'Column picker coming soon.');
}
const entityDisplayName = computed(() => entityConfigs[entityType.value]?.displayName || entityType.value);
const resultsCount = computed(() => props.resultsObject?.meta?.count);
const resultsCountLabel = computed(() => {
  if (!props.resultsObject?.meta) return '';
  if (isSemanticSearch.value) return '50 most semantically similar works';
  const count = props.resultsObject.meta.count;
  if (count === 0) return 'There are no results for this search.';
  const formatted = filters.toPrecision(count);
  const isRounded = Number(formatted.replace(/,/g, '')) !== count;
  const prefix = isRounded ? 'about ' : '';
  return `${prefix}${formatted} ${entityDisplayName.value}`;
});
const hasFiltersAvailable = computed(() => {
  return facetConfigs(entityType.value).some(c => c.actions?.includes('filter'));
});
const filterModeSnackbar = ref(false);

// Filter mode: basic (chips) or advanced (FilterList)
const filterMode = ref(localStorage.getItem('serp-filter-mode') || 'basic');

function facetTypeToChipType(facetConfig) {
  if (facetConfig.type === 'selectEntity') return 'entity';
  if (facetConfig.type === 'boolean') return 'boolean';
  if (facetConfig.type === 'range' && facetConfig.key === 'publication_year') return 'year';
  if (facetConfig.type === 'range') return 'range';
  return null;
}

function setFilterMode(newMode) {
  if (newMode === filterMode.value) return;
  if (newMode === 'basic') {
    // Strip filters that can't be represented as chips
    const currentFilters = filtersFromUrlStr(entityType.value, route.query.filter);
    const compatible = currentFilters.filter(f => {
      const fc = getFacetConfig(entityType.value, f.key);
      return fc && facetTypeToChipType(fc) !== null;
    });
    if (compatible.length < currentFilters.length) {
      const newFilterStr = filtersAsUrlStr(compatible) || undefined;
      const newQuery = { ...route.query, filter: newFilterStr };
      if (!newFilterStr) delete newQuery.filter;
      url.pushToRoute(router, {
        name: route.name,
        params: route.params,
        query: newQuery,
      });
      filterModeSnackbar.value = true;
    }
  }
  filterMode.value = newMode;
  localStorage.setItem('serp-filter-mode', newMode);
}

// Pagination
const showPagination = computed(() => {
  return (props.resultsObject?.meta?.count || 0) > url.getPerPage();
});

const page = computed({
  get() {
    return props.resultsObject?.meta?.page ?? 1;
  },
  set(val) {
    url.setPage(val === 1 ? undefined : val);
  },
});

useSelectionContext(() => props.resultsObject);

// --- Collections feature wiring (Phase 4) -----------------------------------
const selection = computed(() => store.state.selection);

// IDs the user has actually selected on this page. In non-select-all
// mode this is selectedIds verbatim. In select-all mode it's the
// loaded page minus excluded; the "actual" set of all-N-results IDs
// is not enumerable client-side (no list endpoint for arbitrary
// filtered queries) — see `enumerationBlocked` below.
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

// After any CollectionActionMenu add/remove (or Create-and-assign via the dialog
// inside the menu), clear the SERP selection. The per-row collection chips
// refresh themselves via the collections-store `entityMutationCounter` watcher.
function onCollectionsApplied() {
  store.commit('selection/deselectAll');
}

// Reset the per-page collection-membership map (read by CollectionActionMenu's
// row-state computation) on every results change so stale memberships don't
// leak from one page to the next; per-row EntityCollectionsRow instances
// re-populate it as they remount and fetch.
watch(
  () => props.resultsObject?.results,
  () => {
    store.commit('collections/clearPageCollections');
  }
);
</script>

<style scoped>
/* Master checkbox in the header row — trim Vuetify's default control width so
   it sits flush at the left edge, lined up over the per-row checkboxes. */
.results-header-checkbox {
  flex: 0 0 auto;
  width: auto;
}
</style>
