<template>
  <div :class="{'results-table': true, 'works-query': querySubjectEntity === 'works'}">
    <!-- Results Header / Actions -->
    <div class="results-table-controls pa-2" v-if="uiVariant !== 'top'">      
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
      <!-- Row Selection Message -->
      <div class="selection-message py-1 mx-3"
        v-if="isEveryRowSelected && rows.length < resultsMeta?.count"
      >
        <template v-if="isEntireSearchSelected">
          All <span class="font-weight-bold mx-1">{{ resultsMeta?.count | millify }}</span> results are selected.
          <v-btn
            text
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
            color="primary"
            rounded
            @click="isEntireSearchSelected = true"
          >
            Select all {{ resultsMeta?.count | millify }} results
          </v-btn>
        </template>
      </div>

      <!-- Results Table -->
      <v-simple-table class="mx-5 mb-5" ref="resultsTable">
        <thead>
        <th>
          <span v-if="uiVariant === 'top'">
            <v-btn icon @click="clickSelectAllButton">
              <v-icon>{{ selectAllIcon }}</v-icon>
            </v-btn>
          </span>
        </th>
        <!-- Results Table Headers -->
        <th
          v-for="(header, i) in queryColumnsConfigs"
          :key="'header-'+i"
          :class="[
            'data-type-' + header.type, 
            { 'is-date': header.isDate, 'metric': header.id && header.id.includes('(') }
          ]"
        >
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
                  {{ (header.displayNameForColumn || header.displayName) | titleCase }}
                  <v-icon small>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list dense>
                <v-list-item class="pb-2 py-1">
                  <v-list-item-title style="font-family: monospace; font-size: 10px;">{{ header.id }}</v-list-item-title>
                </v-list-item>
                <v-divider/>
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
        </th>

        <!-- Add Column Button -->
        <th key="column-adder" :class="{'metric': hasMetricsColumns}">
          <v-menu rounded max-height="50vh">
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>mdi-plus-circle</v-icon>
              </v-btn>
            </template>
            <v-card flat rounded>
              <v-text-field
                  v-model="columnSearch"
                  filled
                  rounded
                  background-color="white"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  autofocus
                  placeholder="Add Column"
                  style=""
              />
              <v-divider/>
              <v-list class="py-0" style="max-height: calc(50vh - 56px); overflow-y: scroll;">
                <v-list-item
                    v-for="column in columnsToAddFiltered"
                    :key="column.id"
                    @click="addColumn(column.id)"
                >
                  <v-list-item-icon>
                    <v-icon>{{ column.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>{{ column.displayNameForColumn || column.displayName }}</v-list-item-title>
                </v-list-item>
              </v-list>

            </v-card>

          </v-menu>
        </th>
        </thead>
      
      
        <tbody v-if="hasQueryChanged || isSearchCanceled || !queryIsCompleted">
          <tr class="search-controls-row">
            <td colspan="100%">
              <query-search-controls  v-if="hasQueryChanged || isSearchCanceled || queryBackendError" />
              <results-error v-if="queryBackendError" />
              <results-searching v-else-if="!queryIsCompleted" />
            </td>
          </tr>

        </tbody>

        <tbody v-else>
          <!-- Results Rows -->
          <tr
            v-for="(row, i) in rows"
            :key="'row-'+i"
            :class="{'dimmed': hasQueryChanged}"
            @click.exact="clickRow(row.id)"
            @click.meta.stop="metaClickRow(row.id)"
          >
            <td key="selector" class="selector pr-0" style="width: 1px; white-space: nowrap; padding-left:7px;">
              <v-btn icon @click.stop="toggleSelectedId(row.id)">
                <v-icon v-if="selectedIds.includes(row.id)">mdi-checkbox-marked</v-icon>
                <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
              </v-btn>
            </td>
            <td
              v-for="(cell, i) in row.cellsWithConfigs"
              :key="'cell-'+i"
              class="px-1"
              :class="[
                'data-type-' + cell.config.type, 
                {'is-date': cell.config.isDate, 'metric': cell.config.id.includes('(')}
              ]"
            >
              <column-value :property="cell"/>
            </td>
            <td key="column-adder-placeholder" :class="{'metric': hasMetricsColumns}"></td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-card class="more-results-message" flat v-if="!hasQueryChanged && resultsMeta?.count > 100">
        To view results beyond the first 100, download the full results set above.
      </v-card>

    </div>

    <!-- DownloadDialogs -->
    <v-dialog v-model="isDownloadDialogOpen" width="500">
      <download-dialog 
        :resultsCount="resultsMeta?.count" 
        :isOpen="isDownloadDialogOpen"
        @close="isDownloadDialogOpen = false"
         />
    </v-dialog>

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
import ResultsError from "@/components/Results/ResultsError.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";


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
    rows() {
      const rows = this.resultsBody.map((row) => {
        return {
          ...row,
          cellsWithConfigs: row.cells.map((cell, i) => {
            return {
              ...cell,
              config: this.resultsHeader[i],
            }
          })
        }
      });
      return rows;
    },
    hasMetricsColumns() { 
      return this.queryColumnsConfigs.some(col => col.id.includes('('));
    },
    isEveryRowSelected() {
      return this.selectedIds.length === this.resultsBody.length;
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
    ]),
    ...mapActions("search", [
      "createSearch",
      "resetToSubmittedQuery",
    ]),
    ...mapActions("user", [
      "createCollection",
    ]),
    cancelSearch() {
      this.resetToSubmittedQuery();
    },
    commitSortBy(sortBy) {
      this.setSortBy(sortBy);
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
      console.log("removeColumn", id);
      this.deleteReturnColumn(id);
    },
    addColumn(id) {
      console.log("addColumn", id);
      this.addReturnColumn(id);
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
    measureMetricColumns() {
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
    }
  }
}
</script>


<style lang="scss">
.search-controls-row:hover {
  background-color:
   transparent !important;
}
.search-controls-row td {
  height: 500px !important;
  vertical-align: top;
}
.search-controls {
  padding: 70px 0px;
  text-align: center;
}
.selection-message {
  font-size: 14px;
  line-height: 28px;;
}
.results-box.ui-top .selection-message {
  padding: 10px 10px;
}
table {
  border-top: none;
  border-collapse: separate !important;
}
th {
  border-bottom: 4px solid;
  border-color: var(--v-catEntityDarker-base);
  background-color: var(--v-catEntity-base);
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
.results-box.ui-top th:first-child {
  border-left-width: 3px;
  border-left-style: solid;
}
td.metric {
  border-color: var(--v-catWorksDarker-base);
}
td:not(.metric) + td.metric {
  border-left: 3px solid var(--v-catWorksDarker-base);
}
.results-box.ui-top th:not(.metric) + th.metric {
  border-left: 3px solid var(--v-catWorksDarker-base);
}
tr:last-child td {
  border-bottom-width: 3px;
  border-bottom-style: solid;
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
.dimmed {
  opacity: 0.4;
}
.more-results-message {
  padding: 20px;
  border-top: 1px #ddd solid;
  text-align: center;
  font-size: 15px;
  color: #666;
}
</style>