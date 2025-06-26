<template>
  <div :class="{
      'results-table': true, 
      'works-query': querySubjectEntity === 'works' || query.show_underlying_works, 
      'works-first': uiVariant === 'sentence-worksfirst'
    }"
  >
    <div>
      <!-- Results Table -->
      <v-table ref="resultsTable" :class="['mx-8', 'mb-5', {'dimmed': hasQueryChanged}]">
        <thead>
          <!-- Render all headers based on their type -->
          <th 
            v-for="(header, i) in headers" 
            :key="'header-'+i"
            :class="[
              header.type === 'ui-action' ? 'ui-action' : 'data-type-' + header.type, 
              { 
                'is-date': header.isDate, 
                'metric': (header.id && header.id.includes('(')) || header.display === 'metrics'
              }
            ]"
          >
            <!-- Empty placeholder header -->
            <template v-if="header.id === 'placeholder'">&nbsp;</template>
            
            <!-- Selector header -->
            <template v-else-if="header.id === 'selector'">
              <span v-if="uiVariant !== 'side'">
                <v-btn icon variant="plain" @click="clickSelectAllButton">
                  <v-icon>{{ selectAllIcon }}</v-icon>
                </v-btn>
              </span>
            </template>
            
            <!-- Column adder header -->
            <template v-else-if="header.id === 'columnAdder'">
              <query-column-adder mode="dialog" :display="header.display" />
            </template>
            
            <!-- Regular data column header -->
            <template v-else>
              <div class="d-flex">
                <v-spacer v-if="header.type === 'number' && !header.isDate" />
                <v-menu location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      variant="text"
                      v-bind="props"
                      style="white-space: nowrap;"
                      class="px-0"
                    >
                      <template v-if="submittedQuery.sort_by_column === header.id">
                        <v-icon v-if="submittedQuery.sort_by_order==='desc'" size="small">mdi-arrow-down</v-icon>
                        <v-icon v-if="submittedQuery.sort_by_order==='asc'" size="small">mdi-arrow-up</v-icon>
                      </template>
                      <v-icon v-if="getActiveFilters(header.id).length > 0" size="x-small">mdi-filter-outline</v-icon>
                      {{ filters.titleCase(header.displayNameForColumn || header.displayName) }}
                      <v-icon size="small">mdi-menu-down</v-icon>
                    </v-btn>
                  </template>

                  <v-list density="compact">
                    <!-- Active Filters-->
                    <template v-if="getActiveFilters(header.id).length">
                      <v-list-item
                        v-for="(filterInfo, index) in getActiveFilters(header.id)"
                        :key="`filter-${index}`"
                      >
                        <template #prepend>
                          <v-icon class="align-self-center">mdi-filter-outline</v-icon>
                        </template>
                        
                        <QueryFilterValueChip
                          :column-config="header"
                          :value="filterInfo.value"
                        />
                        
                        <v-list-item-action>
                          <v-btn icon @click="removeColumnFilter(filterInfo.targetKey, filterInfo.path)">
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </v-list-item-action> 
                      </v-list-item>
                    </template>

                    <!-- Add Filter -->
                    <v-list-item @click="addColumnFilter(header.id)">
                      <template #prepend>
                        <v-icon>mdi-filter-plus-outline</v-icon>
                      </template>
                      <v-list-item-title>Add Filter</v-list-item-title>
                    </v-list-item>

                    <v-divider/>

                    <!-- Remove -->
                    <v-list-item @click="removeColumn(header.id)">
                      <template #prepend>
                        <v-icon>mdi-table-column-remove</v-icon>
                      </template>
                      <v-list-item-title>Remove Column</v-list-item-title>
                    </v-list-item>
                    <template v-if="header.actions?.includes('sort')">
                      <v-divider/>
                      <v-list-item
                        active-class="primary--text"
                        :active="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'desc'"
                        @click="commitSortBy({column_id: header.id, direction: 'desc'})"
                      >
                        <template #prepend>
                          <v-icon>mdi-arrow-down</v-icon>
                        </template>
                        <v-list-item-title>Sort Descending</v-list-item-title>
                      </v-list-item>
                      <v-list-item
                        @click="commitSortBy({column_id: header.id, direction: 'asc'})"
                        active-class="primary--text"
                        :active="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'asc'"
                      >
                        <template #prepend>
                          <v-icon>mdi-arrow-up</v-icon>
                        </template>
                        <v-list-item-title>Sort Ascending</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </th>
        </thead>
      
        <tbody v-if="!queryIsCompleted || isSearchCanceled || queryBackendError">
          <tr class="search-controls-row">
            <td colspan="100%">
              <results-error v-if="queryBackendError" />
              <results-searching v-else-if="!queryIsCompleted" />
            </td>
          </tr>

        </tbody>

        <tbody v-else>
          <!-- Row Selection Message -->
          <tr class="selection-message mx-5"
            v-if="isEveryRowSelected && rows.length < resultsMeta?.count"
          >
            <td colspan="100%">
              <template v-if="isEntireSearchSelected">
                All <span class="font-weight-bold mx-1">{{ filters.millify(resultsMeta?.count) }}</span> results are selected.
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  rounded
                  @click="unselectAll"
                >
                  Clear selection
                </v-btn>
              </template>
              <template v-else>
                All <span class="font-weight-bold">{{ selectedIds.length }}</span> results on this page are selected.
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  rounded
                  @click="isEntireSearchSelected = true"
                >
                  Select all {{ filters.millify(resultsMeta?.count) }} results
                </v-btn>
              </template>
            </td>
          </tr>
          
          <!-- Results Rows -->
          <template v-if="rows.length">
            <tr
              v-for="(row, i) in rows"
              :key="'row-'+i"
              @click.exact="clickRow(row.id)"
              @click.meta.stop="metaClickRow(row.id)"
            >
              <td
                v-for="(cell, i) in row.cellsWithConfigs"
                :key="'cell-'+i"
                class="px-1"
                :class="[
                  cell.type === 'ui-action' ? 'ui-action' : 'data-type-' + cell.config.type, 
                  {
                    'is-date': cell.config.isDate, 
                    'metric': (cell.config.id && cell.config.id.includes('(')) || cell.config.display === 'metrics'
                  }
                ]"
              >
                <!-- Placeholder cell -->
                <template v-if="cell.config && cell.config.id === 'placeholder'">
                  &nbsp;
                </template>
                
                <!-- Selector cell -->
                <template v-else-if="cell.config && cell.config.id === 'selector'">
                  <v-btn icon variant="plain" @click.stop="toggleSelectedId(row.id)">
                    <v-icon v-if="selectedIds.includes(row.id)">mdi-checkbox-marked</v-icon>
                    <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
                  </v-btn>
                </template>
                
                <!-- Column adder cell (empty) -->
                <template v-else-if="cell.config && cell.config.id === 'columnAdder'">
                  <!-- Empty cell -->
                </template>
                
                <!-- Regular data cell -->
                <template v-else>
                  <column-value :property="cell"/>
                </template>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr class="search-controls-row no-results">
              <td colspan="100%">
                No results found for this query.
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>

      <v-card class="more-results-message" flat
        v-if="!hasQueryChanged && resultsMeta?.count > 100 && query.value && query.value.get_rows !== 'summary'"
      >
        To view results beyond the first 100, download the full results set above.
      </v-card>

    </div>

    <!-- Correction Dialog -->
    <v-dialog v-model="isCorrectionDialogOpen" width="500">
      <correction-create :ids="selectedIds" @close="isCorrectionDialogOpen = false"/>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { entity } from "@/entity";
import filters from "@/filters";
import { useResultsTable } from '@/composables/Results/useResultsTable';

import ColumnValue from "@/components/ColumnValue.vue";
import CorrectionCreate from "@/components/CorrectionCreate.vue";
import QueryColumnAdder from "@/components/Query/QueryColumnAdder.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import QueryFilterValueChip from '@/components/Query/QueryFilterValueChip.vue';

defineOptions({ name: "ResultsTable" });

const store = useStore();

// Data properties
const selectedIds = ref([]);
const isEntireSearchSelected = ref(false);
const isCorrectionDialogOpen = ref(false);

// Store getters
const uiVariant = computed(() => store.getters['uiVariant']);

// Search getters
const query = computed(() => store.getters['search/query']);
const submittedQuery = computed(() => store.getters['search/submittedQuery']);
const resultsMeta = computed(() => store.getters['search/resultsMeta']);
const resultsBody = computed(() => store.getters['search/resultsBody']);
const hasQueryChanged = computed(() => store.getters['search/hasQueryChanged']);
const isSearchCanceled = computed(() => store.getters['search/isSearchCanceled']);
const queryIsCompleted = computed(() => store.getters['search/queryIsCompleted']);
const queryBackendError = computed(() => store.getters['search/queryBackendError']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);

const { headers, rows } = useResultsTable();

// Computed properties
const isEveryRowSelected = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length === resultsBody.value.length;
});

const selectAllIcon = computed(() => {
  if (isEveryRowSelected.value) {
    return "mdi-checkbox-marked";
  } else if (selectedIds.value.length === 0) {
    return "mdi-checkbox-blank-outline";
  } else {
    return "mdi-minus-box-outline";
  }
});

// Search mutations & actions
const deleteReturnColumn = (column) => store.commit('search/deleteReturnColumn', column);
const setSortBy = (sortBy) => store.commit('search/setSortBy', sortBy);
const setSelectedIds = (ids) => store.commit('search/setSelectedIds', ids);
const setEntireSearchSelected = (selected) => store.commit('search/setEntireSearchSelected', selected);
const createSearch = () => store.dispatch('search/createSearch');
const addFilter = (filter) => store.dispatch('search/addFilter', filter);
const deleteFilterByPath = (payload) => store.dispatch('search/deleteFilterByPath', payload);

const commitSortBy = (sortBy) => {
  setSortBy(sortBy);
  createSearch();
};

const addSelectedId = (id) => { selectedIds.value.push(id); };
const removeSelectedId = (id) => { selectedIds.value = selectedIds.value.filter((i) => i !== id); };

const toggleSelectedId = (id) => {
  if (selectedIds.value.includes(id)) {
    removeSelectedId(id);
  } else {
    addSelectedId(id);
  }
};

const unselectAll = () => {
  selectedIds.value = [];
  isEntireSearchSelected.value = false;
};

const clickSelectAllButton = () => {
  isEntireSearchSelected.value = false;
  if (selectedIds.value.length === 0) {
    selectedIds.value = resultsBody.value.map((row) => row.id);
  } else {
    unselectAll();
  }
};

const setZoomId = (id) => store.commit('setZoomId', id);

const clickRow = (rowId) => {
  const fullEntityId = entity.fullId(rowId, querySubjectEntity.value);
  setZoomId(fullEntityId);
};

const metaClickRow = (rowId) => {
  const fullEntityId = entity.fullId(rowId, querySubjectEntity.value);
  const newTab = window.open("http://api.openalex.org/" + fullEntityId);
  setTimeout(() => {
    newTab.focus();
  }, 1000);
  return false;
};

const removeColumn = (id) => {
  deleteReturnColumn(id);
  createSearch();
};

const addColumnFilter = (filterKey, filterValue) => {
  const filterGroup = querySubjectEntity.value === "works" || query.value.show_underlying_works ? "works" : "entity";
  addFilter({filterGroup, filterKey, filterValue});
};

const removeColumnFilter = (targetKey, path) => {
  deleteFilterByPath({ targetKey, path });
};

const getActiveFilters = (columnId) => {
  // Finds filters currently applied to columnId
  const activeFiltersWithPath = [];
  const entityType = querySubjectEntity.value;
  const targetKey = entityType === 'works' ? 'filter_works' : 'filter_aggs';
  const filtersToSearch = query.value[targetKey];

  const findFilters = (filters, currentPath) => {
    if (!Array.isArray(filters)) return;

    filters.forEach((filter, index) => {
      const newPath = [...currentPath, index];

      if (filter.filters && Array.isArray(filter.filters)) {
        findFilters(filter.filters, [...newPath, 'filters']);
      } else if (filter.column_id === columnId && filter.value !== undefined) {
        activeFiltersWithPath.push({
          value: filter.value,
          path: newPath,
          targetKey: targetKey
        });
      }
    });
  };

  findFilters(filtersToSearch, []);
  return activeFiltersWithPath;
};

// Lifecycle hooks
onBeforeUnmount(() => {
  setZoomId(null);
});

// Watchers
watch(selectedIds, (newIds) => {
  setSelectedIds(newIds);
}, { deep: true });

watch(isEntireSearchSelected, (value) => {
  setEntireSearchSelected(value);
}, { deep: true });

</script>


<style lang="scss" scoped>
.selection-message {
  font-size: 14px;
  line-height: 22px;
  background-color: #f5f5f5;
}
.results-box .selection-message {
  padding: 10px 10px;
}
table, thead {
  border-top: none !important;
}
th {
  border-bottom: 3px solid;
  border-color: rgb(var(--v-theme-catEntityDarker));
  background-color: rgb(var(--v-theme-catEntity));
}
table th.ui-action,
table td.ui-action {
  width: 40px;
  text-align: center;
}
tr:hover {
  background-color: #f5f5f5 !important;
}
th.metric,
.works-query th {
  border-color: rgb(var(--v-theme-catWorksDarker));
  background-color: rgb(var(--v-theme-catWorks));
}
.results-table td {
  border-color: rgb(var(--v-theme-catEntityDarker));
}
.results-table.works-query td {
  border-color: rgb(var(--v-theme-catWorksDarker));
}
td:first-child, td:last-child {
  border-radius: 0 !important;
}
td:first-child {
  border-left-width: 3px;
  border-left-style: solid;
}
td:last-child {
  border-right-width: 3px;
  border-right-style: solid;
}
.results-box th:first-child {
  border-left-width: 3px;
  border-left-style: solid;
}
.results-box th:first-child {
  border-left: none;
}
td.metric {
  border-color: rgb(var(--v-theme-catWorksDarker));
}
td:not(.metric) + td.metric,
.results-box th:not(.metric) + th.metric {
  border-left: 3px solid rgb(var(--v-theme-catWorksDarker));
}
tr:last-child td {
  border-bottom-width: 3px;
  border-bottom-style: solid;
}
.metric {
  width: 130px;
}
tr:hover .metric {
  background-color: transparent;
}
td.data-type-number {
  text-align: right;
  font-family: monospace;
  font-size: 0.9em;

  &.is-date {
    text-align: unset;
    font-family: unset;
  }
}
th button {
  font-size: 14px !important;
}
a {
  text-decoration: none;
}
.search-controls-row:hover {
  background-color: inherit !important;
}
.dimmed {
  pointer-events: none;
  opacity: 0.4;
  user-select: none;    
}
.no-results {
  text-align: center;
  color: #999;
  height: 300px;
}
.more-results-message {
  padding: 20px;
  border-top: 1px #ddd solid;
  text-align: center;
  font-size: 15px;
  color: #666;
}
</style>