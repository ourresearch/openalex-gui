<template>
  <div>
    <v-menu 
      v-model="isMenuOpen"
      location="top left"
      :offset="[-60, 0]"
      :close-on-content-click="false"
    >
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

      <v-card class="add-filter-menu-card rounded-o">
        <v-text-field
          v-model="searchString"
          ref="addFilterInitialInput"
          variant="plain"
          hide-details
          autofocus
          placeholder="Search all filters"
          @keyup.enter="onEnter"
          @keydown.down="onDownArrow"
        >
          <template #prepend-inner>
            <v-icon color="primary" class="ml-4">mdi-magnify</v-icon>
          </template>
        </v-text-field>

        <v-divider/>
        
        <v-list v-if="searchString">
          <template v-if="potentialFiltersSearchResults.length > 0">
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
          </template>
          <template v-else>
            <v-list-item>
              <v-list-item-title class="text-grey">No matching filters.</v-list-item-title>
            </v-list-item>
          </template>
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
            @click="isDialogOpen = true; isMenuOpen = false;"
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
              v-if="newFilterConfig.type === 'select'"
              :filter-key="newFilterKey"
              :is-open="isMenuOpen"
              :search-string="searchString"
              :filters="url.readFilters($route)"
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

import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';

defineOptions({ name: 'AddFilter' });

const route = useRoute();
const store = useStore();

const searchString = ref('');
const isMenuOpen = ref(false);
const isDialogOpen = ref(false);
const newFilterKey = ref(null);
const isFabShowing = ref(false);
const addFilterInitialInput = ref(null);

const entityType = computed(() => store.getters.entityType);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);

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
    .filter(conf => !conf.requiresApiKey || isLibrarian.value)
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
  isMenuOpen.value = false;
}

function clickCloseSearch() {
  searchString.value ? searchString.value = '' : closeDialog();
}

function closeDialog() {
  searchString.value = '';
  isDialogOpen.value = false;
  newFilterKey.value = null;
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    // Fab Animation
    isFabShowing.value = true;
  }, 1);
});

// Watchers
watch(isMenuOpen, async (to) => {
  if (to) {
    setTimeout(() => {
      if (addFilterInitialInput.value) {
        addFilterInitialInput.value.focus();
      }
    }, 50);
  }
});

watch(isDialogOpen, to => {
  if (!to) {
    closeDialog();
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