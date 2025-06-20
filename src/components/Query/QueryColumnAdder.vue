<template>
  <div>
    <!-- Menu Mode -->
    <template v-if="props.mode === 'menu'">
      <v-menu v-model="isMenuOpen" class="rounded-lg" location="bottom" max-height="50vh">
        <template v-slot:activator="{ props }">
          <v-btn icon variant="plain" v-bind="props">
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
      <v-btn icon variant="plain" @click="openDialog">
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
                    variant="flat"
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

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { getConfigs } from '@/oaxConfigs';
import filters from '@/filters';

defineOptions({ name: 'QueryColumnAdder'});

// Props
const props = defineProps({
  display: {
    type: String,
    default: 'data',
    validator: value => ['data', 'metrics'].includes(value)
  },
  mode: {
    type: String,
    default: 'menu',
    validator: value => ['menu', 'dialog'].includes(value)
  }
});

// Vuex store
const store = useStore();

// Refs
const isMenuOpen = ref(false);
const isDialogOpen = ref(false);
const columnSearch = ref('');
const selectedColumns = ref([]);
const originalColumns = ref([]);

// Vuex Getters
const query = computed(() => store.getters['search/query']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);

// Computed: current entity
const entity = computed(() => {
  return query.value.show_underlying_works ? 'works' : querySubjectEntity.value;
});

// Column configs
const columnConfigs = computed(() => {
  return getConfigs()[entity.value].columns;
});

// Available columns, filtered by action and display type
const availableColumns = computed(() => {
  const action = query.value.get_rows === 'summary' ? 'summary' : 'column';
  const allColumns = Object.values(columnConfigs.value)
    .filter(column => column.actions?.includes(action))
    .map(column => ({
      displayName: column.displayNameForColumn || column.displayName,
      column_id: column.id,
      icon: column.icon
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  if (query.value.get_rows === 'summary') {
    return allColumns;
  } else if (props.display === 'data') {
    return allColumns.filter(col => !col.column_id.includes('('));
  } else if (props.display === 'metrics') {
    return allColumns.filter(col => col.column_id.includes('('));
  }

  return [];
});

// Columns filtered by search
const filteredColumns = computed(() => {
  if (!columnSearch.value) {
    return availableColumns.value;
  }
  return availableColumns.value.filter(col =>
    col.displayName.toLowerCase().includes(columnSearch.value.toLowerCase())
  );
});

const color = computed(() => {
  if (props.display === 'metrics') {
    return 'catWorks';
  }
  return ['works', 'summary'].includes(entity.value) ? 'catWorks' : 'catEntity';
});

const buttonText = computed(() => {
  return props.display === 'data' ? 'Column' : 'Metric';
});

const dialogTitle = computed(() => {
  const subject = entity.value.charAt(0).toUpperCase() + entity.value.slice(1);
  return props.display === 'data' ? `${subject} Columns` : 'Metrics';
});

// Mutations and actions
const addReturnColumn = (id) => store.commit('search/addReturnColumn', id);
const deleteReturnColumn = (id) => store.commit('search/deleteReturnColumn', id);
const createSearch = () => store.dispatch('search/createSearch');

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
  createSearch();
}

function removeColumn(column) {
  deleteReturnColumn(column.column_id);
  createSearch();
}

function toggleColumnSelection(columnId) {
  if (selectedColumns.value.includes(columnId)) {
    selectedColumns.value = selectedColumns.value.filter(id => id !== columnId);
  } else {
    selectedColumns.value.push(columnId);
  }
}

function isColumnSelected(columnId) {
  return selectedColumns.value.includes(columnId);
}

function openDialog() {
  selectedColumns.value = [...query.value.show_columns];
  originalColumns.value = [...query.value.show_columns];
  isDialogOpen.value = true;
}

function cancelDialog() {
  isDialogOpen.value = false;
}

function applyChanges() {
  const toAdd = selectedColumns.value.filter(id => !originalColumns.value.includes(id));
  const toRemove = originalColumns.value.filter(id => !selectedColumns.value.includes(id));

  toAdd.forEach(addReturnColumn);
  toRemove.forEach(deleteReturnColumn);

  if (toAdd.length > 0 || toRemove.length > 0) {
    createSearch();
  }

  isDialogOpen.value = false;
}
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