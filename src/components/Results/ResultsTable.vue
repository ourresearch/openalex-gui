<template>
  <div>

    <!-- Results Header / Actions -->
    <div class="pa-2">
      <query-search-controls />
      
      <div v-if="!hasQueryChanged" class="d-flex flex-grow-1 align-center">
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

    <div :class="{'dimmed': hasQueryChanged}">
      <!-- Row Selection Message -->
      <div class="pa-3 d-flex align-center grey lighten-3"
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
          All <span class="font-weight-bold mx-1">{{ selectedIds.length }}</span> results on this page are selected.
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
      <v-simple-table>
        <thead>
        <th key="checkbox-placeholder"></th>
        
        <!-- Results Table Headers -->
        <th
            v-for="(header, i) in queryColumnsConfigs"
            :key="'header-'+i"
            :class="`data-type-${header.type} is-date-${header.isDate}`"
            class=""
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
                    <v-icon v-if="submittedQuery.sort_by_order==='desc'">mdi-arrow-down</v-icon>
                    <v-icon v-if="submittedQuery.sort_by_order==='asc'">mdi-arrow-up</v-icon>
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
        <th key="column-adder">
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
        <tbody>
      
      <!-- Results Rows -->
      <tr
            v-for="(row, i) in rows"
            :key="'row-'+i"
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
              :class="`data-type-${cell.config.type} is-date-${!!cell.config.isDate}`"
          >
            <column-value :property="cell"/>
          </td>
          <td key="column-adder-placeholder"></td>
        </tr>
        </tbody>
      </v-simple-table>

      <v-card class="more-results-message" flat v-if="resultsMeta?.count > 100">
        To view results beyond the first 100, download the full results set above.
      </v-card>

    </div>

    <!-- Dialogs -->
    <v-dialog v-model="isDownloadDialogOpen" width="500">
      <download-dialog 
        :resultsCount="resultsMeta?.count" 
        :isOpen="isDownloadDialogOpen"
        @close="isDownloadDialogOpen = false"
         />
    </v-dialog>

    <v-dialog v-model="isCorrectionDialogOpen" width="500">
      <correction-create :ids="selectedIds" @close="isCorrectionDialogOpen = false"/>
    </v-dialog>

    <v-dialog scrollable v-model="isPropSelectorDialogOpen">
      <v-card flat rounded>
        <query-return @close="isPropSelectorDialogOpen = false"/>
      </v-card>
    </v-dialog>

  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {unravel} from "../../util";
import {entity} from "@/entity";
import {getConfigs} from "@/oaxConfigs";
import * as oaxSearch from "@/oaxSearch";

import ColumnValue from "@/components/ColumnValue.vue";
import LabelMenu from "@/components/Label/LabelMenu.vue";
import CorrectionCreate from "@/components/CorrectionCreate.vue";
import DownloadDialog from "@/components/Download/DownloadDialog.vue";
import QueryReturn from "@/components/Query/QueryReturn.vue";
import QuerySearchControls from "@/components/Query/QuerySearchControls.vue";


export default {
  name: "ResultsTable",
  components: {
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
    ]),
    querySubjectEntity() {
      return this.submittedQuery.get_rows === "summary" ? "works" : this.submittedQuery.get_rows;
    },
    querySubjectEntityConfig() {
      return getConfigs()[this.querySubjectEntity];
    },
    queryColumnsConfigs() {
      const columnsToReturn = this.submittedQuery.show_columns.map((col) => {
        const ret = this.querySubjectEntityConfig.columns[col];
        return ret;
      });
      return columnsToReturn;
    },
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
    unravel,
    ...mapMutations([
      "snackbar",
      "setZoomId",
    ]),
    ...mapMutations("search", [
      "addReturnColumn",
      "deleteReturnColumn",
      "setSortBy",
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
      this.createSearch();
    },
    addColumn(id) {
      console.log("addColumn", id);
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
  },
  created() {
   //console.log(this.rows);
  }
}
</script>


<style scoped lang="scss">
td.data-type-number {
  text-align: right;
  font-family: monospace;
  font-size: 0.9em;

  &.is-date-true {
    text-align: unset;
    font-family: unset;
  }
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