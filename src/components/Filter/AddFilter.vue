<template>
  <div>
    <!-- In headless mode only the value-picking dialog is rendered; the parent
         drives it via the exposed openForKey() (e.g. the table column header's
         "Filter by this…"). The "Add filter" launcher + property picker are hidden. -->
    <template v-if="!headless">
    <selection-menu
      :all-keys="potentialFilters.map(f => f.key)"
      :popular-keys="potentialFiltersPopular.map(f => f.key)"
      :disabled-keys="potentialFilters.filter(f => f.disabled).map(f => f.key)"
      :get-display-name="getFilterDisplayName"
      :get-icon="getFilterIcon"
      search-placeholder="Search all filters"
      more-dialog-title="All Filters"
      location="top left"
      :offset="[-60, 0]"
      custom-more
      @select="setNewFilterKey"
      @more="isMoreFiltersDialogOpen = true"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
        >
          <v-icon start>mdi-plus</v-icon>
          Add filter
        </v-btn>
      </template>
    </selection-menu>

    <!-- Unified "more filters" picker (oxjob #293) -->
    <novice-filter-dialog
      v-model="isMoreFiltersDialogOpen"
      :facet-keys="potentialFilters.map(f => f.key)"
      :disabled-keys="potentialFilters.filter(f => f.disabled).map(f => f.key)"
      @select="setNewFilterKey"
    />
    </template>

    <!-- Filter Dialog: Value Inputs or Full Filter List -->
    <v-dialog
      v-model="isDialogOpen"
      width="800"
      scrollable
    >
      <!-- selectEntity value step: hand off to the SAME shared picker the novice
           chip + advanced filter row use (oxjob #350). It owns its own search,
           collections toggle, list, Apply, and URL-write; so we render it as the
           whole dialog body and skip our local search field / Cancel-Apply. -->
      <entity-value-picker
        v-if="newFilterKey && newFilterConfig?.type === 'selectEntity'"
        :filter-key="newFilterKey"
        :load-entities="loadEntities"
        max-height="80vh"
        @close="closeDialog"
      />

      <v-card v-else class="add-filter-dialog-card rounded-o">
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
          <!-- No filter selected yet → show the property options. (A range/search
               filter that's been chosen has no list step: the user types its
               value in the field above and hits enter.) -->
          <div v-if="!newFilterKey">
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
      </v-card>
    </v-dialog>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import { api } from '@/api';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { facetConfigs } from '@/facetConfigs';
import { getFacetConfig } from '@/facetConfigUtils';

import EntityValuePicker from '@/components/Filter/EntityValuePicker.vue';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';
import NoviceFilterDialog from '@/components/NoviceFilterDialog.vue';

defineOptions({ name: 'AddFilter' });

defineProps({
  // Headless: render only the value-picking dialog (no "Add filter" launcher /
  // property picker). The parent opens it pre-targeted via openForKey(). Used by
  // the table column header's "Filter by this…" so the property lands directly
  // on its value-picking step (oxjob #295 Phase 5).
  headless: { type: Boolean, default: false },
});

const route = useRoute();
const store = useStore();

const searchString = ref('');
const isDialogOpen = ref(false);
const isMoreFiltersDialogOpen = ref(false);
const newFilterKey = ref(null);

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);

const isSemanticSearch = computed(() => !!route.query['search.semantic']);

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
      // Hide search-type facets (handled by SearchBox now)
      if (conf.type === 'search' && conf.key !== 'doi_starts_with' && conf.key !== 'issn') {
        return false;
      }
      // Semantic search only supports a restricted set of filters
      if (isSemanticSearch.value && !conf.semanticSearchAllowed) {
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

// Open the value-picking dialog pre-targeted to a property (used in headless
// mode by the table column header's "Filter by this…"). Boolean properties are
// applied immediately by setNewFilterKey (no value step needed).
function openForKey(filterKey) {
  setNewFilterKey(filterKey);
}
defineExpose({ openForKey });

function clickCloseSearch() {
  searchString.value ? searchString.value = '' : closeDialog();
}

function closeDialog() {
  searchString.value = '';
  isDialogOpen.value = false;
  newFilterKey.value = null;
}

// Entity loader handed to the shared EntityValuePicker (selectEntity value step).
// The picker merges in collections + owns the Apply/URL-write itself, so this
// only needs to return the field's own entity suggestions.
const loadEntities = (searchStr) =>
  api.getSuggestions(entityType.value, newFilterKey.value, searchStr, []);

// Watchers
watch(isDialogOpen, to => {
  if (!to) closeDialog();
});

watch(newFilterKey, () => {
  searchString.value = '';
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