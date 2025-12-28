<template>
  <filter-base :filter-key="filterKey" :index="index" @add-option="isActive = true">
    <div class="d-flex flex-wrap align-center">
      <template v-for="(id, i) in optionIds" :key="id">
        <filter-select-option
          :filter-value="id"
          :filter-key="filterKey"
          :position="i"
          @delete="deleteOption(id)"
        />
      </template>
      <v-btn
        v-if="optionIds.length > 0"
        icon
        size="small"
        variant="outlined"
        class="ml-1 light-border"
        @click="isActive = true"
      >
        <v-icon size="small" color="black">mdi-plus</v-icon>
      </v-btn>
    </div>

    <v-dialog
      v-model="isActive"
      :fullscreen="smAndDown"
      max-width="600"
      scrollable
    >
      <v-card class="bg-white">
        <v-text-field
            v-model="searchString"
            variant="plain"
            bg-color="white"
            hide-details
            autofocus
            :placeholder="searchStringPlaceholder"
            class="filter-select-search-field"
        >
          <template #prepend-inner>
            <v-icon class="ml-4">mdi-magnify</v-icon>
          </template>
          <template #append-inner>
            <v-icon @click="clickCloseSearch">mdi-close</v-icon>
          </template>
        </v-text-field>
        <v-divider/>
        <v-card-text class="pa-0" style="height: 70vh;">
          <filter-select-add-option
              :filter-key="filterKey"
              :filter-index="index"
              :is-open="isActive"
              :search-string="searchString"
              :defer-updates="true"
              :local-selection="localSelection"
              @close="close"
              @add="addOption"
              @toggle-selection="toggleSelection"
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3 justify-end">
          <v-btn
            variant="plain"
            class="text-black"
            @click="close"
          >
            Cancel
          </v-btn>
          <v-btn
            variant="flat"
            color="black"
            @click="applySelections"
          >
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </filter-base>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify'

import { url } from '@/url';
import filters from '@/filters';
import { getFacetConfig } from '@/facetConfigUtils';
import { makeSelectFilterValue, createSimpleFilter } from '@/filterConfigs';

import FilterSelectOption from '@/components/Filter/FilterSelectOption.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';
import FilterBase from '@/components/Filter/FilterBase.vue';

defineOptions({name: "FilterSelect"})

const {filterKey, index} = defineProps({
  filterKey: String,
  index: Number,
});
const emit = defineEmits(['upsert', 'close']);

// Route and store
const route = useRoute();
const store = useStore();

const { smAndDown } = useDisplay();

const entityType = computed(() => store.getters.entityType);

// Local state
const isActive = ref(false);
const searchString = ref('');
const localSelection = ref([]);

// Config for the facet
const config = computed(() => getFacetConfig(entityType.value, filterKey));

// Dynamic placeholder
const searchStringPlaceholder = computed(() =>
  'Search ' + filters.pluralize(config.value.displayName, 2)
);

// Selected option IDs with getter/setter
const optionIds = computed({
  get() {
    return url.readFilterOptions(route, entityType.value, index);
  },
  set(to) {
    console.log('set appliedOptionIds', to);
    const newValue = makeSelectFilterValue(to, 'any');
    emit('upsert', newValue);
  }
});

// Methods
function clickCloseSearch() {
  searchString.value ? searchString.value = '' : close();
}

function close() {
  console.log('FilterSelect close()');
  store.state.activeFilterKey = null;
  isActive.value = false;
  emit('close'); // still needed
}

function deleteOption(id) {
  url.deleteFilterOption(entityType.value, index, id);
}

function addOption(id) {
  console.log('FilterSelect addOption()', id, optionIds.value);
  close();
  optionIds.value.length
    ? url.addFilterOption(entityType.value, index, id)
    : url.createFilter(entityType.value, filterKey, id);
}

function toggleSelection(value) {
  const idx = localSelection.value.indexOf(value);
  if (idx === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(idx, 1);
  }
}

function applySelections() {
  if (localSelection.value.length > 0) {
    // Get current filters and remove any with this key
    const currentFilters = url.readFilters(route).filter(f => f.key !== filterKey);
    
    // Add new filter with all selected values
    const newFilterValue = localSelection.value.join('|');
    const newFilter = createSimpleFilter(entityType.value, filterKey, newFilterValue);
    currentFilters.push(newFilter);
    
    url.pushNewFilters(currentFilters, entityType.value);
  }
  close();
}

// Watchers
watch(isActive, (to) => {
  searchString.value = '';
  if (to) {
    // Initialize local selection from current filter options
    localSelection.value = [...optionIds.value];
  }
});
</script>


<style scoped lang="scss">
input {
  padding: 0 3px !important;
}
.light-border {
  border-color: #ddd !important;
}
</style>

<style lang="scss">
.filter-select-search-field {
  padding: 8px 16px !important;
  
  .v-field__prepend-inner {
    padding-left: 8px !important;
    padding-right: 12px !important;
    align-items: center !important;
  }
  
  .v-field__append-inner {
    align-items: center !important;
    padding-top: 0 !important;
  }
  
  .v-field__input {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    min-height: 32px !important;
    font-size: 16px !important;
  }
}
</style>