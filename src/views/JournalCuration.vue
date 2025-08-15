<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-breadcrumbs :items="breadcrumbs" divider="›" class="px-0 mt-n10" />
      <div class="text-h3 mb-4">
        Unpaywall Journal Curation
      </div>

      <div class="text-subtitle-1 mb-6 text-grey-darken-3">
        Change the Open Access status of journals. Changes will show up within two days.
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
        placeholder="Search by title or ISSN"
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
                <v-radio label="All journals" value="all"></v-radio>
                <v-radio label="Open access only" value="open"></v-radio>
                <v-radio label="Closed access only" value="closed"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Works Filter -->
        <v-menu v-model="worksMenu" location="bottom start" :close-on-content-click="false">
          <template #activator="{ props }">
            <template v-if="worksFilter === 0">
              <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                Works
                <v-icon icon="mdi-menu-down" end color="grey-darken-1" class="mr-n1"></v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-btn v-bind="props" color="blue-darken-2" rounded variant="tonal" size="default">
                &gt;{{ filters.millify(worksFilter) }} works
                <v-icon icon="mdi-close" class="mr-n1" end @click.stop="worksFilter = 0"></v-icon>
              </v-btn>
            </template>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Works Count</span>
              <v-btn icon variant="text" class="mr-n2" @click="worksMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="worksFilter === 0" class="mb-2 text-body-2 text-grey-darken-1">
                Any work count
              </div>
              <div v-else class="mb-2 text-body-2 text-grey-darken-1">
                At least {{ worksFilter.toLocaleString() }} works
              </div>
              <v-slider 
                v-model="worksFilter" 
                color="blue"
                :min="0" 
                :max="200000" 
                :step="1000"
              ></v-slider>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>

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
            <template #item.is_oa="{ value }">
              <div class="mr-n2">
                <template v-if="value">
                  <v-tooltip text="Open Access" location="bottom">
                    <template #activator="{ props }">
                      <v-icon icon="mdi-lock-open-variant" color="yellow-darken-2" v-bind="props"></v-icon>
                    </template>
                  </v-tooltip>
                </template>
                <template v-else>
                  <v-tooltip text="Closed Access" location="bottom">
                    <template #activator="{ props }">
                      <v-icon icon="mdi-lock" color="grey-lighten-1" v-bind="props"></v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </div>
            </template>

            <template #item.display_name="{ value, item }">

              <div class="pr-2 py-1">
                <div class="journal-title">{{ value }}</div>
                <div class="journal-issn text-caption text-grey-darken-1">{{ item.issn_l }}</div>
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
                    <v-list-item prepend-icon="mdi-pencil" @click="editJournal(item)">
                      Change Open Access Status
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item prepend-icon="mdi-book-open-outline" :href="item.id" target="_blank">
                      OpenAlex profile
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-home-outline" :href="item.homepage_url" target="_blank">
                      Journal website
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
          <v-progress-circular indeterminate color="blue-lighten-2"></v-progress-circular>
        </div>
        <div v-else-if="searchResults.length === 0" class="text-center text-grey py-6">
          No journals found for "{{ search }}".
          </div>
        </div>
      </v-card>
    </v-container>
  </div>


  <!-- Edit Dialog -->
  <v-dialog v-model="editDialog" width="520">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Change Open Access status
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="editDialog = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-5 rounded-xl mx-4 mb-4 bg-blue-grey-lighten-5">

        <div class="text-grey-darken-2 mb-1 mx-2">What is this journal's OA status?</div>
        <v-radio-group v-model="correctedOA" hide-details>
          <v-radio label="Open Access" :value="true"></v-radio>
          <v-radio label="Closed Access" :value="false"></v-radio>
        </v-radio-group>

        <div v-if="correctedOA && !editingJournal.is_oa" class="pt-6 pb-2">
          <div class="text-grey-darken-2 mb-1 mx-2">Has this journal always been OA?</div>
          <v-radio-group v-model="alwaysOA" hide-details>
            <v-radio label="It was always OA" :value="true"></v-radio>
            <v-radio label="It flipped to OA " :value="false"></v-radio>
          </v-radio-group>
        </div>

        <div v-if="correctedOA && !editingJournal.is_oa && !alwaysOA" class="pt-6 pb-2">
          <div class="text-grey-darken-2 mb-1 mx-2">In what year did this journal flip to OA?</div>
          <v-text-field 
            v-model="oaDate" 
            bg-color="white"
            width="200"
            variant="solo"
            rounded
            flat
            hide-details
            density="compact"
            placeholder="e.g., 2020" 
          ></v-text-field>
          <div v-if="oaDateError" class="text-caption text-red mt-1 ml-3">Please enter a 4-digit year.</div>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-btn color="blue" variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn color="blue" variant="flat" rounded :disabled="!isFormValid" @click="submitCorrection">Submit Fix</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>



</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';
import filters from '@/filters';

useHead({ title: 'Unpaywall Journal Curation' });

const router = useRouter();

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const worksFilter             = useParams('worksFilter', 'number', 0);
const page                    = useParams('page', 'number', 1);

const openAccessMenu = ref(false);
const worksMenu = ref(false);
const editDialog = ref(false);

const editingJournal = ref(null);
const correctedOA = ref(null);
const alwaysOA = ref(true);
const oaDate = ref(null);

let debounceTimer = null;
let currentRequestId = 0;
let errorTimer = null;

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Journals', to: '/curate/journals', disabled: true },
];

const headers = [
  { title: '', key: 'is_oa', width: '10px' },
  { title: 'Title', key: 'display_name', align: 'start' },
  { title: 'OA Flip Year', key: 'oa_flip_year', width: '120px', align: 'end' },
  { title: 'Works', key: 'works_count', width: '100px', align: 'end' },
  { title: '', key: 'dots_menu', width: '40px', align: 'end', sortable: false },
];

const openAccessFilterString = computed(() => {
  if (openAccessFilter.value === 'open') {
    return ',is_oa:true';
  } else if (openAccessFilter.value === 'closed') {
    return ',is_oa:false';
  } else {
    return '';
  }
});

const worksFilterString = computed(() => {
  if (worksFilter.value > 0) {
    return `,works_count:>${worksFilter.value}`;
  } else {
    return '';
  }
});

const editJournal = (journal) => {
  router.push('/curate/journals/' + extractId(journal.id));
};

const onRowClick = (event, item) => {
  editJournal(item.item);
};

const isYear = (value) => {
  if (!value) return false;
  return /^(19|20)\d{2}$/.test(value);
};

const oaDateError = ref(false);

const isFormValid = computed(() => {
  return editingJournal.value.is_oa !== correctedOA.value && (alwaysOA.value || isYear(oaDate.value));
});

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    let filter = "type:journal|conference";
    if (search.value) {
      filter += isISSN(search.value) ? `,issn_l:${search.value}` : `,display_name.search:${search.value}`;
    }
    const response = await axios.get(`https://api.openalex.org/sources?filter=${filter}${openAccessFilterString.value}${worksFilterString.value}&per_page=100&sort=works_count:desc&page=${page.value}&data-version=2`);
    
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

const isISSN = (issn) => {
  return /^\d{4}-\d{3}[0-9X]$/.test(issn);
};

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
