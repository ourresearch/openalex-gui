<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      <div class="text-h3 mb-4">
        Unpaywall Sources Curation
      </div>

      <div class="text-subtitle-1 mb-6 text-grey-darken-3">
        Change the Open Access status of sources. Changes will show up within two days.
      </div>

      <v-text-field
        v-model="search"
        variant="solo-filled"
        bg-color="#dbe2eb"
        flat
        clearable
        clear-icon="mdi-close"
        hide-details
        rounded="pill"
        density="default"
        prepend-inner-icon="mdi-magnify"
        class="mb-8"
        placeholder="Search by title, ISSN, or OpenAlex ID"
      ></v-text-field>

      <div v-if="resultsRangeText" class="text-body-2 text-grey-darken-1 mb-2 px-4" >
        {{ resultsRangeText }}
      </div>

      <v-card flat rounded="xl" class="pa-4">   
        <div>
          <div v-if="searchResults.length > 0">
            <v-data-table
            :headers="headers"
            :items="searchResults"
            :items-per-page="100"
            @click:row="onRowClick"
            hide-default-footer
          >       
            <template #item.type="{ value, item }">
              <div class="mr-n2">
                <v-tooltip :text="`${filters.titleCase(item.type)}${ item.is_oa ? ' (Open Access)' : ''}`" location="bottom">
                  <template #activator="{ props }">
                    <v-icon :icon="typeIcons[value]" :color="item.is_oa ? 'yellow-darken-2' : 'grey'" v-bind="props"></v-icon>
                  </template>
                </v-tooltip>
              </div>
            </template>

            <template #item.display_name="{ value, item }">

              <div class="pr-2 py-1">
                <div class="source-title">{{ value }}</div>
                <div class="source-issn text-caption text-grey-darken-1">{{ item.issn_l }}</div>
              </div>
            </template>

            <template #item.oa_flip_year="{ value }">
              <span v-if="typeof value === 'number'">{{ value }}</span>
              <span v-else class="text-grey">-</span>
            </template>

            <template #item.works_count="{ value }">
              <code>{{ typeof value === 'number' ? value.toLocaleString() : "-" }}</code>
            </template>

            <template #item.dots_menu="{ value, item }">
              <v-menu 
                teleport="body" 
                scroll-strategy="none" 
                location="bottom end"
                :contained="false"
                :absolute="false"
              >
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props">
                    <v-icon icon="mdi-dots-vertical" color="grey-darken-1"></v-icon>
                  </v-btn>
                </template>
                <v-card>
                  <v-list class="text-grey-darken-3" style="font-size: 16px;">
                    <v-list-item prepend-icon="mdi-pencil" @click="editSource(item)">
                      Change Open Access Status
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item prepend-icon="mdi-book-open-outline" :href="item.id" target="_blank">
                      OpenAlex profile
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-home-outline" :href="item.homepage_url" target="_blank">
                      Source website
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-api" :href="`${item.id.replace('://', '://api.')}?data-version=2`" target="_blank">
                      OpenAlex API
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </template>
          </v-data-table>

          <div v-if="searchResultsTotalCount > 100" class="text-center text-body-2 text-grey-darken-1 pt-8">
            <v-pagination
              v-model="page"
              :length="searchResultsTotalCount / 100"
            ></v-pagination>
          </div>
        </div>
        <div v-if="debounceTimer" class="text-center text-grey py-6">
          <v-skeleton-loader type="list-item-two-line@6"></v-skeleton-loader>
        </div>
        <div v-else-if="searchResults.length === 0" class="text-center text-grey py-6">
          No sources found for "{{ search }}".
          </div>
        </div>
      </v-card>
    </v-container>
  </div>

</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';
import filters from '@/filters';

useHead({ title: 'Unpaywall Sources Curation' });

const router = useRouter();

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const worksFilter             = useParams('worksFilter', 'number', 0);
const page                    = useParams('page', 'number', 1);

const editDialog = ref(false);

const correctedOA = ref(null);
const alwaysOA = ref(true);
const oaDate = ref(null);

let debounceTimer = null;
let currentRequestId = 0;
let errorTimer = null;

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Sources', to: '/curate/sources', disabled: true },
];

const headers = [
  { title: '', key: 'type', width: '10px' },
  { title: 'Title', key: 'display_name', align: 'start' },
  { title: 'OA Flip Year', key: 'oa_flip_year', width: '120px', align: 'end' },
  { title: 'Works', key: 'works_count', width: '100px', align: 'end' },
  { title: '', key: 'dots_menu', width: '40px', align: 'end', sortable: false },
];

const typeIcons = {
  "journal": 'mdi-notebook-outline',
  "repository": 'mdi-town-hall',
  "ebook platform": 'mdi-book-open-outline',
  "book series": 'mdi-book-open-variant-outline',
  "conference": 'mdi-account-group',
  "igsnCatalog": 'mdi-book-outline',
  "other": 'mdi-book-outline',
};

const editSource = (source) => {
  router.push('/curate/sources/' + extractId(source.id));
};

const onRowClick = (event, item) => {
  editSource(item.item);
};

const isYear = (value) => {
  if (!value) return false;
  return /^(19|20)\d{2}$/.test(value);
};

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    const response = await axios.get(`https://api.openalex.org/sources?${filterString.value}&per_page=100&sort=works_count:desc&page=${page.value}&data-version=2`);
    
    // Only update results if this is still the most recent request
    if (requestId === currentRequestId) {
      searchResults.value = response.data.results;
      searchResultsTotalCount.value = response.data.meta.count;
      debounceTimer = null;
    }
  } catch (error) {
    // Only handle error if this is still the most recent request
    if (requestId === currentRequestId) {
      console.error('Search failed:', error);
      searchResults.value = [];
    }
  }
};

const filterString = computed(() => {
  const filters = [searchFilterString.value, openAccessFilterString.value, worksFilterString.value].filter(f => f !== null);
  return filters.length > 0 ? `filter=${filters.join(',')}` : '';
});

const searchFilterString = computed(() => {
  if (search.value) {
    if (isOpenAlexId(search.value)) {
      return `ids.openalex:${search.value}`;
    } else if (isISSN(search.value)) {
      return `issn:${search.value}`;
    } else {
      return `display_name.search:${search.value}`;
    }
  }
  return null;
});

const openAccessFilterString = computed(() => {
  if (openAccessFilter.value === 'open') {
    return 'is_oa:true';
  } else if (openAccessFilter.value === 'closed') {
    return 'is_oa:false';
  } else {
    return null;
  }
});

const worksFilterString = computed(() => {
  if (worksFilter.value > 0) {
    return `works_count:>${worksFilter.value}`;
  } else {
    return null;
  }
});

const isISSN = (issn) => {
  return /^\d{4}-\d{3}[0-9X]$/.test(issn);
};

const isOpenAlexId = (id) => {
  return /^S\d+$/.test(id);
}

const resultsRangeText = computed(() => {
  if (searchResults.value.length === 0) return null;
  
  const start = (page.value - 1) * 100 + 1;
  const end = Math.min(start + searchResults.value.length - 1, searchResultsTotalCount.value);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${searchResultsTotalCount.value.toLocaleString()}`;
});

const debouncedSearch = () => {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Set new timer for 200ms
  debounceTimer = setTimeout(() => {
    getSearchResults();
  }, 200);
};


const extractId = (id) => {
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
}

debouncedSearch();

watch(search, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(openAccessFilter, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(worksFilter, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(page, () => {
  searchResults.value = [];
  debouncedSearch();
});

watch(editDialog, () => {
  if (!editDialog.value) {
    setTimeout(() => {
      correctedOA.value = null;
      alwaysOA.value = true;
      oaDate.value = null;
    }, 500);
  }
});

watch(oaDate, () => {
  if (errorTimer) clearTimeout(errorTimer);
  if (alwaysOA.value) {
    oaDateError.value = false;
    return;
  }
  if (!isYear(oaDate.value)) {
    errorTimer = setTimeout(() => {
      oaDateError.value = true;
    }, 300);  
  } else {
    oaDateError.value = false;
  }
});

</script>

<style scoped>
:deep(.v-data-table tr th) {
  font-size: 12px;
  height: 36px !important;
}
:deep(.v-data-table tbody tr:hover) {
  cursor: pointer;
  background-color: #F5F5F5;
}
</style>
