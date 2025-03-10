<template>
  <v-card flat rounded>
    <div class="columns-controls-line" />
    <!-- Display -->
    <div class="query-section-label">Display</div>

    <div class="columns-controls-box" v-if="visibleColumns.length > 0">
      <!-- Visible Columns -->
      <div v-for="(column, index) in visibleColumns" :key="index" class="column-chip">
        <v-chip small outlined>
          {{ column.displayName | titleCase }}
          <v-icon
            v-if="visibleColumns.length > 1" 
            @click="removeColumn(column)" small class="ml-1">mdi-close</v-icon>
        </v-chip>
      </div>
      <!-- Columns Button/Menu -->
      <v-menu v-model="isColumnsMenuOpen" offset-y>
        <template v-slot:activator="{ on }">
          <v-btn small rounded v-on="on"><v-icon color="primary" small>mdi-plus</v-icon>Column</v-btn>
        </template>
        <v-card flat rounded>
          <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
            <v-list-item
                v-for="(column, i) in availableColumns"
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


    <!-- Sort by -->
    <div class="query-section-label" v-if="sortByColumn" style="margin-top: 10px;">Sort by</div>
    <!-- Sort by Column -->
    <div class="sort-box" v-if="sortByColumn">
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
              style="min-width: 1px !important;"
              outlined
              small
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
                <v-icon v-if="column.column_id===query.sort_by_column">mdi-check</v-icon>
              </v-list-item-icon>
              <v-list-item-title class="py-3">
                {{ column.displayName | titleCase}}
              </v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>

      <!-- Sort by Order -->
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
              outlined
              small
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
              <v-list-item-icon>
                <v-icon v-if="order===query.sort_by_order">mdi-check</v-icon>
              </v-list-item-icon>
              <v-list-item-title class="py-3">
                {{ {"desc": "Descending", "asc": "Ascending"}[order] }}
              </v-list-item-title>
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
      isColumnsMenuOpen: false,
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
    visibleColumns() {
      return this.query.show_columns.map(column => ({
          displayName: this.columnConfigs[column].displayNameForColumn || this.columnConfigs[column].displayName,
          column_id: column,
        }));
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
  font-size: 18px;
  display: inline-block;
}
.column-chip {
  display: inline-block;
  margin: 8px 2px;
}
.v-chip {
  background-color: #f5f5f5 !important;
  cursor: pointer;
} 
.v-btn {
  margin-left: 2px;
}
.sort-box .v-chip:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  padding-right: 8px;
  border-right: none;
}
.sort-box .v-chip:last-child {
  margin-right: 0px;
  padding-right: 0px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>