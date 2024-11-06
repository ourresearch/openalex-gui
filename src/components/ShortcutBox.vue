<template>
  <div>
    <v-autocomplete
      ref="shortcutBox"
      prepend-inner-icon="mdi-magnify"
      return-object
      rounded
      v-model="select"
      v-model:search="searchString"
      :items="suggestions"
      item-title="displayName"
      :custom-filter="(item, queryText, itemText) => true"
      :menu-props="{ maxHeight: 600 }"
      :density="dense ? 'compact' : 'default'"
      :placeholder="placeholder"
      :autofocus="autofocus"
      :menu="menuOpen" 
      :loading="isLoading"
      @click:clear="clickClear"
      @update:modelValue="onChange"
      @keyup.enter="onEnterKeyup"
    > 
      <!-- Chip Slot -->
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
          {{ newFilter.displayName }}
        </v-chip>
      </template> 

      <!-- Item Slot -->
      <template #item="{ props, item }">
        <v-list-item  class="ac-list-item" v-bind="props">
            <v-icon class="icon" :icon="item.raw.icon"/>
          <template v-if="item.raw.isFilterLink">
            <div class="content-wrap">
              <v-list-item-title>
                <span class="font-weight-bold">{{item.raw.displayValue}}</span>
              </v-list-item-title>
              <v-list-item-subtitle>
                Filter by {{ item.raw.displayValue }} 
              </v-list-item-subtitle>
            </div>
              <v-icon class="filter-icon">mdi-filter-plus</v-icon>
          </template>
            
          <template v-else-if="item.raw.key === 'default.search'">
            <v-list-item-title class="content-wrap">
              <span class="">Search for</span>
              <span class="mx-2 font-weight-medium">"{{ searchString }}"</span>
              <span class="mr-2">in {{entityType}} {{ item.raw.displayName }}</span>
            </v-list-item-title>
            <small class="enter-action">
              press Enter
            </small>
          </template>
          <!-- {{ item.raw.displayName }} -->
          <template v-else>
            <div class="content-wrap">
            <v-list-item-title >{{ item.raw.displayValue }}</v-list-item-title>
            <v-list-item-subtitle style="white-space: normal;">
              {{ item.raw.displayName }} {{ item.raw.key }}
              <span v-if="item.raw.hint">
                {{  item.raw.hint }}
              </span>
            </v-list-item-subtitle>
          </div>
            <v-list-item-action v-if="item.raw.entityId" @click="goToEntity(item.raw.value)">
              <v-btn elevation="0" icon>
                <v-icon>mdi-information-outline</v-icon>
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
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
  import { ref,  useTemplateRef, computed, watch, onMounted, onBeforeUnmount, toRaw } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { url } from '@/url';
  import { api } from '@/api';
  import { debounce } from 'lodash';
  import { createSimpleFilter } from '@/filterConfigs';
  import { entityConfigs, urlPartsFromId } from '@/entityConfigs';
  import { findFacetConfigs } from '@/facetConfigs';
  import { entityTypeFromId } from '@/util';
  import { useStore } from 'vuex';

  type Filter = {
    type: 'boolean' | string;
    key?: string;
  };

  interface SuggestionItem {
    entityId?: string;
    displayName: string;
    key?: string;
    icon?: string;
    isFilterLink?: boolean;
    displayValue: string;
    isDisabled?: boolean;
    hint?: string;
    type?: string;
    value?: string;
  }

  const props = defineProps<{
    dense?: boolean;
    showExamples?: boolean;
    autofocus?: boolean;
  }>();

  const route = useRoute()
  const router = useRouter()
  const shortcutBox = useTemplateRef('shortcutBox');
  // Vuex setup
  const store = useStore();
  const entityType = computed(() => store.getters.entityType);
  const userId = computed(() => store.getters['user/userId']);

  // Local state
  const searchString = ref<string>('');
  const suggestions = ref<SuggestionItem[]>([]);
    const staticSuggestions = ref([
    { displayValue: 'Test Option 1' },
    { displayValue: 'Test Option 2' },
    { displayValue: 'Test Option 3' },
  ]);

  const newFilter = ref<SuggestionItem | null>(null);
  const select = ref<any>(null);
  const isLoading = ref(false);
  const menuOpen = ref(false);
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
        isDisabled: url.isFilterKeyAvailableToCreate(route, entityType.value, f.key),
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
    menuOpen.value = false;

    console.log("🚀 ~ clear ~ clear:")
  };

  const clickClear = () => {
    clear();
    console.log("🚀 ~ clickClear ~ clickClear:")
  };

  const selectFilter = (filter) => {
    if (filter.type === 'boolean') {
      const oldFilters = url.readFilters(route) as unknown as Filter[];
      const newFilter = createSimpleFilter('works', filter.key!, true);
      console.log("🚀 ~ selectFilter ~ newFilter:", newFilter)
      url.pushNewFilters([...oldFilters, newFilter]);
    } else {
      newFilter.value = filter;
    }
  };

  const onChange = debounce((myFilterData) => {
    // console.log("🚀 ~ onChange ~ myFilterData:", myFilterData)
    if (select.value) isEnterPressed.value = false;
    if (toRaw(myFilterData).key === 'default.search') {
      submitSearchString();
      menuOpen.value = true;
    } else if (toRaw(myFilterData).isFilterLink) {
      console.log("🚀 ~ onChange ~ myFilterData:", myFilterData)
      selectFilter(toRaw(myFilterData));
      menuOpen.value = true;
    } else if (toRaw(myFilterData).value) {
      const oldFilters = url.readFilters(route) as unknown as Filter[];

      url.pushNewFilters([...oldFilters, toRaw(myFilterData)]);
      clear();
    }

    requestAnimationFrame(() => {
      searchString.value = '';
      select.value = null;
      suggestions.value = [];
    });
  }, 100);

  const onEnterKeyup = () => {
    // console.log("🚀 ~ onEnterKeyup ~ entityType.value:", entityType.value)
    if (!searchString.value && props.showExamples) {
      url.pushToRoute(router, { name: 'Serp', params: { entityType: entityType.value } });
      return;
    }

    const filterKey = newFilter.value?.key ?? 'default.search';
    url.createFilter(entityType.value, filterKey, searchString.value);
    isEnterPressed.value = false;
  };

  const submitSearchString = () => {
    if (!searchString.value) {
      url.pushToRoute(router, {
        name: 'Serp', params: { entityType: entityType.value }
      });
    } else {
      const searchFilter = createSimpleFilter(entityType.value, 'default.search', searchString.value);
      const oldFilters = url.readFilters(route) as unknown as Filter[];
      url.pushNewFilters([...oldFilters, searchFilter]);
    }
  };

  const goToEntity = (id: string) => {
    url.pushToRoute(router, { name: 'EntityPage', params: urlPartsFromId(id) });
  };

  const trySearch = (str: string) =>{
    requestAnimationFrame(() => {
      searchString.value = str;
      
      getSuggestions();
    });
  };

  const getSuggestions = async () => {
    const fulltextSearchFilter = createSimpleFilter(entityType.value, 'default.search', searchString.value) as unknown as SuggestionItem;
    console.log("🚀 ~ getSuggestions ~ fulltextSearchFilter:", fulltextSearchFilter , toRaw(newFilter), searchString.value)
    isLoading.value = true;

    if (searchString.value === 'coriander OR cilantro') {
      suggestions.value = [fulltextSearchFilter];
      isLoading.value = false;
      if(suggestions.value.length >= 1 ) {menuOpen.value = true;}
      return;
    }


    if (newFilter.value && !searchString.value) {
      suggestions.value = await api.getGroups(entityType.value, newFilter.value.key);
      isLoading.value = false;
      if(suggestions.value.length >= 1 ) {menuOpen.value = true;}
      return;
    }

    if (!newFilter.value && !searchString.value) {
      suggestions.value = [];
      isLoading.value = false;
      if(suggestions.value.length >= 1 ) {menuOpen.value = true;}
      return;
    }

    const apiSuggestions = await api.getSuggestions(
      entityType.value,
      newFilter.value?.key,
      searchString.value,
      url.readFilters(route)
    );
    isLoading.value = false;

    const ret = [...(newFilter.value ? [] : filterSuggestions.value), ...apiSuggestions];
    const everySuggestionIsAWork = ret.every(f => f.entityId === 'works');
    const cleaned = everySuggestionIsAWork ? ret.slice(0, 3) : ret.filter(f => f.entityId !== 'works').slice(0, 5);

    if (!newFilter.value) {
      cleaned.push(fulltextSearchFilter);
    }

    menuOpen.value = true; 
    suggestions.value = cleaned;
    console.log("🚀 ~ Final suggestions before assignment:", ret, cleaned);
  };

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key !== '/') return;
    console.log("🚀 ~ onKeyPress ~ shortcutBox.value:", shortcutBox.value)
    if (document.activeElement === shortcutBox.value) return;
    event.preventDefault();
    shortcutBox.value?.focus();
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
    () => route.fullPath,
    () => clear()
  );
</script>

<style  lang="scss">
// Hack to avoid using important
:is(.ac-list-item, #increase#specificity) > .v-list-item__content{
  display: flex;
  align-items: center;
  flex-wrap: nowrap;

  .content-wrap {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-left: 5px;

    .v-list-item-title,
    .v-list-item-subtitle {
      width: 100%;
    }
  }


  
  > .v-list-item-title:first-of-type {
    display: none;
  }
  .v-list-item-action, 
  .filter-icon, 
  .enter-action {
    align-self: end;
    margin-left: auto;
  }
}

.icon {
  display:flex;
  justify-self: unset;
}

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
</style>
