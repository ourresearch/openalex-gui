<template>
  <div class="relative">
    <div v-if="isLoading" class="absolute inset-x-0 top-0 h-1 bg-primary/20 overflow-hidden">
      <div class="h-full w-1/3 bg-primary animate-pulse"></div>
    </div>
    <div class="p-2">
      <p class="text-xs text-muted-foreground px-2 py-1">
        <template v-if="isLoading">
          Searching...
        </template>
        <template v-else-if="props.searchString && suggestions.length">
          Top search results ({{ suggestions.length }})
        </template>
        <template v-else-if="props.searchString && !suggestions.length">
          No results found
        </template>
        <template v-else>
          {{ hasAutocomplete ? "Top" : "All" }}
          {{ entityConfig?.name  }}
          ({{ suggestions.length }})
        </template>
      </p>

      <filter-select-edit-row
        v-for="row in suggestions"
        :key="row.value + row.count"
        :filter-key="props.filterKey"
        :filter-index="props.filterIndex"
        :value="row.value"
        :display-value="row.displayValue"
        :count="row.count"
        :hint="row.hint"
        :is-from-autocomplete="row.isFromAutocomplete"
      />
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import _ from 'lodash';

import { api } from '@/api';
import { getFacetConfig } from '@/facetConfigs';
import { getEntityConfig } from '@/entityConfigs';

import FilterSelectEditRow from '@/components/Filter/FilterSelectEditRow.vue';

// Props
const props = defineProps({
  filterKey: String,
  filterIndex: Number,
  isOpen: Boolean,
  searchString: String,
  filters: Array
});

const emit = defineEmits(['close']);

// Route and store
const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);

// State
const suggestions = ref([]);
const isLoading = ref(false);

// Configs
const filterConfig = computed(() =>
  getFacetConfig(entityType.value, props.filterKey)
);

const entityConfig = computed(() => {
  if (filterConfig.value.isStringOnly) {
    return null;
  }
  return getEntityConfig(filterConfig.value.entityId);
});

const hasAutocomplete = computed(() =>
  entityConfig.value?.hasAutocomplete
);

// Debounced suggestion fetching
const getSuggestions = _.debounce(async () => {
  isLoading.value = true;
  suggestions.value = await api.getSuggestions(
    entityType.value,
    props.filterKey,
    props.searchString,
    props.filters ?? []
  );
  isLoading.value = false;
}, 300, { leading: true });

// Watchers
watch(() => props.searchString, () => {
  suggestions.value = [];
  isLoading.value = true;
  getSuggestions();
});

watch(() => props.isOpen, () => {
  getSuggestions();
}, { immediate: true });

watch(() => route.fullPath, () => {
  emit('close');
});
</script>