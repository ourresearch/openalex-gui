<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-row>
        <v-col cols="12">
          <div class="ml-2">
            <div class="text-h4 mb-0">
              OREO
            </div>
            <div class="text-body-2 mb-3">
              OpenAlex Rewrite Evaluation Overview
            </div>
          </div>
          <v-card flat class="rounded-o pt-4 pb-4 px-10">
            <v-row class="mt-0 pb-4 mb-8 px-4 mx-n10" style="border-bottom: 1px solid #e0e0e0">
              <div class="font-weight-medium" style="font-size: 16px;">
                <template v-if="source === 'xpac'">
                  <v-icon size="small" variant="plain" class="mr-1" color="blue-lighten-2" icon="mdi-file-document-plus-outline"></v-icon>
                  Xpac Explorer
                </template>
                <template v-if="source === 'prod-only'">
                  <v-icon size="small" variant="plain" class="mr-1" color="blue-lighten-2" icon="mdi-factory"></v-icon>
                  Prod Only Explorer
                </template>
              </div>

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

            <template v-if="!isLoading">
              <v-row v-for="id in idsWithData" :key="id" class="mb-3 pb-3" style="line-height: 1.3; border-bottom: 1px solid #f5f5f5;">
                <v-col cols="12" sm="9">

                  <google-scholar-view :id="id" :data="apiData[id]" @title-click="zoomId = $event"/>

                </v-col>

                <v-col cols="12" sm="2" offset-sm="1">

                  <div v-if="source === 'xpac'" class="text-caption text-right">
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

          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Work Details Drawer -->  
    <work-drawer 
      v-model:isDrawerOpen="isDrawerOpen" 
      :workId="zoomId" 
      :workData="zoomId && apiData[zoomId] ? apiData[zoomId] : null"
      :isV2="source === 'xpac'"
      @close="onDrawerClose"
    />

    <oreo-nav />

  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';

import { samples } from '@/qa/samples';
import { useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';
import OreoNav from '@/components/QA/OreoNav.vue';
import GoogleScholarView from '@/components/QA/googleScholarView.vue';

const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};
const entityType = 'works';

const apiData       = ref({});
const titleMatches  = ref({});
const isLoading     = ref(false);
const pageSize      = ref(100);
const page          = useParams('page', 'number', 1);
const source        = useParams('source', 'string', 'xpac');
const zoomId        = useParams('zoomId', 'string', null);

const sample    = computed(() => source.value === 'xpac' ? samples.xpac3 : samples.prodOnly1);
const sampleIds = computed(() => sample.value.ids);

const idsToShow = computed(() => {
  return sampleIds.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value);
});

const idsWithData = computed(() => {
  return idsToShow.value.filter(id => id in apiData.value);
});

const isDrawerOpen = computed(() => zoomId.value !== null);

async function fetchResponses() {
  isLoading.value = true;

  let newIds = [];
  idsToShow.value.forEach(id => {
    if (!(id in apiData.value)) {
      newIds.push(id);
    }
  });
  if (newIds.length > 0) {
    const version = source.value === 'xpac' ? 'v2/' : '';
    const url = `https://api.openalex.org/${version}${entityType}?filter=ids.openalex:${newIds.join('|')}&per_page=100`;
    const response = await axios.get(url, axiosConfig);
    response.data.results.forEach(result => {
      apiData.value[extractID(result.id)] = result;
    });
  }
  isLoading.value = false;
}

const extractID = (input) => {
  return input.split("/").slice(-1)[0];
}

async function checkTitleMatch(id) {
  if (!apiData.value[id]?.title) { return; }
  const title = apiData.value[id].title;
  const url = `https://api.openalex.org/works?filter=display_name.search:${encodeTitle(title)}`;
  try {
    const response = await axios.get(url, axiosConfig);
    titleMatches.value[id] = response.data.meta.count;
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
  if (source.value === 'xpac') {
    idsToShow.value.forEach(id => {
      if (!(id in titleMatches.value)) {
        checkTitleMatch(id);
      }
    });
  }
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