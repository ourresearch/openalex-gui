<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container fluid class="pa-0 pa-sm-4" style="max-width: 900px;">
      <v-row>
        <v-col cols="12">
          <v-card rounded elevation="4" class="pt-6 pb-0 px-10">
            <v-row class="mt-2">
              <v-card-title class="py-0 px-2 mb-10">
                Sample Sets
              </v-card-title>
            </v-row>

            <!-- Samples List -->
            <v-row class="bg-grey-lighten-3 mx-n12 pa-6" style="border-top: 3px solid #BBDEFB">
              <v-col cols="12" sm="4" v-for="sample in Object.keys(samples)" :key="sample">
                <v-card color="white" class="sample-card fill-height">
                  <v-card-title>{{ samples[sample].name }}</v-card-title>
                  <v-card-text>
                    <div class="text-grey-darken-2 mb-4">{{ samples[sample].description }}</div>
                    <div class="d-flex justify-space-between" style="font-size: 12px;">
                      <div class="text-grey-darken-1">
                        <v-icon size="x-small" color="blue-lighten-1" icon="mdi-clock"></v-icon>
                        {{ samples[sample].date }}
                      </div>
                      <div class="text-grey-darken-1">
                        <v-icon size="x-small" color="blue-lighten-1" icon="mdi-pound"></v-icon>
                        {{ samples[sample].ids.length.toLocaleString() }}
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="bg-grey-lighten-3 px-12 py-0 mx-n12" style="border-top: 2px solid #ccc">
              <v-card color="white" class="pa-6 my-12" style="width: 500px;">
                <div class="text-h6 mb-6">New Sample</div>
                
                <!-- Sampler Builder -->
                <div v-if="!isLoading && !showResults">
                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label">Source</div>
                    <v-btn-toggle
                      v-model="sampleTarget"
                      color="blue"
                      variant="outlined"
                      density="compact"
                      mandatory
                      class="mr-2"
                    >
                      <v-btn value="prod">Prod</v-btn>
                      <v-btn value="walden-only">Xpac</v-btn>
                    </v-btn-toggle>                
                  </div>

                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label">Type</div>
                    <v-select
                      v-model="entityType"
                      :items="entityTypes"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="mr-2 flex-grow-0"
                      style="width: 120px;"
                    ></v-select>                  
                  </div>

                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label">Sample size</div>
                    <v-number-input
                      v-model="sampleSize"
                      variant="outlined"
                      min="1"
                      max="10000"
                      step="1000"
                      hide-details
                      density="compact"
                      class="mr-2 flex-grow-0"
                      control-variant="stacked"
                      style="width: 120px;"
                    ></v-number-input>
                  </div>


                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label">Sample filter</div>
                      <v-text-field
                        v-model="customFilter"
                        variant="outlined"
                        density="compact"
                        persistent-placeholder
                        hide-details
                        class="mr-2 flex-grow-0"
                        placeholder="e.g. type:article,is_oa:true"
                        style="width: 300px;"
                      ></v-text-field>
                  </div>


                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label">Sample recent days</div>
                    <v-number-input
                      v-model="sampleDays"
                      variant="outlined"
                      placeholder="e.g. 2"
                      min="1"
                      max="365"
                      step="1"
                      density="compact"
                      hide-details
                      class="mr-2 flex-grow-0"
                      control-variant="stacked"
                      style="width: 110px;"
                    ></v-number-input>                  
                  </div>

                  <div class="sampler-builder-row d-flex align-center">
                    <div class="label"></div>
                    <v-switch
                      v-model="includeApiResponses"
                      color="blue"
                      hide-details
                      density="compact"
                      class="mr-2 flex-grow-0"
                    >
                      <template #label>
                        <span class="text-body-2">Include API responses</span>
                      </template>
                    </v-switch>  
                  </div>

                  <div class="text-right">
                    <v-btn
                      color="blue"
                      @click="buildSample"
                    >
                      Build Sample
                    </v-btn>
                  </div>
                </div>
                
                <!-- Loading -->
                <div v-if="isLoading">
                  <div class="font-weight-medium text-grey-darken-1">Loading... {{ sampleIds.length.toLocaleString() }} / {{ sampleSize.toLocaleString() }}</div>
                  <v-progress-linear :model-value="(sampleIds.length / sampleSize) * 100" color="blue" class="my-4"></v-progress-linear>
                  <v-btn color="grey" variant="tonal" class="mr-2" @click="cancelSample">
                    Cancel
                  </v-btn>
                </div>

                <!-- Sample Results -->

                <div v-if="showResults">
                  <div class="font-weight-medium text-grey-darken-1 mb-2">Sample Built: {{ sampleIds.length }}</div>
                  <div class="d-flex">
                    <v-btn color="blue" variant="tonal" class="mr-2" @click="copySampleIds">
                      <v-icon :icon="lastCopied === 'ids' ? 'mdi-check' : 'mdi-content-copy'"></v-icon>
                      {{ lastCopied === 'ids' ? 'IDs Copied' : 'Copy IDs' }}
                    </v-btn>
                    <v-btn color="blue" variant="tonal" class="mr-2" v-if="includeApiResponses" @click="downloadResponses">
                      <v-icon icon="mdi-download"></v-icon>
                      Download Responses
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="blue" variant="outlined" class="mr-2" @click="cancelSample">
                      Back
                    </v-btn>
                  </div>
                </div>

              </v-card>
            </v-row>
          </v-card>
          
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

import { samples } from '@/qa/samples';

const pageSize = 100;
const prodUrl = `https://api.openalex.org/`;
const waldenUrl = `https://api.openalex.org/v2/`;
const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

let apiData        = {};

const sampleIds    = ref([]);
const isLoading    = ref(false);
const showResults  = ref(false);
const entityType   = ref("works");
const sampleSize   = ref(10000);
const sampleFilter = ref('');
const sampleDays   = ref(null);
const customFilter = ref('');
const includeApiResponses = ref(false);
const sampleTarget = ref('walden-only');
const errorMessage = ref('');
const lastCopied   = ref('');

const entityTypes = [
  "works",
  "authors",
  "sources",
  "institutions",
  "publishers",
]

async function buildSample() {
  sampleIds.value = [];
  apiData = {};
  isLoading.value = true;

  while (sampleIds.value.length < sampleSize.value && isLoading.value) {
    await fetchRandomSample();
  }
  sampleIds.value = sampleIds.value.slice(0, sampleSize.value);
  isLoading.value = false;
  showResults.value = true;
}

async function fetchRandomSample() {
  let newIds = [];

  const url = sampleUrl();

  try {
    const response = await axios.get(url, axiosConfig);
    if (isLoading.value === false) { return; }
    newIds = response.data.results.map(result => extractID(result.id));
    response.data.results.forEach(result => {
      apiData[extractID(result.id)] = result;
    });
    if (sampleTarget.value === 'walden-only') {
      newIds = await removeProdIds(newIds);
    }
    sampleIds.value = [...new Set(sampleIds.value.concat(newIds))];

  } catch (error) {
    if (error.response?.data?.error === "Invalid query parameters error.") {
      errorMessage.value = "It looks like your custom filter is invalid.";
    } else {
      errorMessage.value = "There was an error fetching sample IDs."
    }
  }
}

function sampleUrl() {
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

  const apiBase = sampleTarget.value === 'walden-only' ? waldenUrl : prodUrl;

  let url = `${apiBase}${entityType.value}?sample=${pageSize}${filterStr}&per_page=${pageSize}`;
  if (!includeApiResponses.value) {
    url += '&select=id';
  }  
  return url;
}

async function removeProdIds(ids) {
  const filterKey = 'ids.openalex'
  const selectFields = ['id'];
  const filter = ids.map(id => encodeURIComponent(id)).join('|');
  const url = `https://api.openalex.org/works?filter=${filterKey}:${filter}&select=${selectFields.join(',')}&per_page=100`;
  const response = await axios.get(url, axiosConfig);
  const prodIds = response.data.results.map(result => extractID(result.id));
  return ids.filter(id => !prodIds.includes(id));
}

const extractID = (input) => {
  return input.split("/").slice(-1)[0];
}

function cancelSample() {
  sampleIds.value = [];
  apiData = {};
  isLoading.value = false;
  showResults.value = false;
}

function copySampleIds() {
  navigator.clipboard.writeText(JSON.stringify(sampleIds.value, null, 2));
  lastCopied.value = 'ids';
}

function downloadResponses() {
  const blob = new Blob([JSON.stringify(apiData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'responses.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
    

<style scoped>
.sample-card .v-icon {
  margin-top: -2px;
}
.sampler-builder-row {
  margin-bottom: 12px;
}
.sampler-builder-row .label {
  width: 140px;
  font-weight: bold;
  color: #555;
  font-size: 14px;
  margin-right: 12px;
}
</style>
