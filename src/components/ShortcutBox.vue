<template>
  <div>
    <v-autocomplete
      v-model="select"
      :items="suggestions"
      item-title="displayValue"
      :search="searchString" @update:search="onSearchInputUpdate"
      :customFilter="(item, queryText, itemText) => true"
      :menu-props="{maxHeight: 600,}"
      return-object
      :density="dense ? 'compact' : undefined"
      variant="solo-filled"
      flat
      
      clearable
      
      hide-no-data
      hide-details
      class="shortcut-box"
      :placeholder="placeholder"
      ref="shortcutBoxRef"
      :autofocus="autofocus"
      :loading="isLoading"
      @update:model-value="onChange"
      @click:clear="clickClear"
      @keydown.enter="isEnterPressed = true"
      @keyup.enter="onEnterKeyup"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <template v-slot:prepend-inner>
        <v-icon :color="isFocused ? 'primary' : 'grey'">mdi-magnify</v-icon>
        <v-chip
          v-if="newFilter"
          closable
          @click:close="clear"
          class="pa-5"
          style=" border-radius: 30px;"
        >
          <v-icon start>
            {{ newFilter.icon }}
          </v-icon>
          {{ newFilter?.displayName }}
        </v-chip>
      </template>

      <template v-slot:item="data">
        <v-list-item
          :value="data.item.raw?.value ?? data.item.value"
          active-class="bg-primary-lighten-4"
          :active="data.props.selected"
          @click="onChange(data.item.raw ?? data.item)"
        >
          <template #prepend>
            <v-icon>{{ data.item.raw?.icon ?? data.item.icon }}</v-icon>
          </template>

          <div>
            <!-- Filter link -->
            <template v-if="data.item.raw?.isFilterLink ?? data.item.isFilterLink">
              <v-list-item-title>
                <span class="font-weight-bold">{{ filters.capitalize(data.item.raw?.displayValue ?? data.item.displayValue) }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                Filter by {{ data.item.raw?.displayValue ?? data.item.displayValue }}
              </v-list-item-subtitle>
            </template>

            <!-- Default search -->
            <template v-else-if="(data.item.raw?.key ?? data.item.key) === defaultSearchType">
              <v-list-item-title>
                <span class="">Search for</span>
                <span class="mx-2 font-weight-medium">"{{ searchString }}"</span>
                <span class="mr-2">in {{ filters.pluralize(entityType, 1) }} {{ data.item.raw?.displayName ?? data.item.displayName }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                press Enter
              </v-list-item-subtitle>
            </template>

            <!-- Entity -->
            <template v-else>
              <v-list-item-title style="white-space: normal;">
                {{ filters.prettyTitle(data.item.raw?.displayValue ?? data.item.displayValue) }}
              </v-list-item-title>
              <v-list-item-subtitle style="white-space: normal;">
                {{ filters.capitalize(data.item.raw?.displayName ?? data.item.displayName) }}
                <span v-if="data.item.raw?.hint ?? data.item.hint">
                  {{ filters.truncate(data.item.raw?.hint ?? data.item.hint) }}
                </span>
              </v-list-item-subtitle>
            </template>
          </div>

          <!-- Info / Filter button -->
          <template #append>
            <v-icon v-if="data.item.raw?.isFilterLink ?? data.item.isFilterLink">
              mdi-filter-plus
            </v-icon>
            <v-btn 
              v-else-if="data.item.raw?.entityId ?? data.item.entityId" 
              icon
              variant="plain"
              @click.stop="goToEntity(data.item.raw?.value ?? data.item.value)"
              tabindex="-1"
            >
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>

    <div class="ml-2 mt-2" v-if="showExamples">
      <span class="text-body-2 text-grey">Try:</span>
      <v-btn
        v-for="search in searchesToTry"
        :key="search"
        variant="text"
        class="font-weight-regular"
        @click="trySearch(search)"
      >
        {{ search }}
      </v-btn>
    </div>
  </div>
</template>


<script setup>
import _ from 'lodash';
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import { api } from '@/api';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { urlPartsFromId } from '@/entityConfigs';
import { findFacetConfigs } from '@/facetConfigs';

defineOptions({
  name: 'ShortcutBox'
});

const props = defineProps({
  dense: Boolean,
  showExamples: Boolean,
  autofocus: Boolean
});

const shortcutBoxRef = ref(null);
const isLoading = ref(false);
const searchString = ref('');
const suggestions = ref([]);
const newFilter = ref(null);
const select = ref(null);
const interval = ref(null);
const isEnterPressed = ref(false);
const isProgrammaticInput = ref(false);
const isFocused = ref(false);
const store = useStore();
const route = useRoute();
const router = useRouter();

const searchesToTry = [
  'Claudia Goldin',
  'coriander OR cilantro',
  'Institution'
];

const entityType = computed(() => store.getters.entityType);
const cleanedSearchString = computed(() =>
  searchString.value ? searchString.value.replace(/[,:]/g, '') : searchString.value
);
const defaultSearchType = computed(() =>
  entityType.value === 'works' ? 'title_and_abstract.search' : 'default.search'
);

const filterSuggestions = computed(() => {
  if (!searchString.value || searchString.value.length < 3) return [];

  const rawSuggestions = findFacetConfigs(entityType.value, searchString.value)
    .filter(f => f.actions?.includes('filter'))
    .map(f => ({
      ...f,
      isFilterLink: true,
      displayValue: f.displayName,
      isDisabled: url.isFilterKeyAvailableToCreate(route, entityType.value, f.key)
    }));

  return rawSuggestions.sort((a, b) =>
    a.displayValue.length > b.displayValue.length ? 1 : -1
  );
});

const placeholder = computed(() => {
  const displayName = newFilter.value?.displayName;
  const pluralized = displayName ? filters.pluralize(displayName, 2) : null;

  if (!newFilter.value) {
    return entityType.value === 'works' ? 'Search OpenAlex' : `Search ${entityType.value}`;
  } else if (newFilter.value.key === 'publication_year') {
    return 'Enter year or range of years';
  } else if (newFilter.value.type === 'range') {
    return 'Enter number or range';
  } else if (newFilter.value.type === 'search') {
    return `Search within ${pluralized}`;
  } else {
    return `Search ${pluralized}`;
  }
});

function clear() {
  searchString.value = '';
  suggestions.value = [];
  newFilter.value = null;
}

function clickClear() {
  suggestions.value = [];
  searchString.value = '';
  newFilter.value = null;
}

function selectFilter(filter) {
  if (filter.type === 'boolean') {
    const oldFilters = url.readFilters(route);
    const newF = createSimpleFilter('works', filter.key, true);
    filter.value = true;
    url.pushNewFilters([...oldFilters, newF]);
  } else {
    newFilter.value = filter;
  }
}

function onChange(myFilterData) {
  if (isProgrammaticInput.value || !myFilterData) return;
  if (select.value) isEnterPressed.value = false;

  if (myFilterData.key === defaultSearchType.value) {
    submitSearchString();
  } else if (myFilterData?.isFilterLink) {
    selectFilter(myFilterData);
  } else if (myFilterData?.value) {
    url.pushNewFilters([...url.readFilters(route), myFilterData]);
    clear();
  }

  setTimeout(() => {
    searchString.value = '';
    select.value = null;
    suggestions.value = [];
  });
}

function onEnterKeyup() {
  if (!isEnterPressed.value) return;

  if (!searchString.value && props.showExamples) {
    url.pushToRoute(router, { name: 'Serp', params: { entityType: entityType.value } });
    return;
  }

  const filterKey = newFilter.value?.key ?? defaultSearchType.value;
  url.createFilter(entityType.value, filterKey, cleanedSearchString.value);
  isEnterPressed.value = false;
}

function submitSearchString() {
  if (!searchString.value) {
    url.pushToRoute(router, { name: 'Serp', params: { entityType: entityType.value } });
  } else {
    const searchFilter = createSimpleFilter(entityType.value, defaultSearchType.value, cleanedSearchString.value);
    url.pushNewFilters([...url.readFilters(route), searchFilter]);
  }
}

function goToEntity(id) {
  console.log('goToEntity()', id);
  url.pushToRoute(router, {
    name: 'EntityPage',
    params: urlPartsFromId(id)
  });
}

function trySearch(str) {
  isProgrammaticInput.value = true;
  suggestions.value = [];
  select.value = str;
  searchString.value = str;

  nextTick(async () => {
    shortcutBoxRef.value?.focus();
    const input = shortcutBoxRef.value?.$el?.querySelector('input');
    if (input) input.value = str;

    if (searchString.value?.length) {
      await getSuggestions();
    }

    isProgrammaticInput.value = false;
  });
}

function onSearchInputUpdate(val) {
  searchString.value = val;

  if (newFilter.value?.type !== 'select') {
    if (val?.length) {
      getSuggestions();
    } else {
      suggestions.value = [];
    }
  }
}

const getSuggestions = _.debounce(async () => {
  const fulltext = createSimpleFilter(entityType.value, defaultSearchType.value, cleanedSearchString.value);

  if (searchString.value === 'coriander OR cilantro') {
    suggestions.value = [fulltext];
    return;
  }

  isLoading.value = true;

  try {
    if (newFilter.value && !searchString.value) {
      suggestions.value = await api.getGroups(entityType.value, newFilter.value.key);
      isLoading.value = false;
      return;
    }

    if (!newFilter.value && !searchString.value) {
      suggestions.value = [];
      isLoading.value = false;
      return;
    }

    const apiSugg = await api.getSuggestions(
      entityType.value,
      newFilter.value?.key,
      searchString.value,
      url.readFilters(route)
    );

    isLoading.value = false;

    const base = [...(newFilter.value ? [] : filterSuggestions.value), ...apiSugg];
    const allWorks = base.every(f => f.entityId === 'works');

    const cleaned = allWorks
      ? base.slice(0, 3)
      : base.filter(f => f.entityId !== 'works').slice(0, 5);

    if (!newFilter.value) {
      cleaned.push(fulltext);
    }

    //console.log('cleaned suggestions', cleaned);
    suggestions.value = cleaned;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    // Fall back to just showing the fulltext search option
    suggestions.value = [fulltext];
    isLoading.value = false;
  }
}, 100);

watch(searchString, val => {
  if (val === null || val === undefined) return;
  if (newFilter.value?.type && newFilter.value.type !== 'select') return;
  getSuggestions();
});

watch(() => route.fullPath, () => {
  clear();
});
</script>


<style lang="scss">

.v-autocomplete__content {
  max-width: 400px !important;
}
.shortcut-box {
  .v-input__append-inner:last-of-type {
    display: none !important; // hide the down-caret icon
  }
}

</style>