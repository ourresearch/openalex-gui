<template>
  <div :class="{'expanded': isExpanded}" class="rounded">
    <div class="columns-controls-line" />
    
    <!-- Display -->
    <div v-if="showSections.includes('display')" class="columns-controls-box">
      <div class="query-section-label">Display</div>
      <!-- Visible Columns -->
      <div class="columns-list flex flex-wrap items-center gap-1" :style="{'border-color': displayColumnsColorHex}">
        <Badge 
          v-for="(column, index) in visibleDataColumns" 
          :key="index" 
          variant="secondary"
          class="query-builder-chip cursor-pointer"
        >
          {{ filters.titleCase(column.displayName) }}
          <X
            v-if="visibleDataColumns.length > 1" 
            @click="removeColumn(column)" 
            class="h-3 w-3 ml-1 cursor-pointer"
          />
        </Badge>
        <!-- Columns Button/Menu -->
        <DropdownMenu v-model:open="isDataColumnsMenuOpen">
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" class="h-6 px-2">
              <Plus class="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="max-h-[calc(60vh-56px)] overflow-y-auto">
            <DropdownMenuItem
              v-for="column in availableDataColumns"
              :key="column.id"
              @click="toggleColumn(column)"
            >
              <Check v-if="query.show_columns.includes(column.column_id)" class="h-4 w-4 mr-2" />
              <span v-else class="w-4 mr-2"></span>
              {{ filters.titleCase(column.displayName) }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Calculate -->
    <div v-if="showSections.includes('calculate') && availableMetricsColumns.length > 0">
      <div class="columns-controls-box">
        <div class="query-section-label">Calculate</div>
        <!-- Visible Columns -->
        <div class="columns-list flex flex-wrap items-center gap-1" :style="{'border-color': catWorksHex}">
          <Badge 
            v-for="(column, index) in visibleMetricsColumns" 
            :key="index" 
            variant="secondary"
            class="query-builder-chip cursor-pointer"
          >
            {{ filters.titleCase(column.displayName) }}
            <X @click="removeColumn(column)" class="h-3 w-3 ml-1 cursor-pointer" />
          </Badge>
          <!-- Metrics Button/Menu -->
          <DropdownMenu v-model:open="isMetricsColumnsMenuOpen">
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" class="h-6 px-2">
                <Plus class="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="max-h-[calc(60vh-56px)] overflow-y-auto">
              <DropdownMenuItem
                v-for="column in availableMetricsColumns"
                :key="column.id"
                @click="toggleColumn(column)"
              >
                <Check v-if="query.show_columns.includes(column.column_id)" class="h-4 w-4 mr-2" />
                <span v-else class="w-4 mr-2"></span>
                {{ filters.titleCase(column.displayName) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    <!-- Sort by -->
    <div v-if="showSections.includes('sort')" class="sort-box columns-controls-box">
      <!-- Sort by Column -->
      <div class="query-section-label" v-if="sortByColumn">Sort by</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge variant="secondary" class="query-builder-chip cursor-pointer rounded-r-none border-r">
            {{ filters.titleCase((sortByColumn.displayNameForColumn || sortByColumn.displayName)) }}
            <ChevronDown class="h-3 w-3 ml-1" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            v-for="column in availableSortByColumns"
            :key="column.column_id"
            @click="setSortByColumn(column.column_id)"
          >
            <Check v-if="column.column_id === query.sort_by_column" class="h-4 w-4 mr-2" />
            <span v-else class="w-4 mr-2"></span>
            {{ filters.titleCase(column.displayName) }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Sort by Order -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge variant="secondary" class="query-builder-chip cursor-pointer rounded-l-none">
            <ArrowDown v-if="query.sort_by_order === 'desc'" class="h-3 w-3" />
            <ArrowUp v-else class="h-3 w-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            v-for="order in ['desc', 'asc']"
            :key="order"
            @click="setOrder(order)"
          >
            <Check v-if="order === query.sort_by_order" class="h-4 w-4 mr-2" />
            <span v-else class="w-4 mr-2"></span>
            {{ {"desc": "Descending", "asc": "Ascending"}[order] }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

import { X, Plus, Check, ChevronDown, ArrowDown, ArrowUp } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
  align-items: center;
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
.query-builder-chip {
  height: 22px;
  padding: 0 5px;
}
</style>