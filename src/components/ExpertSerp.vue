<template>
  <v-container fluid class="pt-0">
    <!-- Desktop two-column layout -->
    <template v-if="mdAndUp">
      <serp-right-toolbar
        :results-object="resultsObject"
        :show-oql="showOql"
        style="margin-top: 14px; margin-bottom: 6px;"
        @toggle-oql="toggleOql"
      />
      <v-row>
        <v-col :cols="url.isTableView($route) ? 9 : 6">
          <search-box style="width: 100%;" class="mb-4" />

          <!-- #378 C3: a complex (non-flat) OQL query → card instead of chips. -->
          <complex-query-card v-if="isComplexQuery" class="mb-4" @view-oql="showOql = true" />
          <!-- Filters: no filters available, or normal -->
          <div v-else-if="!hasFiltersAvailable" class="d-flex align-center mb-4" style="min-height: 40px; margin-left: 20px;">
            <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
          </div>
          <template v-else>
            <template v-if="effectiveFilterMode === 'basic'">
              <div class="d-flex align-center ga-1 mb-4">
                <div class="flex-grow-1">
                  <novice-filter-chips />
                </div>
                <filter-style-menu :filter-mode="effectiveFilterMode" :basic-disabled="!basicRepresentable" @set-mode="setFilterMode" />
              </div>
            </template>
            <filter-list v-else class="mt-0 mb-4">
              <template #toolbar-append>
                <filter-style-menu :filter-mode="effectiveFilterMode" :basic-disabled="!basicRepresentable" @set-mode="setFilterMode" />
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
              @filter-column="onColumnFilter"
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
          <!-- Read-only "Show as OQL" render of the current query (oxjob #346),
               at the top of the right column. Flag-gated + toggled via the kebab. -->
          <serp-oql-panel v-if="oqlFlag && showOql" />
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

      <!-- Headless filter value-picker driven by the table column header's
           "Filter by this…". Renders nothing until openForKey() opens it on the
           targeted property's value-picking step (oxjob #295 Phase 5). -->
      <add-filter v-if="isTableView" ref="columnFilterRef" headless />
    </template>

    <!-- Fallback: stacked layout (mobile) -->
    <template v-else>
      <serp-right-toolbar
        :results-object="resultsObject"
        :show-oql="showOql"
        style="margin-top: 14px; margin-bottom: 6px;"
        @toggle-oql="toggleOql"
      />
      <div class="d-flex justify-center mb-4 mt-2">
        <search-box style="max-width: 800px; width: 100%;" />
      </div>

      <!-- Read-only "Show as OQL" render (oxjob #346), flag-gated + kebab-toggled. -->
      <div v-if="oqlFlag && showOql" class="mx-auto mb-4" style="max-width: 800px; width: 100%;">
        <serp-oql-panel />
      </div>

      <!-- Mobile: filter chips/list + toggle -->
      <div class="mx-auto" style="max-width: 800px; width: 100%;">
        <!-- #378 C3: a complex (non-flat) OQL query → card instead of chips. -->
        <complex-query-card v-if="isComplexQuery" class="mb-4" @view-oql="showOql = true" />
        <!-- Filters: no filters available, or normal -->
        <div v-else-if="!hasFiltersAvailable" class="d-flex align-center mb-4" style="min-height: 40px; margin-left: 20px;">
          <span class="text-body-2" style="color: rgba(0,0,0,0.38);">No filters available</span>
        </div>
        <template v-else>
          <template v-if="effectiveFilterMode === 'basic'">
            <div class="d-flex align-center ga-1 mb-4">
              <div class="flex-grow-1">
                <novice-filter-chips />
              </div>
              <filter-style-menu :filter-mode="effectiveFilterMode" :basic-disabled="!basicRepresentable" @set-mode="setFilterMode" />
            </div>
          </template>
          <filter-list v-else class="mt-0 mb-4">
            <template #toolbar-append>
              <filter-style-menu :filter-mode="effectiveFilterMode" :basic-disabled="!basicRepresentable" @set-mode="setFilterMode" />
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

  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
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
import GroupByViews from '@/components/GroupByViews.vue';
import FilterList from '@/components/Filter/FilterList.vue';
import AddFilter from '@/components/Filter/AddFilter.vue';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import ComplexQueryCard from '@/components/ComplexQueryCard.vue';
import NoviceSortButton from '@/components/NoviceSortButton.vue';
import SerpRightToolbar from '@/components/SerpRightToolbar.vue';
import SerpOqlPanel from '@/components/SerpOqlPanel.vue';
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
const { mdAndUp } = useDisplay();

const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const isTableView = computed(() => url.isTableView(route));
const entityType = computed(() => store.getters.entityType);

// Read-only "Show as OQL" panel (oxjob #346), behind the `oql` feature flag.
// We own + persist the toggle here and pass it to the kebab in SerpRightToolbar.
const oqlFlag = computed(() => !!store.getters.featureFlags['oql']);
const showOql = ref(localStorage.getItem('serp-show-oql') === '1');
function toggleOql() {
  showOql.value = !showOql.value;
  localStorage.setItem('serp-show-oql', showOql.value ? '1' : '0');
}

// "Filter by this…" from a table column header opens the headless AddFilter on
// the property's value-picking step, reusing the canonical filter UI verbatim.
const columnFilterRef = ref(null);
function onColumnFilter(baseKey) {
  columnFilterRef.value?.openForKey(baseKey);
}

// Master "select all on page" checkbox — shown in the header row for list view
// (the table view renders its own master checkbox in the table header).
const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();

const entityDisplayName = computed(() => entityConfigs[entityType.value]?.displayName || entityType.value);
const resultsCount = computed(() => props.resultsObject?.meta?.count);
// Number of rows the user has ticked (handles select-all mode). Surfaced in the
// header so the count reflects the selection, not just the total (ZD #8373).
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
const hasFiltersAvailable = computed(() => {
  return facetConfigs(entityType.value).some(c => c.actions?.includes('filter'));
});
// #378 C3: an OQL-submit query with no flat oxurl form (nested/cross-field
// logic) — the server omits meta.x_query.url. Chips can't represent it, so the
// chip region shows a "too complex — view as OQL" card instead.
const isComplexQuery = computed(() => {
  const xq = props.resultsObject?.meta?.x_query;
  return !!route.query.oql && !!xq && xq.url == null;
});
// Filter mode: basic (chips) or advanced (FilterList). `filterMode` is the user's
// stored PREFERENCE; `effectiveFilterMode` is what's actually shown — basic is
// only honored when it can faithfully represent the whole query (#353 round 4).
const filterMode = ref(localStorage.getItem('serp-filter-mode') || 'basic');

// Whether the basic chip view can losslessly show the current query. When false
// the SERP forces advanced mode and the Basic toggle is disabled (a chip can't
// represent a repeated field, an un-chip-able field, or a negated entity/range —
// see basicCanRepresent). Re-evaluates reactively, so basic re-enables the moment
// the query simplifies (e.g. the user removes the offending filter in advanced).
const basicRepresentable = computed(() =>
  basicCanRepresent(entityType.value, filtersFromUrlStr(entityType.value, route.query.filter))
);
const effectiveFilterMode = computed(() =>
  basicRepresentable.value ? filterMode.value : 'advanced'
);

function setFilterMode(newMode) {
  // Basic is unavailable for queries it can't represent — ignore the request
  // (the menu item is disabled too, this is just belt-and-suspenders).
  if (newMode === 'basic' && !basicRepresentable.value) return;
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
