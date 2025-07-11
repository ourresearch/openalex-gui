<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;">
    <v-container :fluid="smAndDown" class="pa-0 pa-sm-4">
      <v-row>
        <v-col cols="12">
          <v-card rounded elevation="4" class="pt-6 pb-0 px-10">
            <v-card-title class="pa-0 mb-5">
              Walden QA
            </v-card-title>

            <!-- Top Controls -->
            <v-row class="top-controls mb-0" dense>
              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">
                <v-number-input 
                  v-model="sampleSize" 
                  variant="outlined" 
                  density="compact"
                  hide-details
                  label="Sample" 
                  :min="1" 
                  :max="500"
                  control-variant="stacked"
                  class="mr-2"
                  style="width: 110px; height: 40px;" 
                />

                <v-select
                  v-model="entityType"
                  :items="entityTypes"
                  variant="outlined"
                  density="compact"
                  hide-details
                  label="Entity"
                  style="width: 150px; height: 40px" 
                />
              </v-col>

              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0">
                <v-btn 
                  variant="flat" 
                  size="x-large" 
                  density="compact"
                  color="primary"
                  @click="fetchRandomSample"
                  class="w-100 w-sm-auto"
                >
                  <v-icon start icon="mdi-dice-multiple-outline"></v-icon>
                  Sample
                </v-btn>
              </v-col>
                          
              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">
                <v-btn 
                  variant="outlined" 
                  size="x-large" 
                  density="compact"
                  color="primary"
                  class="mr-2 flex-grow-1 flex-sm-grow-0"
                  @click="showGetIdsDialog = true"
                >
                  <v-icon start icon="mdi-file-document-outline"></v-icon>
                  Get IDs
                </v-btn>

                <v-btn 
                  variant="outlined" 
                  size="x-large" 
                  density="compact"
                  color="primary" 
                  class="mr-1 square-btn flex-grow-0"
                  @click="showSettingsDialog = true"
                >
                  <v-icon icon="mdi-cog"></v-icon>
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm class="align-self-end">
                <div class="text-grey-darken-1 align-self-end" style="font-size: 14px; min-width: 150px;">
                  {{ settingsSummary }}
                </div>
              </v-col>

              <v-col cols="12" sm="auto">
                <v-btn-toggle
                  v-model="mode"
                  color="primary"
                  variant="outlined"
                  density="compact"
                  mandatory
                >
                  <v-btn value="table">Table</v-btn>
                  <v-btn value="results">Results</v-btn>
                </v-btn-toggle>
              </v-col>

              <!-- Get IDs Dialog -->
              <v-dialog v-model="showGetIdsDialog" max-width="500px">
                <v-card class="pa-2">
                  <v-card-title class="text-h5">
                    <v-icon size="small" variant="plain" color="grey" :icon="entityConfig.icon"></v-icon>
                    Compare IDs
                  </v-card-title>

                  <v-card-subtitle>
                    Paste a list of IDs or URLs
                  </v-card-subtitle>

                  <v-card-text>
                    <v-textarea
                      v-model="idsInput"
                      placeholder="W4406469713, W4406469714..."
                      variant="outlined"
                      hide-details
                      :rows="6"
                    />
                  </v-card-text>

                  <v-card-actions class="justify-end">
                    <v-btn variant="text" @click="showGetIdsDialog = false">Cancel</v-btn>
                    <v-btn color="primary" variant="flat" @click="onGetIds">Compare</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>


              <!-- Settings Dialog -->
              <v-dialog v-model="showSettingsDialog" max-width="900px">
                <v-card class="pa-2">
                  <v-card-title class="text-h5">
                    <v-icon size="small" variant="plain" color="grey" icon="mdi-cog"></v-icon>
                    Settings
                  </v-card-title>

                  <!-- Sample -->
                  <v-card-text>
                    <div class="text-body-1 text-grey-darken-2 font-weight-medium mb-2">Sample</div>
                    <v-card flat rounded class="pa-0 mb-8">
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
                                <v-icon size="x-large" variant="plain" color="grey" class="mb-1" :icon="entityConfig.icon"></v-icon>
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
                                placeholder="filter=foo:bar"
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

                    <!-- Fields -->
                    <div class="text-body-1 text-grey-darken-2 font-weight-medium mb-2">
                      Fields
                      <v-btn
                        color="grey"
                        variant="tonal"
                        icon
                        size="x-small"
                        @click="fieldsToShowSettings = [...defaultFields[entityType]]"
                      >
                        <v-icon icon="mdi-refresh"></v-icon>
                      </v-btn>
                    </div>
                    <v-card rounded flat border class="fields-card pa-6 pb-4 bg-grey-lighten-5">
                      <v-chip 
                        v-for="field in Object.keys(schema[entityType])" 
                        :key="field"
                        :text="field"
                        variant="flat"
                        :color="fieldsToShowSettings.includes(field) ? 'blue-lighten-5' : 'grey-lighten-3'"
                        class="mr-2 mb-3"
                        @click="toggleFieldInSettings(field)"
                      />
                    </v-card>
                  </v-card-text>

                  <v-card-actions class="justify-end">
                    <v-btn variant="text" @click="showSettingsDialog = false">Cancel</v-btn>
                    <v-btn color="primary" variant="flat" @click="onSaveSettings">Apply</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

            </v-row>

            <!-- Start View -->
            <div v-if="!searchStarted && Object.keys(matches).length === 0" class="start-view mt-8 d-flex align-center justify-center">
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
              v-if="searchStarted && Object.keys(matches).length === 0" 
              :type="mode === 'table' ? 'table' : 'list-item-three-line@12'" 
              class="mt-8"
            />

            <!-- Results -->
            <div v-if="Object.keys(matches).length > 0" class="bg-blue-lighten-5 mx-n10 mt-10 py-2 results-section">
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
                    <v-card-title class="text-h6 font-weight-bold">{{ Object.keys(matches).length }}</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Sample Size</v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Results Table -->
              <div v-if="mode == 'table'" ref="tableScrollRef" class="table-scroll">
                <v-data-table
                  ref="vDataTableRef"
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
              <div v-else-if="mode == 'results'">
                <v-card class="py-8 px-12">
                  <v-row>
                    <v-spacer/>
                    <v-chip
                      :variant="hide404s ? 'flat' : 'tonal'"
                      :color="hide404s ? 'blue-lighten-1' : 'blue'"
                      @click="hide404s = !hide404s"
                    >
                      Hide 404s
                    </v-chip>
                  </v-row>
                  <v-row v-for="id in Object.keys(matches)" :key="id">
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
                            <template v-if="data.primary_location.source?.display_name">
                              <span :class="index === 1 && !matches[id]['primary_location.source.display_name'] ? 'text-red-lighten-2' : ''">
                                {{ data.primary_location.source.display_name }}
                              </span> 
                              <span v-if="!data.primary_location.source.id" class="text-red-lighten-2 ml-1">- Source ID Missing</span>
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

            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Fixed Table Header -->
    <div
      v-if="headers.length > 0"
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

import { getConfigs } from '@/oaxConfigs';
import { defaultFields, schema } from '@/qa/apiComparison';
import filters from '@/filters';
import { useParamsAndLocalStorage, useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';

defineOptions({ name: 'WaldenQA' });

const prodUrl = `https://api.openalex.org/`;
const waldenUrl = `https://api.openalex.org/v2/`;
const axiosConfig = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

const ids          = useParams('ids', 'array', []);
const sampleSize   = useParamsAndLocalStorage('sampleSize', 'number', 100);
const entityType   = useParamsAndLocalStorage('entityType', 'string', 'works');
const sampleFilter = useParamsAndLocalStorage('sampleFilter', 'string', null);
const sampleDays   = useParamsAndLocalStorage('sampleDays', 'number', 7);
const customFilter = useParamsAndLocalStorage('customFilter', 'string', '');
const fieldsToShow = useParamsAndLocalStorage('fieldsToShow', 'array', defaultFields[entityType.value]);
const mode         = useParamsAndLocalStorage('mode', 'string', 'table');
const hide404s     = useParamsAndLocalStorage('hide404s', 'boolean', false);
const zoomId       = useParams('zoomId', 'string', null);
const zoomSource   = useParams('zoomSource', 'string', 'prod');

const prodResults          = reactive({});
const waldenResults        = reactive({});
const searchStarted        = ref(false);
const idsInput             = ref('');
const fieldsToShowSettings = ref([]);
const showGetIdsDialog     = ref(false);
const showSettingsDialog   = ref(false);
const errorMessage         = ref('');

const tableScrollRef       = ref(null);
const fixedHeaderRef       = ref(null);
const vDataTableRef        = ref(null);
const showFixedHeader      = ref(false);

const { smAndDown } = useDisplay();

const entityConfig = computed(() => getConfigs()[entityType.value]);

const entityTypes = Object.keys(schema).map((key) => ({
  title: filters.titleCase(key),
  value: key,
}));

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
    fieldsToShow.value.forEach(field => {
      const type = schema[entityType.value][field];
      let passed = false;

      const prodValue = getFieldValue(prod, field);
      const waldenValue = getFieldValue(walden, field);

      if (prod && !walden) {
        passed = false;
      } else if (prodValue === null && waldenValue === null) {
        passed = true;
      } else if (prod === undefined && walden === undefined) {
        passed = true;
      } else if (type === "object") {
        passed = Object.keys(prodValue || {}).length === Object.keys(waldenValue || {}).length;
      } else if (type === "array") {
        passed = prodValue && waldenValue && prodValue.length === waldenValue.length;
      } else {
        passed = prodValue === waldenValue;
      }
      matches[id][field] = passed;
      //console.log("matches", id, field, prod?.[field], walden?.[field], matches[id][field]);
      if (!matches[id][field]) {
        rowPassed = false;
      }
    });
    matches[id].source = rowPassed;
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
  Object.keys(matches.value).forEach(id => {
    total++;
    if (matches.value[id].source) {
      passed++;
    }
  });
  return Math.round((passed / total) * 100);
});

const returnRate = computed(() => { 
  let total = 0;
  let passed = 0;
  Object.keys(prodResults).forEach(id => {
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
  Object.keys(matches.value).forEach(id => {
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
  
  Object.keys(matches.value).forEach(id => {
    fieldsToShow.value.forEach(field => {
      if (matches.value[id][field]) {
        counts[field]++;
      }
    });
  });
  
  Object.keys(counts).forEach(field => {
    counts[field] = counts[field] > 0 ? Math.round((counts[field] / Object.keys(matches.value).length) * 100) : 0;
  });
  
  return counts;
});

const settingsSummary = computed(() => {
  let summary = `Comparing ${fieldsToShow.value.length} of ${Object.keys(schema[entityType.value]).length} fields`;
  if (sampleFilter.value === "recent") {
    summary += ` from past ${sampleDays.value} days`;
  } else if (sampleFilter.value === "custom") {
    summary += ` with ${customFilter.value}`;
  }
  return summary;
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

  ids.value.forEach(id => {
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

  styles.backgroundColor = passed ? "#e8f5e9" : "#ffebee";

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

async function fetchRandomSample() {
  clearResults();
  searchStarted.value = true;
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
    filterStr = `&${customFilter.value}`;
  }

  const url = `https://api.openalex.org/${entityType.value}?sample=${sampleSize.value}${filterStr}&per_page=${sampleSize.value}`;
  try {
    const response = await axios.get(url, axiosConfig);
    ids.value = response.data.results.map(result => extractID(result.id));
    fetchResults();
  } catch (error) {
    searchStarted.value = false;
    if (error.response?.data?.error === "Invalid query parameters error.") {
      errorMessage.value = "It looks like your custom filter is invalid.";
    } else {
      errorMessage.value = "There was an error fetching sample IDs."
    }
  }
}

async function fetchResults() {
  searchStarted.value = true;
  clearResults();
  const getResults = (url, store) => {
    ids.value.map(id => {
      axios.get(`${url}${entityType.value}/${id}`, axiosConfig)
        .then(response => {
          store[id] = response.data;
        })
        .catch(() => {
          store[id] = null;
        });
    });
  }
  getResults(prodUrl, prodResults);
  getResults(waldenUrl, waldenResults);
}

const clearResults = () => {
  Object.keys(prodResults).forEach(key => {
    delete prodResults[key];
  });
  Object.keys(waldenResults).forEach(key => {
    delete waldenResults[key];
  });
  errorMessage.value = '';
};

const toggleFieldInSettings = (field) => {
  if (fieldsToShowSettings.value.includes(field)) {
    fieldsToShowSettings.value = fieldsToShowSettings.value.filter(f => f !== field);
  } else {
    fieldsToShowSettings.value.push(field);
  }
}

const onGetIds = () => {
  ids.value = idsInput.value.split(/[\s,]/).map(id => extractID(id.trim()));
  showGetIdsDialog.value = false;
  fetchResults();
};

const onSaveSettings = () => {
  fieldsToShow.value = [...fieldsToShowSettings.value];
  showSettingsDialog.value = false;
};

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
  // If IDs are provided in URL, fetch results immediately
  if (ids.value && ids.value.length > 0) {
    searchStarted.value = true;
    fetchResults();
  }

  window.addEventListener('resize', () => {
    syncFixedHeader();
  });
});

watch(entityType, () => {
  fieldsToShow.value = [...defaultFields[entityType.value]];
  clearResults();
  searchStarted.value = false;
});

watch(showGetIdsDialog, (newVal) => {
  if (!newVal) {
    idsInput.value = '';
  }
});

watch(showSettingsDialog, (newVal) => {
  if (newVal) {
    fieldsToShowSettings.value = [...fieldsToShow.value];
  }
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
  border-top: 3px solid #BBDEFB !important;
}
:deep(thead tr th) {
  background-color: #F5F5F5 !important;
  border-top: 1px solid #ccc !important;
  border-bottom: 2px solid #ccc !important;
  white-space: nowrap;
}
tr:nth-child(even) td {
  border-bottom: 2px solid #ccc !important;
  padding-bottom: 12px !important;
  padding-top: 4px !important;
}
tr:nth-child(odd) td {
  padding-bottom: 4px !important;
  padding-top: 12px !important;
}
:deep(table thead th:first-child) {
  position: sticky !important;
  left: 0 !important;
  z-index: 3 !important;
}
:deep(table > tbody > tr > td:nth-child(1)) {
  position: sticky;
  left: 0;
  z-index: 2;
}
:deep(table > thead > tr > th:nth-child(1)) {
  z-index: 3;
}
td a {
  color: #555;
  text-decoration: none;
}
td a:hover {
  color: #555;
  text-decoration: underline;
}
.table-scroll {
  position: relative;
  overflow-x: auto;
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
.fields-card {
  border-color: #BDBDBD;
}
.fixed-header {
  position: fixed;
  top: 0;
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
</style>
