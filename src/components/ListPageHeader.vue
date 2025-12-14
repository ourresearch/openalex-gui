<template>
  <div class="list-page-header">
    <!-- Title -->
    <h1 class="text-h5 font-weight-bold mb-4">{{ title }}</h1>
    
    <!-- Controls row: Search, Filters, Actions -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Search field (always visible, Linear-style) -->
      <v-text-field
        v-model="searchModel"
        variant="outlined"
        density="compact"
        :placeholder="searchPlaceholder"
        hide-details
        class="search-field"
        @update:model-value="onSearchInput"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="searchModel" #append-inner>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="clearSearch"
          >
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <!-- Filter button with dropdown -->
      <v-menu v-if="filters && filters.length" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            class="text-none filter-btn"
            :color="hasActiveFilters ? 'primary' : undefined"
          >
            <v-icon start size="small">mdi-filter-variant</v-icon>
            {{ hasActiveFilters ? `Filters (${activeFilterCount})` : 'Filters' }}
            <v-icon end size="small">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card min-width="250" class="pa-3">
          <div v-for="filter in filters" :key="filter.key" class="mb-3">
            <div class="text-caption text-medium-emphasis mb-1">{{ filter.label }}</div>
            <v-select
              v-model="filterValues[filter.key]"
              :items="filter.options"
              :item-title="filter.itemTitle || 'title'"
              :item-value="filter.itemValue || 'value'"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              :placeholder="`All ${filter.label.toLowerCase()}`"
              @update:model-value="onFilterChange(filter.key, $event)"
            />
          </div>
          <v-btn
            v-if="hasActiveFilters"
            variant="text"
            size="small"
            class="text-none mt-1"
            @click="clearAllFilters"
          >
            Clear all filters
          </v-btn>
        </v-card>
      </v-menu>

      <v-spacer />

      <!-- Export CSV button -->
      <v-btn
        v-if="showExport"
        variant="outlined"
        size="small"
        class="text-none"
        :loading="exporting"
        :disabled="exporting"
        @click="$emit('export')"
      >
        <v-icon start size="small">mdi-download</v-icon>
        Export CSV
      </v-btn>

      <!-- Primary action button -->
      <v-btn
        v-if="createLabel"
        color="primary"
        variant="flat"
        size="small"
        class="text-none"
        @click="$emit('create')"
      >
        {{ createLabel }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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

<style scoped lang="scss">
.list-page-header {
  .search-field {
    max-width: 320px;
    flex-shrink: 0;
    
    :deep(.v-field) {
      border-radius: 6px;
    }
  }
  
  .filter-btn {
    border-radius: 6px;
  }
}
</style>
