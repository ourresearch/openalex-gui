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
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-chip
                    color="teal"
                    v-bind="props"
                  >
                    <b class="mr-1">Sample:</b> {{ sample.name }}
                  </v-chip>
                </template>

                <template #default>
                  <div>{{ sample.description }}</div>
                  <div>Size: {{ sample.ids.length.toLocaleString() }}</div>
                  <div>Date: {{ sample.date }}</div>
                </template>
              </v-tooltip>

            </v-row>

            <v-pagination
              v-model="page"
              :length="100"
              :total-visible="10"
              rounded
              class="mt-2 mb-12 bg-blue-lighten-5 mx-n10"
              style="border-top: 3px solid #BBDEFB;"
            ></v-pagination>

            <template v-if="!isLoading">
            <v-row v-for="id in idsToShow" :key="id" class="mb-3 pb-3" style="line-height: 1.3; border-bottom: 1px solid #f5f5f5;">
              <v-col cols="12" sm="9">
                <div class="mb-0" style="font-size: 18px; cursor: pointer;" @click="zoomId = id">
                  <span v-if="apiData[id].title">{{ apiData[id].title }}</span>
                  <span v-else class="text-red-lighten-2">Title Missing</span>
                </div>
                <div class="text-green-darken-2" style="line-height: 1;">
                  <template v-if="apiData[id].authorships.length">
                    <span 
                      v-for="(authorship, index) in apiData[id].authorships" :key="authorship.id"
                      class="text-caption mr-1"
                      style="font-size: 14px !important;"
                    >
                    {{ authorship.raw_author_name }}{{ index < apiData[id].authorships.length - 1 ? ',' : '' }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-caption mr-1 text-red-lighten-2" style="font-size: 14px !important;">Authors Missing</span>
                  </template>
                </div>
                <div class="text-caption text-grey-darken-2" style="font-size: 14px !important;">
                  <span>{{ apiData[id].publication_year }}</span>
                  <span class="mx-1">•</span>
                  <template v-if="apiData[id].primary_location.source.display_name">
                    <span>{{ apiData[id].primary_location.source.display_name }}</span>
                    <span v-if="!apiData[id].primary_location.source.id" class="text-red-lighten-2 ml-1">- Source ID Missing</span>
                  </template>
                  <template v-else>
                    <span class="text-red-lighten-2">Source Missing</span>
                  </template>
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
                    color="blue"
                    size="x-small"
                    class="display-inline-block flex-grow-0 mb-1"
                    style="text-decoration: none;"
                  >
                    {{ titleMatches[id].toLocaleString() }} {{ titleMatches[id] === 1 ? 'match' : 'matches' }}
                    <v-icon class="ml-0" icon="mdi-chevron-right"></v-icon>
                  </v-chip>

                </div>
              </v-col>
            </v-row>
            </template>

            <v-skeleton-loader v-if="isLoading" type="list-item-three-line@12"></v-skeleton-loader>
            
            <v-pagination
              v-if="!isLoading"
              v-model="page"
              :length="100"
              :total-visible="10"
              rounded
              class="mt-8"
            ></v-pagination>

            <div ref="bottomObserver" class="py-4"></div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Work Details Drawer -->  
    <work-drawer 
      v-model:isDrawerOpen="isDrawerOpen" 
      :workId="zoomId" 
      :workData="zoomId && apiData[zoomId] ? apiData[zoomId] : null"
      @close="onDrawerClose"
    />
  </div>
</template>


<script setup>
import { ref, reactive, computed, watch } from 'vue';
import axios from 'axios';

import { samples } from '@/qa/samples';
import { useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';

const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};
const entityType = 'works';

const sample   = samples.xpac2;
const sampleIds = sample.ids;

let apiData          = {};
const useCachedData  = true;
let cachedDataLoaded = false;

const titleMatches  = reactive({});
const isLoading     = ref(false);
const pageSize      = ref(100);
const page          = useParams('page', 'number', 1);
const zoomId        = useParams('zoomId', 'string', null);

const idsToShow = computed(() => {
  return sampleIds.slice((page.value - 1) * pageSize.value, page.value * pageSize.value);
});

const isDrawerOpen = computed(() => zoomId.value !== null);

async function fetchResponses() {
  isLoading.value = true;
  if (useCachedData) {
    if (!cachedDataLoaded) {
      apiData = (await axios.get("https://gui-test-data.s3.us-east-2.amazonaws.com/xpac2Responses.json")).data;
      cachedDataLoaded = true;
    }
    isLoading.value = false;
    return;
  }
  let newIds = [];
  idsToShow.value.forEach(id => {
    if (!(id in apiData)) {
      newIds.push(id);
    }
  });
  if (newIds.length > 0) {
    const url = `https://api.openalex.org/v2/${entityType}?filter=ids.openalex:${newIds.join('|')}&per_page=100`;
    const response = await axios.get(url, axiosConfig);
    response.data.results.forEach(result => {
      apiData[extractID(result.id)] = result;
    });
  }
  isLoading.value = false;
}

const extractID = (input) => {
  return input.split("/").slice(-1)[0];
}

async function checkTitleMatch(id) {
  if (!apiData[id]?.title) { return; }
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

watch(idsToShow, async () => {
  await fetchResponses();
  idsToShow.value.forEach(id => {
    if (!(id in titleMatches)) {
      checkTitleMatch(id);
    }
  });
}, { immediate: true });

function onDrawerClose() {
  zoomId.value = null;
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