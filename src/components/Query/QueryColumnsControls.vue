<template>
  <v-card :class="{'expanded': isExpanded}" flat rounded>
    <div class="columns-controls-line" />
    
    <!-- Display -->
    <div v-if="showSections.includes('display')" class="columns-controls-box">
      <div class="query-section-label">Display</div>
      <!-- Visible Columns -->
      <div class="columns-list" :style="{'border-color': displayColumnsColorHex}">
        <v-chip 
          v-for="(column, index) in visibleDataColumns" 
          :key="index" 
          variant="flat" 
          label 
          :color="displayColumnsColor" 
          class="query-builder-chip mt-0"
        >
          {{ filters.titleCase(column.displayName) }}
          <v-icon
            v-if="visibleDataColumns.length > 1" 
            @click="removeColumn(column)" size="small" class="ml-1"
          >
            mdi-close
          </v-icon>
        </v-chip>
        <!-- Columns Button/Menu -->
        <v-menu v-model="isDataColumnsMenuOpen" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn class="query-builder-chip" variant="flat" size="small" :color="displayColumnsColor" v-bind="props"><v-icon size="small">mdi-plus</v-icon></v-btn>
          </template>
          <v-card flat rounded>
            <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
              <v-list-item
                v-for="column in availableDataColumns"
                :key="column.id"
                @click="toggleColumn(column)"
              >
                <v-icon>{{ column.icon }}</v-icon>
                <v-list-item-title>
                  {{ filters.titleCase(column.displayName) }}
                </v-list-item-title>
                <v-spacer />
                <v-icon v-if="(query.show_columns.includes(column.column_id))">mdi-check</v-icon>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
    </div>
    </div>

    <!-- Calculate -->
    <div v-if="showSections.includes('calculate') && availableMetricsColumns.length > 0">
      <div class="columns-controls-box">
        <div class="query-section-label">Calculate</div>
        <!-- Visible Columns -->
        <div class="columns-list" :style="{'border-color': catWorksHex}">
          <v-chip 
            v-for="(column, index) in visibleMetricsColumns" 
            :key="index" 
            class="query-builder-chip mt-0"  
            label
            variant="flat"
            color="catWorks"
          >
            {{ filters.titleCase(column.displayName) }}
            <v-icon
              @click="removeColumn(column)" size="small" class="ml-1">mdi-close</v-icon>
          </v-chip>
          <!-- Metrics Button/Menu -->
          <v-menu v-model="isMetricsColumnsMenuOpen" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn class="query-builder-chip" size="small" variant="flat" color="catWorks" v-bind="props"><v-icon size="small">mdi-plus</v-icon></v-btn>
            </template>
            <v-card flat rounded>
              <v-list class="py-0" style="max-height: calc(60vh - 56px); overflow-y: scroll;">
                <v-list-item
                    v-for="column in availableMetricsColumns"
                    :key="column.id"
                    @click="toggleColumn(column)"
                >
                  <v-icon>{{ column.icon }}</v-icon>
                  <v-list-item-title>
                    {{ filters.titleCase(column.displayName) }}
                  </v-list-item-title>
                  <v-spacer />
                  <v-icon v-if="(query.show_columns.includes(column.column_id))">mdi-check</v-icon>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Sort by -->
    <div v-if="showSections.includes('sort')" class="sort-box columns-controls-box">
    <!-- Sort by Column -->
      <div class="query-section-label" v-if="sortByColumn">Sort by</div>
      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <v-chip
            style="min-width: 1px !important;"
            class="mt-0 first query-builder-chip"
            :color="sortColor"
            label
            variant="flat" 
            v-bind="props" 
          >
            {{ filters.titleCase((sortByColumn.displayNameForColumn || sortByColumn.displayName)) }}
            <v-icon size="small">mdi-menu-down</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item
            v-for="column in availableSortByColumns"
            :key="column.column_id"
            :active="query.sort_by_column === column.column_id"
            @click="setSortByColumn(column.column_id)"
            active-class="primary--text"
          >
            <template #prepend>
              <v-icon>{{ column.icon }}</v-icon>
            </template>
            <v-list-item-title class="py-3">
              {{ filters.titleCase(column.displayName)}}
            </v-list-item-title>
            <template #append>
              <v-icon v-if="column.column_id===query.sort_by_column">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Sort by Order -->
      <v-menu location="bottom">
        <template v-slot:activator="{ props }">
          <v-chip
            label
            class="last query-builder-chip"
            :color="sortColor"
            variant="flat" 
            style="min-width: 1px !important;"
            v-bind="props" 
          >
            <v-icon size="small">{{ {"desc": "mdi-arrow-down", "asc": "mdi-arrow-up"}[query.sort_by_order] }}</v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item
            v-for="order in ['desc', 'asc']"
            :key="order"
            :active="query.sort_by_order === order"
            @click="setOrder(order)"
            active-class="primary--text"
          >
            <v-list-item-title class="py-3">
              {{ {"desc": "Descending", "asc": "Ascending"}[order] }}
            </v-list-item-title>
            <v-icon v-if="order===query.sort_by_order">mdi-check</v-icon>
          </v-list-item>
        </v-list>
      </v-menu>

    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import filters from '@/filters';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'QueryColumnsControl' });

const { showSections, isExpanded } = defineProps({
  showSections: {
    type: Array,
    default: () => ['display', 'calculate', 'sort']
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
});

const store = useStore();

const isDataColumnsMenuOpen = ref(false);
const isMetricsColumnsMenuOpen = ref(false);

const query = computed(() => store.getters['search/query']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);

// Column configs
const columnConfigs = computed(() => {
  return getConfigs()[querySubjectEntity.value].columns;
});

// Available columns
const availableColumns = computed(() => {
  return Object.values(columnConfigs.value)
    .filter(column => column.actions?.includes('column'))
    .map(column => ({
      displayName: column.displayNameForColumn || column.displayName,
      column_id: column.id,
      icon: column.icon
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
});

const availableDataColumns = computed(() => {
  return availableColumns.value.filter(col => !col.column_id.includes('('));
});

const availableMetricsColumns = computed(() => {
  return availableColumns.value.filter(col => col.column_id.includes('('));
});

// Visible columns
const visibleColumns = computed(() => {
  return query.value.show_columns.map(column => ({
    displayName: columnConfigs.value[column]?.displayNameForColumn || columnConfigs.value[column]?.displayName,
    column_id: column
  }));
});

const visibleDataColumns = computed(() => {
  return visibleColumns.value.filter(col => !col.column_id.includes('('));
});

const visibleMetricsColumns = computed(() => {
  return visibleColumns.value.filter(col => col.column_id.includes('('));
});

// Sortable columns
const availableSortByColumns = computed(() => {
  return Object.values(columnConfigs.value)
    .filter(column => column.actions?.includes('sort'))
    .map(column => ({
      displayName: column.displayNameForColumn || column.displayName,
      column_id: column.id,
      icon: column.icon
    }));
});

const sortByColumn = computed(() => {
  return columnConfigs.value?.[query.value.sort_by_column];
});

// Color logic
const displayColumnsColor = computed(() => {
  return ['works', 'summary'].includes(querySubjectEntity.value) ? 'catWorks' : 'catEntity';
});

const displayColumnsColorHex = computed(() => {
  const theme = store.state.vuetify?.theme?.themes?.light;
  const worksColor = theme?.catWorksDarker;
  const entityColor = theme?.catEntityDarker;
  return ['works', 'summary'].includes(querySubjectEntity.value) ? worksColor : entityColor;
});

const catWorksHex = computed(() => {
  return store.state.vuetify?.theme?.themes?.light?.catWorksDarker;
});

const sortColor = computed(() => {
  const base = ['works', 'summary'].includes(querySubjectEntity.value) ? 'catWorks' : 'catEntity';
  return query.value.sort_by_column.includes('(') ? 'catWorks' : base;
});

// Vuex mutations and actions
const addReturnColumn = (colId) => store.commit('search/addReturnColumn', colId);
const deleteReturnColumn = (colId) => store.commit('search/deleteReturnColumn', colId);
const setSortBy = (payload) => store.commit('search/setSortBy', payload);

// Methods
function toggleColumn(column) {
  if (query.value.show_columns.includes(column.column_id)) {
    removeColumn(column);
  } else {
    addColumn(column);
  }
}

function addColumn(column) {
  addReturnColumn(column.column_id);
}

function removeColumn(column) {
  deleteReturnColumn(column.column_id);
}

function setSortByColumn(columnId) {
  setSortBy({
    column_id: columnId,
    direction: query.value.sort_by_order
  });
}

function setOrder(order) {
  setSortBy({
    column_id: query.value.sort_by_column,
    direction: order
  });
}

// Lifecycle
onMounted(() => {
  if (!query.value.show_columns) {
    console.log('No show columns');
  }
});
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
.expanded .query-section-label {
  margin-bottom: 10px;
}
.expanded .columns-list {
  border-left-width: 3px;
  border-left-style: solid;
  padding-left: 15px;
}
.expanded .columns-controls-box {
  display: block;
}
.v-chip {
  cursor: pointer;
} 
.query-builder-chip {
  height: 22px !important;
  padding: 0px 5px !important;
  margin-right: 4px;
  margin-bottom: 4px;
}
.sort-box .v-chip.first {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-right: 5px !important;
  border-right: 1px solid #eee !important;
  margin-right: 0;
}
.sort-box .v-chip.last {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  margin-right: 0px;
  margin-left: 0;
}
</style>