<template>
  <v-container class="page">
    <v-card rounded flat class="px-8 py-6">
      <h1 class="text-h4 mb-2" @click="handleTitleClick">Analytics Documentation</h1>
      
      <div class="mb-6">OpenAlex Analytics works by generating a set of works to consider, then optionally grouping them into another entity type like authors or institutions. If no works filters are applied all works in OpenAlex are considered. Filters may be applied to the starting work set and then separetly to each group of resulting entities. Below is a list of all available fields for filtering, displaying as return columns, or sorting.</div>

      <!-- Debug Mode Controls -->
      <div v-if="debugMode" class="mb-6 pa-4 grey lighten-4 rounded">
        <h3 class="mb-3">Show</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="field in sortedAvailableFields" :key="field">
            <v-checkbox
              v-model="selectedFields"
              :label="field"
              :value="field"
              dense
              hide-details
              class="my-0 py-0"
            ></v-checkbox>
          </v-col>
        </v-row>
        
        <!-- Filter Controls -->
        <h3 class="mt-4 mb-3">Filter</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="(filter, index) in sortedFilterFunctions" :key="index">
            <v-checkbox
              v-model="activeFilters"
              :label="filter.name"
              :value="filter.name"
              dense
              hide-details
              class="my-0 py-0"
            ></v-checkbox>
          </v-col>
        </v-row>
      </div>
      
      <!-- Works section first -->
      <div v-if="configs.works && hasVisibleColumns(configs.works.columns)" class="mb-10">
        <h2 class="text-h5 mb-1">
          {{ configs.works.displayName | titleCase }}
          <span v-if="debugMode" class="text-subtitle-2 grey--text ml-2">
            ({{ countVisibleColumns(configs.works.columns) }} columns)
          </span>
        </h2>
        <p class="mb-4">{{ configs.works.descrFull }}</p>
        <ul>
          <li v-for="(column, columnId) in configs.works.columns" :key="columnId" class="mb-3" 
              v-if="shouldShowColumn(column)">
            <div>
              <strong>{{ column.displayName | titleCase }}</strong> [{{ column.id }}]:
              {{ column.descr }}
              <div class="d-inline-block">
                <v-chip v-if="column.actions && column.actions.includes('filter')" x-small class="mr-1 my-1" color="primary" text-color="white">filter</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('column')" x-small class="mr-1 my-1" color="secondary" text-color="white">column</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('sort')" x-small class="mr-1 my-1" color="accent" text-color="white">sort</v-chip>
              </div>
              
              <!-- Debug field information -->
              <div v-if="debugMode && selectedFields.length > 0" class="mt-2 pl-4 grey--text text--darken-1">
                <div v-for="field in selectedFields" :key="field" v-if="column[field] !== undefined && !isDisplayedInDefault(field)">
                  <small><strong>{{ field }}:</strong> {{ formatFieldValue(column[field]) }}</small>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      
      <!-- Remaining sections in alphabetical order -->
      <div v-for="(config, configKey) in sortedConfigs" :key="configKey" class="mb-10"
           v-if="hasVisibleColumns(config.columns)">
        <h2 class="text-h5 mb-1">
          {{ config.displayName | titleCase }}
          <span v-if="debugMode" class="text-subtitle-2 grey--text ml-2">
            ({{ countVisibleColumns(config.columns) }} columns)
          </span>
        </h2>
        <p class="mb-4">{{ config.descrFull }}</p>
        <ul>
          <li v-for="(column, columnId) in config.columns" :key="columnId" class="mb-3"
              v-if="shouldShowColumn(column)">
            <div>
              <strong>{{ column.displayName | titleCase }}</strong> [{{ column.id }}]:
              {{ column.descr }}
              <div class="d-inline-block">
                <v-chip v-if="column.actions && column.actions.includes('filter')" x-small class="mr-1 my-1" color="primary" text-color="white">filter</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('column')" x-small class="mr-1 my-1" color="secondary" text-color="white">column</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('sort')" x-small class="mr-1 my-1" color="accent" text-color="white">sort</v-chip>
              </div>
              
              <!-- Debug field information -->
              <div v-if="debugMode && selectedFields.length > 0" class="mt-2 pl-4 grey--text text--darken-1">
                <div v-for="field in selectedFields" :key="field" v-if="column[field] !== undefined && !isDisplayedInDefault(field)">
                  <small><strong>{{ field }}:</strong> {{ formatFieldValue(column[field]) }}</small>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </v-card>
  </v-container>
</template>


<script>

import {getConfigs} from "@/oaxConfigs";

export default {
  name: "AnalyticsDocs",
  components: {
  },
  props: {
  },
  data: () => ({
    configs: getConfigs(),
    debugMode: false,
    clickCount: 0,
    clickTimer: null,
    selectedFields: [],
    activeFilters: [],
    filterFunctions: [
      {
        name: "Actions Empty",
        filter: (col) => !col.actions || col.actions.length === 0
      },
      {
        name: "Actions Popular",
        filter: (col) => col.actionsPopular && col.actionsPopular.length > 0
      },
      {
        name: "Redshift Columns Unequal",
        filter: (col) => col.redshiftFilterColumn !== col.redshiftDisplayColumn
      },
      {
        name: "Column Type is not String",
        filter: (col) => col.type !== "string",
      }
    ],
    availableFields: [
      'id', 'subjectEntity', 'operators', 'defaultOperator', 'entityId', 'objectEntity', 
      'displayName', 'displayNameForColumn', 'type', 'isId', 'isList', 'isColumnMandatory',
      'isDate', 'isYear', 'isCountry', 'isExternalId', 'externalIdPrefix', 'isSingleWork',
      'category', 'icon', 'actionsPopular', 'redshiftDisplayColumn', 'redshiftFilterColumn',
      'apiField', 'sortByValue', 'displayNullAs', 'isSearchColumn'
    ]
  }),
  computed: {
    sortedConfigs() {
      // Create a new object with all configs except 'works'
      const configsWithoutWorks = {};
      Object.keys(this.configs)
        .filter(key => key !== 'works')
        .sort() // Sort alphabetically
        .forEach(key => {
          configsWithoutWorks[key] = this.configs[key];
        });
      return configsWithoutWorks;
    },
    
    sortedAvailableFields() {
      // Return alphabetically sorted available fields
      return [...this.availableFields].sort();
    },
    
    sortedFilterFunctions() {
      // Return alphabetically sorted filter functions
      return [...this.filterFunctions].sort((a, b) => a.name.localeCompare(b.name));
    }
  },
  methods: {
    handleTitleClick() {
      // Clear the timer if it exists
      if (this.clickTimer) {
        clearTimeout(this.clickTimer);
      }
      
      // Increment click count
      this.clickCount++;
      // If 4 clicks were detected within the time window, toggle debug mode
       if (this.clickCount === 4) {
        this.debugMode = !this.debugMode;
      }
      
      // Set a timer to reset the click count after 1 second
      this.clickTimer = setTimeout(() => {
        this.clickCount = 0;
      }, 1000);
    },
    formatFieldValue(value) {
      if (value === null || value === undefined) {
        return 'null';
      } else if (typeof value === 'object') {
        return JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      } else {
        return value.toString();
      }
    },
    isDisplayedInDefault(field) {
      // These fields are already displayed in the default view
      const defaultFields = ['id', 'displayName', 'descr', 'actions'];
      return defaultFields.includes(field);
    },
    shouldShowColumn(column) {
      // In normal mode, only show columns with actions
      if (!this.debugMode) {
        return column.actions && column.actions.length > 0;
      }
      
      // In debug mode with no active filters, show all columns
      if (this.activeFilters.length === 0) {
        return true;
      }
      
      // In debug mode with active filters, apply each selected filter
      return this.activeFilters.some(filterName => {
        const filterFunc = this.filterFunctions.find(f => f.name === filterName).filter;
        return filterFunc(column);
      });
    },
    hasVisibleColumns(columns) {
      // Check if any columns in this section should be shown
      return Object.values(columns).some(column => this.shouldShowColumn(column));
    },
    countVisibleColumns(columns) {
      // Count how many columns are visible in this section
      return Object.values(columns).filter(column => this.shouldShowColumn(column)).length;
    }
  }
}
</script>

<style>
.page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>