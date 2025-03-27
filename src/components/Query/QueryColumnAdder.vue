<template>
  <!-- Column Add Button/Menu -->
  <v-menu v-model="isMenuOpen" offset-y rounded max-height="50vh">
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
        :placeholder="'Add ' + buttonText"
      />
      <v-divider/>
      <v-list class="py-0" style="max-height: calc(50vh - 56px); overflow-y: scroll;">
        <v-list-item
          v-for="column in filteredColumns"
          :key="column.column_id"
          @click="toggleColumn(column)"
        >
          <v-list-item-icon>
            <v-icon>{{ column.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            {{ column.displayName | titleCase }}
          </v-list-item-title>
          <v-spacer />
          <v-list-item-icon v-if="query.show_columns.includes(column.column_id)">
            <v-icon>mdi-check</v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { getConfigs } from "@/oaxConfigs";

export default {
  name: "QueryColumnAdder",
  props: {
    display: {
      type: String,
      default: "data",
      validator: value => ["data", "metrics"].includes(value)
    }
  },
  data() {
    return {
      isMenuOpen: false,
      columnSearch: ""
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
    ]),
    columnConfigs() {
      return getConfigs()[this.querySubjectEntity].columns;
    },
    availableColumns() {
      const action = this.query.get_rows === "summary" ? "summary" : "column";
      const allColumns = Object.values(this.columnConfigs)
        .filter(column => column.actions?.includes(action))
        .map(column => ({
          displayName: column.displayNameForColumn || column.displayName,
          column_id: column.id,
          icon: column.icon,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      // Filter based on display type
      if (this.query.get_rows === "summary") {
        return allColumns;
      } else if (this.display === "data") {
        return allColumns.filter(col => !col.column_id.includes("("));
      } else if (this.display === "metrics") {
        return allColumns.filter(col => col.column_id.includes("("));
      }
    },
    filteredColumns() {
      // Filter available columns based on search term
      if (!this.columnSearch) {
        return this.availableColumns;
      }
      
      return this.availableColumns.filter(col => 
        col.displayName.toLowerCase().includes(this.columnSearch.toLowerCase())
      );
    },
    color() {
      if (this.display === "metrics") {
        return "catWorks";
      }
      return ['works', 'summary'].includes(this.querySubjectEntity) ? 'catWorks' : 'catEntity';
    },
    buttonText() {
      return this.display === "data" ? "Column" : "Metric";
    }
  },
  methods: {
    ...mapMutations("search", [
      "addReturnColumn",
      "deleteReturnColumn",
    ]),
    ...mapActions("search", [
      "createSearch"
    ]),
    toggleColumn(column) {
      if (this.query.show_columns.includes(column.column_id)) {
        this.removeColumn(column);
      } else {
        this.addColumn(column);
      }
    },
    addColumn(column) {
      this.addReturnColumn(column.column_id);
      this.createSearch();
    },
    removeColumn(column) {
      this.deleteReturnColumn(column.column_id);
      this.createSearch();
    }
  }
};
</script>