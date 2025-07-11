<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-row>
        <v-col cols="12">
          <v-card rounded elevation="4" class="pt-6 pb-0 px-10">
            <v-row class="mt-2">
              <v-card-title class="py-0 px-2 mb-10">
                <v-icon size="large" variant="plain" color="blue-lighten-2" icon="mdi-dice-multiple-outline"></v-icon>
                Xpac Sampler
              </v-card-title>
              <v-spacer></v-spacer>
              <v-btn 
                variant="outlined" 
                size="x-large" 
                density="compact"
                color="blue-lighten-2" 
                class="mr-1 square-btn flex-grow-0"
                @click="showSettingsDialog = true"
              >
                <v-icon icon="mdi-cog"></v-icon>
              </v-btn>
            </v-row>

            <v-row v-for="id in ids" :key="id" class="mb-3 pb-3" style="line-height: 1.3; border-bottom: 1px solid #f5f5f5;">
              <v-col cols="12" sm="9">
                <div class="mb-0" style="font-size: 18px; cursor: pointer;" @click="zoomId = id">
                  {{ apiData[id].title ? apiData[id].title : '[Title Missing]' }}
                </div>
                <div class="text-green-darken-2" style="line-height: 1;">
                  <span 
                    v-for="(authorship, index) in apiData[id].authorships" :key="authorship.id"
                    class="text-caption mr-1"
                    style="font-size: 14px !important;"
                  >
                    {{ authorship.raw_author_name }}{{ index < apiData[id].authorships.length - 1 ? ',' : '' }}
                  </span>
                </div>
                <div class="text-caption text-grey-darken-2" style="font-size: 14px !important;">
                  <span>{{ apiData[id].publication_year }}</span>
                  <span v-if="apiData[id].primary_location.source.display_name" class="mx-1">•</span>
                  <span>{{ apiData[id].primary_location.source.display_name }}</span>
                </div>
                <div class="text-caption text-grey-darken-2" style="font-size: 14px !important;">
                  <span>{{ apiData[id].type }}</span>
                  <span class="mx-1">•</span>
                  <span>{{ apiData[id].open_access.oa_status }}</span>
                  <v-chip
                      :href="`https://api.openalex.org/v2/works/${id}`" 
                      target="_blank"
                      color="blue-lighten-1"
                      size="x-small"
                      class="ml-2"
                      style="text-decoration: none;"
                    >
                      API
                      <v-icon class="ml-0" icon="mdi-chevron-right"></v-icon>
                    </v-chip>
                </div>
              </v-col>

              <v-col cols="12" sm="2" offset-sm="1">

                <div class="text-caption text-right">
                  <v-chip
                    v-if="!(id in titleMatches) && apiData[id].title"
                    color="grey"
                    size="x-small"
                    class="display-inline-block mb-1"
                    :href="`https://openalex.org/works?filter=display_name.search:${encodeTitle(apiData[id].title)}`" 
                    target="_blank"
                  >
                    Checking...
                  </v-chip>

                  <v-chip
                    v-if="titleMatches[id]"
                    :href="`https://openalex.org/works?filter=display_name.search:${encodeTitle(apiData[id].title)}`" 
                    target="_blank"
                    color="red-lighten-3"
                    size="x-small"
                    class="display-inline-block flex-grow-0 mb-1"
                    style="text-decoration: none;"
                  >
                    {{ titleMatches[id].toLocaleString() }} {{ titleMatches[id] === 1 ? 'match' : 'matches' }}
                    <v-icon class="ml-0" icon="mdi-chevron-right"></v-icon>
                  </v-chip>

                  <v-chip
                    v-if="!apiData[id].title"
                    color="red-lighten-3"
                    size="x-small"
                    class="display-inline-block flex-grow-0 mb-1"
                  >
                    Title missing
                  </v-chip>

                  <v-chip
                    v-if="apiData[id].authorships.length === 0"
                    color="red-lighten-3"
                    size="x-small"
                    class="display-inline-block flex-grow-0 mb-1"
                  >
                    Authors missing
                  </v-chip>

                  <v-chip
                    v-if="apiData[id].primary_location.source.id === null"
                    color="red-lighten-3"
                    size="x-small"
                    class="display-inline-block flex-grow-0 mb-1"
                  >
                    Source missing
                  </v-chip>

                </div>
              </v-col>
            </v-row>

            <v-skeleton-loader v-if="isLoading" type="list-item-two-line@12"></v-skeleton-loader>
            
            <div ref="bottomObserver" class="py-4"></div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="900px">
      <v-card class="pa-2">

        <!-- Sample -->
        <v-card-text>
          <div class="text-body-1 text-grey-darken-2 font-weight-medium mb-2">Sample</div>
          <v-card flat rounded class="pa-0 mb-2">
            <v-row>
              <v-col cols="12" sm="4">
                <v-card 
                  flat 
                  rounded 
                  :class="['option-card', 'fill-height', sampleFilter == null ? 'selected' : '']"
                  variant="outlined"
                  class="d-flex align-center justify-center"
                  @click="sampleFilter = null"
                >
                  <v-card-text>
                    <div class="text-grey-darken-2 text-center">
                      <v-icon size="x-large" variant="plain" color="grey" class="mb-1" icon="mdi-file-document-outline"></v-icon>
                      <div>All {{ entityType }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="4">
                <v-card 
                  flat 
                  rounded 
                  :class="['option-card', 'fill-height', sampleFilter == 'recent' ? 'selected' : '']"
                  variant="outlined"
                  @click="sampleFilter = 'recent'"
                >
                  <v-card-text>
                    <div class="text-grey-darken-2 mb-2">
                      <v-icon variant="plain" color="grey" icon="mdi-clock-outline"></v-icon>
                      {{ filters.titleCase(entityType) }} from recent days:
                    </div>
                    <v-number-input
                      v-model="sampleDays"
                      :min="1"
                      :max="365"
                      variant="outlined"
                      flat
                      density="compact"
                      inline
                      hide-details
                      width="100px"
                      style="margin: auto;"
                      control-variant="stacked"
                    />
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="4">
                <v-card 
                  flat 
                  rounded 
                  :class="['option-card', 'fill-height', sampleFilter == 'custom' ? 'selected' : '']"
                  variant="outlined"
                  @click="sampleFilter = 'custom'"
                >
                  <v-card-text>
                    <div class="text-grey-darken-2 mb-2">
                      <v-icon variant="plain" color="grey" icon="mdi-filter-outline"></v-icon>
                      Custom filter:
                    </div>
                    <v-text-field
                      v-model="customFilter"
                      placeholder="e.g. 'type:article'"
                      variant="outlined"
                      flat
                      hide-details
                      density="compact"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelSettingsChange">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="applySettingsChange">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Work Details Drawer -->  
    <work-drawer 
      v-model:isDrawerOpen="isDrawerOpen" 
      :workId="zoomId" 
      :workData="zoomId && apiData[zoomId] ? apiData[zoomId] : null"
    />
  </div>
</template>


<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

import filters from '@/filters';
import { useParamsAndLocalStorage } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';

const apiBase = `https://api.openalex.org/v2/`;
const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};
const sampleSize = 100;
const entityType = 'works';

const ids                = ref([]);
const apiData            = reactive({});
const titleMatches       = reactive({});
const errorMessage       = ref('');
const isLoading          = ref(false);
const zoomId             = ref(null);
const showSettingsDialog = ref(false);
const isDrawerOpen       = ref(false);
const bottomObserver     = ref(null);
const scrollContainer    = ref(null);

const sampleFilter = useParamsAndLocalStorage('sampleFilter', 'string', null);
const sampleDays   = useParamsAndLocalStorage('sampleDays', 'number', 2);
const customFilter = useParamsAndLocalStorage('customFilter', 'string', '');

const previousSettings = {};

async function fetchRandomSample() {
  isLoading.value = true;
  let allIds = [];

  let filterStr = '';

  if (sampleFilter.value === 'recent') {
    const now = new Date();
    now.setDate(now.getDate() - sampleDays.value);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fromCreatedDate = `${yyyy}-${mm}-${dd}`;
    filterStr = `&filter=from_created_date:${fromCreatedDate}`;
  } else if (sampleFilter.value === 'custom') {
    filterStr = `&filter=${customFilter.value}`;
  }

  const url = `${apiBase}${entityType}?sample=${sampleSize}${filterStr}&per_page=${sampleSize}`;
  try {
    const response = await axios.get(url, axiosConfig);
    allIds = response.data.results.map(result => extractID(result.id));
    response.data.results.forEach(result => {
      apiData[extractID(result.id)] = result;
    });
    let xpacIds = await removeProdIds(allIds);
    ids.value = ids.value.concat(xpacIds);
    isLoading.value = false;
  } catch (error) {
    isLoading.value = false;
    if (error.response?.data?.error === "Invalid query parameters error.") {
      errorMessage.value = "It looks like your custom filter is invalid.";
    } else {
      errorMessage.value = "There was an error fetching sample IDs."
    }
  }
}

async function removeProdIds(ids) {
  const filterKey = 'ids.openalex'
  const selectFields = ['id'];
  const filter = ids.map(id => encodeURIComponent(id)).join('|');
  const url = `https://api.openalex.org/${entityType}?filter=${filterKey}:${filter}&select=${selectFields.join(',')}`;
  const response = await axios.get(url, axiosConfig);
  const prodIds = response.data.results.map(result => extractID(result.id));
  return ids.filter(id => !prodIds.includes(id));
}

const extractID = (input) => {
  return input.split("/").slice(-1)[0];
}

async function checkTitleMatch(id) {
  if (!apiData[id]?.title) return;
  const title = apiData[id].title;
  const url = `https://api.openalex.org/works?filter=display_name.search:${encodeTitle(title)}`;
  try {
    const response = await axios.get(url, axiosConfig);
    titleMatches[id] = response.data.meta.count;
  } catch (error) {
    console.error("Error checking title match:", error);
  }
}

function encodeTitle(title) {
  title = title.replace(/[^\w\s]/gi, ' ');
  title = title.replace(/\s+/g, '+');
  return encodeURIComponent(title);
}

function cancelSettingsChange() {
  sampleFilter.value = previousSettings.sampleFilter;
  sampleDays.value = previousSettings.sampleDays;
  customFilter.value = previousSettings.customFilter;
  showSettingsDialog.value = false;
}

function applySettingsChange() {
  showSettingsDialog.value = false;
  if (previousSettings.sampleFilter !== sampleFilter.value 
    || previousSettings.sampleDays !== sampleDays.value 
    || previousSettings.customFilter !== customFilter.value) {
    ids.value = [];
    fetchRandomSample();
  }
}

watch(ids, () => {
  ids.value.forEach(id => {
    if (!(id in titleMatches)) {
      checkTitleMatch(id);
    }
  });
});

watch(showSettingsDialog, () => {
  if (showSettingsDialog.value) {
    previousSettings.sampleFilter = sampleFilter.value;
    previousSettings.sampleDays = sampleDays.value;
    previousSettings.customFilter = customFilter.value;
  }
});

watch(zoomId, () => {
  if (zoomId.value) {
    isDrawerOpen.value = true;
  }
});

watch(isDrawerOpen, () => {
  if (!isDrawerOpen.value) {
    zoomId.value = null;
  }
});

onMounted(() => {
  fetchRandomSample();
  setupInfiniteScroll();
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

let observer = null;

function setupInfiniteScroll() {
  // Use Intersection Observer API to detect when user scrolls to bottom
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting && !isLoading.value) {
      fetchRandomSample();
    }
  }, {
    root: null, // Use viewport as root
    rootMargin: '0px',
    threshold: 0.1 // Trigger when 10% of the element is visible
  });
  
  // Start observing the bottom element
  if (bottomObserver.value) {
    observer.observe(bottomObserver.value);
  }
}
</script>


<style scoped>
.square-btn {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
}
.option-card {
  border-color: #BDBDBD;
  background-color: #FAFAFA;
}
.option-card.selected {
  border-color: #64B5F6;
  background-color: #E1F5FE;
}
.option-card .v-icon {
  margin-top: -2px;
}
:deep(.option-card.selected input) {
  background-color: white !important;
}
</style>