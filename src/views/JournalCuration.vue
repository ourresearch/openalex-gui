<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <div class="text-h4 mb-2">
        Unpaywall Journal Curation
      </div>

      <div class="text-subtitle-2 mb-3 text-grey-darken-1">
        Sometimes Unpaywall makes errors. You can submit fixes to journals here. Corrections will show up in a few days.
      </div>

      <v-text-field
        v-model="search"
        variant="solo"
        color="blue-lighten-2"
        flat
        clearable
        clear-icon="mdi-close"
        hide-details
        rounded
        density="default"
        prepend-inner-icon="mdi-magnify"
        class="mb-3"
        placeholder="Search by title or ISSN..."
      ></v-text-field>


      <div class="mb-5 px-4">
      <!-- Open Access Filter -->
        <span class="text-grey-darken-1 mr-2" style="font-size: 12px;">Filters:</span>

        <v-menu v-model="openAccessMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="openAccessFilter === 'all'">
                <v-btn v-bind="props" variant="flat" size="small" rounded class="text-grey-darken-1">
                  Open Access
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="small" rounded>
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
              <v-btn v-bind="props" variant="flat" size="small" rounded class="text-grey-darken-1">
                Works
                <v-icon icon="mdi-menu-down" end color="grey-darken-1" class="mr-n1"></v-icon>
              </v-btn>
            </template>
            <template v-else>
              <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="small">
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

      <v-alert v-if="showSuccessMessage" type="success" density="compact">
        Your correction has been received and will be reviewed within a few days.
        <br />
        Thank you for your help.
      </v-alert>
      <v-alert v-if="showErrorMessage" type="error" density="compact">
        There was an error submitting your correction. Please try again later.
      </v-alert>


      <v-card flat rounded="xl" class="pa-4">
                  
        <div>
          <div v-if="searchResults.length > 0">
            <v-data-table
            :headers="headers"
            :items="searchResults"
            :items-per-page="100"
            hide-default-footer
          >          
            <template #item.display_name="{ value, item }">
              <v-tooltip v-if="pendingCorrections.includes(item.issn_l)" location="bottom" text="A correction has been submitted for this journal. It will be reviewed within a few days.">
                <template #activator="{ props }">
                  <div v-bind="props">
                    <v-icon icon="mdi-timer-sand" size="default" color="grey-lighten-1"></v-icon>
                    {{ value }}
                  </div>
                </template>
              </v-tooltip>
              <v-tooltip v-else-if="!item.issn_l" location="bottom" text="This journal record does not have an ISSN. We currently require an ISSN to submit corrections.">
                <template #activator="{ props }">
                  <div v-bind="props">
                    {{ value }}
                  </div>
                </template>
              </v-tooltip>
              <div v-else class="pr-2 cursor-pointer" @click="editJournal(item)">

                <span class="journal-title">{{ value }}</span>
              </div>
            </template>

            <template #item.is_oa="{ value }">
              <template v-if="value">
                <v-tooltip text="Open Access" location="bottom">
                  <template #activator="{ props }">
                    <v-icon icon="mdi-lock-open" color="yellow-darken-2" v-bind="props"></v-icon>
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
            </template>

            <template #item.works_count="{ value }">
              <code>{{ value.toLocaleString() }}</code>
            </template>

            <template #item.homepage_url="{ value, item }">
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props">
                    <v-icon icon="mdi-dots-vertical" color="grey-darken-1"></v-icon>
                  </v-btn>
                </template>
                <v-card rounded="xl">
                  <v-list class="text-grey-darken-2" style="font-size: 14px;">
                    <v-list-item :href="item.id" target="_blank">
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                      OpenAlex profile
                    </v-list-item>
                    <v-list-item :href="item.homepage_url" target="_blank">
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                      Journal website
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </template>
            </v-data-table>
            <div v-if="searchResultsTotalCount > 100" class="text-center text-body-2 text-grey-darken-1 pt-8">
              {{ searchResultsTotalCount - 100 }} additional journals match this search.
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
            Change Open Access Status
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="editDialog = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-5 rounded-xl mx-4 mb-4 bg-blue-grey-lighten-5">
        <div class="mb-2 px-2">
          <span class="text-grey-darken-3 mb-0 ellipsis-2-lines font-weight-medium" style="font-size: 14px;">{{ editingJournal.display_name }}</span>
          <span class="text-grey-darken-1 text-caption">{{ editingJournal.issn_l }}</span>
        </div>

        <v-radio-group v-model="correctedOA" hide-details>
          <v-radio label="This journal is Open Access" :value="true"></v-radio>
          <v-radio label="This journal is Closed Access" :value="false"></v-radio>
        </v-radio-group>

        <div v-if="correctedOA && !editingJournal.is_oa" class="pt-6 pb-2">
          <div class="text-caption text-grey-darken-2 mb-1 mx-2">When did this journal become Open Access?</div>
          <v-radio-group v-model="alwaysOA" hide-details>
            <v-radio label="This journal has always been Open Access" :value="true"></v-radio>
            <v-radio :value="false">
              <template #label>
                <div>
                  This journal became Open Access in
                  <v-text-field 
                    v-model="oaDate" 
                    class="d-inline-block"
                    bg-color="white"
                    width="110"
                    variant="solo"
                    rounded
                    flat
                    hide-details
                    density="compact"
                    placeholder="e.g., 2020" 
                    style="vertical-align: middle;">
                  </v-text-field>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
          <div v-if="oaDateError" class="text-caption text-red text-right mt-1 mr-3">Please enter a 4-digit year.</div>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-btn color="blue" variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn color="blue" variant="flat" rounded :disabled="!isFormValid" @click="submitCorrection">Submit Fix</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Librarian Dialog -->
  <v-dialog v-model="isLibrarianDialogOpen" width="520">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex justify-space-between align-start w-100 pl-6">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div>
            Librarian account required
          </div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="isLibrarianDialogOpen = false">
          <v-icon color="grey-darken-2">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div>
          We are currently accepting change requests from known librarians only.
          <br>
          <br>
          If you would like to have your account marked as a librarian, please <a href="https://help.openalex.org/hc/en-us/requests/new">submit a support request</a>.
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>


<script setup>

import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';
import filters from '@/filters';

const store = useStore();

const correctionsHost = "https://corrections.openalex.org";
//const correctionsHost = "http://localhost:5006";

const search = useParams('search', 'string', '');
const searchResults = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter = useParams('openAccessFilter', 'string', 'all');
const worksFilter = useParams('worksFilter', 'number', 0);

const pendingCorrections = ref([]);

const openAccessMenu = ref(false);
const worksMenu = ref(false);
const editDialog = ref(false);

const editingJournal = ref(null);
const correctedOA = ref(null);
const alwaysOA = ref(true);
const oaDate = ref(null);

const isLibrarianDialogOpen = ref(false);
const email = computed(() => store.getters['user/userEmail']);
const isLibrarian = computed(() => store.getters['user/isLibrarian']);

const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

let debounceTimer = null;
let currentRequestId = 0;
let errorTimer = null;

const headers = [
  { title: 'Title', key: 'display_name', width: '350px', align: 'start' },
  { title: 'ISSN', key: 'issn_l', width: '150px', align: 'start', sortable: false },
  { title: 'OA', key: 'is_oa' },
  { title: 'Works', key: 'works_count', align: 'end' },
  { title: '', key: 'homepage_url', align: 'end', sortable: false },
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

  if (!email.value) {
    store.commit('user/setIsLoginDialogOpen', true);
    return;
  }
  if (!isLibrarian.value) {
    isLibrarianDialogOpen.value = true;
    return;
  }
  editingJournal.value = journal;
  editDialog.value = true;
  correctedOA.value = journal.is_oa;
};

const isYear = (value) => {
  if (!value) return false;
  return /^(19|20)\d{2}$/.test(value);
};

const oaDateError = ref(false);

const isFormValid = computed(() => {
  return editingJournal.value.is_oa !== correctedOA.value && (alwaysOA.value || isYear(oaDate.value));
});

const getPendingCorrections = async () => {
  try {
    const apiEndpoint = `${correctionsHost}/pending`;
    const response = await axios.get(apiEndpoint);
    pendingCorrections.value = response.data.journals;
  } catch (error) {
    console.error('Error fetching pending corrections:', error);
  }
};

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    let filter = "type:journal|conference";
    if (search.value) {
      filter += isISSN(search.value) ? `,issn_l:${search.value}` : `,display_name.search:${search.value}`;
    }
    const response = await axios.get(`https://api.openalex.org/sources?filter=${filter}${openAccessFilterString.value}${worksFilterString.value}&per_page=100&sort=works_count:desc`);
    
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

const getDomain = (url) => {
  const domain = url.replace('https://', '').replace('http://', '').replace('www.', '');
  return domain.split('/')[0];
};

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

function submitCorrection() {
  const apiEndpoint = `${correctionsHost}/corrections`;

  try {
    const payload = generatePostData();
    axios.post(apiEndpoint, payload);
    showSuccessMessage.value = true;    
    pendingCorrections.value.push(editingJournal.value.issn_l);
  } catch (e) {
    const errData = e.response && e.response.data;
    console.error('Error submitting correction:', errData);
    showErrorMessage.value = true;
  }
  editDialog.value = false;
}

function generatePostData() {
  // Build payload to match API expectations
  const post = {
    type: 'journal',
    id: editingJournal.value.issn_l,
    "Approved": true,
    email: email.value,
    'New is_oa': correctedOA.value,
    'New oa_date': alwaysOA.value ? null : oaDate.value,
    'Previous is_oa': editingJournal.value.is_oa,
    'Previous oa_date': typeof editingJournal.value.oa_date !== 'undefined' ? editingJournal.value.oa_date : null
  }
  return post;
}

onMounted(() => {
  getPendingCorrections();
});

watch(search, () => {
  debouncedSearch();
}, { immediate: true });

watch(openAccessFilter, () => {
  searchResults.value = [];
  debouncedSearch();
});

watch(worksFilter, () => {
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

watch(showSuccessMessage, () => {
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 5000);
});

watch(showErrorMessage, () => {
  setTimeout(() => {
    showErrorMessage.value = false;
  }, 5000);
});
</script>

<style scoped>
:deep(.v-data-table tr th) {
  font-size: 12px;
  height: 36px !important;
}
.journal-title:hover {
text-decoration: underline;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;   /* Number of lines */
  overflow: hidden;
  text-wrap: wrap;
}
</style>
