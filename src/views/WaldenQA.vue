<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;">
    <v-container :fluid="smAndDown" class="pa-0 pa-sm-4">
      <v-row>
        <v-col cols="12">
          <v-card rounded elevation="4" class="pt-6 pb-0 px-10">
            
            <!-- Title Row -->
            <v-row class="mt-2">
              <v-card-title class="pa-0 mb-5">
                Walden Comparison
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

            <!-- Top Controls -->
            <v-row class="top-controls mb-0 mx-n4 sticky-controls" dense>
              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">
                <v-btn-toggle
                  v-model="mode"
                  color="blue"
                  variant="outlined"
                  density="compact"
                  mandatory
                  class="mr-2"
                >
                  <v-btn value="table">Table</v-btn>
                  <v-btn value="results">Results</v-btn>
                  <v-btn value="diff">Diff</v-btn>
                </v-btn-toggle>

                <v-menu location="bottom right" :close-on-content-click="false">
                  <template #activator="{ props }">
                    <v-chip 
                      variant="tonal" 
                      size="large" 
                      color="blue"
                      label
                      class="mr-1"
                      v-bind="props"
                    >
                      Fields: {{ fieldsToShow.length }} of {{ Object.keys(schema[entityType]).length }}
                      <v-icon icon="mdi-menu-down"></v-icon>
                    </v-chip>
                  </template>
                  <v-card style="max-width: 900px;">
                    <v-card-text>
                    <!-- Fields -->
                    <div class="text-body-1 text-grey-darken-2 font-weight-medium mb-2">
                      Fields to Show
                      <v-btn
                        color="grey"
                        variant="tonal"
                        size="x-small"
                        class="mr-2"
                        @click="fieldsToShow = [...defaultFields[entityType]]"
                      >
                        <v-icon icon="mdi-refresh"></v-icon>
                        Defaults
                      </v-btn>
                      
                      <v-btn
                        color="grey"
                        variant="tonal"
                        size="x-small"
                        class="mr-2"
                        @click="fieldsToShow = [...Object.keys(schema[entityType])]"
                      >
                        <v-icon icon="mdi-select-group"></v-icon>
                        All
                      </v-btn>                      
                      
                      <v-btn
                        color="grey"
                        variant="tonal"
                        size="x-small"
                        @click="fieldsToShow = []"
                      >
                        <v-icon icon="mdi-select"></v-icon>
                        None
                      </v-btn>
                    </div>
                    <v-card rounded flat border class="fields-card pa-6 pb-4 bg-grey-lighten-5">
                      <v-chip 
                        v-for="field in Object.keys(schema[entityType])" 
                        :key="field"
                        :text="field"
                        variant="flat"
                        :color="fieldsToShow.includes(field) ? 'blue-lighten-5' : 'grey-lighten-3'"
                        class="mr-2 mb-3"
                        @click="toggleField(field)"
                      />
                    </v-card>
                  </v-card-text>
                  </v-card>
                </v-menu>
              </v-col>

            </v-row>

            <v-pagination
              v-model="page"
              :length="100"
              :total-visible="10"
              rounded
              class="mt-8 bg-blue-lighten-5 mx-n10"
              style="border-top: 3px solid #BBDEFB;"
            ></v-pagination>

            <!-- Start View -->
            <div v-if="!searchStarted && matchedIds.length === 0" class="start-view mt-8 d-flex align-center justify-center">
              <div class="text-center">
                <v-icon size="200" :color="errorMessage ? 'red-lighten-4' : 'blue-lighten-4'" icon="mdi-tools" class="mb-4"></v-icon>
                <div class="ml-2 text-grey-darken-1 font-weight-medium" style="font-size: 18px; letter-spacing: .5px;">
                  <span v-if="errorMessage" class="text-red">{{ errorMessage }}</span>
                  <span v-else>“Quality improvement through painstaking toil.”</span>
                </div>
              </div>
            </div>
            
            <!-- Skeleton Loader -->
            <v-skeleton-loader 
              v-if="searchStarted && matchedIds.length === 0" 
              :type="mode === 'table' ? 'table' : 'list-item-three-line@12'" 
              class="mt-8"
            />

            <!-- Results -->
            <div v-if="matchedIds.length > 0" class="bg-grey-lighten-4 mx-n10 py-2 results-section">
              <!-- Stats -->
              <v-row :dense="smAndDown" class="px-2 px-sm-6 pt-5 pb-7">
                <v-col cols="3" class="py-2">
                  <v-card color="grey-lighten-5" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ matchRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Match Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="grey-lighten-5" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ returnRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Return Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="grey-lighten-5" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ cellMatchRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Cell Match Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="grey-lighten-5" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ matchedIds.length }}</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Sample Size</v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Results Table -->
              <div v-if="mode == 'table'" ref="tableScrollRef" class="table-scroll">
                <v-data-table
                  ref="vDataTableRef"
                  class="results-table"
                  :headers="headers"
                  :items="rows"
                  :items-per-page="-1"
                  hide-default-footer
                  density="compact"
                  item-value="name"
                >
                  <template v-slot:headers="{ columns }">
                    <tr>
                      <th v-for="column in columns" :key="column.key">
                        {{ column.title }}
                        <span 
                          v-if="column.key !== 'source'"
                          class="text-caption text-grey-darken-1 ml-1"
                        >
                          {{ columnMatchRates[column.key] }}%
                        </span>
                      </th>
                    </tr>
                  </template>
                  <template v-slot:item="{ item, columns }">
                      <tr>
                        <td v-for="column in columns" :key="column.key" :style="getCellStyle(item, column)">
                          <span v-if="column.key === 'source'">
                            <a :href="item.url" target="_blank">{{ item[column.key] }} 
                            <v-icon size="x-small" variant="plain" icon="mdi-open-in-new"></v-icon></a>
                          </span>
                          <span v-else>
                            {{ item[column.key] }}
                          </span>
                        </td>
                      </tr>
                    </template>
                </v-data-table>
              </div>

              <!-- Results List -->
              <div v-if="mode == 'results'">
                <v-card class="py-8 px-12">
                  <v-row v-for="id in matchedIds" :key="id">
                    <template v-if="!hide404s || waldenResults[id]">
                      <v-col  
                        v-for="(data, index) in [prodResults[id], waldenResults[id]]" 
                        :key="index" 
                        cols="6" 
                        class="pr-12 pb-10"
                      >
                        <div v-if="data">
                          <div class="mb-0" style="font-size: 18px; cursor: pointer;" @click="onZoom(data.id, index)">
                            <span v-if="data.title" :class="index === 1 && !matches[id]['title'] ? 'text-red-lighten-2' : ''">
                              {{ data.title }}
                            </span>
                            <span v-else class="text-red-lighten-2">Title Missing</span>
                          </div>
                          <div class="text-green-darken-2" style="line-height: 1;">
                            <template v-if="data.authorships.length">
                              <span 
                                v-for="(authorship, index) in data.authorships" :key="authorship.id"
                                class="text-caption mr-1"
                                style="font-size: 14px !important;"
                              >
                              {{ authorship.raw_author_name }}{{ index < data.authorships.length - 1 ? ',' : '' }}
                              </span>
                            </template>
                            <template v-else>
                              <span class="text-caption mr-1 text-red-lighten-2" style="font-size: 14px !important;">Authors Missing</span>
                            </template>
                          </div>
                          <div class="text-caption text-grey-darken-2" style="font-size: 14px !important;">
                            <span :class="index === 1 && !matches[id]['publication_year'] ? 'text-red-lighten-2' : ''">
                              {{ data.publication_year }}
                            </span>
                            <span class="mx-1">•</span>
                            <template v-if="data.primary_location?.source?.display_name">
                              <span :class="index === 1 && !matches[id]['primary_location.source.display_name'] ? 'text-red-lighten-2' : ''">
                                {{ data.primary_location.source?.display_name }}
                              </span> 
                              <span v-if="!data.primary_location.source?.id" class="text-red-lighten-2 ml-1">- Source ID Missing</span>
                            </template>
                            <template v-else>
                              <span class="text-red-lighten-2">Source Missing</span>
                            </template>
                          </div>
                          <div class="text-caption text-grey-darken-2" style="font-size: 14px !important;">
                            <span :class="index === 1 && !matches[id]['type'] ? 'text-red-lighten-2' : ''">
                              {{ data.type }}
                            </span>
                            <span class="mx-1">•</span>
                            <span :class="index === 1 && !matches[id]['open_access.oa_status'] ? 'text-red-lighten-2' : ''">
                              {{ data.open_access?.oa_status }}
                            </span>
                            <v-chip
                              :href="`https://api.openalex.org/${index === 1 ? 'v2/' : ''}works/${id}`" 
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
                        </div>
                        <div v-else>
                          <div class="mb-0" style="font-size: 18px;">
                            <span class="text-red-lighten-2">404</span>
                          </div>
                        </div>
                      </v-col>
                    </template>
                  </v-row>
              </v-card>
              </div>

              <!-- Diff List-->
              <div v-else-if="mode == 'diff'">
                <v-card class="py-8 px-12">
                  <v-row v-for="id in matchedIds" :key="id">
                    <template v-if="!hide404s || waldenResults[id]">
                      <table class="diff-table mb-16" style="table-layout: fixed; max-width: 100%;">
                        <tr class="text-h6 mb-2" style="border-bottom: 1px solid #f5f5f5;">
                          <th>
                            <span @click="onZoom(id, 0)" style="cursor: pointer;">Prod {{ id }}</span>
                            <v-chip
                              :href="`https://api.openalex.org/works/${id}`" 
                              target="_blank"
                              color="blue-lighten-1"
                              size="x-small"
                              class="ml-2"
                              style="text-decoration: none;"
                            >
                              API
                              <v-icon class="ml-0" icon="mdi-chevron-right"></v-icon>
                            </v-chip>
                          </th>
                          <th>
                            <span @click="onZoom(id, 1)" style="cursor: pointer;">Walden {{ id }}</span>
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
                          </th>
                        </tr>
                        <tbody>
                          <tr
                            v-for="field in fieldsToShow"
                            :key="field"
                          >
                            <td
                              v-for="(data, index) in [prodResults[id], waldenResults[id]]"
                              :key="index"
                              :class="index === 1 ? getDiffCellClass(id, field) : ''"
                              style="word-wrap: break-word; overflow-wrap: break-word;"
                            >
                              <span v-if="data">
                                <span class="font-weight-bold mr-2">{{ field }}:</span>
                                <span v-if="isObject(getFieldValue(data, field))">
                                  <span style="white-space: pre">{{ JSON.stringify(getFieldValue(data, field), null, 2) }}</span>
                                </span>
                                <span v-else>{{ getFieldValue(data, field) }}</span>
                              </span>
                              <span v-else>404</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </template>
                  </v-row>
              </v-card>
              </div>

            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Fixed Table Header -->
    <div
      v-if="headers.length > 0 && mode === 'table'"
      ref="fixedHeaderRef"
      class="fixed-header"
      v-show="showFixedHeader"
    >
      <table class="results-table">
        <thead>
          <tr>
            <th v-for="column in headers" :key="column.key">
              {{ column.title }}
              <span v-if="column.key !== 'source'" class="text-caption text-grey-darken-1 ml-1">
                {{ columnMatchRates[column.key] }}%
              </span>
            </th>
          </tr>
        </thead>
      </table>
    </div>
 
    <!-- Work Details Drawer -->  
    <work-drawer 
      v-model:isDrawerOpen="isDrawerOpen" 
      :workId="zoomId" 
      :workData="zoomData"
      :isV2="zoomSource === 'walden'"
      @close="onDrawerClose"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import axios from 'axios';
import _ from 'lodash';

import { prod1 } from '@/qa/samples';
import { defaultFields, schema } from '@/qa/apiComparison';
import { useParamsAndLocalStorage, useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';

defineOptions({ name: 'WaldenQA' });

const sample = prod1;
const sampleIds = sample.ids;

const prodUrl      = `https://api.openalex.org/`;
const waldenUrl    = `https://api.openalex.org/v2/`;
const axiosConfig  = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

const entityType   = ref('works');
const fieldsToShow = useParams('fieldsToShow', 'array', defaultFields[entityType.value]);
const mode         = useParams('mode', 'string', 'table');
const hide404s     = useParamsAndLocalStorage('hide404s', 'boolean', false);
const zoomId       = useParams('zoomId', 'string', null);
const zoomSource   = useParams('zoomSource', 'string', 'prod');
const pageSize     = useParams('pageSize', 'number', 100);
const page         = useParams('page', 'number', 1);

const prodResults          = reactive({});
const waldenResults        = reactive({});
const searchStarted        = ref(false);
const errorMessage         = ref('');

const tableScrollRef       = ref(null);
const fixedHeaderRef       = ref(null);
const vDataTableRef        = ref(null);
const showFixedHeader      = ref(false);

const { smAndDown } = useDisplay();

const idsToShow = computed(() => {
  return sampleIds.slice((page.value - 1) * pageSize.value, page.value * pageSize.value);
});

const matches = computed(() => {
  const matches = {};
  Object.keys(prodResults).forEach(id => {
    const prod = prodResults[id];
    const walden = waldenResults[id];
    if (walden === undefined) {
      return;
    }
    matches[id] = {};
    let rowPassed = true;
    Object.keys(schema[entityType.value]).forEach(field => {
      const type = schema[entityType.value][field];
      let passed = false;

      const prodValue = getFieldValue(prod, field);
      const waldenValue = getFieldValue(walden, field);

      if (prod && !walden) {
        passed = false;
      } else if (prodValue === null && waldenValue === null) {
        passed = true;
      } else if (prodValue === undefined && waldenValue === undefined) {
        passed = true;
      } else if (type === "object") {
        passed = _.isEqual(prodValue, waldenValue);
      } else if (type === "array") {
        passed = _.isEqual(prodValue, waldenValue);
      } else {
        passed = prodValue === waldenValue;
      }
      matches[id][field] = passed;

      if (!passed && fieldsToShow.value.includes(field)) {
        rowPassed = false;
      }
    });
    matches[id].rowPassed = rowPassed;
  });
  return matches;
});

const getFieldValue = (obj, field) => {
  if (!obj) { return undefined; }
  const keys = field.split(".");
  let value = obj;
  for (let i = 0; i < keys.length; i++) {
    value = value !== null && typeof value === "object" ? value[keys[i]] : undefined;
    if (value === undefined) {
      return undefined;
    }
  }
  return value;
};

const matchRate = computed(() => {
  let total = 0;
  let passed = 0;
  matchedIds.value.forEach(id => {
    total++;
    if (matches.value[id].rowPassed) {
      passed++;
    }
  });
  return Math.round((passed / total) * 100);
});

const returnRate = computed(() => { 
  let total = 0;
  let passed = 0;
  matchedIds.value.forEach(id => {
    total++;
    if (waldenResults[id]) {
      passed++;
    }
  });
  return Math.round((passed / total) * 100);
});

const cellMatchRate = computed(() => {
  let total = 0;
  let passed = 0;
  matchedIds.value.forEach(id => {
    Object.keys(matches.value[id]).forEach(field => {
      total++;
      if (matches.value[id][field]) {
        passed++;
      }
    });
  });
  return Math.round((passed / total) * 100);
});

const columnMatchRates = computed(() => {
  const counts = {};
  
  fieldsToShow.value.forEach(field => {
    counts[field] = 0;
  });
  
  matchedIds.value.forEach(id => {
    fieldsToShow.value.forEach(field => {
      if (matches.value[id][field]) {
        counts[field]++;
      }
    });
  });
  
  Object.keys(counts).forEach(field => {
    counts[field] = counts[field] > 0 ? Math.round((counts[field] / matchedIds.value.length) * 100) : 0;
  });
  
  return counts;
});

const matchedIds = computed(() => {
  return idsToShow.value.filter(id => id in matches.value);
});

const headers = computed(() => {
  const fields = fieldsToShow.value.map(field => {
    return { title: field, key: field };
  });
  fields.unshift({title: "Source", key: "source"});
  return fields;
})

const rows = computed(() => {
  const rows = [];

  matchedIds.value.forEach(id => {
    const prod = prodResults[id];
    const walden = waldenResults[id];
    
    if (prod !== undefined && walden !== undefined) {
      const prodRow = makeRow(prod, "Prod", id);
      const waldenRow = makeRow(walden, "Walden", id);
     
      rows.push(prodRow);
      rows.push(waldenRow);
    }
  });
  return rows;
});

const makeRow = (data, source, id) => {
  const row = {};
  row.source = source;
  row._id = id;
  row.url = `https://api.openalex.org/${source === "Prod" ? "" : "v2/"}${entityType.value}/${id}`;
  fieldsToShow.value.map(field => {
    const type = schema[entityType.value][field];
    
    if (!data) {
      row[field] = "-";
      return;
    }
    const val = getFieldValue(data, field);
    if (val == null || val === undefined) {
      row[field] = "-";
    } else if (type === "object") {
      row[field] = val && Object.keys(val).length;
    } else if (type === "array") {
      row[field] = val && val.length;
    } else {
      row[field] = val;
    }
  });
  return row;
};

function getCellStyle(item, column) {  
  console.log("getCellStyle", item, column);
  if (!item) { return {}; }

  let passed = false;

  if (matches.value[item._id] && matches.value[item._id][column.key]) {
    passed = true;
  }

  const styles = {};

  styles.backgroundColor = passed ? "#DCEDC8" : "#FFCDD2";

  if (column.key === 'title') {
    styles.whiteSpace = 'nowrap';
    styles.overflow = 'hidden';
    styles.textOverflow = 'ellipsis';
    styles.maxWidth = '300px';

  } else if (column.key === 'source') {
    styles.width = '250px';
    styles.fontWeight = 'bold';
    styles.fontSize = '11px';
    styles.whiteSpace = 'nowrap';
    
  } else if (column.key === 'display_name') {
    styles.minWidth = '300px';
  }
  console.log(passed, styles);
  return styles;
}

function getDiffCellClass(id, field) {
  const prodValue = getFieldValue(prodResults[id], field);
  const waldenValue = getFieldValue(waldenResults[id], field);

  if ((prodValue === null || prodValue === undefined) && (waldenValue !== null && waldenValue !== undefined)) {
    return 'bg-green-lighten-4';
  }

  if (!matches.value[id][field]) {
    return 'bg-red-lighten-4';
  }

  return '';
}

function isObject(obj) {
  if (Array.isArray(obj)) {
    return true;
  } else if (typeof obj === 'object' && obj !== null) {
    return true;
  } else {
    return false;
  }
}

async function fetchResponses() {
  searchStarted.value = true;
  errorMessage.value = '';
  const getResults = async (url, store) => {
    let newIds = [];
    let missingIds = [...idsToShow.value];
    idsToShow.value.forEach(id => {
      if (!(id in store)) {
        newIds.push(id);
      }
    });
    if (newIds.length > 0) {
      const apiUrl = `${url}${entityType.value}?filter=ids.openalex:${newIds.join('|')}&per_page=100`;
      const response = await axios.get(apiUrl, axiosConfig);
      response.data.results.forEach(result => {
        store[extractID(result.id)] = result;
        missingIds.splice(missingIds.indexOf(extractID(result.id)), 1);
      });
      missingIds.forEach(id => {
        store[id] = null;
      });
    }
  }
  await getResults(prodUrl, prodResults);
  await getResults(waldenUrl, waldenResults);
}

const toggleField = (field) => {
  if (fieldsToShow.value.includes(field)) {
    fieldsToShow.value = fieldsToShow.value.filter(f => f !== field);
  } else {
    fieldsToShow.value.push(field);
  }
}

const isDrawerOpen = computed(() => {
  return Boolean(zoomId.value);
});

const zoomData = computed(() => {
  if (!zoomId.value) { return null; }

  return zoomSource.value === "prod" ? prodResults[zoomId.value] : waldenResults[zoomId.value];
});

const onZoom = (id, sourceIndex) => {
  console.log('onZoom', id, sourceIndex);
  zoomId.value = extractID(id);
  zoomSource.value = sourceIndex === 0 ? "prod" : "walden";
}

function onDrawerClose() {
  zoomId.value = null;
}

const extractID = (input) => {
  return input.split("/").slice(-1)[0];
}

 async function syncFixedHeader() {
  // Synchronize the fixed header's horizontal scroll, position, and column widths with the real table
  await nextTick();
  const scroll = tableScrollRef.value;
  const fixed = fixedHeaderRef.value;
  
  if (!scroll || !fixed) return;

  const left = scroll.getBoundingClientRect().left;
  fixed.style.left = `${left}px`;
  fixed.style.width = `${scroll.clientWidth}px`;
  fixed.style.overflow = 'hidden';

  const realThs = scroll.querySelectorAll('thead tr:first-child th');
  const fixedThs = fixed.querySelectorAll('thead tr:first-child th');
  if (realThs.length === fixedThs.length) {
    for (let i = 0; i < realThs.length; i++) {
      const w = realThs[i].offsetWidth;
      fixedThs[i].style.width = w + 'px';
      fixedThs[i].style.minWidth = w + 'px';
      fixedThs[i].style.maxWidth = w + 'px';
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', () => {
    syncFixedHeader();
  });
});

watch(idsToShow, async () => {
  await fetchResponses();
}, { immediate: true });

watch(entityType, () => {
  fieldsToShow.value = [...defaultFields[entityType.value]];
  searchStarted.value = false;
});

const handleWindowScroll = () => {
  // Fixed header visibility logic based on window scroll
  const wrapper = document.querySelector('.v-table__wrapper');
  if (!wrapper) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  showFixedHeader.value = wrapperRect.top < 0;
};

watch(() => Object.keys(matches.value).length, async (count) => {
  if (count > 0) {
    // Setup syncing fixed header with data table
    await nextTick();
    const scroll = document.querySelector('.v-table__wrapper');
    const fixed = fixedHeaderRef.value;
    if (scroll && fixed) {
      const scrollHandler = () => {
        fixed.scrollLeft = scroll.scrollLeft;
      };
      scroll.addEventListener('scroll', scrollHandler);
      fixed.scrollLeft = scroll.scrollLeft;
      syncFixedHeader();
      window.addEventListener('scroll', handleWindowScroll);
      handleWindowScroll(); // Call immediately to set showFixedHeader initially
    }
  }
});

watch([tableScrollRef, fixedHeaderRef], () => {
  syncFixedHeader();
  handleWindowScroll();
});

/*
async function buildSample() {
  while (ids.value.length < 10000) {
    await fetchRandomSample();
    console.log(ids.value.length);
  }
  ids.value = ids.value.slice(0, 10000);
  console.log(ids.value);
}


async function fetchRandomSample() {
  const url = `https://api.openalex.org/${entityType.value}?sample=${sampleSize.value}&per_page=${sampleSize.value}`;
  try {
    const response = await axios.get(url, axiosConfig);
    const newIds = response.data.results.map(result => extractID(result.id));
    ids.value = [...new Set(ids.value.concat(newIds))];
  } catch (error) {
    console.log(error);
  }
}
*/
</script>


<style scoped>
.square-btn {
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
}
:deep(.v-number-input input) {
  text-align: center;
}
.start-view {
  height: 50vh;
  border-top: 1px solid #E0E0E0 !important;
}
.results-section {
  border-top: 1px solid #E0E0E0 !important;
}
:deep(.results-table thead tr th) {
  background-color: #F5F5F5 !important;
  border-top: 1px solid #E0E0E0 !important;
  border-bottom: 2px solid #ccc !important;
  white-space: nowrap;
}
.results-table tr:nth-child(even) td {
  border-bottom: 2px solid #ccc !important;
  padding-bottom: 12px !important;
  padding-top: 4px !important;
}
.results-table tr:nth-child(odd) td {
  padding-bottom: 4px !important;
  padding-top: 12px !important;
}
:deep(.results-table table thead th:first-child) {
  position: sticky !important;
  left: 0 !important;
  z-index: 3 !important;
}
:deep(.results-table table > tbody > tr > td:nth-child(1)) {
  position: sticky;
  left: 0;
  z-index: 2;
}
:deep(.results-table table > thead > tr > th:nth-child(1)) {
  z-index: 3;
}
.results-table td a {
  color: #555;
  text-decoration: none;
}
.results-table td a:hover {
  color: #555;
  text-decoration: underline;
}
.table-scroll {
  position: relative;
  overflow-x: auto;
}
.fields-card {
  border-color: #BDBDBD;
}
.fixed-header {
  position: fixed;
  top: 46px;
  left: 0;
  width: auto;
  background: white;
  border-collapse: collapse;
  z-index: 1000;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  pointer-events: none;
}
.fixed-header::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
.fixed-header table {
  min-width: max-content;
  width: max-content;
  border-collapse: collapse;
}
.fixed-header th {
  background-color: #F5F5F5;
  padding: 4px 16px;
  font-size: 14px;
  font-weight: 500;
  border-top: 1px solid #ccc;
  border-bottom: 2px solid #ccc;
  white-space: nowrap;
  text-align: left;
}
.diff-table {
  width: 100%;
  table-layout: fixed;
  max-width: 100%;
}
.diff-table th {
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
  text-align: left;
}
.diff-table tr {
  width: 100%;
}
.diff-table td {
  width: 50%;
  vertical-align: top;
  margin: 0 40px 0 0;
  padding-right: 40px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
} 
.diff-table tbody tr:first-child td {
  padding-top: 12px;
}
.sticky-controls {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
}
.v-card, .v-overlay {
  overflow: visible !important;
}
</style>
