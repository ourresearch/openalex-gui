<template>
  <div class="pt-3">
  <v-container>
    <v-navigation-drawer 
      v-model="isNavOpen" 
      :temporary="display.mobile.value"
      :permanent="!display.mobile.value"
      location="start"
      width="250"
      :transition="false"
    >
      <v-list-item 
        title="Entity Types"
        prepend-icon="mdi-cog"
      >
        <template #title>
          <span class="font-weight-medium" style="font-size: 12px;">Entity Types</span>
        </template>
      </v-list-item>
      <v-divider class="mb-3"/>
      <v-list-item 
        v-for="config in sortedConfigs"
        :key="config.displayName"
        :title="filters.titleCase(config.displayName)"
        :prepend-icon="config.icon"
        :to="'#' + config.id"
        :active="activeSection === config.id"
        class="text-grey-darken-2"
      />
    </v-navigation-drawer>

    <template v-if="display.mobile.value">
      <v-btn 
        @click="isNavOpen = !isNavOpen" 
        append-icon="mdi-menu-down"
        style="position: fixed; top: 75px; left: 10px; z-index: 9999;"
      >Entity Types</v-btn>
    </template>

    <v-card rounded flat class="px-8 py-6 mt-4 analytics-docs" :transition="false">
      <h1 class="text-h4 mb-2" @click="handleTitleClick">Analytics Documentation</h1>
      
      <div class="mb-4 text-grey-darken-1">
        Queries in OpenAlex Analytics start by generating a set of works to consider.
        These works can be optionally grouped into a different entity type like authors or institutions. 
        If no works filters are applied then all works in OpenAlex are considered in the query.
        When grouping into another entity type, another set of filters can be applied specific to that entity type. 
        Below is a list of all available fields for filtering each entity type, displaying data columns, or sorting.
      </div>

      <v-text-field
        v-model="searchStr"
        label="Search all fields"
        variant="solo-filled"
        flat
        rounded
        prepend-inner-icon="mdi-magnify"
        single-line
        density="comfortable"
        hide-details
        class="mb-8"
      />

      <!-- Debug Mode Controls -->
      <div v-if="debugMode" class="mb-6 pa-4 bg-grey-lighten-4 rounded">
        <h3 class="mb-3">Show</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4" v-for="field in sortedAvailableFields" :key="field">
            <v-checkbox
              v-model="selectedFields"
              :label="field"
              :value="field"
              density="compact"
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
              density="compact"
              hide-details
              class="my-0 py-0"
            ></v-checkbox>
          </v-col>
        </v-row>
      </div>

      <!-- Entity Sections -->
      <div v-for="config in sortedConfigs" :key="config.displayName" class="mb-14">
        <h2 class="text-h5 mb-1 font-weight-bold" :id="config.id">
          {{ filters.titleCase(config.displayName) }}
          <span v-if="debugMode" class="text-subtitle-2 text-grey ml-2">
            ({{ countVisibleColumns(config.columns) }} columns)
          </span>
        </h2>
        <p class="mb-4 text-grey-darken-1">{{ config.descrFull }}</p>
        <div style="border: 1px solid #e0e0e0;">
          <div v-for="(column, columnId) in columnsToShow(config.id)" :key="columnId" class="mb-3">
            <div class="bg-green-lighten-5 mb-3 py-2 px-3">
              <v-icon color="grey-darken-1" size="x-small" class="mr-2">{{ config.icon }}</v-icon>
              <strong>{{ filters.titleCase(column.displayName) }}</strong> 
              <span class="text-green-darken-3 mx-6">{{ column.id }}</span>
              <span class="d-inline-block">
                <v-chip v-if="column.actions && column.actions.includes('filter')" size="small" class="mx-1 font-weight-bold" color="blue">filter</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('column')" size="small" class="mx-1 font-weight-bold" color="indigo">column</v-chip>
                <v-chip v-if="column.actions && column.actions.includes('sort')" size="small" class="mx-1 font-weight-bold" color="pink">sort</v-chip>
              </span>
            </div>

            <div class="text-grey-darken-2 py-2 px-9">
              {{ column.descr }}
            </div>
              
            <!-- Debug field information -->
            <div v-if="debugMode && availableSelectedFields(column).length > 0" class="mt-2 pl-4 text-grey-darken-1">
              <div v-for="field in availableSelectedFields(column)" :key="field">
                <small><strong>{{ field }}:</strong> {{ formatFieldValue(column[field]) }}</small>
              </div>
            </div>

          </div>
        </div>
      </div>
    </v-card>
  </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'AnalyticsDocs' });

const configs = ref(getConfigs());
const debugMode = ref(false);
const clickCount = ref(0);
const searchStr = ref('');
const activeSection = ref(null);
const display = useDisplay();
const isNavOpen = ref(!display.mobile.value);

let clickTimer = null;

const selectedFields = ref([]);
const activeFilters = ref([]);

const filterFunctions = [
  {
    name: 'Actions Empty',
    filter: col => !col.actions || col.actions.length === 0,
  },
  {
    name: 'Has Actions',
    filter: col => col.actions && col.actions.length > 0,
  },
  {
    name: 'Has Actions Popular',
    filter: col => col.actionsPopular && col.actionsPopular.length > 0,
  },
  {
    name: 'Redshift Columns Unequal',
    filter: col => col.redshiftFilterColumn !== col.redshiftDisplayColumn,
  },
  {
    name: "Type is not 'string'",
    filter: col => col.type !== 'string',
  },
  {
    name: "Type is 'object' or 'array'",
    filter: col => col.type === 'object' || col.type === 'array',
  },
  {
    name: 'Name contains ()',
    filter: col => col.id.includes('('),
  },
];

// Computed
const sortedConfigs = computed(() => {
  const results = [];
  Object.keys(configs.value)
    .filter(
      key => hasVisibleColumns(configs.value[key].columns)
    )
    .sort()
    .forEach(key => {
      results.push(configs.value[key]);
    });

    // Move works to the front if it exists in the results
    const worksIndex = results.findIndex(config => config.id === 'works');
    if (worksIndex !== -1) {
      const worksConfig = results.splice(worksIndex, 1)[0];
      results.unshift(worksConfig);
    }

    return results;
});

const availableFields = computed(() => {
  const fieldSet = new Set();
  Object.values(configs.value).forEach(config => {
    if (config.columns) {
      Object.values(config.columns).forEach(column => {
        Object.keys(column).forEach(key => fieldSet.add(key));
      });
    }
  });
  return Array.from(fieldSet);
});

const sortedAvailableFields = computed(() =>
  [...availableFields.value].sort()
);

const sortedFilterFunctions = computed(() =>
  [...filterFunctions].sort((a, b) => a.name.localeCompare(b.name))
);

// Methods
function formatFieldValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value.toString();
}

function isDisplayedInDefault(field) {
  const defaultFields = ['id', 'displayName', 'descr', 'actions'];
  return defaultFields.includes(field);
}

function shouldShowColumn(column) {
  if (!debugMode.value) {
    if (!column.actions || column.actions.length === 0) { return false; }
    if (searchStr.value.length > 0) {
      const query = searchStr.value.toLowerCase();
      const fields = ['displayName', 'descr', 'id'];
      const content = fields.map(field => column[field].toLowerCase()).join(' ');
      return content.includes(query);
    }
  }

  if (activeFilters.value.length === 0) {
    return true;
  }

  return activeFilters.value.every(filterName => {
    const filterFunc = filterFunctions.find(f => f.name === filterName)?.filter;
    return filterFunc ? filterFunc(column) : true;
  });
}

function hasVisibleColumns(columns) {
  return Object.values(columns).some(col => shouldShowColumn(col));
}

function countVisibleColumns(columns) {
  return Object.values(columns).filter(col => shouldShowColumn(col)).length;
}

function columnsToShow(configKey) {
  const columns = configs.value[configKey].columns;
  return Object.values(columns).filter(col => shouldShowColumn(col));
}

function availableSelectedFields(column) {
  return selectedFields.value.filter(
    field =>
      column[field] !== undefined && !isDisplayedInDefault(field)
  );
}

function handleTitleClick() {
  if (clickTimer) {
    clearTimeout(clickTimer);
  }

  clickCount.value++;
  if (clickCount.value === 4) {
    debugMode.value = !debugMode.value;
  }

  clickTimer = setTimeout(() => {
    clickCount.value = 0;
  }, 1000);
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log(entry.target.id);
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.6 // adjust as needed
    }
  );

  sortedConfigs.value.forEach(config => {
    const el = document.getElementById(config.id);
    if (el) observer.observe(el);
  });

  onUnmounted(() => {
    observer.disconnect();
  });
});

onMounted(() => {
  document.querySelector('.v-app-bar').classList.add('fixed');
});

onUnmounted(() => {
  document.querySelector('.v-app-bar').classList.remove('fixed');
});

</script>

<style>
.v-app-bar.fixed {
  position: fixed !important;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e0e0e0 !important;
}

.analytics-docs {
  max-width: 800px;
  margin: 0 auto;
}
.analytics-docs .v-icon {
  margin-top: -4px;
}
</style>