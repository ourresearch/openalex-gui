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
        class="mb-3"
        placeholder="Search by title, DOI, or OpenAlex ID"
      ></v-text-field>

      <div class="mb-6 px-4">
      <!-- Open Access Filter -->
        <span class="text-grey-darken-1 mr-2" style="font-size: 14px;">Filter by:</span>

        <v-menu v-model="openAccessMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="openAccessFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Open Access
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ openAccessFilter === 'open' ? 'Open' : 'Closed' }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="openAccessFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Open Access</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="openAccessMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="openAccessFilter">
                <v-radio label="All works" value="all"></v-radio>
                <v-radio label="Open access only" value="open"></v-radio>
                <v-radio label="Closed access only" value="closed"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

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
            <template #item.display_name="{ value, item }">
              <div class="pr-2 py-1">
                <v-tooltip v-if="pendingCorrections.includes(extractId(item.id))" location="bottom" text="A submitted change is currently pending for this work. It will be processed within two days.">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-timer-sand" color="grey" class="mr-2"></v-icon>
                  </template>
                </v-tooltip>  
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
          <v-progress-circular indeterminate color="blue-lighten-2"></v-progress-circular>
        </div>
        <div v-else-if="searchResults.length === 0" class="text-center text-grey py-6">
          No works found for "{{ search }}".
          </div>
        </div>
      </v-card>
    </v-container>
  </div>


  <!-- Pending Change Dialog -->
  <v-dialog v-model="isPendingDialogOpen" width="520">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change pending
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isPendingDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div>
          A submitted change is currently pending for this work. It will be processed within two days.
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>


</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';
import { urlBase } from '@/apiConfig';

useHead({ title: 'Unpaywall Work Curation' });

const store = useStore();
const router = useRouter();

const correctionsHost = urlBase.correctionsApi;

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const page                    = useParams('page', 'number', 1);

const pendingCorrections = ref([]);

const openAccessMenu = ref(false);

const isPendingDialogOpen = ref(false);

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
  if (pendingCorrections.value.includes(extractId(work.id))) {
    isPendingDialogOpen.value = true;
    return;
  }
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

const getPendingCorrections = async () => {
  try {
    const apiEndpoint = `${correctionsHost}/v2/pending`;
    const response = await axios.get(apiEndpoint);
    pendingCorrections.value = response.data;
  } catch (error) {
    console.error('Error fetching pending corrections:', error);
  }
};

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

const debouncedSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    getSearchResults();
  }, 200);
};


getPendingCorrections();
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
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;   /* Number of lines */
  overflow: hidden;
  text-wrap: wrap;
}
</style>
