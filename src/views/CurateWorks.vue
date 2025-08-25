<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      <div class="text-h3 mb-4">
        Unpaywall Works Curation
      </div>

      <div class="text-subtitle-1 mb-6 text-grey-darken-3">
        Change the Open Access links and licenses of works. Changes will show up within two days.
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
        placeholder="Search by title, DOI, or OpenAlex ID"
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
            <template #item.display_name="{ value }">
              <div class="pr-2 py-1">
                <span>{{ value }}</span>
              </div>
            </template>

            <template #item.type="{ value }">
              <span>{{ value }}</span>
            </template>

            <template #item.publication_year="{ value }">
              <span v-if="typeof value === 'number'">{{ value }}</span>
              <span v-else class="text-grey">-</span>
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
                    <v-list-item prepend-icon="mdi-pencil" @click="editWork(item)">
                      Edit Work
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item prepend-icon="mdi-file-document-outline" :href="item.id" target="_blank">
                      OpenAlex profile
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
              :length="Math.ceil(searchResultsTotalCount / 100)"
            ></v-pagination>
          </div>
        </div>
        <div v-if="debounceTimer" class="text-center text-grey py-6">
          <v-skeleton-loader type="list-item-two-line@6"></v-skeleton-loader>
        </div>
        <div v-else-if="searchResults.length === 0" class="text-center text-grey py-6">
          No works found for "{{ search }}".
          </div>
        </div>
      </v-card>
    </v-container>
  </div>

</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';

useHead({ title: 'Unpaywall Work Curation' });

const router = useRouter();

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const page                    = useParams('page', 'number', 1);

const openAccessMenu = ref(false);

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Works', to: '/curate/works', disabled: true },
];

let debounceTimer = null;
let currentRequestId = 0;

const headers = [
  { title: 'Title', key: 'display_name', align: 'start' },
  { title: 'Type', key: 'type'},
  { title: 'Year', key: 'publication_year'},
  { title: '', key: 'dots_menu', width: '40px', align: 'end', sortable: false },
];

const editWork = (work) => {
  router.push('/curate/works/' + extractId(work.id));
};

const onRowClick = (event, item) => {
  editWork(item.item);
};

const extractId = (id) => {
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
}

const openAccessFilterString = computed(() => {
  if (openAccessFilter.value === 'open') {
    return 'is_oa:true';
  } else if (openAccessFilter.value === 'closed') {
    return 'is_oa:false';
  } else {
    return null;
  }
});

const searchFilterString = computed(() => {
  if (search.value) {
    if (isOpenAlexId(search.value)) {
      return `ids.openalex:${search.value}`;
    } else if (isDOI(search.value)) {
      return `doi:${search.value}`;
    } else {
      return `display_name.search:${search.value}`;
    }
  }
  return null;
});

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    const filterStr = [searchFilterString.value, openAccessFilterString.value].filter(s => s !== null).join(',');
    const response = await axios.get(`https://api.openalex.org/works?filter=${filterStr}&per_page=100&sort=cited_by_count:desc&page=${page.value}&data-version=2`);
    
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

const isDOI = (doi) => {
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
};

const isOpenAlexId = (id) => {
  return /^W\d+$/.test(id);
}

const resultsRangeText = computed(() => {
  if (searchResults.value.length === 0) return null;
  
  const start = (page.value - 1) * 100 + 1;
  const end = Math.min(start + searchResults.value.length - 1, searchResultsTotalCount.value);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${searchResultsTotalCount.value.toLocaleString()}`;
});

const debouncedSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    getSearchResults();
  }, 200);
};

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

watch(page, () => {
  searchResults.value = [];
  debouncedSearch();
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
