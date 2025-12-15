<template>
  <div :class="{
      'results-table': true, 
      'works-query': querySubjectEntity === 'works' || query.show_underlying_works, 
      'works-first': uiVariant === 'sentence-worksfirst'
    }"
  >
    <div>
      <!-- Results Table -->
      <Table ref="resultsTable" :class="['mx-8', 'mb-5', {'dimmed': hasQueryChanged}]">
        <TableHeader>
          <TableRow>
            <!-- Render all headers based on their type -->
            <TableHead 
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
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click="clickSelectAllButton">
                    <CheckSquare v-if="isEveryRowSelected" class="h-4 w-4" />
                    <Square v-else-if="selectedIds.length === 0" class="h-4 w-4" />
                    <MinusSquare v-else class="h-4 w-4" />
                  </Button>
                </span>
              </template>
              
              <!-- Column adder header -->
              <template v-else-if="header.id === 'columnAdder'">
                <query-column-adder mode="dialog" :display="header.display" />
              </template>
              
              <!-- Regular data column header -->
              <template v-else>
                <div class="flex">
                  <div v-if="header.type === 'number' && !header.isDate" class="flex-1" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" class="px-0 whitespace-nowrap">
                        <template v-if="submittedQuery.sort_by_column === header.id">
                          <ArrowDown v-if="submittedQuery.sort_by_order==='desc'" class="h-4 w-4" />
                          <ArrowUp v-if="submittedQuery.sort_by_order==='asc'" class="h-4 w-4" />
                        </template>
                        <Filter v-if="getActiveFilters(header.id).length > 0" class="h-3 w-3" />
                        {{ filters.titleCase(header.displayNameForColumn || header.displayName) }}
                        <ChevronDown class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                      <!-- Active Filters-->
                      <template v-if="getActiveFilters(header.id).length">
                        <div
                          v-for="(filterInfo, index) in getActiveFilters(header.id)"
                          :key="`filter-${index}`"
                          class="flex items-center px-2 py-1"
                        >
                          <Filter class="h-4 w-4 mr-2 text-muted-foreground" />
                          <QueryFilterValueChip
                            :column-config="header"
                            :value="filterInfo.value"
                          />
                          <Button variant="ghost" size="icon" class="h-6 w-6 ml-auto" @click="removeColumnFilter(filterInfo.targetKey, filterInfo.path)">
                            <X class="h-4 w-4" />
                          </Button>
                        </div>
                      </template>

                      <!-- Add Filter -->
                      <DropdownMenuItem v-if="canAddColumnFilter(header.id)" @click="addColumnFilter(header.id)">
                        <FilterIcon class="h-4 w-4 mr-2" />
                        Add Filter
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <!-- Remove -->
                      <DropdownMenuItem @click="removeColumn(header.id)">
                        <Columns class="h-4 w-4 mr-2" />
                        Remove Column
                      </DropdownMenuItem>
                      <template v-if="header.actions?.includes('sort')">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="commitSortBy({column_id: header.id, direction: 'desc'})">
                          <ArrowDown class="h-4 w-4 mr-2" />
                          Sort Descending
                          <Check v-if="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'desc'" class="h-4 w-4 ml-auto" />
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="commitSortBy({column_id: header.id, direction: 'asc'})">
                          <ArrowUp class="h-4 w-4 mr-2" />
                          Sort Ascending
                          <Check v-if="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'asc'" class="h-4 w-4 ml-auto" />
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </template>
            </TableHead>
          </TableRow>
        </TableHeader>
      
        <TableBody v-if="!queryIsCompleted || isSearchCanceled || queryBackendError">
          <TableRow class="search-controls-row">
            <TableCell colspan="100">
              <results-error v-if="queryBackendError" />
              <results-searching v-else-if="!queryIsCompleted" />
            </TableCell>
          </TableRow>
        </TableBody>

        <TableBody v-else>
          <!-- Row Selection Message -->
          <TableRow class="selection-message"
            v-if="isEveryRowSelected && rows.length < resultsMeta?.count"
          >
            <TableCell colspan="100">
              <template v-if="isEntireSearchSelected">
                All <span class="font-bold mx-1">{{ filters.millify(resultsMeta?.count) }}</span> results are selected.
                <Button variant="link" size="sm" @click="unselectAll">Clear selection</Button>
              </template>
              <template v-else>
                All <span class="font-bold">{{ selectedIds.length }}</span> results on this page are selected.
                <Button variant="link" size="sm" @click="isEntireSearchSelected = true">
                  Select all {{ filters.millify(resultsMeta?.count) }} results
                </Button>
              </template>
            </TableCell>
          </TableRow>
          
          <!-- Results Rows -->
          <template v-if="rows.length">
            <TableRow
              v-for="(row, i) in rows"
              :key="'row-'+i"
              class="cursor-pointer hover:bg-muted/50"
              @click.exact="onClickRow(row.id)"
              @click.meta.stop="onMetaClickRow(row.id)"
            >
              <TableCell
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
                  <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="toggleSelectedId(row.id)">
                    <CheckSquare v-if="selectedIds.includes(row.id)" class="h-4 w-4" />
                    <Square v-else class="h-4 w-4" />
                  </Button>
                </template>
                
                <!-- Column adder cell (empty) -->
                <template v-else-if="cell.config && cell.config.id === 'columnAdder'">
                  <!-- Empty cell -->
                </template>
                
                <!-- Regular data cell -->
                <template v-else>
                  <column-value :property="cell"/>
                </template>
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow class="search-controls-row no-results">
              <TableCell colspan="100">
                No results found for this query.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>

      <Card class="more-results-message p-5 border-t text-center text-sm text-muted-foreground"
        v-if="!hasQueryChanged && resultsMeta?.count > 100 && query.value && query.value.get_rows !== 'summary'"
      >
        To view results beyond the first 100, download the full results set above.
      </Card>

    </div>

    <!-- Correction Dialog -->
    <Dialog v-model:open="isCorrectionDialogOpen">
      <DialogContent class="max-w-[500px]">
        <correction-create :ids="selectedIds" @close="isCorrectionDialogOpen = false"/>
      </DialogContent>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';

import { CheckSquare, Square, MinusSquare, ArrowDown, ArrowUp, Filter, ChevronDown, X, Columns, Check } from 'lucide-vue-next';
const FilterIcon = Filter;

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { entity } from "@/entity";
import { getColumnConfig } from "@/oaxConfigs";
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

const onClickRow = (rowId) => { 
  const entityType = query.value.show_underlying_works ? "works" : querySubjectEntity.value;
  console.log("onClickRow", rowId, entityType);
  const fullEntityId = entity.fullId(rowId, entityType);
  setZoomId(fullEntityId);
};

const onMetaClickRow = (rowId) => {
  const entityType = query.value.show_underlying_works ? "works" : querySubjectEntity.value;
  const fullEntityId = entity.fullId(rowId, entityType);
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

const canAddColumnFilter = (filterKey) => {
  const columnConfig = getColumnConfig(querySubjectEntity.value, filterKey);
  const canAddFilter = columnConfig.actions?.includes("filter");
  console.log("canAddColumnFilter", filterKey, columnConfig, canAddFilter);
  return canAddFilter;
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
  min-height: 50px;
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