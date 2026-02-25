<template>
  <v-container fluid class="pt-0">
    <!-- Desktop two-column layout -->
    <template v-if="mdAndUp">
      <serp-right-toolbar :results-object="resultsObject" style="margin-top: 14px; margin-bottom: 6px;" />
      <v-row>
        <v-col cols="6">
          <search-box style="width: 100%;" class="mb-4" />

          <!-- Filters: basic chips with gear, or advanced FilterList with gear in its toolbar -->
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

          <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />

          <!-- Results card -->
          <v-card variant="outlined" class="bg-white" style="margin-top: 84px;">
            <!-- Results header -->
            <div class="d-flex align-center mb-1 pa-4 pb-0">
              <div class="text-body-2 text-medium-emphasis flex-grow-1">
                <template v-if="!resultsObject?.meta">
                </template>
                <template v-else-if="isSemanticSearch">
                  50 most semantically similar works
                </template>
                <template v-else-if="resultsObject.meta.count === 0">
                  There are no results for this search.
                </template>
                <template v-else>
                  About {{ filters.toPrecision(resultsObject.meta.count) }} {{ filters.pluralize(entityType, 2) }}
                </template>
              </div>
              <novice-sort-button />
            </div>

            <v-divider />

            <!-- Results list -->
            <div v-if="resultsObject?.results" class="results-container px-4">
              <serp-results-list-item
                v-for="result in resultsObject.results"
                :key="result.id"
                :result="result"
              />
            </div>

            <!-- No results -->
            <div
              v-if="resultsObject?.meta?.count === 0"
              class="text-medium-emphasis text-center py-8"
            >
              Try adjusting your search or filters.
            </div>

            <!-- Pagination -->
            <v-pagination
              v-if="showPagination"
              class="pb-8 pt-4"
              rounded
              active-color="primary"
              v-model="page"
              :length="numPages"
              :total-visible="7"
            />
          </v-card>
        </v-col>
        <v-col cols="6">
          <template v-if="isSemanticSearch">
            <div class="d-flex align-center justify-center text-body-2" style="color: rgba(0,0,0,0.3); margin-top: calc(50vh - 200px);">
              <v-icon size="18" class="mr-2">mdi-information-outline</v-icon>
              Semantic search doesn't support faceting.
            </div>
          </template>
          <group-by-views v-else-if="url.isViewSet($route, 'report')" :results-object="resultsObject" hide-toolbar hide-results-count hide-more />
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
        <!-- Filters: basic chips with gear, or advanced FilterList with gear in its toolbar -->
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
      </div>

      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <!-- Mobile: stacked results -->
      <div class="mx-auto" style="max-width: 800px; width: 100%;">
        <v-card variant="outlined" class="bg-white" style="margin-top: 84px;">
          <!-- Results header -->
          <div class="d-flex align-center mb-1 pa-4 pb-0">
            <div class="text-body-2 text-medium-emphasis flex-grow-1">
              <template v-if="!resultsObject?.meta">
              </template>
              <template v-else-if="isSemanticSearch">
                50 most semantically similar works
              </template>
              <template v-else-if="resultsObject.meta.count === 0">
                There are no results for this search.
              </template>
              <template v-else>
                About {{ filters.toPrecision(resultsObject.meta.count) }} {{ filters.pluralize(entityType, 2) }}
              </template>
            </div>
            <novice-sort-button />
          </div>
          <v-divider />

          <div v-if="resultsObject?.results" class="px-4">
            <serp-results-list-item
              v-for="result in resultsObject.results"
              :key="result.id"
              :result="result"
            />
          </div>
          <div
            v-if="resultsObject?.meta?.count === 0"
            class="text-medium-emphasis text-center py-8"
          >
            Try adjusting your search or filters.
          </div>
          <v-pagination
            v-if="showPagination"
            class="pb-8 pt-4"
            rounded
            active-color="primary"
            v-model="page"
            :length="numPages"
            :total-visible="7"
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
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr, filtersAsUrlStr } from '@/filterConfigs';
import { getFacetConfig } from '@/facetConfigUtils';

import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
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
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const entityType = computed(() => store.getters.entityType);
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
const numPages = computed(() => {
  const count = props.resultsObject?.meta?.count || 0;
  const perPage = url.getPerPage();
  return Math.min(Math.ceil(count / perPage), 10);
});

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
</script>
