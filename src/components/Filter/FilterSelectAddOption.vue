<template>
  <v-card tile flat :loading="isLoading">
    <v-list class="mt-0 pt-0">
      <v-list-subheader>
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
      </v-list-subheader>

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
        :defer-updates="props.deferUpdates"
        :local-selection="props.localSelection"
        @toggle-selection="(val) => emit('toggle-selection', val)"
      />
    </v-list>
  </v-card>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import _ from 'lodash';

import { api } from '@/api';
import { getFacetConfig } from '@/facetConfigUtils';
import { getEntityConfig } from '@/entityConfigs';

import FilterSelectEditRow from '@/components/Filter/FilterSelectEditRow.vue';

// Props
const props = defineProps({
  filterKey: String,
  filterIndex: Number,
  isOpen: Boolean,
  searchString: String,
  filters: Array,
  deferUpdates: Boolean,
  localSelection: Array,
  // The entity being *filtered* (e.g. "works" for a works group-by). On an entity
  // page store.getters.entityType is the page entity ("institutions"), so without
  // this the work-type "More…" picker would resolve the institution `type` config
  // and autocomplete institution-types instead of work-types (zd#8768).
  entityType: String,
  // OQL mode (oxjob #563): the live query as OQO. `filters` can't express it
  // (?filter= is empty in OQL mode), so when set, group-backed suggestions
  // aggregate against this query — matching the widget's own filtered counts.
  oqo: Object,
});

const emit = defineEmits(['close', 'toggle-selection']);

// Route and store
const store = useStore();
const route = useRoute();
const entityType = computed(() => props.entityType || store.getters.entityType);

// State
const suggestions = ref([]);
const isLoading = ref(false);

// Configs
const filterConfig = computed(() =>
  getFacetConfig(entityType.value, props.filterKey)
);

const entityConfig = computed(() => {
  // Range/date filters (e.g. publication_year) and string-only filters have no
  // entity to select, so there's no entity config to resolve. getEntityConfig()
  // throws on an undefined name, which crashed the year "More…" popup, so guard
  // the undefined case here and fall through to the no-autocomplete "All" path.
  if (filterConfig.value.isStringOnly || !filterConfig.value.entityToSelect) {
    return null;
  }
  return getEntityConfig(filterConfig.value.entityToSelect);
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
    props.filters ?? [],
    props.oqo
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