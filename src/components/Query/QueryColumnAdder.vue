<template>
  <div>
    <!-- Menu Mode -->
    <template v-if="props.mode === 'menu'">
      <DropdownMenu v-model:open="isMenuOpen">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <PlusCircle class="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-64">
          <div class="p-2">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="columnSearch"
                autofocus
                :placeholder="'Add ' + buttonText"
                class="pl-8"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div class="max-h-[calc(50vh-56px)] overflow-y-auto">
            <DropdownMenuItem
              v-for="column in filteredColumns"
              :key="column.column_id"
              @click="toggleColumn(column)"
            >
              <component :is="getIcon(column.icon)" class="h-4 w-4 mr-2" />
              {{ filters.titleCase(column.displayName) }}
              <Check v-if="query.show_columns.includes(column.column_id)" class="h-4 w-4 ml-auto" />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
    
    <!-- Dialog Mode -->
    <template v-else>
      <Button variant="ghost" size="icon" @click="openDialog">
        <PlusCircle class="h-5 w-5" />
      </Button>
      
      <Dialog v-model:open="isDialogOpen">
        <DialogContent class="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{{ dialogTitle }}</DialogTitle>
          </DialogHeader>
          
          <div class="max-h-[400px] overflow-y-auto py-4">
            <div class="grid grid-cols-3 gap-2">
              <Badge
                v-for="column in availableColumns"
                :key="column.column_id"
                @click="toggleColumnSelection(column.column_id)"
                :variant="isColumnSelected(column.column_id) ? 'default' : 'outline'"
                class="cursor-pointer justify-start px-2 py-1.5 h-8"
              >
                <component :is="getIcon(column.icon)" class="h-4 w-4 mr-1 flex-shrink-0" />
                <span class="truncate text-sm">{{ filters.titleCase(column.displayName) }}</span>
              </Badge>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" @click="cancelDialog">Cancel</Button>
            <Button @click="applyChanges">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { PlusCircle, Search, Check, FileText, Calendar, Quote, Users, Building, Globe, Tag, Hash, DollarSign, BarChart } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { getConfigs } from '@/oaxConfigs';
import filters from '@/filters';

// Map mdi icons to lucide icons
const iconMap = {
  'mdi-file-document': FileText,
  'mdi-calendar': Calendar,
  'mdi-format-quote-close': Quote,
  'mdi-account-group': Users,
  'mdi-domain': Building,
  'mdi-web': Globe,
  'mdi-tag': Tag,
  'mdi-pound': Hash,
  'mdi-currency-usd': DollarSign,
  'mdi-chart-bar': BarChart,
};

function getIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

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