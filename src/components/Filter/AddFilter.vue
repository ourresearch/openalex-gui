<template>
  <div>
    <v-menu location="top left" :offset="[-60, 0]" location-strategy="connected" :close-on-content-click="false">
      <template v-slot:activator="{props}">
        <v-fab-transition>
          <v-btn
              v-if="isFabShowing"
              v-bind="props"
              icon
              size="large"
              color="primary"
              class="rounded-circle"
          >
            <v-icon>mdi-plus-thick</v-icon>
          </v-btn>
        </v-fab-transition>
      </template>

      <v-card class="add-filter-menu-card rounded-o pr-5">
        <v-text-field
          v-model="searchString"
          variant="default"
          hide-details
          autofocus
          placeholder="Search all filters"
          @keyup.enter="onEnter"
          @keydown.down="onDownArrow"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-magnify</v-icon>
          </template>
        </v-text-field>

        <v-divider/>
        
        <v-list v-if="searchString">
          <v-list-item
              v-for="filter in potentialFiltersSearchResults"
              :key="filter.key"
              @click="setNewFilterKey(filter.key)"
              :disabled="filter.disabled"
          >
            <template #prepend>
              <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ filters.titleCase(filter.displayName) }}
            </v-list-item-title>        
          </v-list-item>
        </v-list>

        <v-list v-if="!searchString">
          <v-list-item
              v-for="filter in potentialFiltersPopular"
              :key="filter.key"
              @click="setNewFilterKey(filter.key)"
              :disabled="filter.disabled"
          >
            <template #prepend>
              <v-icon :disabled="filter.disabled">{{ filter.icon }}</v-icon>
            </template>
            <v-list-item-title>
              {{ filters.titleCase(filter.displayName) }}
            </v-list-item-title>
          </v-list-item>
          <v-divider/>
          <v-list-item
              key="more-filters"
              @click="isDialogOpen = true"
          >
            <template #prepend>
              <v-icon>mdi-dots-horizontal</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">
              More
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>

    <v-dialog
      v-model="isDialogOpen"
      width="800"
      scrollable
    >
      <v-card class="rounded-o">
        <v-text-field
            v-model="searchString"
            variant="default"
            bg-color="white"
            :prepend-inner-icon="prependIcon"
            hide-details
            autofocus
            :placeholder="placeholder"
            style=""
            class="add-filter-text-field mr-4 py-3 text-lg-h5 font-weight-regular"
            append-icon="mdi-close"
            @keyup.enter="onEnter"
            @keydown.down="onDownArrow"
            @click:append="clickCloseSearch"
            @click:prepend-inner="clickPrependIcon"
        />
        <v-divider/>

        <v-card-text :style="{height: dialogBodyHeight}" class="add-filter-dialog-body pa-0">
          <!-- Filter selected, user entering value -->
          <div v-if="newFilterKey" class="">
            <filter-card-range v-if="newFilterConfig.type === 'range'" :filter-key="newFilterKey"/>
            <filter-card-search v-if="newFilterConfig.type === 'search'" :filter-key="newFilterKey"/>
            <filter-select-add-option
                v-if="newFilterConfig.type === 'select'"
                :filter-key="newFilterKey"
                :is-open="isMenuOpen"
                :search-string="searchString"
                :filters="url.readFilters($route)"
            />
          </div>

          <!-- No filter selected yet, what are my options? -->
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
import { facetConfigs, getFacetConfig } from '@/facetConfigs';

import FilterCardRange from '@/components/FilterCard/FilterCardRange.vue';
import FilterCardSearch from '@/components/FilterCard/FilterCardSearch.vue';
import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'AddFilter' });

defineProps({
  includeChips: Boolean
});

// Routing and store
const route = useRoute();
const store = useStore();
const entityType = computed(() => store.getters.entityType);

// Reactive state
const searchString = ref('');
const isMenuOpen = ref(false);
const isDialogOpen = ref(false);
const newFilterKey = ref(null);
const isFabShowing = ref(false);

// Derived config
const newFilterConfig = computed(() => {
  if (!newFilterKey.value) { return null; }
  return getFacetConfig(entityType.value, newFilterKey.value);
});

// Computed values
const dialogBodyHeight = computed(() => {
  const fullHeight = !newFilterKey.value || newFilterConfig.value?.type === 'select';
  return fullHeight ? '80vh' : 0;
});

const prependIcon = computed(() => newFilterKey.value ? 'mdi-arrow-left' : 'mdi-magnify');

const potentialFilters = computed(() =>
  facetConfigs(entityType.value)
    .filter(conf => conf.actions?.includes('filter'))
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

const placeholder = computed(() => {
  const displayName = newFilterConfig.value?.displayName;
  const pluralized = displayName ? filters.pluralize(displayName, 2) : null;

  if (!newFilterKey.value) return 'Search all filters';
  if (newFilterKey.value === 'publication_year') return 'Enter year or range of years';
  if (newFilterConfig.value?.type === 'range') return 'Enter number or range';
  if (newFilterConfig.value?.type === 'search') return 'Search within ' + pluralized;
  return 'Search ' + pluralized;
});

// Methods
function onDownArrow(event) {
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
    url.pushNewFilters([...oldFilters, newFilter]);
  } else {
    newFilterKey.value = filterKey;
    if (filterKey) isDialogOpen.value = true;
  }
}

function clickCloseSearch() {
  searchString.value ? searchString.value = '' : closeDialog();
}

function closeDialog() {
  searchString.value = '';
  isDialogOpen.value = false;
  newFilterKey.value = null;
}

function clickPrependIcon() {
  if (newFilterKey.value) {
    newFilterKey.value = null;
    searchString.value = '';
  }
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    isFabShowing.value = true;
  }, 1);
});

// Watchers
watch(isDialogOpen, to => {
  if (!to) {
    searchString.value = '';
    newFilterKey.value = null;
  }
});

watch(newFilterKey, () => {
  searchString.value = '';
});

watch(() => route.fullPath, () => {
  closeDialog();
});
</script>


<style lang="scss">
.add-filter-menu-card {
  width: auto;
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