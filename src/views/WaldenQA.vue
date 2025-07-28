<template>
  <div :class="['color-2 py-0 py-sm-12', mode]" style="min-height: 70vh;">
    <v-container :fluid="smAndDown" :class="['pa-0', 'pa-sm-4']">
      <v-row>
        <v-col cols="12">
          <v-card flat class="pt-6 pb-0 px-10 rounded-o">
            
            <!-- Title Row -->
            <v-row class="mt-2">
              <v-card-title class="pa-0 mb-5 text-h5">
                OpenAlex Rewrite Evaluation Overview
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
            <v-row class="top-controls mb-8 mx-n10 px-6 sticky-controls" dense>
              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">
                <v-btn-toggle
                  v-model="mode"
                  color="blue"
                  variant="outlined"
                  density="compact"
                  mandatory
                  class="mr-2"
                >
                  <v-btn value="works">Works</v-btn>
                  <v-btn value="metrics">Metrics</v-btn>
                  <v-btn value="recall">Recall</v-btn>

                </v-btn-toggle>

              </v-col>
              <v-spacer></v-spacer>

              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">

              </v-col>

            </v-row>

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
              :type="mode === 'works' ? 'table' : 'list-item-three-line@12'" 
              class="mt-8"
            />

            <!-- Results -->
            <div v-if="matchedIds.length > 0" class="bg-grey-lighten-4 mx-n10 results-section">
              
              <!-- Stats -->
              <v-row :dense="smAndDown" v-if="mode === 'metrics'" class="px-2 px-sm-6 pt-6 pb-4">
                <v-col cols="3" class="py-2">
                  <v-card color="" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ mode == "metrics" ? matchRateTotal : matchRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Match Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ mode == "metrics" ? returnRateTotal : returnRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Return Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="" rounded class="text-center fill-height">
                    <v-card-title class="text-h6 font-weight-bold">{{ mode == "metrics" ? cellMatchRateTotal : cellMatchRate }}%</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">Field Match Rate</v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="3">
                  <v-card color="" rounded class="text-center fill-height" style="position: relative;">
                    <v-card-title class="text-h6 font-weight-bold">{{ mode == "metrics" ? worksMatchedIds.length.toLocaleString() : matchedIds.length }}</v-card-title>
                    <v-card-text class="text-caption text-uppercase text-grey-darken-2">
                      Sample Size
                      <v-menu v-if="mode === 'metrics' && metricsSampleSize < 10000" >  
                        <template #activator="{ props }">
                          <v-btn
                            color="blue"
                            variant="tonal"
                            size="default"
                            icon
                            v-bind="props"
                            :style="{'position': 'absolute', 'top': '10px', 'right': mdAndDown ? '5px' : '30px'}"
                          >
                            <v-icon icon="mdi-plus"></v-icon>
                          </v-btn>
                        </template>

                        <v-card>
                          <v-list class="text-right">
                            <v-list-item class="text-grey-darken-1">Load more samples:</v-list-item>
                            <v-divider/>
                            <v-list-item
                              v-for="sampleSize in [1000, 2000, 3000, 5000, 10000].filter(size => size > metricsSampleSize)"
                              :key="sampleSize"
                              :value="sampleSize"
                              @click="metricsSampleSize = sampleSize"
                            >
                              {{ sampleSize.toLocaleString() }}
                            </v-list-item>
                          </v-list>
                        </v-card>
                      </v-menu>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Works -->
              <div v-if="mode == 'works'" ref="tableScrollRef" class="table-scroll">
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
                      <th v-for="column in columns" :key="column.key" :class="{'icon-column': column.key in fieldIcons, 'spacer-column': column.key === 'spacer'}">
                        <span v-if="fieldIcons[column.key]">
                          <v-tooltip :text="column.title" location="bottom">
                            <template v-slot:activator="{ props }">
                              <v-icon size="small" v-bind="props" :icon="fieldIcons[column.key]"></v-icon>
                            </template>
                          </v-tooltip>
                        </span>
                        <span v-else-if="column.key === 'spacer'">
                          <v-dialog max-width="900">
                            <template #activator="{ props }">
                              <v-btn icon size="x-small" color="grey-lighten-2" class="my-2" v-bind="props">
                                <v-icon icon="mdi-plus"></v-icon>
                              </v-btn>
                            </template>
                            <v-card>
                              <v-card-text>
                              <!-- Fields Menu -->
                              <div class="text-body-1 text-grey-darken-2 font-weight-medium mb-2">
                                Fields to Show
                                <v-btn
                                  color="blue"
                                  variant="tonal"
                                  size="small"
                                  class="mr-2"
                                  @click="fieldsToShow = [...defaultFields[entityType]]"
                                >
                                  <v-icon icon="mdi-refresh"></v-icon>
                                  Defaults
                                </v-btn>
                                
                                <v-btn
                                  color="blue"
                                  variant="tonal"
                                  size="small"
                                  class="mr-2"
                                  @click="fieldsToShow = [...Object.keys(schema[entityType])]"
                                >
                                  <v-icon icon="mdi-select-group"></v-icon>
                                  All
                                </v-btn>                      
                                
                                <v-btn
                                  color="blue"
                                  variant="tonal"
                                  size="small"
                                  @click="fieldsToShow = []"
                                >
                                  <v-icon icon="mdi-select"></v-icon>
                                  None
                                </v-btn>
                              </div>
                              <v-card rounded flat border class="fields-card pa-6 pb-4 bg-grey-lighten-5">
                                <v-chip 
                                  v-for="field in defaultFields[entityType]" 
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
                          </v-dialog>
                        </span>
                        <span v-else>{{ column.title }}</span>
                      </th>
                    </tr>
                  </template>

                  <!-- Table Rows -->
                  <template v-slot:item="{ item, columns }">
                    <tr>
                      <td v-for="column in columns" :key="column.key" :style="getCellStyle(item, column)">
                        
                        <div v-if="column.key === 'prod'" class="py-7 px-0" style="width: 370px;">
                          <google-scholar-view 
                            :id="item._id" 
                            :data="prodResults[item._id]"
                            @title-click="compareId = item._id" />
                        </div>

                        <div v-else-if="column.key === 'walden'" class="py-7 px-0" style="width: 370px;">
                          <google-scholar-view 
                            :id="item._id" 
                            :data="waldenResults[item._id]"
                            :matches="matches[item._id]"
                            :compare-data="prodResults[item._id]" 
                            @title-click="compareId = item._id"/>
                        </div>

                        <v-dialog v-else max-width="70vw" max-height="70vh" width="auto" v-model="dialogStates[getDialogKey(item._id, column.key)]">
                          <template v-slot:activator="{ props }">
                            <div class="test-cell" style="width: 100%; height: 100%; cursor: pointer;" v-bind="props"></div>
                          </template>
                          <compare-field
                            :id="item._id"
                            :field="column.key"
                            :match="matches[item._id][column.key]"
                            :type="schema[entityType][column.key]"
                            :prod-value="getFieldValue(prodResults[item._id], column.key)"
                            :walden-value="waldenResults[item._id] ? getFieldValue(waldenResults[item._id], column.key) : '[404]'"
                            @show-comparison="onShowComparison(item._id, column.key, $event)"
                          />
                        </v-dialog>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </div>

              <!-- Metrics View -->
              <div v-else-if="mode == 'metrics'">
                <v-row>
                  <v-col cols="7">
                    <v-card class="ml-6">
                      <v-data-table
                        :headers="metricsHeaders"
                        :items="metricsItems"
                        :sort-by="[{ key: 'matchRate', order: 'desc' }]"
                        :items-per-page="-1"
                        :hide-default-footer="true"
                        class="metrics-table elevation-1"
                      >
                        <template v-slot:item="{ item, columns }">
                          <tr>
                            <td v-for="column in columns" :key="column.key">
                              <template v-if="column.key === 'fieldName'">
                                <span>{{ item.fieldName }}</span>
                                <v-chip v-if="testOnField(item.fieldName)" class="ml-1" size="small" color="grey">{{ testOnField(item.fieldName) }}</v-chip>
                              </template>
                              <template v-else-if="column.key === 'matchRate'">
                                <v-tooltip>
                                  <template v-slot:activator="{ props }">
                                    <div class="cell-bar d-flex">
                                      <div v-bind="props" :class="getMetricsCellColorClass(item, column)" :style="{ width: item.matchRate * 0.9 + '%', height: '20px%'}">
                                      </div>
                                      <div class="ml-2 font-weight-bold">
                                        {{ item.matchRate }}%
                                      </div>
                                    </div>
                                  </template>
                                  <template v-slot:default>
                                    <v-card class="pa-4 my-n2 mx-n4">
                                      <div class="d-flex align-center">
                                        <div :class="getColorKey(item.matchRate).color" style="display: inline-block; width: 40px; height: 40px; border: 1px solid #ccc; border-radius: 4px;"></div>
                                        <div style="display: inline-block; margin-left: 10px; font-weight: bold;"> {{ getColorKey(item.matchRate).label }}</div>
                                      </div>
                                    </v-card>
                                  </template>
                                </v-tooltip>
                              </template>
                            </td>
                          </tr>
                        </template>
                      </v-data-table>
                    </v-card>
                  </v-col>

                  <v-col cols="5">
                    <v-card class="sum-card mb-6 mr-6" v-for="sumCard in sumCards" :key="sumCard.field">
                      <v-card-title class="">{{ sumCard.title }}</v-card-title>
                      <v-card-text class="">
                        <div class="d-flex">
                          <div class=" mr-8 pr-10 d-flex flex-column" style="border-right: 1px solid #e0e0e0;">
                            <div class="stat d-flex flex-column mb-3">
                              <div class="font-weight-bold" style="font-size: 16px;">{{ sumMetrics[sumCard.field].prod.toLocaleString() }}</div>
                              <div class="text-caption text-uppercase text-grey-darken-2">Prod Sum</div>
                            </div>
                            <div class="stat d-flex flex-column">
                              <div class="font-weight-bold" style="font-size: 16px;">{{ sumMetrics[sumCard.field].walden.toLocaleString() }}</div>
                              <div class="text-caption text-uppercase text-grey-darken-2">Walden Sum</div>
                            </div>
                          </div>  
                          <div class="d-flex flex-column">
                            <div class="mb-5">
                              <div class="percent-stat d-flex flex-column">
                                <span class="font-weight-bold mr-1" style="font-size: 14px;">{{ columnMatchRatesTotal[sumCard.field] }}%</span>
                                <span class="text-caption text-uppercase text-grey-darken-2">Exact Match</span>
                              </div>
                            </div>
                            <div class="d-flex">
                              <div class="percent-stat d-flex flex-column mr-7">
                                <span class="font-weight-bold mr-1" style="font-size: 14px;">{{ columnMatchRatesTotal[sumCard.field + "_count_diff_below_5"] }}%</span>
                                <span class="text-caption text-uppercase text-grey-darken-2">Diff &lt;5%</span>
                              </div>
                              <div class="percent-stat d-flex flex-column">
                                <span class="font-weight-bold mr-1" style="font-size: 14px;">{{ columnMatchRatesTotal[sumCard.field + "_count_diff"] }}%</span>
                                <span class="text-caption text-uppercase text-grey-darken-2">Avg Diff</span>
                              </div>

                            </div>  
                          </div>
                        </div>  

                      </v-card-text>
                    </v-card>

                  </v-col>
                </v-row>  
              </div>

              <!-- Recall -->
              <div v-if="mode === 'recall'">
                <v-progress-linear
                  v-if="recallProgress < 1"
                  :model-value="recallProgress * 100"
                  color="primary"
                  height="2"
                ></v-progress-linear>
                <v-data-table
                  :headers="recallHeaders"
                  :items="recallItems"
                  :items-per-page="-1"
                  :hide-default-footer="true"
                  class="metrics-table elevation-1"
                >
                  <template v-slot:item="{ item, columns }">
                    <tr>
                      <td v-for="column in columns" :key="column.key">
                        <template v-if="column.key === 'type'">
                          <a :href="`https://api.openalex.org/v2/${item.type}`" target="_blank" style="text-decoration: none; color: #000;">/{{ item.type }}</a>
                        </template>
                        <template v-else-if="column.key === 'recall'">
                          <div class="cell-bar d-flex">
                            <div :class="getRecallCellColorClass(item, column)" :style="{ width: item.recall * 0.9 + '%', height: '20px%'}">
                            </div>
                            <div class="ml-2 font-weight-bold">
                              {{ item.recall }}%
                            </div>
                          </div>
                        </template>
                        <template v-else-if="column.key === 'canonicalId'">
                          <div v-if="item.canonicalId === '-'">-</div>
                          <div v-else>
                            <div class="cell-bar d-flex">
                              <div :class="getRecallCellColorClass(item, column)" :style="{ width: item.canonicalId * 0.9 + '%', height: '20px%'}">
                              </div>
                              <div class="ml-2 font-weight-bold">
                                {{ item.canonicalId }}%
                              </div>
                            </div>             
                          </div>
                        </template>
                        <template v-else-if="column.key === 'sampleSize'">
                          <div class="text-right"><code>{{ item.sampleSize }}</code></div>
                        </template>
                        <template v-else>
                          {{ item[column.key] }}
                        </template>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </div>

              <!-- Pagination -->
              <v-pagination
                v-model="page"
                v-if="mode !== 'metrics' && mode !== 'recall'"
                :length="100"
                :total-visible="10"
                rounded
                class="py-4"
              ></v-pagination>

            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Fixed Table Header -->
    <div
      v-if="headers.length > 0 && mode === 'works'"
      ref="fixedHeaderRef"
      class="fixed-header"
      v-show="showFixedHeader"
    >
      <table class="results-table">
        <thead>
          <tr>
            <th v-for="column in headers" :key="column.key">
              <div v-if="fieldIcons[column.key]">
                <v-tooltip :text="column.title" location="bottom">
                  <template v-slot:activator="{ props }">
                    <v-icon size="small" v-bind="props" :icon="fieldIcons[column.key]"></v-icon>
                  </template>
                </v-tooltip>
              </div>
              <div v-else>
                {{ column.title }}
              </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>
 

    <!-- Compare Work Dialog -->
    <v-dialog 
      max-width="80vw" 
      max-height="80vh"
      :model-value="!!compareId"
      scroll-strategy="block"
      class="rounded-o"
      @update:model-value="(val) => { if (!val) compareId = null }"
    >
      <compare-work
        v-if="compareId"
        :id="compareId"
        :matches="matches[compareId]"
        :prod-results="prodResults[compareId]"
        :walden-results="waldenResults[compareId]"
        :compare-view="compareView"
        @update:compare-view="compareView = $event"
      />
    </v-dialog>

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

import { samples } from '@/qa/samples';
import { defaultFields, schema, fieldIcons } from '@/qa/apiComparison';
import { useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';
import CompareField from '@/components/QA/CompareField.vue';
import CompareWork from '@/components/QA/CompareWork.vue';
import GoogleScholarView from '@/components/QA/googleScholarView.vue';

defineOptions({ name: 'WaldenQA' });

const sample    = samples.prod1;
const sampleIds = sample.ids;

const prodUrl      = `https://api.openalex.org/`;
const waldenUrl    = `https://api.openalex.org/v2/`;
const axiosConfig  = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

const entityType        = ref('works');
const fieldsToShow      = useParams('fieldsToShow', 'array', [...defaultFields[entityType.value]]);
const mode              = useParams('mode', 'string', 'works');
const zoomId            = useParams('zoomId', 'string', null);
const zoomSource        = useParams('zoomSource', 'string', 'prod');
const compareId         = useParams('compareId', 'string', null);
const compareView       = useParams('compareView', 'string', 'diff');
const pageSize          = useParams('pageSize', 'number', 100);
const page              = useParams('page', 'number', 1);
const metricsSampleSize = ref(1000);
const dialogStates      = ref({});

const prodResults          = reactive({});
const waldenResults        = reactive({});
const searchStarted        = ref(false);
const errorMessage         = ref('');

const tableScrollRef       = ref(null);
const fixedHeaderRef       = ref(null);
const vDataTableRef        = ref(null);
const showFixedHeader      = ref(false);

const { smAndDown, mdAndDown } = useDisplay();

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

      const passes5Percent = (prodValue, waldenValue) => {
        if (prodValue === 0 && waldenValue === 0) { return true; }
        if (prodValue === 0) { return false; }
        return Math.abs((waldenValue - prodValue) / prodValue * 100) <= 5;
      } 

      if (prod && !walden) {
        passed = false;
      } else if (prodValue === null && waldenValue === null) {
        passed = true;
      } else if (prodValue === undefined && waldenValue === undefined) {
        passed = true;
      } else if (type === "number|<5%") {
        passed = passes5Percent(prodValue, waldenValue);
      } else if (type === "number|≥") {
        passed = prodValue <= waldenValue;
      } else if (type === "array|<5%") {
        if (!(Array.isArray(prodValue) && Array.isArray(waldenValue))) {
          passed = false;
        } else {
          let nProd = prodValue.length;
          let nWalden = waldenValue.length;
          passed = passes5Percent(nProd, nWalden);
        }
      } else if (type === "array|≥") {
        if (!(Array.isArray(prodValue) && Array.isArray(waldenValue))) {
          passed = false;
        } else {
          passed = waldenValue.length >= prodValue.length;
        }
      } else if (type === "object") {
        passed = _.isEqual(prodValue, waldenValue);
      } else if (type === "array") {
        passed = _.isEqual(prodValue, waldenValue);
      } else {
        passed = prodValue === waldenValue;
      }
      matches[id][field] = passed;

      const isNumber = (type) => type === "number" || type.startsWith("number");

      if (isNumber(type) && typeof prodValue === "number" && typeof waldenValue === "number") {
        //console.log("Setting diff field in matches", field, prodValue, waldenValue);
        let diff = 0;
        if (prodValue === 0 && waldenValue === 0) { diff = 0; }
        else if (prodValue === 0) { diff = undefined; }
        else { diff = Math.round((waldenValue - prodValue) / prodValue * 100); }

        matches[id][field + "_diff"] = diff;
        matches[id][field + "_diff_below_5"] = Math.abs(diff) <= 5; 
      }

      if (!passed && fieldsToShow.value.includes(field)) {
        rowPassed = false;
      }
    });
    matches[id]._id = rowPassed;
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

const matchRate = computed(() => {return calcMatchRate(matchedIds.value);});
const matchRateTotal = computed(() => {return calcMatchRate(Object.keys(matches.value));});
const calcMatchRate =(ids) => {
  let total = 0;
  let passed = 0;
  ids.forEach(id => {
    total++;
    if (matches.value[id].rowPassed) {
      passed++;
    }
  });
  return Math.round((passed / total) * 100);
};

const returnRate = computed(() => {return calcReturnRate(matchedIds.value);});
const returnRateTotal = computed(() => {return calcReturnRate(Object.keys(matches.value));});
const calcReturnRate = (ids) => { 
  let total = 0;
  let passed = 0;
  ids.forEach(id => {
    total++;
    if (waldenResults[id]) {
      passed++;
    }
  });
  return Math.round((passed / total) * 100);
};

const cellMatchRate = computed(() => {return calcCellMatchRate(matchedIds.value);});
const cellMatchRateTotal = computed(() => {return calcCellMatchRate(Object.keys(matches.value));});
const calcCellMatchRate = (ids) => {
  let total = 0;
  let passed = 0;
  ids.forEach(id => {
    fieldsToShow.value.forEach(field => {
      total++;
      if (matches.value[id][field]) {
        passed++;
      }
    });
  });
  return Math.round((passed / total) * 100);
};

const worksMatchedIds = computed(() => {
  return Object.keys(matches.value).filter(id => id.startsWith("W"));
});

const columnMatchRates = computed(() => {return calcColumnMatchRates(matchedIds.value);});
const columnMatchRatesTotal = computed(() => {return calcColumnMatchRates(worksMatchedIds.value);});
const calcColumnMatchRates = (ids) => {
  const counts = {};
  const validDiffsSeen = {};
  
  Object.keys(schema[entityType.value]).forEach(field => {
    counts[field] = 0;

    if (schema[entityType.value][field].startsWith("number")) {
      counts[`${field}_diff`] = 0;
      counts[`${field}_diff_below_5`] = 0;
      validDiffsSeen[`${field}_diff`] = 0;
    }
  });
  
  ids.forEach(id => {
    Object.keys(schema[entityType.value]).forEach(field => {
      if (matches.value[id][field]) {
        counts[field]++;
      }
      if (schema[entityType.value][field].startsWith("number")) {
        if (matches.value[id][`${field}_diff`] !== undefined) {
          counts[`${field}_diff`] += Math.abs(matches.value[id][`${field}_diff`]);
          validDiffsSeen[`${field}_diff`]++;
        }
        if (matches.value[id][`${field}_diff_below_5`] === true) {
          counts[`${field}_diff_below_5`]++;
        }
      }
    });
  });
  
  Object.keys(counts).forEach(field => {
    if (field.endsWith("_diff")) {
      //console.log("Setting _diff field", field, counts[field]);
      counts[field] = validDiffsSeen[field] > 0 ? Math.round(counts[field] / validDiffsSeen[field]) : "-";
    } else {
      counts[field] = counts[field] > 0 ? Math.round((counts[field] / ids.length) * 100) : 0;
    }
  });
  
  return counts;
};

const sumMetrics = computed(() => {
  const metrics = {};
  const countFields = ['locations', 'referenced_works']
  
  const sumField = (field, store) => {
    let sum = 0;
    Object.keys(store).forEach(id => {
      const val = getFieldValue(store[id], field);
      if (Array.isArray(val)) {
        sum += val.length;
      }
    });
    return sum;
  }
  
  countFields.forEach(field => {
    metrics[field] =  {
      "prod": sumField(field, prodResults),
      "walden": sumField(field, waldenResults)
    };
  });
  
  return metrics;
});

const matchedIds = computed(() => {
  return idsToShow.value.filter(id => id in matches.value);
});

const testOnField = (field) => {
  const type = schema[entityType.value][field];
  const typeParts = type.split("|");
  if (typeParts.length > 1) {
    return typeParts[1];
  }
  return null;
};

const fieldWithTest = (field) => {
  const test = testOnField(field);
  return test ? field + " " + test : field;
};

const headers = computed(() => {
  const fields = fieldsToShow.value.map(field => {
    return { title: fieldWithTest(field), key: field };
  });
  fields.unshift({title: "Walden", key: "walden"});
  fields.unshift({title: "Prod", key: "prod"});
  fields.push({title: " ", key: "spacer"});
  return fields;
});

const rows = computed(() => {
  const rows = [];

  matchedIds.value.forEach(id => {
    const prod = prodResults[id];
    const walden = waldenResults[id];
    
    if (prod !== undefined && walden !== undefined) {
      rows.push(makeRow(id));
    }
  });
  return rows;
});

const makeRow = (id) => {
  const row = {};
  row._id = id;
  row.prodUrl = `https://api.openalex.org/${entityType.value}/${id}`;
  row.waldenUrl = `https://api.openalex.org/v2/${entityType.value}/${id}`;

  fieldsToShow.value.map(field => {    
    row[field] = " ";
  });
  return row;
};

/*
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
*/

function getCellStyle(item, column) {  
  if (!item || ["prod", "walden", "spacer"].includes(column.key)) { return {}; }

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

  } else if (column.key === '_id') {
    styles.width = '120px';
    styles.fontWeight = 'bold';
    styles.fontSize = '11px';
    styles.whiteSpace = 'nowrap';
    
  } else if (column.key === 'display_name') {
    styles.minWidth = '300px';
  }

  else if (iconFields.includes(column.key)) {
    styles.padding = '0px';
  }

  return styles;
}

const iconFields = [
  "doi",
  "authorships",
  "locations",
  "primary_topic.id",
  "institutions_distinct_count",
  "referenced_works_count",
  "cited_by_count",
];

const metricsHeaders = computed(() => {
  return [
    { 
      title: 'Field',
      key: 'fieldName',
      align: 'right',
      width: "260px",
      sortable: true,
    },
    { 
      title: 'Passing', 
      key: 'matchRate',
      align: 'right',
      sortable: true,
    },
  ];
});

const metricsItems = computed(() => {
  const rows = []; 
  defaultFields[entityType.value].forEach(key => {
    rows.push({
      fieldName: key,
      matchRate: columnMatchRatesTotal.value[key],
    });
  });
  return rows;
});

const colorScores = [
  { score: 85, color: 'bg-green-lighten-2' },
  { score: 70, color: 'bg-green-lighten-3' },
  { score: 50, color: 'bg-amber-lighten-4' },
  { score: 30, color: 'bg-orange-lighten-4' },
  { score: 0, color: 'bg-red-lighten-4' },
];

const getColorKey = (score) => {
  let last = 100;
  for (let i = 0; i < colorScores.length; i++) {
    if (score >= colorScores[i].score) {
      return {color: colorScores[i].color, label: `${colorScores[i].score}-${last}%`}
    }
    last = colorScores[i].score;
  }
};


const getColorForScore = (score, invert = false) => {
  if (score === '-') {
    return '';
  }

  score = invert ? 100 - score : score;

  for (let i = 0; i < colorScores.length; i++) {
    if (score >= colorScores[i].score) {
      return colorScores[i].color;
    }
  }
};

const getMetricsCellColorClass = (item, column) => {
  let cls = '';
  if (column.key === 'fieldName') {
    return ''; // No background color for field name column
  } else if (column.key === 'matchRate') {
    cls = getColorForScore(item.matchRate);
  } else if (column.key === 'diff') {
    cls = getColorForScore(item.diff, true);
  } else if (column.key === 'diffBelow5') {
    cls = getColorForScore(item.diffBelow5);
  }
  return cls + " text-center";
}

const getRecallCellColorClass = (item, column) => {
  let cls = '';
  if (column.key === 'type') {
    return ''; // No background color for field name column
  } else if (column.key === 'recall') {
    cls = getColorForScore(item.recall) + " text-center";
  } else if (column.key === 'canonicalId') {
    cls = getColorForScore(item.canonicalId) + " text-center";
  } else if (column.key === 'sampleSize') {
    cls = "flex-grow-1";
  }
  return cls;
}

const sumCards = [
  {title:"Citations", field:"referenced_works"},
  {title:"Locations", field:"locations"}
]

function isObject(obj) {
  if (Array.isArray(obj)) {
    return true;
  } else if (typeof obj === 'object' && obj !== null) {
    return true;
  } else {
    return false;
  }
}

const getDialogKey = (itemId, columnKey) => `${itemId}-${columnKey}`

const onShowComparison = (itemId, columnKey, event) => {
  const key = getDialogKey(itemId, columnKey);
  dialogStates.value[key] = false;
  compareId.value = event;
}

async function fetchResponses(ids, type, waldenOnly = false) {
  searchStarted.value = true;
  errorMessage.value = '';
  const getResults = async (url, store) => {
    let newIds = [];
    let missingIds = [...ids];
    ids.forEach(id => {
      if (!(id in store)) {
        newIds.push(id);
      }
    });
    if (newIds.length > 0) {
      const apiUrl = `${url}${type}?filter=${idFilterField(type)}:${newIds.join('|')}&per_page=100`;
      try {
      const response = await axios.get(apiUrl, axiosConfig);
      response.data.results.forEach(result => {
        store[extractID(result.id)] = result;
        missingIds.splice(missingIds.indexOf(extractID(result.id)), 1);
      });
      } catch (error) {
        console.error(`Error fetching ${type}: ${error}`);
      }
      missingIds.forEach(id => {
        store[id] = null;
      });
    }
  }
  const promises = [getResults(waldenUrl, waldenResults)]
  if (!waldenOnly) {
    promises.push(getResults(prodUrl, prodResults));
  }
  await Promise.all(promises);
}

function idFilterField(type) {
  const usesId = ["keywords", "domains", "continents", "countries", "languages", "licenses", "sdgs", "work-types"];  
  return usesId.includes(type) ? "id" : "ids.openalex";
}

async function fetchResponsesUpTo(count, ids, type, waldenOnly = false) {
  const nCalls = Math.ceil(count / pageSize.value);
  let startIndex = 0;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < nCalls; i++) {
    const idsToFetch = ids.slice(startIndex, startIndex + 100);
    fetchResponses(idsToFetch, type, waldenOnly);
    startIndex += 100;
    await delay(100);
  }
}

async function fetchRecallResponses() {
  const promises = [];
  recallTypes.forEach(type => {
    promises.push(fetchResponsesUpTo(500, type.ids, type.type));
  });
  await Promise.all(promises);
}

const recallTypes = [
  {
    type: "works",
    ids: samples.prod1.ids.slice(0, 500),
    canonicalId: "doi",
  },
  {
    type: "authors",
    ids: samples.authorsProd1.ids,
    canonicalId: "orcid",
  },
  {
    type: "sources",
    ids: samples.sourcesProd1.ids,
    canonicalId: "issn_l",
  },
  {
    type: "institutions",
    ids: samples.institutionsProd1.ids,
    canonicalId: "ror",
  },
  {
    type: "publishers",
    ids: samples.publishersProd1.ids,
    canonicalId: "ids.wikidata",
  },
  {
    type: "funders",
    ids: samples.fundersProd1.ids,
  },
  {
    type: "topics",
    ids: samples.topicsProd1.ids,
  },
  {
    type: "keywords",
    ids: samples.keywordsProd1.ids,
  },
  {
    type: "domains",
    ids: samples.domainsProd1.ids,
  },
  {
    type: "fields",
    ids: samples.fieldsProd1.ids,
  },
  {
    type: "subfields",
    ids: samples.subfieldsProd1.ids,
  },
  {
    type: "continents",
    ids: samples.continentsProd1.ids,
  },
  {
    type: "countries",
    ids: samples.countriesProd1.ids,
  },
  {
    type: "languages",
    ids: samples.languagesProd1.ids,
  },
  {
    type: "licenses",
    ids: samples.licensesProd1.ids,
  },
  {
    type: "sdgs",
    ids: samples.sdgsProd1.ids,
  },
  {
    type: "work-types",
    ids: samples.workTypesProd1.ids,
  },
  {
    type: "source-types",
    ids: samples.sourceTypesProd1.ids,
  },
  {
    type: "institution-types",
    ids: samples.institutionTypesProd1.ids,
  },
];

const recallHeaders = computed(() => {
  return [
    { 
      title: 'Entity',
      key: 'type',
      align: 'right',
      width: "150px",
      sortable: true,
    },
    { 
      title: 'Recall', 
      key: 'recall',
      sortable: true,
    },
    { 
      title: 'Canonical ID', 
      key: 'canonicalId',
      sortable: true,
    },
    { 
      title: 'Sample Size', 
      key: 'sampleSize',
      align: 'end',
      sortable: true,
    },
  ];
});

const recallResults = computed(() => {
  const results = {};
  recallTypes.forEach(type => {
    results[type.type] = {recall: 0, canonicalId: 0, sampleSize: type.ids.length};
    let recallCounts = 0;
    type.ids.forEach(id => {
      if (waldenResults[id]) { recallCounts++ }
    });
    results[type.type].recall = Math.round(recallCounts / type.ids.length * 100);
  

    if (type.canonicalId) {
      let canonicalIdCount = 0;
      type.ids.forEach(id => {
        if (id in matches.value && matches.value[id][type.canonicalId]) { canonicalIdCount++ }
      });
      results[type.type].canonicalId = Math.round(canonicalIdCount / type.ids.length * 100);
    } else {
      results[type.type].canonicalId = "-";
    }
    
    let sampleSize = 0;
    type.ids.forEach(id => {
      if (id in waldenResults) { sampleSize++ }
    });
    results[type.type].sampleSize = sampleSize;  
  });
  return results;
});

const recallItems = computed(() => {
  const rows = []; 
  Object.keys(recallResults.value).forEach(key => {
    rows.push({
      type: key,
      recall: recallResults.value[key].recall,
      canonicalId: recallResults.value[key].canonicalId,
      sampleSize: recallResults.value[key].sampleSize,
    });
  });
  return rows;
});

const recallProgress = computed(() => {
 let totalCount = 0;
 recallTypes.forEach(type => {
  totalCount += type.ids.length; 
 });
 return Object.keys(matches.value).length / totalCount;
});

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
  zoomId.value = extractID(id);
  zoomSource.value = sourceIndex === 0 ? "prod" : "walden";
}

function onDrawerClose() {
  zoomId.value = null;
}

const extractID = (input) => {
  const orgIndex = input.indexOf('.org/');
  return orgIndex !== -1 ? input.substring(orgIndex + 5) : input;
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
  await fetchResponses(idsToShow.value, "works");
}, { immediate: true });

watch(entityType, () => {
  fieldsToShow.value = [...defaultFields[entityType.value]];
  searchStarted.value = false;
});

watch(mode, () => {
  if (mode.value === 'metrics') {
    fetchResponsesUpTo(metricsSampleSize.value, sampleIds, "works");
  } else if (mode.value === 'recall') {
    fetchRecallResponses();
  }
}, { immediate: true });

watch(metricsSampleSize, () => {
  fetchResponsesUpTo(metricsSampleSize.value, sampleIds, "works");
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
  border-top: 3px solid #BBDEFB;
}
:deep(.results-table thead tr th) {
  background-color: #F5F5F5 !important;
  border-top: 1px solid #E0E0E0 !important;
  border-bottom: 1px solid #E0E0E0 !important;
  white-space: nowrap;
}
:deep(.results-table thead tr th:first-child) {
  border-left: 1px solid #E0E0E0 !important;
}
:deep(.results-table thead tr th:last-child) {
  border-right: 1px solid #E0E0E0 !important;
}
.results-table td a {
  color: #555;
  text-decoration: none;
}
.results-table td a:hover {
  color: #555;
  text-decoration: underline;
}
.results-table .test-cell:hover {
 border: 1px solid #BDBDBD;
}
.results-table .icon-column {
  cursor: pointer;
  width: 30px;
  text-align: center;
}
.results-table .spacer-column {
  text-align: right;
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
  top: 44px;
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
.sticky-controls {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: white;
}
.v-card, .v-overlay {
  overflow: visible !important;
}
:deep(.metrics-table th) {
  background-color: #FAFAFA;
}
</style>