<template>
  <div>
    <v-fab-transition>
      <selection-menu
        v-if="isFabShowing"
        :all-keys="potentialFilters.map(f => f.key)"
        :popular-keys="potentialFiltersPopular.map(f => f.key)"
        :disabled-keys="potentialFilters.filter(f => f.disabled).map(f => f.key)"
        :get-display-name="getFilterDisplayName"
        :get-icon="getFilterIcon"
        search-placeholder="Search all filters"
        more-dialog-title="All Filters"
        location="top left"
        :offset="[-60, 0]"
        @select="setNewFilterKey"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            class="light-border"
            style="background-color: white !important;"
          >
            <v-icon start>mdi-plus</v-icon>
            Add filter
          </v-btn>
        </template>
      </selection-menu>
    </v-fab-transition>

    <!-- Filter Dialog: Value Inputs or Full Filter List -->
    <v-dialog
      v-model="isDialogOpen"
      width="800"
      scrollable
    >
      <v-card class="add-filter-dialog-card rounded-o">
        <v-text-field
          v-model="searchString"
          variant="plain"
          bg-color="white"
          flat
          hide-details
          center-affix
          autofocus
          :placeholder="placeholderText"
          class="add-filter-text-field mr-4 py-3 text-lg-h5 font-weight-regular"
          @keyup.enter="onEnter"
          @keydown.down="onDownArrow"
        >
          <template #prepend-inner>
            <v-icon class="ml-4">{{ prependIcon }}</v-icon>
          </template>
          <template #append-inner>
            <v-icon @click="clickCloseSearch">mdi-close</v-icon>
          </template>
        </v-text-field>

        <v-divider/>

        <v-card-text :style="{height: dialogBodyHeight}" class="add-filter-dialog-body pa-0">
          <!-- Filter selected, user choosing value -->
          <div v-if="newFilterKey">
            <filter-select-add-option
              v-if="newFilterConfig.type === 'selectEntity'"
              :filter-key="newFilterKey"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="url.readFilters($route)"
              :defer-updates="true"
              :local-selection="localSelection"
              @toggle-selection="toggleSelection"
            />
          </div>

          <!-- No filter selected, what are my options? -->
          <div v-else>
            <v-list-subheader class="pl-5">
              {{ searchString ? "Search results" : "All filters" }}
              ({{ potentialFiltersSearchResults.length }})
            </v-list-subheader>
            <v-list class="d-flex flex-wrap" nav>
              <v-list-item
                  v-for="filter in potentialFiltersSearchResults"
                  :key="filter.key"
                  @click="setNewFilterKey(filter.key)"
                  :disabled="filter.disabled"
                  style="        
                    flex: 0 1 250px; 
                    min-width: 0;
                    align-items: flex-start;"
              >
                <template #prepend> 
                  <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
                </template>
                <v-list-item-title class="filter-list-item-title">
                  {{ filters.titleCase(filter.displayName) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <template v-if="newFilterKey && newFilterConfig?.type === 'selectEntity'">
          <v-divider />
          <v-card-actions class="pa-3 justify-end">
            <v-btn
              variant="plain"
              class="text-black"
              @click="closeDialog"
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
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';

import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';

defineOptions({ name: 'AddFilter' });

const route = useRoute();
const store = useStore();

const searchString = ref('');
const isDialogOpen = ref(false);
const newFilterKey = ref(null);
const isFabShowing = ref(false);
const localSelection = ref([]);

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const newSearchEnabled = computed(() => store.getters.featureFlags.newSearch);

// Derived config
const newFilterConfig = computed(() => {
  if (!newFilterKey.value) { return null; }
  return getFacetConfig(entityType.value, newFilterKey.value);
});

// Computed values
const dialogBodyHeight = computed(() => {
  if (!newFilterKey.value) return '80vh';
  if (newFilterConfig.value?.type === 'selectEntity') return '70vh'; // Reduced to make room for footer
  return 0;
});

const prependIcon = computed(() => 'mdi-magnify');

const potentialFilters = computed(() =>
  facetConfigs(entityType.value)
    .filter(conf => conf.actions?.includes('filter'))
    .filter(conf => !conf.requiresApiKey || isAdmin.value)
    .filter(conf => {
      // Hide is_xpac filter unless include_xpac is enabled
      if (conf.key === 'is_xpac' && route.query.include_xpac !== 'true') {
        return false;
      }
      // Hide search-type facets when new search is enabled
      if (newSearchEnabled.value && conf.type === 'search') {
        return false;
      }
      return true;
    })
    .map(f => ({
      ...f,
      disabled: !url.isFilterKeyAvailableToCreate(route, entityType.value, f.key)
    }))
);

const potentialFiltersPopular = computed(() =>
  potentialFilters.value.filter(f => f.actionsPopular?.includes('filter'))
);

const potentialFiltersSearchResults = computed(() => {
  const query = searchString.value.toLowerCase();
  return potentialFilters.value.filter(f =>
    f.displayName.toLowerCase().includes(query)
  );
});

const placeholderText = computed(() => {
  const displayName = newFilterConfig.value?.displayName;
  const pluralized = displayName ? filters.pluralize(displayName, 2) : null;

  if (!newFilterKey.value) return 'Search all filters';
  if (newFilterKey.value === 'publication_year') return 'Enter year or range of years';
  if (newFilterConfig.value?.type === 'range') return 'Enter number or range';
  if (newFilterConfig.value?.type === 'search') return 'Search within ' + pluralized;
  return 'Search ' + pluralized;
});

const getFilterDisplayName = (key) => {
  return filters.titleCase(potentialFilters.value.find(f => f.key === key)?.displayName || '');
};

const getFilterIcon = (key) => {
  return potentialFilters.value.find(f => f.key === key)?.icon || 'mdi-tag';
};

// Methods
function onDownArrow(event) {
  // Workaround to allow down arrow press to focus first element in list
  event.preventDefault();
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(focusable))
    .filter(el => !el.disabled && el.offsetParent !== null);
  const currentIndex = elements.indexOf(event.target);
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  } else if (elements.length > 0) {
    elements[0].focus();
  }
}

function onEnter() {
  if (['search', 'range'].includes(newFilterConfig.value?.type) && searchString.value) {
    url.createFilter(entityType.value, newFilterKey.value, searchString.value);
  }
}

function setNewFilterKey(filterKey) {
  const config = getFacetConfig(entityType.value, filterKey);
  if (config.type === 'boolean') {
    const oldFilters = url.readFilters(route);
    const newFilter = createSimpleFilter(entityType.value, filterKey, true);
    //console.log("Pushing new filter", newFilter);
    url.pushNewFilters([...oldFilters, newFilter]);
  } else {
    newFilterKey.value = filterKey;
    if (filterKey) { isDialogOpen.value = true; }
  }
}

function clickCloseSearch() {
  searchString.value ? searchString.value = '' : closeDialog();
}

function closeDialog() {
  searchString.value = '';
  isDialogOpen.value = false;
  newFilterKey.value = null;
  localSelection.value = [];
}

function toggleSelection(value) {
  const index = localSelection.value.indexOf(value);
  if (index === -1) {
    localSelection.value.push(value);
  } else {
    localSelection.value.splice(index, 1);
  }
}

function applySelections() {
  if (localSelection.value.length > 0 && newFilterKey.value) {
    // Get current filters (keep all existing filters intact)
    const currentFilters = url.readFilters(route);

    // Get the options that are already applied for this filter key
    const existingOptions = url.readFilterOptionsByKey(route, entityType.value, newFilterKey.value) || [];

    // Find newly selected values (not already in existing filters)
    const newSelections = localSelection.value.filter(v => !existingOptions.includes(v));

    // Find deselected values (were in existing filters but no longer selected)
    const deselectedOptions = existingOptions.filter(v => !localSelection.value.includes(v));

    // Remove deselected options from existing filters
    let updatedFilters = currentFilters;
    if (deselectedOptions.length > 0) {
      updatedFilters = currentFilters.map(f => {
        if (f.key !== newFilterKey.value) return f;
        // Remove deselected options from this filter's value
        const filterOptions = f.value.split('|').filter(opt => !deselectedOptions.includes(opt));
        if (filterOptions.length === 0) return null; // Filter will be removed
        return createSimpleFilter(entityType.value, f.key, filterOptions.join('|'), f.isNegated);
      }).filter(f => f !== null);
    }

    // Add each new selection as a separate filter (AND logic via comma separation)
    newSelections.forEach(value => {
      const newFilter = createSimpleFilter(entityType.value, newFilterKey.value, value);
      updatedFilters.push(newFilter);
    });

    url.pushNewFilters(updatedFilters, entityType.value);
  }
  closeDialog();
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    // Fab Animation
    isFabShowing.value = true;
  }, 1);
});

// Watchers
watch(isDialogOpen, to => {
  if (to && newFilterKey.value) {
    // Initialize local selection from current filter state
    const currentOptions = url.readFilterOptionsByKey(route, entityType.value, newFilterKey.value) || [];
    localSelection.value = [...currentOptions];
  } else if (!to) {
    closeDialog();
  }
});

watch(newFilterKey, (to) => {
  searchString.value = '';
  if (to) {
    // Initialize local selection from current filter state when filter key is set
    const currentOptions = url.readFilterOptionsByKey(route, entityType.value, to) || [];
    localSelection.value = [...currentOptions];
  }
});

watch(() => route.fullPath, () => {
  closeDialog();
});
</script>


<style lang="scss">
.light-border {
  border-color: #ddd !important;
}
.add-filter-menu-card {
  width: auto;
  max-height: 70vh;
  min-height: 200px;
}
.add-filter-menu-card, .add-filter-dialog-card {
  input {
    padding-top: 4px !important;
  }
  .v-field__prepend-inner, .v-field__append-inner {
    padding-top: 12px !important;
  }
}
.add-filter-dialog-body {
  transition: height 300ms !important;
}
.v-list-item-title.filter-list-item-title {
  font-weight: normal !important;
  font-size: 16px !important;
  white-space: normal;
  overflow-wrap: break-word;
}
</style>