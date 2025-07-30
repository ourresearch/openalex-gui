<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <div class="text-h5 mb-4">
        Unpaywall Journal Curation
      </div>

      <v-card flat rounded="xl" class="pa-8">
                  
        <v-row class="py-4 px-6 mb-2 d-flex mx-n6">
          
          <v-text-field
            v-model="search"
            variant="outlined"
            color="blue-lighten-2"
            flat
            clearable
            hide-details
            density="compact"
            prepend-inner-icon="mdi-magnify"
            class="mr-4"
            placeholder="Search by title or ISSN..."
          ></v-text-field>

          <!-- Open Access Filter -->
          <v-menu v-model="openAccessMenu" location="bottom end">
            <template #activator="{ props }">
              <span class="mr-1">
                <template v-if="openAccessFilter === 'all'">
                  <v-btn v-bind="props" variant="outlined" size="default" style="height: 40px;border-color: #b4b4b4;">
                    Open Access
                    <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                  </v-btn>
                </template>
                <template v-else>
                  <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" style="height: 40px;">
                    {{ openAccessFilter === 'open' ? 'Open' : 'Closed' }}
                    <v-icon icon="mdi-close" class="mr-n1" end @click.stop="openAccessFilter = 'all'"></v-icon>
                  </v-btn>
                </template>
              </span>
            </template>

            <v-card width="300">
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
          <v-menu v-model="worksMenu" location="bottom end" :close-on-content-click="false">
            <template #activator="{ props }">
              <template v-if="worksFilter === 0">
                <v-btn v-bind="props" variant="outlined" size="default" style="height: 40px; border-color: #b4b4b4;">
                  Works
                  <v-icon icon="mdi-menu-down" end color="grey-darken-1" class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" style="height: 40px;">
                  &gt;{{ filters.millify(worksFilter) }} works
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="worksFilter = 0"></v-icon>
                </v-btn>
              </template>
            </template>
            <v-card width="300">
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
        </v-row>


        <v-alert v-if="showSuccessMessage" type="success" density="compact">
          Your correction has been received and will be reviewed within a few days.
          <br />
          Thank you for your help.
        </v-alert>
        <v-alert v-if="showErrorMessage" type="error" density="compact">
          There was an error submitting your correction. Please try again later.
        </v-alert>

        <div v-if="search && search.length > 0">
          <div v-if="searchResults.length > 0">
            <v-data-table
            :headers="headers"
            :items="searchResults"
            :items-per-page="100"
            hide-default-footer
          >
            <template #item.edit-button="{ item }">
              <v-tooltip v-if="pendingCorrections.includes(item.issn_l)" text="A correction has been submitted for this journal. It will be reviewed within a few days.">
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props">
                    <v-icon icon="mdi-timer-sand" size="default" color="grey-lighten-1"></v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
              <v-tooltip v-else text="Submit a Fix" location="bottom">
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props" @click="editJournal(item)">
                    <v-icon icon="mdi-pencil" size="default" color="grey-lighten-1"></v-icon>
                  </v-btn>
                </template>
              </v-tooltip>
            </template>
          
            <template #item.display_name="{ value, item }">
              <div class="py-2 cursor-pointer" @click="setZoomId(item.id.replace('https://openalex.org/', ''))">
                {{ value }}
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

            <template #item.homepage_url="{ value }">
              <v-btn v-if="value" variant="tonal" color="blue-grey-darken-1" size="x-small" :href="value" target="_blank">
                {{ getDomain(value) }}
                <v-icon size="small" class="ml-1" icon="mdi-open-in-new" color="grey"></v-icon>
              </v-btn>
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


        <div v-else class="d-flex align-center justify-center mt-0 mb-6">
          <v-icon icon="mdi-book-open-variant-outline" color="blue-lighten-4" size="200"></v-icon>
          <div class="text-body-2 text-grey-darken-1 ml-6" style="line-height: 2.4;">
            Sometimes Unpaywall makes errors.<br>
            You can submit fixes to journals here.<br>
            Corrections will show up in a few days.
          </div>
        </div>
      </v-card>
    </v-container>
  </div>

  <v-dialog v-model="editDialog" width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-start w-100">
        <div style="flex: 1; min-width: 0; margin-right: 16px;">
          <div class="text-overline text-grey-darken-1">Submit a Fix</div>
          <div class="text-h6 ellipsis-2-lines">
            {{ editingJournal.display_name }}
          </div>
          <div class="text-grey-darken-1 text-caption">{{ editingJournal.issn_l }}</div>
        </div>
        <v-btn icon variant="text" class="mr-n4 mt-n2" style="flex-shrink: 0;" @click="editDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="pt-2">
        <v-radio-group v-model="correctedOA">
          <v-radio label="This journal is Open Access" :value="true"></v-radio>
          <v-radio label="This journal is Closed Access" :value="false"></v-radio>
        </v-radio-group>

        <div v-if="correctedOA && !editingJournal.is_oa" class="pt-6 pb-2" style="border-top: 1px solid #e0e0e0;">
          <v-radio-group v-model="alwaysOA">
            <v-radio label="This journal has always been Open Access" :value="true"></v-radio>
            <v-radio :value="false">
              <template #label>
                <div>
                  This journal became Open Access in
                  <v-text-field 
                    v-model="oaDate" 
                    class="d-inline-block" 
                    width="110" 
                    variant="outlined"
                    density="compact"
                    placeholder="e.g., 2020" 
                    hide-details
                    :rules="[() => /^(19|20)\d{2}$/.test(oaDate) || 'Please enter a four-digit year']"
                    style="vertical-align: middle;"></v-text-field>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </div>

        <div v-if="correctedOA !== editingJournal.is_oa" class="px-4 pt-6 pb-2" style="border-top: 1px solid #e0e0e0;">
          <div class="text-caption mb-1 text-grey-darken-2">
            Add your email in case we need to follow up (optional):
          </div>
          <v-text-field 
            v-model="submitterEmail"
            variant="outlined"
            density="compact"
            hide-details
            placeholder="your.email@example.com"
            type="email"></v-text-field>
        </div>
      </v-card-text>
      <v-card-actions style="border-top: 1px solid #e0e0e0;" class="bg-grey-lighten-4">
        <v-btn color="blue" variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn color="blue" variant="flat" :disabled="correctedOA === editingJournal.is_oa" @click="submitCorrection">Submit Fix</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>


<script setup>

import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import filters from '@/filters';

const store = useStore();

const search = ref('');
const searchResults = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter = ref('all');
const worksFilter = ref(0);

const pendingCorrections = ref([]);

const openAccessMenu = ref(false);
const worksMenu = ref(false);
const editDialog = ref(false);

const editingJournal = ref(null);
const correctedOA = ref(null);
const alwaysOA = ref(true);
const oaDate = ref(null);
const submitterEmail = ref(null);

const showSuccessMessage = ref(false);
const showErrorMessage = ref(false);

let debounceTimer = null;
let currentRequestId = 0;

const headers = [
  { title: '', key: 'edit-button', width: '30px', align: 'end', sortable: false },
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
  editingJournal.value = journal;
  editDialog.value = true;
  correctedOA.value = journal.is_oa;
};

const getPendingCorrections = async () => {
  try {
    const response = await axios.get('https://corrections.openalex.org/pending');
    //const response = await axios.get('http://localhost:5006/pending');
    pendingCorrections.value = response.data.journals;
  } catch (error) {
    console.error('Error fetching pending corrections:', error);
  }
};

const setZoomId = (id) => {
  store.commit('setZoomId', id);
};

const getSearchResults = async () => {
  if (!search.value || !search.value.trim()) {
    searchResults.value = [];
    return;
  }

  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    const filter = isISSN(search.value) ? `issn_l:${search.value}` : `display_name.search:${search.value}`;
    const response = await axios.get(`https://api.openalex.org/sources?filter=${filter},type:journal|conference${openAccessFilterString.value}${worksFilterString.value}&per_page=100`);
    
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
  //const apiEndpoint = "http://localhost:5006/corrections"
  const apiEndpoint = "https://corrections.openalex.org/corrections"

  try {
    const payload = generatePostData();
    axios.post(apiEndpoint, payload);
    showSuccessMessage.value = true;    
    pendingCorrections.value.push(editingJournal.value.issn_l);
  } catch (e) {
    const errData = e.response && e.response.data;
    errorMessage.value = (errData && errData.error) || e.message;
  }
  editDialog.value = false;
}

function generatePostData() {
  // Build payload to match API expectations
  const post = {
    type: 'journal',
    id: editingJournal.value.issn_l,
    email: submitterEmail.value || null,
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
    correctedOA.value = null;
    alwaysOA.value = true;
    oaDate.value = null;
    submitterEmail.value = null;
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

:deep(.v-data-table tr td:first-child) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;   /* Number of lines */
  overflow: hidden;
  text-wrap: wrap;
}
</style>
