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
        v-if="optionIds.length > 0 && filterKey !== 'collection'"
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
        <!-- Cross-type collection filter (oxjob #273): when this field's type has
             ≥1 of the user's collections, offer a two-tab value picker — the
             field's own multi-select entity list, or a single-select Collections
             tab. No tabs when there are no matching collections (renders exactly
             as before). -->
        <template v-if="showTabs">
          <v-tabs v-model="activeTab" color="black" density="comfortable" grow>
            <v-tab value="default">{{ config.displayName }}</v-tab>
            <v-tab value="collections">
              <v-icon size="small" start>mdi-folder-outline</v-icon>
              Collections
            </v-tab>
          </v-tabs>
          <v-divider/>
        </template>

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
          <!-- Collections tab: single-select list of this field's collections -->
          <div v-if="showTabs && activeTab === 'collections'">
            <v-alert
                v-if="mixNote"
                type="info"
                variant="tonal"
                density="compact"
                class="ma-2 text-body-2"
            >{{ mixNote }}</v-alert>
            <v-list class="mt-0 pt-0">
              <v-list-subheader>
                {{ filteredCollections.length }}
                {{ filteredCollections.length === 1 ? 'collection' : 'collections' }}
              </v-list-subheader>
              <v-list-item
                  v-for="col in filteredCollections"
                  :key="col.value"
                  :active="selectedCollectionId === col.value"
                  @click="selectCollection(col.value)"
              >
                <template #prepend>
                  <v-icon>mdi-folder-outline</v-icon>
                </template>
                <v-list-item-title>{{ col.displayValue }}</v-list-item-title>
                <template #append>
                  <v-icon v-if="selectedCollectionId === col.value" color="black" class="mr-2">mdi-check</v-icon>
                  <span class="text-body-2 text-medium-emphasis">{{ filters.toPrecision(col.entityCount) }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="!filteredCollections.length" class="text-medium-emphasis">
                No collections found
              </v-list-item>
            </v-list>
          </div>

          <!-- Default tab: the field's own multi-select entity picker -->
          <filter-select-add-option
              v-else
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
import { api } from '@/api';
import filters from '@/filters';
import * as openalexId from '@/openalexId';
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

// Cross-type collection filter (oxjob #273) local state
const activeTab = ref('default');
const allCollections = ref([]);        // all of this field's matching collections (search-independent)
const selectedCollectionId = ref(null); // single-select
const mixNote = ref('');                // quiet inline note when a tab switch clears the other value

// Config for the facet
const config = computed(() => getFacetConfig(entityType.value, filterKey));

// Collections of this field's type only ever appear when the user owns some;
// the dedicated `collection` field keeps its own picker (no nested tab).
const showTabs = computed(() =>
  filterKey !== 'collection' && allCollections.value.length > 0
);

// Search filters the collections tab locally (instant — they're in the store).
const filteredCollections = computed(() => {
  const term = (searchString.value || '').trim().toLowerCase();
  if (!term) return allCollections.value;
  return allCollections.value.filter(c =>
    (c.displayValue || '').toLowerCase().includes(term)
  );
});

// Dynamic placeholder
const searchStringPlaceholder = computed(() =>
  (showTabs.value && activeTab.value === 'collections')
    ? 'Search collections'
    : 'Search ' + filters.pluralize(config.value.displayName, 2)
);

async function loadCollections() {
  if (filterKey === 'collection') {
    allCollections.value = [];
    return;
  }
  allCollections.value = await api.getCollectionSuggestionsForField(
    entityType.value, filterKey, ''
  );
}

// Single-select a collection. Re-clicking the active one clears it. Picking a
// collection clears any ticked entities (a `col_xxx` ref can't coexist with
// literal IDs in one clause — API #266 returns 400).
function selectCollection(colId) {
  if (selectedCollectionId.value === colId) {
    selectedCollectionId.value = null;
    return;
  }
  selectedCollectionId.value = colId;
  if (localSelection.value.length) {
    const n = localSelection.value.length;
    mixNote.value = `Using collection — cleared ${n} selected ${filters.pluralize(config.value.displayName, n)}`;
    localSelection.value = [];
  }
}

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
  // Ticking an individual entity clears a selected collection (no mixing in
  // one row — vice versa of selectCollection).
  if (selectedCollectionId.value) {
    selectedCollectionId.value = null;
    mixNote.value = 'Cleared collection — using individual values';
  }
  const idx = localSelection.value.indexOf(value);
  if (idx === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(idx, 1);
  }
}

function applySelections() {
  const currentFilters = url.readFilters(route).filter(f => f.key !== filterKey);

  if (selectedCollectionId.value) {
    // Cross-type collection ref as this field's value (oxjob #273): single,
    // replaces the key. Stored verbatim (col_ case preserved by createSimpleFilter).
    currentFilters.push(createSimpleFilter(entityType.value, filterKey, selectedCollectionId.value));
    url.pushNewFilters(currentFilters, entityType.value);
  } else if (localSelection.value.length > 0) {
    if (filterKey === 'collection') {
      // Collections are single-only (oxjob #228): one `collection:` filter per query.
      // Take just the first selected; matching server cap (elastic-api 400s
      // on >1 collection: filter). One filter entry, not pipe-OR.
      const first = localSelection.value[0];
      if (first) {
        currentFilters.push(createSimpleFilter(entityType.value, filterKey, first));
      }
    } else {
      // Default: pipe-OR within a single filter entry.
      const newFilterValue = localSelection.value.join('|');
      currentFilters.push(createSimpleFilter(entityType.value, filterKey, newFilterValue));
    }
    url.pushNewFilters(currentFilters, entityType.value);
  }
  close();
}

// Watchers
watch(isActive, (to) => {
  searchString.value = '';
  mixNote.value = '';
  activeTab.value = 'default';
  selectedCollectionId.value = null;
  if (to) {
    // Initialize from current filter options. A collection ref (col_xxx) lands
    // the picker on the Collections tab with it selected; otherwise the entity
    // tab with the literal IDs ticked.
    const opts = [...optionIds.value];
    const col = opts.find(o => openalexId.isCollectionId(o));
    if (col) {
      selectedCollectionId.value = col;
      localSelection.value = [];
      activeTab.value = 'collections';
    } else {
      localSelection.value = opts;
    }
    loadCollections();
  }
});

// Clear the transient mix note as soon as the user switches tabs.
watch(activeTab, () => { mixNote.value = ''; });
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