<template>
  <div :class="['color-2 py-0 py-sm-12', mode]" style="min-height: 70vh;">
    <v-container :fluid="smAndDown" :class="['pa-0', 'pa-sm-4']">
      <v-row>
        <v-col cols="12">
          <v-card rounded elevation="4" class="pt-6 pb-0 px-10">
            
            <!-- Title Row -->
            <v-row class="mt-2">
              <v-card-title class="pa-0 mb-5">
                <b>O</b>penAlex <b>R</b>ewrite <b>E</b>valuation <b>O</b>verview
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
            <v-row class="top-controls mb-8 mx-n4 sticky-controls" dense>
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
                  <v-btn value="results">GS</v-btn>
                  <v-btn value="metrics">Metrics</v-btn>
                  <v-btn value="recall">Recall</v-btn>

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
              <v-spacer></v-spacer>

              <v-col cols="12" sm="auto" class="mb-2 mb-sm-0 d-flex">

              </v-col>

            </v-row>

            <v-pagination
              v-model="page"
              v-if="mode !== 'metrics' && mode !== 'recall'"
              :length="100"
              :total-visible="10"
              rounded
              class="bg-blue-lighten-5 mx-n10"
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
            <div v-if="matchedIds.length > 0" class="bg-grey-lighten-4 mx-n10 results-section">
              <!-- Stats -->
              <v-row :dense="smAndDown" v-if="mode === 'metrics'" class="px-2 px-sm-6 pt-5 pb-7">
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
                    <v-card-title class="text-h6 font-weight-bold">{{ mode == "metrics" ? Object.keys(matches).length.toLocaleString() : matchedIds.length }}</v-card-title>
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
                            style="position: absolute; top: 10px; right: 30px;"
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

              <!-- Table -->
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
                      <th v-for="column in columns" :key="column.key" :class="column.key in fieldIcons ? 'icon-column' : ''">
                        <span v-if="fieldIcons[column.key]">
                          <v-tooltip :text="column.title" location="bottom">
                            <template v-slot:activator="{ props }">
                              <v-icon size="small" v-bind="props" :icon="fieldIcons[column.key]"></v-icon>
                            </template>
                          </v-tooltip>
                        </span>
                        <span v-else>{{ column.title }}</span>
                      </th>
                    </tr>
                  </template>
                  <template v-slot:item="{ item, columns }">
                    <tr>
                      <td v-for="column in columns" :key="column.key" :style="getCellStyle(item, column)">
                        <div v-if="column.key === '_id'">
                          <v-dialog 
                            max-width="80vw" 
                            max-height="80vh"
                            :model-value="compareId === item._id"
                            @update:model-value="(val) => val ? compareId = item._id : compareId = null"
                          >
                            <template v-slot:activator="{ props }">
                              <span 
                                v-bind="props" 
                                style="cursor: pointer;"
                                @click="compareId = item._id"
                              >{{ item._id }}</span>
                            </template>
                            <compare-work
                              :id="item._id"
                              :matches="matches[item._id]"
                              :prod-results="prodResults[item._id]"
                              :walden-results="waldenResults[item._id]"
                              :compare-view="compareView"
                              @update:compare-view="compareView = $event"
                            />
                          </v-dialog>
                  
                          <v-tooltip text="Prod" location="bottom">
                            <template v-slot:activator="{ props }">
                              <a :href="item.prodUrl" target="_blank" v-bind="props" class="mr-2">
                                <v-icon size="small" variant="plain" icon="mdi-factory"></v-icon>
                                <v-icon size="x-small" variant="plain" icon="mdi-open-in-new"></v-icon>
                              </a>
                            </template>
                          </v-tooltip>
                          <v-tooltip text="Walden" location="bottom">
                            <template v-slot:activator="{ props }">
                              <a :href="item.waldenUrl" target="_blank" v-bind="props">
                                <v-icon size="small" variant="plain" icon="mdi-pine-tree-variant-outline"></v-icon>
                                <v-icon size="x-small" variant="plain" icon="mdi-open-in-new"></v-icon>
                              </a>
                            </template>
                          </v-tooltip>
                        </div>

                        <v-dialog v-else max-width="70vw" max-height="70vh" width="auto">
                          <template v-slot:activator="{ props }">
                            <div style="width: 100%; height: 100%; cursor: pointer;" v-bind="props"></div>
                          </template>
                          <compare-field
                            :id="item._id"
                            :field="column.key"
                            :match="matches[item._id][column.key]"
                            :type="schema[entityType][column.key]"
                            :prod-value="prodResults[item._id][column.key]"
                            :walden-value="waldenResults[item._id] ? waldenResults[item._id][column.key] : '[404]'"
                          />
                        </v-dialog>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </div>

              <!-- Google Scholar -->
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
                            <template v-if="data.authorships && data.authorships.length">
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
                          <div v-if="index === 1" class="mt-4">
                            <v-menu v-for="field in iconFields" :key="field" :text="field" location="bottom">
                              <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" size="small" class="mr-2" :icon="fieldIcons[field]" :color="matches[id][field] ? 'green-lighten-2' : 'red-lighten-2'"></v-icon>
                              </template>
                              <compare-field
                                :id="id"
                                :field="field"
                                :type="schema[entityType][field]"
                                :match="matches[id][field]"
                                :prod-value="prodResults[id][field]"
                                :walden-value="waldenResults[id] ? waldenResults[id][field] : '[404]'"
                              />
                            </v-menu>
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

              <!-- Metrics View -->
              <div v-else-if="mode == 'metrics'">
                <v-row>
                  <v-col cols="7">
                    <v-card class="ml-6">
                      <v-data-table
                        :headers="metricsHeaders"
                        :items="metricsItems"
                        :sort-by="[{ key: 'fieldName', order: 'asc' }]"
                        :items-per-page="-1"
                        :hide-default-footer="true"
                        class="metrics-table elevation-1"
                      >
                        <template v-slot:item="{ item, columns }">
                          <tr>
                            <td v-for="column in columns" :key="column.key" :class="getMetricsCellColorClass(item, column)">
                              <template v-if="column.key === 'fieldName'">
                                <span class="font-weight-bold">{{ item.fieldName }}</span>
                              </template>
                              <template v-else-if="column.key === 'matchRate'">
                                {{ item.matchRate }}%
                              </template>
                              <template v-else-if="column.key === 'diff'">
                                {{ item.diff !== '-' ? item.diff + '%' : item.diff }}
                              </template>
                              <template v-else-if="column.key === 'diffBelow5'">
                                {{ item.diffBelow5 !== '-' ? item.diffBelow5 + '%' : item.diffBelow5 }}
                              </template>
                              <template v-else>
                                {{ item[column.key] }}
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
                <v-data-table
                  :headers="recallHeaders"
                  :items="recallItems"
                  :items-per-page="-1"
                  :hide-default-footer="true"
                  class="metrics-table elevation-1"
                >
                  <template v-slot:item="{ item, columns }">
                    <tr>
                      <td v-for="column in columns" :key="column.key" :class="getRecallCellColorClass(item, column)">
                        <template v-if="column.key === 'type'">
                          <span class="font-weight-bold">{{ item.type }}</span>
                        </template>
                        <template v-else-if="column.key === 'recall'">
                          {{ item.recall }}%
                        </template>
                        <template v-else-if="column.key === 'canonicalId'">
                          {{ item.canonicalId }}%
                        </template>
                        <template v-else-if="column.key === 'Sample Size'">
                          {{ item.sampleSize }}
                        </template>
                        <template v-else>
                          {{ item[column.key] }}
                        </template>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
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
              <v-tooltip :text="column.title" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon size="small" v-bind="props" :icon="fieldIcons[column.key]"></v-icon>
                </template>
              </v-tooltip>
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

import { samples } from '@/qa/samples';
import { defaultFields, schema, fieldIcons } from '@/qa/apiComparison';
import { useParamsAndLocalStorage, useParams } from '@/composables/useStorage';
import WorkDrawer from '@/components/QA/WorkDrawer.vue';
import CompareField from '@/components/QA/CompareField.vue';
import CompareWork from '@/components/QA/CompareWork.vue';

defineOptions({ name: 'WaldenQA' });

const sample    = samples.prod1;
const sampleIds = sample.ids;

const prodUrl      = `https://api.openalex.org/`;
const waldenUrl    = `https://api.openalex.org/v2/`;
const axiosConfig  = {headers: {Authorization: "Bearer YWMKSvdNwfrknsOPtdqCPz"}};

const entityType        = ref('works');
const fieldsToShow      = useParams('fieldsToShow', 'array', [...defaultFields[entityType.value]]);
const mode              = useParams('mode', 'string', 'table');
const hide404s          = useParamsAndLocalStorage('hide404s', 'boolean', false);
const zoomId            = useParams('zoomId', 'string', null);
const zoomSource        = useParams('zoomSource', 'string', 'prod');
const compareId         = useParams('compareId', 'string', null);
const compareView       = useParams('compareView', 'string', 'diff');
const pageSize          = useParams('pageSize', 'number', 100);
const page              = useParams('page', 'number', 1);
const metricsSampleSize = ref(1000);

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
      } else if (type === "number|>=") {
        passed = prodValue <= waldenValue;
      } else if (type === "array|<5%") {
        if (!(Array.isArray(prodValue) && Array.isArray(waldenValue))) {
          passed = false;
        } else {
          let nProd = prodValue.length;
          let nWalden = waldenValue.length;
          passed = passes5Percent(nProd, nWalden);
        }
      } else if (type === "array|>=") {
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

const columnMatchRates = computed(() => {return calcColumnMatchRates(matchedIds.value);});
const columnMatchRatesTotal = computed(() => {return calcColumnMatchRates(Object.keys(matches.value));});
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

const headers = computed(() => {
  const fields = fieldsToShow.value.map(field => {
    let title = field;
    const type = schema[entityType.value][field];
    const typeParts = type.split("|");
    if (typeParts.length > 1) {
      title += " " + typeParts[1];
    }
    return { title: title, key: field };
  });
  fields.unshift({title: "ID", key: "_id"});
  if (fieldsToShow.value.every(field => defaultFields[entityType.value].includes(field))) {
    fields.push({title: " ", key: "spacer"});
  }
  return fields;
})

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
  if (!item || column.key === "spacer") { return {}; }

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
      width: "150px",
      sortable: true,
    },
    { 
      title: 'Exact Match', 
      key: 'matchRate',
      align: 'right',
      sortable: true,
    },
    { 
      title: 'Average Diff', 
      key: 'diff',
      align: 'right',
      sortable: true,
    },
    { 
      title: 'Diff <5%', 
      key: 'diffBelow5',
      align: 'right',
      sortable: true,
    },
  ];
});

const metricsItems = computed(() => {
  const rows = []; 
  fieldsToShow.value.forEach(key => {
    rows.push({
      fieldName: key,
      matchRate: columnMatchRatesTotal.value[key],
      diff: `${key}_diff` in columnMatchRatesTotal.value ? columnMatchRatesTotal.value[`${key}_diff`] : '-',
      diffBelow5: `${key}_diff_below_5` in columnMatchRatesTotal.value ? columnMatchRatesTotal.value[`${key}_diff_below_5`] : '-',
    });
  });
  return rows;
});

const getColorForScore = (score, invert = false) => {
  if (score === '-') {
    return '';
  }

  score = invert ? 100 - score : score;

  if (score > 85) {
    return 'bg-green-lighten-2';
  } else if (score > 70) {
    return 'bg-green-lighten-3';
  } else if (score > 50) {
    return 'bg-amber-lighten-4';
  } else if (score > 30) {
    return 'bg-orange-lighten-4';
  } else {
    return 'bg-red-lighten-4';
  }
}

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
    cls = getColorForScore(item.recall);
  } else if (column.key === 'canonicalId') {
    cls = getColorForScore(item.canonicalId);
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
      const apiUrl = `${url}${type}?filter=ids.openalex:${newIds.join('|')}&per_page=100`;
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
];

const recallResults = computed(() => {
  const results = {};
  recallTypes.forEach(type => {
    results[type.type] = {recall: 0, canonicalId: 0, sampleSize: type.ids.length};
    let recallCounts = 0;
    type.ids.forEach(id => {
      if (waldenResults[id]) { recallCounts++ }
    });
    results[type.type].recall = Math.round(recallCounts / type.ids.length * 100);
  

    let canonicalIdCount = 0;
    type.ids.forEach(id => {
      if (waldenResults[id]) { canonicalIdCount++ }
    });
    results[type.type].canonicalId = Math.round(canonicalIdCount / type.ids.length * 100);
    
    let sampleSize = 0;
    const typePrefix = type.type[0].toUpperCase();
    Object.keys(waldenResults).forEach(key => {
      if (key.startsWith(typePrefix)) {
        sampleSize++;
      }
    });
    results[type.type].sampleSize = sampleSize;  
  });
  return results;
});

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
      align: 'right',
      sortable: true,
    },
    { 
      title: 'Canonical ID', 
      key: 'canonicalId',
      align: 'right',
      sortable: true,
    },
    { 
      title: 'Sample Size', 
      key: 'sampleSize',
      align: 'right',
      sortable: true,
    },
  ];
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

async function fetchRecallResponses() {
  const promises = [];
  recallTypes.forEach(type => {
    promises.push(fetchResponsesUpTo(500, type.ids, type.type));
  });
  await Promise.all(promises);
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
  border-top: 1px solid #E0E0E0;
}
.metrics .results-section {
  border-top: 3px solid #BBDEFB;
}
:deep(.results-table thead tr th) {
  background-color: #F5F5F5 !important;
  border-top: 1px solid #E0E0E0 !important;
  border-bottom: 2px solid #ccc !important;
  white-space: nowrap;
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
.results-table td:hover {
 opacity: 0.5;
}
.results-table .icon-column {
  cursor: pointer;
  width: 30px;
  text-align: center;
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