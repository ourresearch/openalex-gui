<template>
  <div>
    <Popover v-model:open="isPopoverOpen">
      <PopoverTrigger asChild>
        <div class="relative w-full">
          <div class="flex items-center border rounded-lg bg-muted/50 px-3" :class="[dense ? 'h-9' : 'h-11']">
            <Search class="h-4 w-4 mr-2" :class="isFocused ? 'text-primary' : 'text-muted-foreground'" />
            <Badge
              v-if="newFilter"
              variant="secondary"
              class="mr-2 px-3 py-1 rounded-full"
            >
              <component :is="getIconComponent(newFilter.icon)" class="h-3 w-3 mr-1" />
              {{ newFilter?.displayName }}
              <X class="h-3 w-3 ml-1 cursor-pointer" @click.stop="clear" />
            </Badge>
            <input
              ref="shortcutBoxRef"
              v-model="searchString"
              type="text"
              class="flex-1 bg-transparent outline-none text-sm"
              :placeholder="placeholder"
              :autofocus="autofocus"
              @input="onSearchInputUpdate($event.target.value)"
              @keydown.enter="isEnterPressed = true"
              @keyup.enter="onEnterKeyup"
              @focus="isFocused = true; isPopoverOpen = true"
              @blur="isFocused = false"
            />
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin text-muted-foreground" />
            <X v-else-if="searchString" class="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" @click="clickClear" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent class="w-[400px] p-0" align="start" @openAutoFocus.prevent>
        <Command>
          <CommandList class="max-h-[400px]">
            <CommandEmpty v-if="!suggestions.length && searchString">No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                v-for="item in suggestions"
                :key="item.value || item.key"
                :value="item.displayValue || item.value"
                class="cursor-pointer"
                @select="onChange(item)"
              >
                <div class="flex items-center w-full">
                  <component :is="getIconComponent(item.icon)" class="h-4 w-4 mr-3 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <!-- Filter link -->
                    <template v-if="item.isFilterLink">
                      <div class="font-semibold">{{ filters.capitalize(item.displayValue) }}</div>
                      <div class="text-xs text-muted-foreground">Filter by {{ item.displayValue }}</div>
                    </template>
                    <!-- Default search -->
                    <template v-else-if="item.key === defaultSearchType">
                      <div>
                        <span>Search for</span>
                        <span class="mx-1 font-medium">"{{ searchString }}"</span>
                        <span>in {{ filters.pluralize(entityType, 1) }} {{ item.displayName }}</span>
                      </div>
                      <div class="text-xs text-muted-foreground">press Enter</div>
                    </template>
                    <!-- Entity -->
                    <template v-else>
                      <div class="break-words">{{ filters.prettyTitle(item.displayValue) }}</div>
                      <div class="text-xs text-muted-foreground break-words">
                        {{ filters.capitalize(item.displayName) }}
                        <span v-if="item.hint">{{ filters.truncate(item.hint) }}</span>
                      </div>
                    </template>
                  </div>
                  <FilterPlus v-if="item.isFilterLink" class="h-4 w-4 ml-2 flex-shrink-0" />
                  <Button
                    v-else-if="item.entityId"
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 ml-2 flex-shrink-0"
                    @click.stop="goToEntity(item.value)"
                    tabindex="-1"
                  >
                    <Info class="h-4 w-4" />
                  </Button>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <div class="ml-2 mt-2" v-if="showExamples">
      <span class="text-sm text-muted-foreground">Try:</span>
      <Button
        v-for="search in searchesToTry"
        :key="search"
        variant="ghost"
        size="sm"
        class="font-normal"
        @click="trySearch(search)"
      >
        {{ search }}
      </Button>
    </div>
  </div>
</template>


<script setup>
import _ from 'lodash';
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { Search, X, Loader2, Info, Filter as FilterPlus, Calendar, Hash, FileText, Building, User, BookOpen, Globe, Tag } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

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
const isPopoverOpen = ref(false);
const store = useStore();
const route = useRoute();
const router = useRouter();

// Icon mapping for mdi icons to lucide
const iconMap = {
  'mdi-calendar': Calendar,
  'mdi-pound': Hash,
  'mdi-file-document': FileText,
  'mdi-domain': Building,
  'mdi-account': User,
  'mdi-book-open-variant': BookOpen,
  'mdi-web': Globe,
  'mdi-tag': Tag,
  'mdi-magnify': Search,
};

const getIconComponent = (icon) => {
  if (!icon) return Search;
  return iconMap[icon] || Search;
};

const searchesToTry = [
  'Claudia Goldin',
  'coriander OR cilantro',
  'Institution'
];

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);
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
    .filter(f => !f.requiresApiKey || isAdmin.value)
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