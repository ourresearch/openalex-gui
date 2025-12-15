<template>
  <div>
    <!-- Title -->
    <h1 class="text-xl font-bold mb-4">{{ title }}</h1>
    
    <!-- Controls row: Search, Filters, Actions -->
    <div class="flex items-center gap-3 mb-4">
      <!-- Search field -->
      <div class="relative max-w-xs flex-shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchModel"
          :placeholder="searchPlaceholder"
          class="pl-9 pr-8"
          @update:model-value="onSearchInput"
          @keydown.escape="clearSearch"
        />
        <Button
          v-if="searchModel"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          @click="clearSearch"
        >
          <X class="h-3 w-3" />
        </Button>
      </div>

      <!-- Filter button with dropdown -->
      <Popover v-if="filters && filters.length">
        <PopoverTrigger>
          <Button
            variant="outline"
            size="sm"
            :class="hasActiveFilters ? 'border-primary text-primary' : ''"
          >
            <Filter class="h-4 w-4 mr-2" />
            {{ hasActiveFilters ? `Filters (${activeFilterCount})` : 'Filters' }}
            <ChevronDown class="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-64 p-3">
          <div v-for="filter in filters" :key="filter.key" class="mb-3">
            <Label class="text-xs text-muted-foreground mb-1">{{ filter.label }}</Label>
            <Select
              v-model="filterValues[filter.key]"
              @update:model-value="onFilterChange(filter.key, $event)"
            >
              <SelectTrigger>
                <SelectValue :placeholder="`All ${filter.label.toLowerCase()}`" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in filter.options"
                  :key="option[filter.itemValue || 'value']"
                  :value="option[filter.itemValue || 'value']"
                >
                  {{ option[filter.itemTitle || 'title'] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            class="mt-1"
            @click="clearAllFilters"
          >
            Clear all filters
          </Button>
        </PopoverContent>
      </Popover>

      <div class="flex-1" />

      <!-- Export CSV button -->
      <Button
        v-if="showExport"
        variant="outline"
        size="sm"
        :disabled="exporting"
        @click="$emit('export')"
      >
        <Download class="h-4 w-4 mr-2" />
        {{ exporting ? 'Exporting...' : 'Export CSV' }}
      </Button>

      <!-- Primary action button -->
      <Button
        v-if="createLabel"
        size="sm"
        @click="$emit('create')"
      >
        {{ createLabel }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

import { Search, X, Filter, ChevronDown, Download } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  searchValue: {
    type: String,
    default: ''
  },
  filters: {
    type: Array,
    default: () => []
  },
  activeFilters: {
    type: Object,
    default: () => ({})
  },
  showExport: {
    type: Boolean,
    default: false
  },
  exporting: {
    type: Boolean,
    default: false
  },
  createLabel: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:searchValue', 'search', 'filter', 'export', 'create', 'clear-filters']);

const searchModel = ref(props.searchValue);
const filterValues = ref({ ...props.activeFilters });

let debounceTimer = null;

watch(() => props.searchValue, (val) => {
  searchModel.value = val;
});

watch(() => props.activeFilters, (val) => {
  filterValues.value = { ...val };
}, { deep: true });

const hasActiveFilters = computed(() => {
  return Object.values(filterValues.value).some(v => v !== null && v !== undefined && v !== '');
});

const activeFilterCount = computed(() => {
  return Object.values(filterValues.value).filter(v => v !== null && v !== undefined && v !== '').length;
});

function onSearchInput(val) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('update:searchValue', val);
    emit('search', val);
  }, 300);
}

function clearSearch() {
  searchModel.value = '';
  emit('update:searchValue', '');
  emit('search', '');
}

function onFilterChange(key, value) {
  emit('filter', { key, value });
}

function clearAllFilters() {
  for (const key of Object.keys(filterValues.value)) {
    filterValues.value[key] = null;
  }
  emit('clear-filters');
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>
