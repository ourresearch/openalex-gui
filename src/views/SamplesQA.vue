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
            <div class="py-6">
              <v-btn
                color="blue"
                @click="buildSample"
              >
                Build Sample
              </v-btn>
              <v-card v-if="isLoading || sampleIds.length" color="grey-lighten-4" class="mt-4 pa-4">
                <div class="font-weight-medium" v-if="isLoading">Loading... {{ sampleIds.length }} / {{ sampleSize }}</div>
                <div v-else-if="sampleIds.length">
                  <div class="font-weight-medium mb-2">Sample Built: {{ sampleIds.length }}</div>
                  <div>
                    <v-btn color="blue" variant="tonal" class="mr-2" @click="copySampleIds">
                      <v-icon :icon="lastCopied === 'ids' ? 'mdi-check' : 'mdi-content-copy'"></v-icon>
                      {{ lastCopied === 'ids' ? 'IDs Copied' : 'Copy IDs' }}
                    </v-btn>
                    <v-btn color="blue" variant="tonal" class="mr-2" @click="downloadResponses">
                      <v-icon icon="mdi-download"></v-icon>
                      Download Responses
                    </v-btn>
                  </div>
                </div>
              </v-card>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const pageSize = 100;
const prodUrl = `https://api.openalex.org/`;
const waldenUrl = `https://api.openalex.org/v2/`;
const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

let apiData        = {};

const sampleIds    = ref([]);
const isLoading    = ref(false);
const sampleSize   = ref(10000);
const sampleFilter = ref('');
const sampleDays   = ref(2);
const customFilter = ref('');
const sampleTarget = ref('walden-only');
const errorMessage = ref('');
const lastCopied   = ref('');


async function buildSample() {
  sampleIds.value = [];
  apiData = {};
  
  while (sampleIds.value.length < sampleSize.value) {
    await fetchRandomSample();
  }
  sampleIds.value = sampleIds.value.slice(0, sampleSize.value);
}

async function fetchRandomSample() {
  isLoading.value = true;
  let newIds = [];

  const url = sampleUrl();

  try {
    const response = await axios.get(url, axiosConfig);
    newIds = response.data.results.map(result => extractID(result.id));
    response.data.results.forEach(result => {
      apiData[extractID(result.id)] = result;
    });
    if (sampleTarget.value === 'walden-only') {
      newIds = await removeProdIds(newIds);
    }
    sampleIds.value = [...new Set(sampleIds.value.concat(newIds))];

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

  const url = `${apiBase}works?sample=${pageSize}${filterStr}&per_page=${pageSize}`;  
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
    