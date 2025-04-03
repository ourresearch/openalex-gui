<template>
  <div :class="{
      'results-table': true, 
      'works-query': querySubjectEntity === 'works' || query.show_underlying_works, 
      'works-first': uiVariant === 'sentence-worksfirst'
    }"
  >
    <!-- Results Header / Actions -->
    <div class="results-table-controls pa-2" v-if="uiVariant === 'side'">      
      <div v-if="!hasQueryChanged" class="d-flex flex-grow-1 align-center ml-3">
        <v-btn icon @click="clickSelectAllButton">
          <v-icon>{{ selectAllIcon }}</v-icon>
        </v-btn>

        <v-btn icon :disabled="!selectedIds.length" @click="exportResults">
          <v-icon>mdi-tray-arrow-down</v-icon>
        </v-btn>

        <template v-if="userId">
          <label-menu :selectedIds="fullSelectedIds" />

          <v-btn v-if="querySubjectEntity === 'works'" icon :disabled="!selectedIds.length"
            @click="snackbar('Submitting data corrections will be coming soon.')">
            <v-icon>mdi-pencil-outline</v-icon>
          </v-btn>
        </template>
        
        <v-spacer/>
        
        <div class="body-2 px-4">
          1-{{ resultsBody.length }} of {{
            resultsMeta?.count > 10000 ? "about " : ""
          }}{{ resultsMeta?.count | toPrecision }}
          results
        </div>
      </div>
    </div>

    <div>
      <!-- Results Table -->
      <v-simple-table ref="resultsTable" :class="['mx-6', 'mb-5', {'dimmed': hasQueryChanged}]">
        <thead>
          <!-- Render all headers based on their type -->
          <th 
            v-for="(header, i) in headers" 
            :key="'header-'+i"
            :class="[
              header.type === 'ui-action' ? 'ui-action' : 'data-type-' + header.type, 
              { 
                'is-date': header.isDate, 
                'metric': (header.id && header.id.includes('(')) || header.id === 'columnAdderMetric'
              }
            ]"
          >
            <!-- Empty placeholder header -->
            <template v-if="header.id === 'placeholder'">&nbsp;</template>
            
            <!-- Selector header -->
            <template v-else-if="header.id === 'selector'">
              <span v-if="uiVariant !== 'side'">
                <v-btn icon @click="clickSelectAllButton">
                  <v-icon>{{ selectAllIcon }}</v-icon>
                </v-btn>
              </span>
            </template>
            
            <!-- Column adder header -->
            <template v-else-if="header.id === 'columnAdderData' || header.id === 'columnAdderMetric'">
              <query-column-adder mode="dialog" :display="header.display" />
            </template>
            
            <!-- Regular data column header -->
            <template v-else>
              <div class="d-flex">
                <v-spacer v-if="header.type === 'number' && !header.isDate"></v-spacer>
                <v-menu offset-y>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      text
                      v-on="on"
                      style="white-space: nowrap;"
                      class="px-0"
                    >
                      <template v-if="submittedQuery.sort_by_column === header.id">
                        <v-icon v-if="submittedQuery.sort_by_order==='desc'" small>mdi-arrow-down</v-icon>
                        <v-icon v-if="submittedQuery.sort_by_order==='asc'" small>mdi-arrow-up</v-icon>
                      </template>
                      <v-icon v-if="getActiveFilters(header.id).length > 0" x-small>mdi-filter</v-icon>
                      {{ (header.displayNameForColumn || header.displayName) | titleCase }}
                      <v-icon small>mdi-menu-down</v-icon>
                    </v-btn>
                  </template>

                  <v-list dense>
                    <!-- Active Filters-->
                    <template v-if="getActiveFilters(header.id).length">
                      <v-list-item
                        v-for="(filterInfo, index) in getActiveFilters(header.id)"
                        :key="`filter-${index}`"
                      >
                        <v-list-item-icon class="align-self-center">
                          <v-icon >mdi-filter-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-content>
                          <QueryFilterValueChip
                            :column-config="header"
                            :value="filterInfo.value"
                          />
                        </v-list-item-content>
                        <v-list-item-action>
                          <v-btn icon @click="removeColumnFilter(filterInfo.targetKey, filterInfo.path)">
                            <v-icon>mdi-close</v-icon>
                          </v-btn>
                        </v-list-item-action> 
                      </v-list-item>
                    </template>

                    <!-- Add Filter -->
                    <v-list-item @click="addColumnFilter(header.id)">
                      <v-list-item-icon>
                        <v-icon>mdi-filter-plus-outline</v-icon>
                      </v-list-item-icon>
                      <v-list-item-title>Add Filter</v-list-item-title>
                    </v-list-item>

                    <v-divider/>

                    <!-- Remove -->
                    <v-list-item @click="removeColumn(header.id)">
                      <v-list-item-icon>
                        <v-icon>mdi-table-column-remove</v-icon>
                      </v-list-item-icon>
                      <v-list-item-title>Remove Column</v-list-item-title>
                    </v-list-item>
                    <template v-if="header.actions?.includes('sort')">
                      <v-divider/>
                      <v-list-item
                        active-class="primary--text"
                        :input-value="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'desc'"
                        @click="commitSortBy({column_id: header.id, direction: 'desc'})"
                      >
                        <v-list-item-icon>
                          <v-icon>mdi-arrow-down</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Sort Descending</v-list-item-title>
                      </v-list-item>
                      <v-list-item
                        @click="commitSortBy({column_id: header.id, direction: 'asc'})"
                        active-class="primary--text"
                        :input-value="submittedQuery.sort_by_column === header.id && submittedQuery.sort_by_order === 'asc'"
                      >
                        <v-list-item-icon>
                          <v-icon>mdi-arrow-up</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>Sort Ascending</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </th>
        </thead>
      
        <tbody v-if="isSearchCanceled || !queryIsCompleted">
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
                All <span class="font-weight-bold mx-1">{{ resultsMeta?.count | millify }}</span> results are selected.
                <v-btn
                  text
                  small
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
                  text
                  small
                  color="primary"
                  rounded
                  @click="isEntireSearchSelected = true"
                >
                  Select all {{ resultsMeta?.count | millify }} results
                </v-btn>
              </template>
            </td>
          </tr>
          
          <!-- Results Rows -->
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
                  'metric': (cell.config.id && cell.config.id.includes('(')) || cell.config.id === 'columnAdderMetric'
                }
              ]"
            >
              <!-- Placeholder cell -->
              <template v-if="cell.config && cell.config.id === 'placeholder'">
                &nbsp;
              </template>
              
              <!-- Selector cell -->
              <template v-else-if="cell.config && cell.config.id === 'selector'">
                <v-btn icon @click.stop="toggleSelectedId(row.id)">
                  <v-icon v-if="selectedIds.includes(row.id)">mdi-checkbox-marked</v-icon>
                  <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
                </v-btn>
              </template>
              
              <!-- Column adder cell (empty) -->
              <template v-else-if="cell.config && (cell.config.id === 'columnAdderData' || cell.config.id === 'columnAdderMetric')">
                <!-- Empty cell -->
              </template>
              
              <!-- Regular data cell -->
              <template v-else>
                <column-value :property="cell"/>
              </template>
            </td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-card class="more-results-message" flat v-if="!hasQueryChanged && resultsMeta?.count > 100 && this.query.get_rows !== 'summary'">
        To view results beyond the first 100, download the full results set above.
      </v-card>

    </div>

    <!-- Correction Dialog -->
    <v-dialog v-model="isCorrectionDialogOpen" width="500">
      <correction-create :ids="selectedIds" @close="isCorrectionDialogOpen = false"/>
    </v-dialog>

    <!-- Query Return Dialog -->
    <v-dialog scrollable v-model="isPropSelectorDialogOpen">
      <v-card flat rounded>
        <query-return @close="isPropSelectorDialogOpen = false"/>
      </v-card>
    </v-dialog>

  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {entity} from "@/entity";
import * as oaxSearch from "@/oaxSearch";

import ColumnValue from "@/components/ColumnValue.vue";
import LabelMenu from "@/components/Label/LabelMenu.vue";
import CorrectionCreate from "@/components/CorrectionCreate.vue";
import DownloadDialog from "@/components/Download/DownloadDialog.vue";
import QueryReturn from "@/components/Query/QueryReturn.vue";
import QuerySearchControls from "@/components/Query/QuerySearchControls.vue";
import QueryColumnAdder from "@/components/Query/QueryColumnAdder.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import QueryFilterValueChip from '../Query/QueryFilterValueChip.vue'; // Import the component

export default {
  name: "ResultsTable",
  components: {
    ResultsError,
    ResultsSearching,
    ColumnValue,
    LabelMenu,
    CorrectionCreate,
    QueryReturn,
    DownloadDialog,
    QuerySearchControls,
    QueryColumnAdder,
    QueryFilterValueChip, // Register the component
  },
  props: {
    apiUrl: String,
  },
  data() {
    return {
      selectedIds: [],
      isEntireSearchSelected: false,
      zoomId: null,
      isPropSelectorDialogOpen: false,
      isCorrectionDialogOpen: false,
      isDownloadDialogOpen: false,
      columnSearch: "",
    }
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "resultsMeta",
      "resultsHeader",
      "resultsBody",
      "submittedQuery",
      "hasQueryChanged",
      "isSearchCanceled",
      "queryIsCompleted",
      "queryBackendError",
      "queryColumnsConfigs",
      "querySubjectEntity",
      "querySubjectEntityConfig",
    ]),
    headers() {
      if (!this.resultsHeader.length) { 
        // Return a single placeholder header when there are no results
        return [{ id: 'placeholder', type: 'ui-action'}]; 
      }

      const result = [{ id: 'selector', type: 'ui-action'}]; // Start with a selector column

      const dataColumns = this.resultsHeader.slice();
      
      // Find first metric column index
      const firstMetricIndex = dataColumns.findIndex(col => col.id && col.id.includes('('));
      const hasMetricColumns = firstMetricIndex !== -1;
      
      // Add data columns with column adders in appropriate positions
      if (hasMetricColumns) {
        // Add non-metric columns
        result.push(...dataColumns.slice(0, firstMetricIndex));
        
        // Add data column adder before first metric column if not in summary mode
        if (this.query.get_rows !== 'summary') {
          result.push({
            id: 'columnAdderData',
            type: 'ui-action',
            display: 'data'
          });
        }
        
        // Add metric columns
        result.push(...dataColumns.slice(firstMetricIndex));
        
        // Add metric column adder at the end
        result.push({
          id: 'columnAdderMetric',
          type: 'ui-action',
          display: 'metrics'
        });
      } else {
        // No metric columns, just add all columns
        result.push(...dataColumns);
        
        // Add data column adder at the end if not in summary mode
        if (this.query.get_rows !== 'summary') {
          result.push({
            id: 'columnAdderData',
            type: 'ui-action',
            display: 'data'
          });
        }
      }
      
      // Apply sorting if needed (for worksfirst variant)
      if (false && this.uiVariant === 'sentence-worksfirst') {
        result.sort((a, b) => {
          // Always keep selector at the beginning
          if (a.id === 'selector') return -1;
          if (b.id === 'selector') return 1;
          
          const aHas = a.id.includes("(") || a.id === "columnAdderMetric" || false;
          const bHas = b.id.includes("(") || b.id === "columnAdderMetric" || false;
          
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return 0; // Keep original order if both have or both don't have parentheses
        });
      }
      return result;
    },
    rows() {
      return this.resultsBody.map(row => {
        // Create basic cells with configs
        let dataCells = row.cells.map((cell, i) => ({
          ...cell,
          config: this.resultsHeader[i],
        }));
        
        // Find first metric cell index
        const firstMetricIndex = dataCells.findIndex(cell => cell.config?.id?.includes('('));
        const hasMetricCells = firstMetricIndex !== -1;
        
        // Create final cells array with UI action cells
        const finalCells = [{ type: 'ui-action', config: { id: 'selector' }}];
        
        // Add data cells with column adders in appropriate positions
        if (hasMetricCells) {
          // Add non-metric cells
          finalCells.push(...dataCells.slice(0, firstMetricIndex));
          
          // Add data column adder cell before first metric cell if not in summary mode
          if (this.query.get_rows !== 'summary') {
            finalCells.push({
              type: 'ui-action',
              config: { id: 'columnAdderData' }
            });
          }
          // Add metric cells
          finalCells.push(...dataCells.slice(firstMetricIndex));
          // Add metric column adder cell at the end
          finalCells.push({type: 'ui-action', config: { id: 'columnAdderMetric' }});
        } else {
          // No metric cells, just add all cells
          finalCells.push(...dataCells);
          
          // Add data column adder at the end if not in summary mode
          if (this.query.get_rows !== 'summary') {
            finalCells.push({
              type: 'ui-action',
              config: { id: 'columnAdderData' }
            });
          }
        }
        
        // Apply sorting if needed (for worksfirst variant)
        if (false &&this.uiVariant === 'sentence-worksfirst') {
          finalCells.sort((a, b) => {
            // Always keep selector at the beginning
            if (a.config.id === 'selector') return -1;
            if (b.config.id === 'selector') return 1;
            
            const aHas = a.config.id.includes("(") || a.config.id === "columnAdderMetric" || false;
            const bHas = b.config.id.includes("(") || b.config.id === "columnAdderMetric" || false;
            
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return 0; // Keep original order if both have or both don't have parentheses
          });
        }

        return {
          ...row,
          cellsWithConfigs: finalCells
        };
      });
    },
    hasMetricsColumns() { 
      return this.queryColumnsConfigs.some(col => col.id.includes('('));
    },
    isEveryRowSelected() {
      return this.selectedIds.length > 0 && this.selectedIds.length === this.resultsBody.length;
    },
    selectAllIcon() {
      if (this.isEveryRowSelected) {
        return "mdi-checkbox-marked";
      } else if (this.selectedIds.length === 0) {
        return "mdi-checkbox-blank-outline";
      } else {
        return "mdi-minus-box-outline";
      }
    },
    fullSelectedIds() {
      // Returns selected IDs in full format e.g. "topics/T123" instead of "123"
      const fullIds = this.selectedIds.map(id => entity.fullId(id, this.querySubjectEntity));
      return fullIds;
    },
    columnsToAddFiltered() {
      return this.columnsToAdd.filter(col => {
        return col.displayName.toLowerCase().includes(this.columnSearch.toLowerCase())
      })
    },
    columnsToAdd() {
      console.log(this.submittedQuery);
      return Object.values(this.querySubjectEntityConfig.columns)
        .filter(col => {
          return col.actions?.includes("column");
        })
        .filter(col => {
          return !this.submittedQuery.show_columns.includes(col.id);
        });
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
      "setZoomId",
    ]),
    ...mapMutations("search", [
      "addReturnColumn",
      "deleteReturnColumn",
      "setSortBy",
      "setMetricsColumnPercentage",
      "setSelectedIds",
      "setEntireSearchSelected",
    ]),
    ...mapActions("search", [
      "createSearch",
      "resetToSubmittedQuery",
      "addFilter",
      "deleteFilterByPath", // Map the new action
    ]),
    ...mapActions("user", [
      "createCollection",
    ]),
    cancelSearch() {
      this.resetToSubmittedQuery();
    },
    commitSortBy(sortBy) {
      this.setSortBy(sortBy);
      this.createSearch();
    },
    addSelectedId(id) {
      this.selectedIds.push(id);
    },
    removeSelectedId(id) {
      this.selectedIds = this.selectedIds.filter((i) => i !== id);
    },
    toggleSelectedId(id) {
      //console.log("toggleSelectedId", id);
      if (this.selectedIds.includes(id)) {
        this.removeSelectedId(id);
      } else {
        this.addSelectedId(id);
      }
    },
    unselectAll(){
      this.selectedIds = [];
      this.isEntireSearchSelected = false;
    },
    clickSelectAllButton() {
      this.isEntireSearchSelected = false;
      if (this.selectedIds.length === 0) {
        this.selectedIds = this.resultsBody.map((row) => row.id);
      } else {
        this.unselectAll();
      }
    },
    addColumnFilter(filterKey, filterValue) {
      const filterGroup = this.querySubjectEntity === "works" || this.query.show_underlying_works ? "works" : "entity";
      this.addFilter({filterGroup, filterKey, filterValue});
    },
    clickRow(rowId) {
      console.log("clickRow", rowId);
      this.setZoomId(entity.fullId(rowId, this.querySubjectEntity));
    },
    metaClickRow(rowId) {
      const newTab = window.open(this.apiUrl);
      setTimeout(() => {
        newTab.focus();
      }, 1000);
      return false;
    },
    removeColumn(id) {
      this.deleteReturnColumn(id);
      this.createSearch();
    },
    addColumn(id) {
      this.addReturnColumn(id);
      this.createSearch();
    },
    exportResults() {
      if (this.isEntireSearchSelected) {
        this.isDownloadDialogOpen = true;
      } else {
        this.exportSelectedAsCsv();
      }
    },
    exportSelectedAsCsv() {
      const selectedRows = this.resultsBody.filter(row => this.selectedIds.includes(row.id));
      const csv = oaxSearch.jsonToCsv(this.resultsHeader, selectedRows);
      const blob = new Blob([csv], {type: "text/csv"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selected.csv";
      a.click();
    },
    getActiveFilters(columnId) {
      const activeFiltersWithPath = [];
      const entityType = this.entity || this.querySubjectEntity;
      const targetKey = entityType === 'works' ? 'filter_works' : 'filter_aggs';
      const filtersToSearch = this.query[targetKey];


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
    },
    removeColumnFilter(targetKey, path) {
      this.deleteFilterByPath({ targetKey, path });
    },

    measureMetricColumns() {
      if (true || !this.uiVariant || !this.uiVariant.includes("sentence")) { return; }
        
      this.$nextTick(() => {
        const table = this.$refs.resultsTable.$el;
        const metricHeaders = Array.from(table.querySelectorAll('th.metric'));
        
        if (!metricHeaders.length) return;

        const totalWidth = table.getBoundingClientRect().width;
        let metricsWidth = metricHeaders.reduce((sum, th) => 
          sum + th.getBoundingClientRect().width, 0
        );

        let metricPercent = (metricsWidth / totalWidth) * 100;
        const MIN_METRIC_PERCENT = 40;

        if (metricPercent < MIN_METRIC_PERCENT) {
          const requiredMetricsWidth = (MIN_METRIC_PERCENT / 100) * totalWidth;
          const LAST_COLUMN_WIDTH = 36;
          
          // Always set the last column to fixed width
          const lastMetricHeader = metricHeaders[metricHeaders.length - 1];
          lastMetricHeader.style.width = `${LAST_COLUMN_WIDTH}px`;
          
          if (metricHeaders.length > 1) {
            // For other metric columns, distribute remaining width evenly
            const remainingWidth = requiredMetricsWidth - LAST_COLUMN_WIDTH;
            const widthPerOtherColumn = remainingWidth / (metricHeaders.length - 1);
            
            metricHeaders.slice(0, -1).forEach(th => {
              th.style.width = `${widthPerOtherColumn}px`;
            });
          } else {
            // If there's only one metric column, it gets the minimum required width
            lastMetricHeader.style.width = `${requiredMetricsWidth}px`;
          }

          // Verify the new total width meets minimum
          metricsWidth = metricHeaders.reduce((sum, th) => 
            sum + th.getBoundingClientRect().width, 0
          );
          metricPercent = (metricsWidth / totalWidth) * 100;
        }

        metricPercent = Math.max(parseFloat(metricPercent.toFixed(2)), MIN_METRIC_PERCENT);
        this.setMetricsColumnPercentage(metricPercent);
      });
    },
    handleResize: _.debounce(function() {
      this.measureMetricColumns();
    }, 5),
  },
  created() {
   //console.log(this.rows);
  },
  mounted() {
    this.measureMetricColumns();
    window.addEventListener('resize', this.handleResize);
  },
  updated() {
    this.measureMetricColumns();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
    selectedIds: {
      handler(newIds) {
        this.setSelectedIds(newIds);
      },
      deep: true
    },
    isEntireSearchSelected: {
      handler(value) {
        this.setEntireSearchSelected(value);
      },
      deep: true
    }
  }
}
</script>


<style lang="scss">
.selection-message {
  font-size: 14px;
  line-height: 22px;
  background-color: #f5f5f5;
}
.results-box .selection-message {
  padding: 10px 10px;
}
table {
  border-top: none;
  border-collapse: separate !important;
}
th {
  border-bottom: 3px solid;
  border-color: var(--v-catEntityDarker-base);
  background-color: var(--v-catEntity-base);
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
  border-color: var(--v-catWorksDarker-base);
  background-color: var(--v-catWorks-base);
}
.results-table td {
  border-color: var(--v-catEntityDarker-base);
}
.results-table.works-query td {
  border-color: var(--v-catWorksDarker-base);
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
  border-color: var(--v-catWorksDarker-base);
}
td:not(.metric) + td.metric,
.results-box th:not(.metric) + th.metric {
  border-left: 3px solid var(--v-catWorksDarker-base);
}
tr:last-child td {
  border-bottom-width: 3px;
  border-bottom-style: solid;
}
.metric {
  width: 130px;
}
/*
.works-first th:first-child,
.works-first td:first-child {
  border-color: var(--v-catWorksDarker-base);
  border-left-width: 3px;
  border-bottom-width: 3px;
  border-bottom-style: solid;
}
.works-first th:first-child {
  background-color: var(--v-catWorks-base);
}
.works-first th:last-child {
  background-color: var(--v-catEntity-base);
}
.works-first.works-query th:last-child {
  background-color: var(--v-catWorks-base);
}
.works-first th:last-child,
.works-first td:last-child {
  border-color: var(--v-catEntityDarker-base);
  border-right-width: 3px;
  border-bottom-width: 3px;
  border-bottom-style: solid;
}
.works-first.works-query th:last-child,
.works-first.works-query td:last-child {
  border-color: var(--v-catWorksDarker-base);
}
.works-first td:first-child,
.works-first td:last-child {
  background-color: transparent;
}
.works-first td:not(.metric) + td.metric,
.results-box .works-first th:not(.metric) + th.metric {
  border-left: none;
}
.works-first td.metric + td:not(.metric),
.results-box .works-first th.metric + th:not(.metric) {
  border-left: 3px solid var(--v-catEntityDarker-base);
  padding-left: 15px !important;
}
*/
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
.more-results-message {
  padding: 20px;
  border-top: 1px #ddd solid;
  text-align: center;
  font-size: 15px;
  color: #666;
}
</style>