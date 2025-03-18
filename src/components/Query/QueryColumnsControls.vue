<template>
  <v-card flat rounded>
    <div class="columns-controls-line" />
    
    <!-- Display -->
    <div class="columns-controls-box">
      <div class="query-section-label">Display</div>
      <!-- Visible Columns -->
      <div>
        <div v-for="(column, index) in visibleDataColumns" :key="index" class="query-builder-chip">
          <v-chip label color="catDisplay" class="mt-0">
            {{ column.displayName | titleCase }}
            <v-icon
              v-if="visibleDataColumns.length > 1" 
              @click="removeColumn(column)" small class="ml-1">mdi-close</v-icon>
          </v-chip>
        </div>
        <!-- Columns Button/Menu -->
        <v-menu v-model="isDataColumnsMenuOpen" offset-y>
          <template v-slot:activator="{ on }">
            <v-btn class="query-builder-button" small color="catDisplayDarker" v-on="on"><v-icon small>mdi-plus</v-icon>Column</v-btn>
          </template>
          <v-card flat rounded>
            <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
              <v-list-item
                  v-for="column in availableDataColumns"
                  :key="column.id"
                  @click="toggleColumn(column)"
              >
                <v-list-item-icon>
                  <v-icon>{{ column.icon }}</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  {{ column.displayName | titleCase }}
                </v-list-item-title>
                <v-spacer />
                <v-list-item-icon v-if="(query.show_columns.includes(column.column_id))">
                  <v-icon>mdi-check</v-icon>
                </v-list-item-icon>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
    </div>
    </div>

    <!-- Metrics -->
    <div v-if="availableMetricsColumns.length > 0">
      <div class="columns-controls-box" v-if="visibleMetricsColumns.length > 0">
        <div class="query-section-label">Metrics</div>
        <!-- Visible Columns -->
        <div>
          <div v-for="(column, index) in visibleMetricsColumns" :key="index" class="query-builder-chip">
            <v-chip label color="catMetrics">
              {{ column.displayName | titleCase }}
              <v-icon
                v-if="visibleMetricsColumns.length > 1" 
                @click="removeColumn(column)" small class="ml-1">mdi-close</v-icon>
            </v-chip>
          </div>
          <!-- Metrics Button/Menu -->
          <v-menu v-model="isMetricsColumnsMenuOpen" offset-y>
            <template v-slot:activator="{ on }">
              <v-btn class="query-builder-button" small color="catMetricsDarker" v-on="on"><v-icon small>mdi-plus</v-icon>Metric</v-btn>
            </template>
            <v-card flat rounded>
              <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
                <v-list-item
                    v-for="column in availableMetricsColumns"
                    :key="column.id"
                    @click="toggleColumn(column)"
                >
                  <v-list-item-icon>
                    <v-icon>{{ column.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                    {{ column.displayName | titleCase }}
                  </v-list-item-title>
                  <v-spacer />
                  <v-list-item-icon v-if="(query.show_columns.includes(column.column_id))">
                    <v-icon>mdi-check</v-icon>
                  </v-list-item-icon>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Sort by -->
    <!-- Sort by Column -->
    <div class="sort-box columns-controls-box" v-if="sortByColumn">
      <div class="query-section-label" v-if="sortByColumn">Sort by</div>
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
            style="min-width: 1px !important;"
            class="mt-0 first query-builder-chip"
            label
            color="catSort"
            v-on="on" 
          >
            {{ (sortByColumn.displayNameForColumn || sortByColumn.displayName) | titleCase }}
            <v-icon small>mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item-group>
            <v-list-item
              v-for="column in availableSortByColumns"
              :key="column.column_id"
              :value="column.column_id"
              active-class="primary--text"
              @click="setSortByColumn(column.column_id)"
            >
              <v-list-item-icon>
                <v-icon>{{ column.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-title class="py-3">
                {{ column.displayName | titleCase}}
              </v-list-item-title>
              <v-list-item-icon>
                <v-icon v-if="column.column_id===query.sort_by_column">mdi-check</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>

      <!-- Sort by Order -->
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
            color="catSort"
            label
            class="last query-builder-chip"
            style="min-width: 1px !important;"
            v-on="on" 
          >
            {{ {"desc": "Descending", "asc": "Ascending"}[query.sort_by_order] }}
            <v-icon small>mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item-group>
            <v-list-item
              v-for="order in ['desc', 'asc']"
              :key="order"
              :value="order"
              active-class="primary--text"
              @click="setOrder(order)"
            >
              <v-list-item-title class="py-3">
                {{ {"desc": "Descending", "asc": "Ascending"}[order] }}
              </v-list-item-title>
              <v-list-item-icon>
                <v-icon v-if="order===query.sort_by_order">mdi-check</v-icon>
              </v-list-item-icon>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </div>
  </v-card>
</template>

<script>
import {mapGetters, mapMutations } from "vuex";
import { getConfigs } from "@/oaxConfigs";

export default {
  name: "QueryColumnsControl",
  components: {
  },
  props: {},
  data() {
    return {
      isDataColumnsMenuOpen: false,
      isMetricsColumnsMenuOpen: false,
    }
  },
  computed: {
    ...mapGetters("search",[
      "query",
      "querySubjectEntity",
    ]),
    columnConfigs() {
      return getConfigs()[this.querySubjectEntity].columns;
    },
    availableColumns() {
      const availableColumns = Object.values(this.columnConfigs)
          .filter(column => column.actions?.includes("column"))
          .map(column => ({
            displayName: column.displayNameForColumn || column.displayName,
            column_id: column.id,
            icon: column.icon,
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
      return availableColumns;  
    },
    availableDataColumns() {
      return this.availableColumns.filter(col => !col.column_id.includes("("));
    },
    availableMetricsColumns() {
      return this.availableColumns.filter(col => col.column_id.includes("("));
    },
    visibleColumns() {
      return this.query.show_columns.map(column => ({
          displayName: this.columnConfigs[column].displayNameForColumn || this.columnConfigs[column].displayName,
          column_id: column,
        }));
    },
    visibleDataColumns() {
      return this.visibleColumns.filter(col => !col.column_id.includes("("));
    },
    visibleMetricsColumns() {
      return this.visibleColumns.filter(col => col.column_id.includes("("));
    },
    availableSortByColumns() {
      return Object.values(this.columnConfigs)
          .filter(column => column.actions?.includes("sort"))
          .map(column => ({
            displayName:  column.displayNameForColumn || column.displayName,
            column_id: column.id,
            icon: column.icon,
        }));
    },
    sortByColumn() {
      return this.columnConfigs?.[this.query.sort_by_column];
    },
  },
  methods: {
    ...mapMutations("search", [
      "addReturnColumn",
      "deleteReturnColumn",
      "setSortBy"
    ]),
    openColumnsMenu(filter) {
      this.currentFilter = filter;
      this.isColumnsMenuOpen = true;
    },
    toggleColumn(column) {
      if (this.query.show_columns.includes(column.column_id)) {
        this.removeColumn(column);
      } else {
        this.addColumn(column);
      }
    },
    addColumn(column) {
      this.addReturnColumn(column.column_id);
    },
    removeColumn(column) {
      this.deleteReturnColumn(column.column_id);
    },
    setSortByColumn(column) {
      this.setSortBy({column_id: column, direction: this.query.sort_by_order });
   },
    setOrder(order) {
      this.setSortBy({column_id: this.query.sort_by_column, direction: order });
    },
  },
  mounted() {
    if (!this.query.show_columns) { debugger; }
  },
  watch: {
  }
};
</script>


<style scoped>
.query-section-label {
  display: inline-block;
  margin-right: 5px;
}
.columns-controls-box {
  display: flex;
  margin-bottom: 5px;
}
.v-chip {
  cursor: pointer;
} 
.columns-controls-box .query-builder-chip {
  margin-right: 4px;
  margin-bottom: 4px;
}
.sort-box .v-chip.first {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-right: 5px !important;
  border-right: 1px solid #B2DFDB  !important; /* teal lighten4 */
  margin-right: 0;
}
.sort-box .v-chip.last {
  margin-right: 0px;
  padding-left: 7px;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  margin-left: 0;
}
</style>