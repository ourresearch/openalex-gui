<template>
  <v-card flat rounded style="margin-top: 28px !important">
    <div class="columns-controls-line" />
    <!-- Display -->
    <div class="query-section-label">Display</div>

    <!-- Columns Button/Menu -->
    <v-menu v-model="isColumnsMenuOpen" offset-y>
      <template v-slot:activator="{ on }">
        <v-btn small v-on="on"><v-icon color="primary" small>mdi-plus</v-icon>Columns</v-btn>
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
            <v-list-item-icon v-if="(show_columns.includes(column.column_id))">
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <div class="columns-controls-box" v-if="visibleColumns.length > 0">
      <!-- Visible Columns -->
      <div v-for="(column, index) in visibleColumns" :key="index" class="column-chip">
        <v-chip outlined>
          {{ columnConfig(column.column_id).displayName | titleCase }}
          <v-icon
            v-if="visibleColumns.length > 1" 
            @click="removeColumn(column)" small class="ml-1">mdi-close</v-icon>
        </v-chip>
      </div>
    </div>


    <!-- Sort by -->
    <div class="query-section-label" style="margin-top: 10px;">Sort by</div>
    <!-- Sort by Column -->
    <span class="sort-box" v-if="sortByColumn">
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-chip
              style="min-width: 1px !important;"
              outlined
              v-on="on" 
          >
            {{ sortByColumn.displayName | titleCase }}
            <v-icon small>mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item-group>
            <v-list-item
                v-for="column in visibleColumns"
                :key="column.column_id"
                :value="column.column_id"
                active-class="primary--text"
                @click="setSortBy(column.column_id)"
            >
              <v-list-item-icon>
                <v-icon v-if="column.column_id===sort_by_column">mdi-check</v-icon>
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
              style="min-width: 1px !important;"
              v-on="on" 
          >
            {{ {"desc": "Descending", "asc": "Ascending"}[sort_by_order] }}
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
                <v-icon v-if="order===sort_by_order">mdi-check</v-icon>
              </v-list-item-icon>
              <v-list-item-title class="py-3">
                {{ {"desc": "Descending", "asc": "Ascending"}[order] }}
              </v-list-item-title>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
    </span>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { getConfigs } from "@/oaxConfigs";

export default {
  name: "QueryColumnsControl",
  components: {
  },
  props: {
    subjectEntity: String,
    show_columns: Array,
    sort_by_column: String,
    sort_by_order: String,
  },
  data() {
    return {
      openNodes: [],
      visibleColumns: [],
      availableColumns: [],
      sortByColumn: null,
      isColumnsMenuOpen: false,
    };
  },
  computed: {

  },
  methods: {
    ...mapActions("search", ["createSearch"]),
    openColumnsMenu(filter) {
      this.currentFilter = filter;
      this.isColumnsMenuOpen = true;
    },
    toggleColumn(column) {
      console.log(this.show_columns)
      console.log(column)
      if (this.show_columns.includes(column.column_id)) {
        console.log("remove")
        this.removeColumn(column)
      } else {
        this.addColumn(column)
      }
    },
    addColumn(column) {
      this.visibleColumns.push(column)
      this.applyColumns()
    },
    removeColumn(column) {
      const index = this.visibleColumns.indexOf(column);
      if (index > -1) {
        this.visibleColumns.splice(index, 1);
        this.applyColumns();
      }
    },
    setSortBy(column) {
      this.$store.state.search.query.sort_by_column = column;
      this.createSearch();
   },
    setOrder(order) {
      this.$store.state.search.query.sort_by_order = order;
      this.createSearch();      
    },
    applyColumns() {
      const columns = this.visibleColumns.map(column => column.column_id)
      this.$store.state.search.query.show_columns = columns;
      this.createSearch();
    },
    columnConfig(column_id) {
      const mySubjectEntity = this.subjectEntity
      const mySubjectEntityConfig = getConfigs()[mySubjectEntity]
      const columnConfig = mySubjectEntityConfig.columns[column_id]
      return columnConfig
    },
  },
  mounted() {
  },
  watch: {
    "show_columns": {
      handler: function(newColumns) {

        const availableColumns = getConfigs()[this.subjectEntity].columns

        this.availableColumns = Object.values(availableColumns)
          .filter(column => column.actions.includes("column"))
          .map(column => ({
            displayName: column.displayName,
            column_id: column.id,
            icon: column.icon,
        }));

        this.visibleColumns = newColumns.map(column => ({
          displayName: availableColumns[column].displayName,
          column_id: column,
        }));
      },
      immediate: true,
    },
    "sort_by_column": {
      handler: function(column) {
        this.sortByColumn = getConfigs()[this.subjectEntity].columns[column]
      },
    immediate: true,
    }
  }
};
</script>


<style scoped>
.columns-controls-line {
  border-top: 1px #ddd solid;
  margin: 0 20px 28px 20px;
}
.query-section-label {
  font-size: 16px;
  display: inline-block;
}
.columns-controls-box {
  padding-left: 10px;
}
.column-chip {
  display: inline-block;
  margin: 8px 3px;
}
.v-chip {
  background-color: #f5f5f5 !important;
  cursor: pointer;
} 
.v-btn {
  margin-left: 10px;
}
.sort-box .v-chip:first-child {
  margin-right: 0px;
  margin-left: 8px;
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