<template>
  <div class="color-2 py-0 py-sm-12" style="min-height: 70vh;" ref="scrollContainer">
    <v-container v-if="!isAdmin" style="width: 600px; margin-top: 100px;">
      <v-alert type="info">
        This page is available to OpenAlex admins only.
      </v-alert>
    </v-container>
    
    <v-container v-else class="pa-0 pa-sm-4">
      <div class="text-h3 mb-6">
        Curation Moderation
      </div>

      <!-- Filters -->
      <div class="mb-4 d-flex align-center">
        <!--<span class="text-grey-darken-1 mr-2" style="font-size: 14px;">Filter by:</span>-->

        <!-- Approved Filter -->
        <v-menu v-model="approvedMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="approvedFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Approved
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ approvedFilter === 'null' ? 'Needs Approval' : (approvedFilter === 'true' ? 'Approved' : 'Denied') }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="approvedFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Approved</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="approvedMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="approvedFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="Needs Approval" value="null"></v-radio>
                <v-radio label="Approved" value="true"></v-radio>
                <v-radio label="Denied" value="false"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Ingested Filter -->
        <v-menu v-model="ingestedMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="ingestedFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Ingested
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ ingestedFilter === 'null' ? 'Not Ingested' : (ingestedFilter === 'true' ? 'Ingested' : 'Not Ingested') }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="ingestedFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Ingested</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="ingestedMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="ingestedFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="Not Ingested" value="null"></v-radio>
                <v-radio label="Ingested" value="true"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Entity Filter -->
        <v-menu v-model="entityMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="entityFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Entity
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ entityFilter === 'works' ? 'Works' : 'Journals' }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="entityFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Entity</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="entityMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="entityFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="Works" value="works"></v-radio>
                <v-radio label="Journals" value="journals"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Property Filter -->
        <v-menu v-model="propertyMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="propertyFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Property
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ propertyFilter }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="propertyFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Property</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="propertyMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="propertyFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="pdf_url" value="pdf_url"></v-radio>
                <v-radio label="html_url" value="html_url"></v-radio>
                <v-radio label="license" value="license"></v-radio>
                <v-radio label="is_oa" value="is_oa"></v-radio>
                <v-radio label="oa_date" value="oa_date"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Submitter Filter -->
        <v-menu v-model="submitterMenu" :close-on-content-click="false" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="!emailFilter">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Submitter
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ emailFilter }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="clearEmailFilter"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="350" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Submitter</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="submitterMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="emailInput"
                label="Email address"
                placeholder="Enter email address"
                variant="solo-filled"
                flat
                rounded
                bg-color="grey-lighten-3"
                density="compact"
                hide-details
                class="mb-3"
              ></v-text-field>
              <div class="d-flex justify-end gap-2">
                <v-btn 
                  variant="text" 
                  @click="submitterMenu = false"
                >
                  Cancel
                </v-btn>
                <v-btn 
                  color="blue-darken-2" 
                  variant="flat"
                  rounded
                  :disabled="emailInput === ''" 
                  @click="applyEmailFilter"
                >
                  Filter
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>

        <v-spacer></v-spacer>

        <!-- Sort Order Filter -->
        <v-menu v-model="sortMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                Sort: {{ sortOrder === 'desc' ? 'Newest' : 'Oldest' }}
                <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
              </v-btn>
            </span>
          </template>

          <v-card width="150">
            <v-list>
              <v-list-item @click="sortOrder = 'desc'">
                <v-icon icon="mdi-check" :color="sortOrder === 'desc' ? 'grey-darken-2' : 'transparent'" size="small"></v-icon>
                Newest
              </v-list-item>
              <v-list-item @click="sortOrder = 'asc'">
                <v-icon icon="mdi-check" :color="sortOrder === 'asc' ? 'grey-darken-2' : 'transparent'" size="small"></v-icon>
                Oldest
              </v-list-item>  
            </v-list>
          </v-card>
        </v-menu>

      </div>

      <v-card flat rounded="xl" class="pa-4">   
        <div>
          <div v-if="curations.length > 0">
            <div class="px-4 " style="height: 28px;">
              <div v-if="selectedRows.length > 0" class="bulk-actions-row">
                <div class="d-flex align-center">
                  <div class="d-flex align-center mr-2">
                    <span class="text-body-2 font-weight-medium">{{ selectedRows.length }} item{{ selectedRows.length > 1 ? 's' : '' }} selected</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                <v-btn 
                  size="small"
                  rounded 
                  color="green-darken-4"
                  class="mr-1"
                  variant="tonal" 
                  prepend-icon="mdi-check"
                  @click="bulkApprove(true)"
                >
                  Approve Selected
                </v-btn>
                <v-btn 
                  size="small" 
                  rounded 
                  color="red-darken-4" 
                  variant="tonal"
                  class="mr-1"
                  prepend-icon="mdi-close"
                  @click="bulkApprove(false)"
                >
                  Deny Selected
                </v-btn>
              </div>
                </div>
              </div>
              <div v-else class="text-body-2 text-grey-darken-1">
                {{ resultsRangeText }}
              </div>
            </div>

            
            <v-data-table
              :headers="headers"
              :items="curations"
              :items-per-page="100"
              hide-default-footer
            >    

            <template #header.checkbox>
              <v-checkbox 
                v-model="selectAll" 
                :indeterminate="isIndeterminate"
                hide-details 
                color="grey-darken-2" 
                class="mr-3 ml-n3"
                variant="flat"
                @click="toggleSelectAll"
              ></v-checkbox>
            </template>
          
            <template #item.checkbox="{ item }">
              <v-checkbox 
                v-if="!item.ingested"
                v-model="selectedRows" 
                :value="item.id" 
                hide-details 
                color="grey-darken-2" 
                class="mr-3 ml-n3" 
                variant="flat"></v-checkbox>
            </template>

            <template #item.approved="{ value, item }">
              <div v-if="value === null">
                <nobr>
                  <v-btn size="small" rounded color="green-darken-4" variant="tonal" class="mr-1" @click="approveCorrection(item.id, true)">Yes</v-btn>
                  <v-btn size="small" rounded color="red-darken-4" variant="tonal" @click="approveCorrection(item.id, false)">No</v-btn>
                </nobr>
              </div>
              <span v-else>
                <span v-if="value"><nobr><v-icon icon="mdi-check" color="green-darken-4"></v-icon> Approved</nobr></span>
                <span v-else><nobr><v-icon icon="mdi-close" color="red-darken-4"></v-icon> Denied</nobr></span>
              </span>
            </template>

            <template #item.entity_id="{ value, item }">
              <div class="d-flex align-center" style="min-width: 0;">
                <v-icon
                  :icon="item.entity === 'works' ? 'mdi-file-document-outline' : 'mdi-book-open-outline'"
                  size="small"
                  color="grey-darken-1"
                  class="mr-1"
                />
                <a
                  :href="`https://openalex.org/${value}`"
                  target="_blank"
                  class="text-truncate d-block flex-grow-1"
                  style="min-width: 0; max-width: 200px; overflow: hidden;"
                >
                  {{ item.apiData?.display_name ?? value }}
                </a>
              </div>
            </template>

            <template #item.property="{ value }">
              <code>{{ value }}</code>
            </template>

            <template #item.property_value="{ value, item }">
              <div style="max-width: 280px;">
                <div>
                  <a v-if="isValidUrl(value)" :href="value" target="_blank" class="d-block text-truncate" style="font-family: monospace;">{{ value.replace("https://", "").replace("http://", "") }}</a>
                  <span v-else-if="value === null || value === ''" class="text-grey">-</span>
                  <span v-else><code>{{ value }}</code></span>
                </div>
                <div v-if="item.previous_value" class="mt-1 text-grey-darken-2 text-caption d-flex align-center">
                  <span class="mr-1 flex-shrink-0">Currently:</span>
                  <a v-if="isValidUrl(item.previous_value)" :href="item.previous_value" target="_blank" class="text-truncate"  style="font-family: monospace; flex: 1; min-width: 0;">{{ item.previous_value.replace("https://", "").replace("http://", "") }}</a>
                  <span v-else-if="item.previous_value === null " class="text-grey">-</span>
                  <span v-else>{{ item.previous_value }}</span>
                </div>
              </div>
            </template>

            <template #item.email="{ value }">
              <span>{{ value }}</span>
            </template>

            <template #item.submitted_date="{ value, item }">
              <div><nobr>{{ getRelativeTime(value) }}</nobr></div>
              <div class="text-grey-darken-2 text-caption">{{ item.email }}</div>
            </template>

            <template #item.ingested_date="{ value }">
              <nobr v-if="value">{{ getRelativeTime(value) }}</nobr>
              <nobr v-else class="text-grey">-</nobr>
            </template>

            <template #item.dots_menu="{ item }">
              <v-menu 
                teleport="body" 
                scroll-strategy="none" 
                location="bottom end"
                :contained="false"
                :absolute="false"
              >
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props">
                    <v-icon icon="mdi-dots-vertical" color="grey-darken-1"></v-icon>
                  </v-btn>
                </template>
                <v-card>
                  <v-list class="text-grey-darken-3" style="font-size: 16px;">
                    <v-list-item v-if="item.entity === 'journals' && item.apiData?.homepage_url" prepend-icon="mdi-home-outline" :href="item.apiData.homepage_url" target="_blank">
                      Journal homepage
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item v-if="item.entity === 'works' && item.apiData?.doi" prepend-icon="mdi-home-outline" :href="`${item.apiData.doi}`" target="_blank">
                      DOI
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-file-document-outline" :href="`https://openalex.org/${item.entity_id}`" target="_blank">
                      OpenAlex profile
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-api" :href="`https://api.openalex.org/${item.entity_id}?data-version=2`" target="_blank">
                      OpenAlex API
                      <v-icon icon="mdi-open-in-new" size="x-small" color="grey"></v-icon>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item prepend-icon="mdi-pencil" :to="`/curate/${item.entity}/${item.entity_id}`">
                      Curate this {{ item.entity === 'works' ? 'work' : 'journal' }}
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </template>
          
          </v-data-table>
        </div>

        <div v-if="isLoading" class="text-center text-grey py-6">
          <v-skeleton-loader type="list-item-two-line@10"></v-skeleton-loader>
        </div>

        <div v-else-if="curations.length === 0" class="text-center text-grey py-6">
          No curation requests matched your filters.
          </div>
        </div>

        <v-pagination
          v-model="page"
          v-if="showPagination"
          :length="Math.ceil(pagination.total / pagination.per_page)"
          class="mt-8"
        ></v-pagination>
        
      </v-card>
    </v-container>
  </div>


</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { useParams } from '@/composables/useStorage';
import { urlBase } from '@/apiConfig';

useHead({ title: 'Unpaywall Curation Moderation' });

const store = useStore();

const correctionsHost = urlBase.correctionsApi;

const curations               = ref([]);
const page                    = useParams('page', 'number', 1);
const perPage                 = useParams('per_page', 'number', 20);
const isLoading               = ref(false);
const selectedRows            = ref([]);
const approvalOffset          = ref(0);
const pagination              = ref(null);
  
// Filter variables
const entityFilter = useParams('entity', 'string', 'all');
const propertyFilter = useParams('property', 'string', 'all');
const approvedFilter = useParams('approved', 'string', 'all');
const ingestedFilter = useParams('ingested', 'string', 'all');
const sortOrder = useParams('sort_order', 'string', 'desc');
const emailFilter = useParams('email', 'string', '');

// Menu states
const entityMenu = ref(false);
const propertyMenu = ref(false);
const approvedMenu = ref(false);
const ingestedMenu = ref(false);
const sortMenu = ref(false);
const submitterMenu = ref(false);

// Email input for submitter filter
const emailInput = ref('');

const isAdmin = computed(() => store.state.user.isAdmin);

const snackbar = (val) => store.commit('snackbar', val);

// Select all functionality
const selectAll = computed({
  get: () => curations.value.length > 0 && selectedRows.value.length === curations.value.length,
  set: (value) => {
    if (value) {
      selectedRows.value = curations.value.map(item => item.id);
    } else {
      selectedRows.value = [];
    }
  }
});

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < curations.value.length;
});

const toggleSelectAll = () => {
  if (selectedRows.value.length === curations.value.length) {
    selectedRows.value = [];
  } else {
    selectedRows.value = curations.value.map(item => item.id);
  }
};

const resultsRangeText = computed(() => {
  if (!pagination.value) return '';
  
  const start = pagination.value.offset + 1;
  const end = Math.min(start + curations.value.length - 1, pagination.value.total);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${pagination.value.total.toLocaleString()}`;
});


const headers = [
  { title: '', key: 'checkbox', sortable: false, width: '30px'},
  { title: 'Approved', key: 'approved'},
  { title: 'Entity', key: 'entity_id'},
  { title: 'Property', key: 'property'},
  { title: 'Value', key: 'property_value'},
  { title: 'Submitted', key: 'submitted_date'},
  { title: 'Ingested', key: 'ingested_date'},
  { title: '', key: 'dots_menu'},
];

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diff = now - date;
  
  if (diff < 0) {
    return 'in the future';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
}

const searchOffset = computed(() => {
  const offset = (page.value - 1) * perPage.value - approvalOffset.value;
  return offset < 0 ? 0 : offset;
});

const getCurations = async () => {
  try {
    isLoading.value = true;
    curations.value = [];
    
    // Build query parameters
    const params = new URLSearchParams({ offset: searchOffset.value });
    
    if (entityFilter.value !== 'all') {
      params.append('entity', entityFilter.value);
    }
    if (propertyFilter.value !== 'all') {
      params.append('property', propertyFilter.value);
    }
    if (approvedFilter.value !== 'all') {
      params.append('approved', approvedFilter.value);
    }
    if (ingestedFilter.value !== 'all') {
      params.append('ingested', ingestedFilter.value);
    }
    if (emailFilter.value) {
      params.append('email', emailFilter.value);
    }
    if (sortOrder.value !== 'desc') {
      params.append('sort_order', sortOrder.value);
    }
    if (perPage.value !== 20) {
      params.append('per_page', perPage.value);
    }
    
    const response = await axios.get(`${correctionsHost}/v2/corrections?${params.toString()}`);
    
    curations.value = response.data.results;
    pagination.value = response.data.pagination;

  } catch (error) {
    console.error('Search failed:', error);
    curations.value = [];
    pagination.value = null;
  }
  isLoading.value = false;
};

const showPagination = computed(() => {
  return pagination.value && pagination.value.total > 0 
    && (pagination.value.total > pagination.value.per_page || pagination.value.offset !== 0);
});

const approveCorrection = (id, value) => {
  axios.post(`${correctionsHost}/v2/corrections/${id}`, { approved: value });
  curations.value = curations.value.map(c => c.id === id ? { ...c, approved: value } : c);
  if (approvedFilter.value === "null") {
    approvalOffset.value++;
  }
};

const bulkApprove = async (value) => {
  try {
    // Process all selected rows
    const promises = selectedRows.value.map(id => 
      approveCorrection(id, value)
    );
    
    await Promise.all(promises);
    selectedRows.value = [];
    
  } catch (error) {
    console.error('Error in bulk approve:', error);
  }
};

const applyEmailFilter = () => {
  emailFilter.value = emailInput.value.trim();
  submitterMenu.value = false;
  page.value = 1;
  getCurations();
};

const clearEmailFilter = () => {
  emailFilter.value = '';
  emailInput.value = '';
};

const isDOI = (doi) => {
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
};

const isOpenAlexId = (id) => {
  return /^W\d+$/.test(id);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

getCurations();

watch(page, () => {
  getCurations();
});

// Watch all filter changes and reset pagination
watch([entityFilter, propertyFilter, approvedFilter, ingestedFilter, sortOrder, emailFilter], () => {
  page.value = 1;
  approvalOffset.value = 0;
  getCurations();
});

// Initialize email input with current filter value
if (emailFilter.value) {
  emailInput.value = emailFilter.value;
}

</script>

<style scoped>
:deep(.v-data-table tr th) {
  font-size: 12px;
  height: 36px !important;
}
:deep(.v-data-table a) {
  color: inherit;
  text-decoration: none;
}
:deep(.v-data-table a:hover) {
  text-decoration: underline;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;   /* Number of lines */
  overflow: hidden;
  text-wrap: wrap;
}
.field {
  display: flex;
  margin-bottom: 10px;
  line-height: 40px;;
}
.field-label {
  width: 110px;
  flex-shrink: 0;
}
.field-value {
  flex: 1;
  min-width: 0;
}
</style>
