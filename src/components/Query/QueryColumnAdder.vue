<template>
  <div>
    <!-- Menu Mode -->
    <template v-if="mode === 'menu'">
      <v-menu v-model="isMenuOpen" class="rounded-lg" location="bottom" max-height="50vh">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-plus-circle</v-icon>
          </v-btn>
        </template>
        <v-card flat>
          <v-text-field
            v-model="columnSearch"
            variant="filled"
            rounded
            bg-color="white"
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
              <v-icon>{{ column.icon }}</v-icon>
              <v-list-item-title>
                {{ filters.titleCase(column.displayName) }}
              </v-list-item-title>
              <v-spacer />
              <v-icon v-if="query.show_columns.includes(column.column_id)">mdi-check</v-icon>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </template>
    
    <!-- Dialog Mode -->
    <template v-else>
      <!-- Button to open dialog -->
      <v-btn icon @click="openDialog">
        <v-icon>mdi-plus-circle</v-icon>
      </v-btn>
      
      <!-- Column selection dialog -->
      <v-dialog v-model="isDialogOpen" max-width="600">
        <v-card>
          <v-card-title class="text-h5">
            {{ dialogTitle }}
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text style="max-height: 400px; overflow-y: auto; padding: 16px 8px;">
            <v-container fluid class="pa-0">
              <v-row class="ma-0">
                <v-col
                  v-for="column in availableColumns"
                  :key="column.column_id"
                  cols="4"
                  class="py-1"
                >
                  <v-chip
                    @click="toggleColumnSelection(column.column_id)"
                    :color="isColumnSelected(column.column_id) ? color : undefined"
                    :class="['column-chip', {'unselected-chip': !isColumnSelected(column.column_id)}]"
                    height="32"
                    :style="{ minHeight: '32px' }"
                    class="text-black"
                  >
                    <v-icon size="16" start>{{ column.icon }}</v-icon>
                    <span class="text-truncate column-option">{{ filters.titleCase(column.displayName) }}</span>
                  </v-chip>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="cancelDialog">Cancel</v-btn>
            <v-btn color="primary" @click="applyChanges">Apply</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import { getConfigs } from "@/oaxConfigs";
import filters from "@/filters";

export default {
  name: "QueryColumnAdder",
  props: {
    display: {
      type: String,
      default: "data",
      validator: value => ["data", "metrics"].includes(value)
    },
    mode: {
      type: String,
      default: "menu",
      validator: value => ["menu", "dialog"].includes(value)
    }
  },
  data() {
    return {
      isMenuOpen: false,
      isDialogOpen: false,
      columnSearch: "",
      selectedColumns: [],
      originalColumns: [],
      filters,
    }
  },
  computed: {
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
    ]),
    entity() {
      return this.query.show_underlying_works ? 'works' : this.querySubjectEntity;
    },
    columnConfigs() {
      return getConfigs()[this.entity].columns;
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
      return null;
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
      return ['works', 'summary'].includes(this.entity) ? 'catWorks' : 'catEntity';
    },
    buttonText() {
      return this.display === "data" ? "Column" : "Metric";
    },
    dialogTitle() {
      const subject = this.entity.charAt(0).toUpperCase() + this.entity.slice(1)
      return this.display === "data" ? subject + " Columns" : "Metrics";
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
    },
    toggleColumnSelection(columnId) {
      if (this.selectedColumns.includes(columnId)) {
        this.selectedColumns = this.selectedColumns.filter(id => id !== columnId);
      } else {
        this.selectedColumns.push(columnId);
      }
    },
    isColumnSelected(columnId) {
      return this.selectedColumns.includes(columnId);
    },
    openDialog() {
      // Initialize selected columns with current selection
      this.selectedColumns = [...this.query.show_columns];
      this.originalColumns = [...this.query.show_columns];
      this.isDialogOpen = true;
    },
    cancelDialog() {
      this.isDialogOpen = false;
    },
    applyChanges() {
      // Determine which columns to add and which to remove
      const columnsToAdd = this.selectedColumns.filter(
        colId => !this.originalColumns.includes(colId)
      );
      const columnsToRemove = this.originalColumns.filter(
        colId => !this.selectedColumns.includes(colId)
      );
      
      // Apply changes
      columnsToAdd.forEach(colId => this.addReturnColumn(colId));
      columnsToRemove.forEach(colId => this.deleteReturnColumn(colId));
      
      // Only create search once after all changes are applied
      if (columnsToAdd.length > 0 || columnsToRemove.length > 0) {
        this.createSearch();
      }
      
      this.isDialogOpen = false;
    }
  }
};
</script>

<style scoped>
.column-option {
  font-size: 14px;
}

.column-chip {
  width: 100%;
  justify-content: flex-start;
  margin: 0;
  font-weight: normal;
}

.column-chip .v-chip__content {
  overflow: hidden;
  width: 100%;
}

.unselected-chip {
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.unselected-chip:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}
</style>