<template>
  <div>
    <v-autocomplete
        v-model="select"
        :items="suggestions"
        :search-input.sync="searchString"
        :filter="(item, queryText, itemText) => true"
        :menu-props="{maxHeight: 600,}"
        item-text="displayValue"
        return-object
        rounded
        :dense="dense"
        filled
        clearable
        hide-no-data
        hide-details
        class="shortcut-box"
        :placeholder="placeholder"
        prepend-inner-icon="mdi-magnify"
        ref="shortcutBox"
        :autofocus="autofocus"
        :loading="isLoading"

        @change="onChange"
        @click:clear="clickClear"
        @keydown.enter="isEnterPressed = true"
        @keyup.enter="onEnterKeyup"
    >
      <!--        @blur="clear"-->
      <template v-slot:chip>
        <v-chip
            v-if="newFilter"
            close
            @click:close="clear"
            class="pa-5"
            style="margin: -9px 0 0 -9px; border-radius: 30px;"
        >
          <v-icon left>
            {{ newFilter.icon }}

          </v-icon>
          {{ newFilter?.displayName }}
        </v-chip>
      </template>


      <template v-slot:item="data">
        <span>
          <v-icon>{{ data.item.icon }}</v-icon>
        </span>
        <template v-if="data.item.isFilterLink">
          
            <v-list-item-title>
              <span class="font-weight-bold">{{ capitalize(data.item.displayValue) }}</span>
            </v-list-item-title>
            <v-list-item-subtitle>
              Filter by {{ data.item.displayValue }}
            </v-list-item-subtitle>
          <span>
            <v-icon>mdi-filter-plus</v-icon>
          </span>
        </template>

        <template v-else-if="data.item.key === 'default.search'">
          
            <v-list-item-title>
              <span class="">Search for</span>
              <span class="mx-2 font-weight-medium">"{{ searchString }}"</span>
              <span class="mr-2">in {{ entityType | pluralize(1) }} {{ data.item.displayName }}</span>
            </v-list-item-title>
          
          <small>
            press Enter
          </small>
        </template>

        <template v-else>
          
            <v-list-item-title
                v-html="$prettyTitle(data.item.displayValue)"
                style="white-space: normal;"
            />
            <v-list-item-subtitle style="white-space: normal;">
              {{ capitalize(data.item.displayName) }}
              <span v-if="data.item.hint">
                {{ data.item.hint | truncate(100) }}
              </span>
            </v-list-item-subtitle>
          
          <v-list-item-action v-if="data.item.entityId" @click="goToEntity(data.item.value)">
            <v-btn icon>
              <v-icon>mdi-information-outline</v-icon>
            </v-btn>
          </v-list-item-action>

        </template>
      </template>
    </v-autocomplete>
    <div class="ml-2 mt-2" v-if="showExamples">
      <span class="body-2 grey--text">Try:</span>
      <v-chip
          v-for="search in searchesToTry"
          :key="search"
          @click="trySearch(search)"
          class="chip"
      > 
        {{ search }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { url } from '@/url';
import { api } from '@/api';
import { createSimpleFilter } from '@/filterConfigs';
import { entityConfigs, urlPartsFromId } from '@/entityConfigs';
import { findFacetConfigs } from '@/facetConfigs';
import { entityTypeFromId } from '@/util';
import { useStore } from 'vuex';

interface SuggestionItem {
  entityId?: string;
  displayName: string;
  key?: string;
  icon?: string;
  isFilterLink?: boolean;
  displayValue: string;
  isDisabled?: boolean;
  hint?: string;
}

const props = defineProps<{
  dense?: boolean;
  showExamples?: boolean;
  autofocus?: boolean;
}>();

// Vuex setup
const store = useStore();
const entityType = computed(() => store.getters.entityType);
const userId = computed(() => store.getters['user/userId']);

// Local state
const searchString = ref<string>('');
const suggestions = ref<SuggestionItem[]>([]);
const newFilter = ref<SuggestionItem | null>(null);
const select = ref<any>(null);
const isLoading = ref(false);
const isEnterPressed = ref(false);
const interval = ref<number | null>(null);

// Sample searches
const searchesToTry = ref(['Claudia Goldin', 'coriander OR cilantro', 'Institution']);

// Computed properties
const filterSuggestions = computed(() => {
  const matches = findFacetConfigs(entityType.value, searchString.value)
    .filter(f => f.actions?.includes('filter'))
    .map(f => ({
      ...f,
      isFilterLink: true,
      displayValue: f.displayName,
      isDisabled: url.isFilterKeyAvailableToCreate(useRoute(), entityType.value, f.key),
    }));
  matches.sort((a, b) => (a.displayName.length > b.displayName.length ? 1 : -1));
  return searchString.value.length >= 3 ? matches : [];
});

const placeholder = computed(() => {
  const displayName = newFilter.value?.displayName;
  const pluralizedDisplayName = displayName ? `${displayName}s` : null;
  if (!newFilter.value) {
    return entityType.value === 'works' ? 'Search OpenAlex' : `Search ${entityType.value}`;
  } else if (newFilter.value.key === 'publication_year') {
    return 'Enter year or range of years';
  } else if (newFilter.value.type === 'range') {
    return 'Enter number or range';
  } else if (newFilter.value.type === 'search') {
    return `Search within ${pluralizedDisplayName}`;
  } else {
    return `Search ${pluralizedDisplayName}`;
  }
});

// Methods
const clear = () => {
  searchString.value = '';
  suggestions.value = [];
  newFilter.value = null;
};

const clickClear = () => {
  suggestions.value = [];
  searchString.value = '';
  newFilter.value = null;
};

const selectFilter = (filter: SuggestionItem) => {
  if (filter.type === 'boolean') {
    const oldFilters = url.readFilters(useRoute());
    const newFilter = createSimpleFilter('works', filter.key!, true);
    url.pushNewFilters([...oldFilters, newFilter]);
  } else {
    newFilter.value = filter;
  }
};

const onChange = (myFilterData: SuggestionItem) => {
  if (select.value) isEnterPressed.value = false;
  if (myFilterData.key === 'default.search') {
    submitSearchString();
  } else if (myFilterData.isFilterLink) {
    selectFilter(myFilterData);
  } else if (myFilterData.value) {
    url.pushNewFilters([...url.readFilters(useRoute()), myFilterData]);
    clear();
  }

  setTimeout(() => {
    searchString.value = '';
    select.value = null;
    suggestions.value = [];
  });
};

const onEnterKeyup = () => {
  if (!isEnterPressed.value) return;
  if (!searchString.value && props.showExamples) {
    url.pushToRoute(useRouter(), { name: 'Serp', params: { entityType: entityType.value } });
    return;
  }

  const filterKey = newFilter.value?.key ?? 'default.search';
  url.createFilter(entityType.value, filterKey, searchString.value);
  isEnterPressed.value = false;
};

const submitSearchString = () => {
  if (!searchString.value) {
    url.pushToRoute(useRouter(), { name: 'Serp', params: { entityType: entityType.value } });
  } else {
    const searchFilter = createSimpleFilter(entityType.value, 'default.search', searchString.value);
    url.pushNewFilters([...url.readFilters(useRoute()), searchFilter]);
  }
};

const goToEntity = (id: string) => {
  url.pushToRoute(useRouter(), { name: 'EntityPage', params: urlPartsFromId(id) });
};

const trySearch = (str: string) => {
  setTimeout(() => {
    searchString.value = str;
    getSuggestions();
  }, 100);
};

const getSuggestions = debounce(async () => {
  const fulltextSearchFilter = createSimpleFilter(entityType.value, 'default.search', searchString.value);

  if (searchString.value === 'coriander OR cilantro') {
    suggestions.value = [fulltextSearchFilter];
    return;
  }

  isLoading.value = true;

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

  const apiSuggestions = await api.getSuggestions(
    entityType.value,
    newFilter.value?.key,
    searchString.value,
    url.readFilters(useRoute())
  );
  isLoading.value = false;

  const ret = [...(newFilter.value ? [] : filterSuggestions.value), ...apiSuggestions];
  const everySuggestionIsAWork = ret.every(f => f.entityId === 'works');
  const cleaned = everySuggestionIsAWork ? ret.slice(0, 3) : ret.filter(f => f.entityId !== 'works').slice(0, 5);

  if (!newFilter.value) {
    cleaned.push(fulltextSearchFilter);
  }

  suggestions.value = cleaned;
}, 100);

const onKeyPress = (event: KeyboardEvent) => {
  if (event.key !== '/') return;
  if (document.activeElement === document.getElementById('shortcutBox')) return;
  event.preventDefault();
  document.getElementById('shortcutBox')?.focus();
};

// Lifecycle Hooks
onMounted(() => {
  window.addEventListener('keypress', onKeyPress);
  interval.value = setInterval(() => {
    if (!newFilter.value && !searchString.value && suggestions.value.length) {
      suggestions.value = [];
    }
  }, 10);
});

onBeforeUnmount(() => {
  if (interval.value) clearInterval(interval.value);
  window.removeEventListener('keypress', onKeyPress);
});

// Watchers
watch(searchString, (newValue) => {
  if (newFilter.value && newFilter.value.type !== 'select') return;
  getSuggestions();
});

watch(
  () => useRoute().fullPath,
  () => clear()
);
</script>

<style  lang="scss">

.v-autocomplete__content {
  max-width: 400px !important;
}

.chip {
  .v-chip__underlay{
    opacity: 0;

    &:hover{
      opacity: .04;

    }
    
  }
}

.shortcut-box {
  .v-input__append-inner:last-of-type {
    display: none !important; // hide the down-caret icon
  }

} 



</style>
