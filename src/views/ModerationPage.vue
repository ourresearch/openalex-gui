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
      <div class="mb-1 d-flex align-center">
        <!--<span class="text-grey-darken-1 mr-2" style="font-size: 14px;">Filter by:</span>-->

        <!-- Status Filter -->
        <v-menu v-model="statusMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="statusFilter === 'all'">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Status
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ statusDisplayNames[statusFilter] }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="statusFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Status</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="statusMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="statusFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="Needs Moderation" value="needs-moderation"></v-radio>
                <v-radio label="Approved" value="approved"></v-radio>
                <v-radio label="Denied" value="denied"></v-radio>
                <v-radio label="Live" value="live"></v-radio>
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
                  Entity Type
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ entityFilter === 'locations' ? 'Works' : 'Sources' }}
                  <v-icon icon="mdi-close" class="mr-n1" end @click.stop="entityFilter = 'all'"></v-icon>
                </v-btn>
              </template>
            </span>
          </template>

          <v-card width="300" rounded="xl">
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">Entity Type</span>
              <v-btn icon variant="text" class="mr-n4" color="grey-darken-1" @click="entityMenu = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="entityFilter">
                <v-radio label="All" value="all"></v-radio>
                <v-radio label="Works" value="locations"></v-radio>
                <v-radio label="Sources" value="sources"></v-radio>
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
                <v-radio label="oa_flip_year" value="oa_flip_year"></v-radio>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-menu>

        <!-- Submitter Filter -->
        <v-menu v-model="submitterMenu" :close-on-content-click="false" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <template v-if="!submitterEmailFilter">
                <v-btn v-bind="props" variant="outlined" size="default" rounded class="text-grey-darken-1" style="border: 1px solid #BDBDBD;">
                  Submitter
                  <v-icon icon="mdi-menu-down" end class="mr-n1"></v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn v-bind="props" color="blue-darken-2" variant="tonal" size="default" rounded>
                  {{ submitterEmailFilter }}
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
                v-model="submitterEmailInput"
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
                  :disabled="submitterEmailInput === ''" 
                  @click="applyEmailFilter"
                >
                  Filter
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </div>

      <!-- Result Count and Sort -->
      <div class="d-flex align-center pb-1 px-4">
        <div v-if="curations.length > 0" class="text-body-2 text-grey-darken-1">
          {{ resultsRangeText }}
        </div>

        <v-spacer></v-spacer>

        <!-- Sort  -->
        <v-menu v-model="sortMenu" location="bottom start">
          <template #activator="{ props }">
            <span class="mr-1">
              <v-btn v-bind="props" variant="text" size="default" class="text-grey-darken-1">
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

      <v-card flat rounded="xl" class="pa-4 pt-0">   
        <div>
          <div v-if="curations.length > 0">
            <!-- Bulk Actions -->
            <div v-if="selectedRows.length > 0" class="bulk-actions-row px-4">
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
                @click="bulkModerate(true)"
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
                @click="bulkModerate(false)"
              >
                Deny Selected
              </v-btn>
            </div>
              </div>
            </div>

            <v-data-table
              :headers="headers"
              :items="curations"
              :items-per-page="100"
              hide-default-footer
            >    

            <template #[`header.checkbox`]> 
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
          
            <template #[`item.checkbox`]="{ item }">
              <v-checkbox 
                v-if="!item.is_live"
                v-model="selectedRows" 
                :value="item.id" 
                hide-details 
                color="grey-darken-2" 
                class="mr-3 ml-n3" 
                variant="flat"></v-checkbox>
            </template>

            <template #[`item.status`]="{ value, item }">
              <div v-if="value === 'needs-moderation'">
                <span class="text-no-wrap">
                  <v-btn size="small" icon density="comfortable" color="green-darken-4" variant="tonal" class="mr-1" @click="moderateCorrection(item.id, true)">
                    <v-icon icon="mdi-check"></v-icon>
                  </v-btn>
                  <v-btn size="small" icon density="comfortable" color="red-darken-4" variant="tonal" @click="moderateCorrection(item.id, false)">
                    <v-icon icon="mdi-close"></v-icon>
                  </v-btn>
                </span>
              </div>
              <span v-else class="font-weight-medium">
                <span v-if="value === 'approved' && !item.is_live"><span class="text-no-wrap"><v-icon icon="mdi-check" color="green-darken-4"></v-icon> Approved</span></span>
                <span v-else-if="value === 'denied'"><span class="text-no-wrap"><v-icon icon="mdi-close" color="red-darken-4"></v-icon> Denied</span></span>
                <span v-else-if="value === 'approved' && item.is_live"><span class="text-no-wrap"><v-icon icon="mdi-web" color="blue-darken-4"></v-icon> Live</span></span>
              </span>
            </template>

            <template #[`item.entity_id`]="{ value, item }">
              <div class="d-flex align-center" style="min-width: 0;">
                <v-icon
                  :icon="item.entity === 'locations' ? 'mdi-file-document-outline' : 'mdi-book-open-outline'"
                  size="small"
                  color="grey-darken-1"
                  class="mr-1"
                />
                <a
                  :href="item.entity === 'locations' ? `https://api.openalex.org/locations/${value}?data-version=2` : `https://openalex.org/${value}`"
                  target="_blank"
                  class="text-truncate d-block flex-grow-1"
                  style="min-width: 0; max-width: 200px; overflow: hidden;"
                >
                  {{ (item.entity === 'locations' ? item.apiData?.title : item.apiData?.display_name) ?? value }}
                </a>
              </div>
            </template>

            <template #[`item.property`]="{ value, item }">
              <code v-if="value === null && item.create_new && item.entity === 'locations'">new location</code>
              <code v-else>{{ value }}</code>
            </template>

            <template #[`item.property_value`]="{ value, item }">
              <div style="max-width: 280px;">
                <!-- New Location -->
                <template v-if="item.create_new && item.entity === 'locations'">
                  <div>
                    <code><span class="text-grey-darken-1">is_oa:</span> {{ JSON.parse(item.property_value).is_oa }}</code>
                  </div>
                  <div v-if="JSON.parse(item.property_value).landing_page_url" class="text-truncate">
                    <code><span class="text-grey-darken-1">landing_page_url:</span> <a :href="JSON.parse(item.property_value).landing_page_url" target="_blank">{{ JSON.parse(item.property_value).landing_page_url }}</a></code>
                  </div>
                  <div v-if="JSON.parse(item.property_value).pdf_url" class="text-truncate">
                    <code><span class="text-grey-darken-1">pdf_url:</span> <a :href="JSON.parse(item.property_value).pdf_url" target="_blank">{{ JSON.parse(item.property_value).pdf_url }}</a></code>
                  </div>
                  <div v-if="JSON.parse(item.property_value).license">
                    <code><span class="text-grey-darken-1">license:</span> {{ JSON.parse(item.property_value).license }}</code>
                  </div>
                  <div class="text-truncate">
                    <code><span class="text-grey-darken-1">work_id:</span> <a :href="JSON.parse(item.property_value).work_id" target="_blank">{{ JSON.parse(item.property_value).work_id }}</a></code>
                  </div>
                  <div>
                    <code><span class="text-grey-darken-1">title:</span> {{ JSON.parse(item.property_value).title }}</code>
                  </div>
                </template> 
                <!-- Other Values -->
                <template v-else>
                  <div>
                    <a v-if="isValidUrl(value)" :href="value" target="_blank" class="d-block text-truncate" style="font-family: monospace;">{{ value.replace("https://", "").replace("http://", "") }}</a>
                    <span v-else-if="value === null || value === ''" class="text-grey">-</span>
                    <span v-else><code>{{ value }}</code></span>
                  </div>
                  <div v-if="item.previous_value" class="mt-1 text-grey-darken-2 text-caption d-flex align-center">
                    <span class="mr-1 flex-shrink-0">Now:</span>
                    <a v-if="isValidUrl(item.previous_value)" :href="item.previous_value" target="_blank" class="text-truncate"  style="font-family: monospace; flex: 1; min-width: 0;">{{ item.previous_value.replace("https://", "").replace("http://", "") }}</a>
                    <span v-else-if="item.previous_value === null " class="text-grey">-</span>
                    <span v-else>{{ item.previous_value }}</span>
                  </div>
                </template>
              </div>
            </template>

            <template #[`item.submitted_date`]="{ value, item }">
              <div><span class="text-no-wrap">{{ getRelativeTime(value) }}</span></div>
              <div class="text-grey-darken-2 text-caption">{{ item.submitter_email }}</div>
            </template>

            <template #[`item.live_date`]="{ value }">
              <span v-if="value" class="text-no-wrap">{{ getRelativeTime(value) }}</span>
              <div v-else class="text-grey text-center">-</div>
            </template>

            <template #[`item.dots_menu`]="{ item }">
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
                    <v-list-item v-if="item.entity === 'sources' && item.apiData?.homepage_url" prepend-icon="mdi-home-outline" :href="item.apiData.homepage_url" target="_blank">
                      Source homepage
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
                      Curate this {{ item.entity === 'works' ? 'work' : 'source' }}
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-menu>
            </template>
          
            </v-data-table>
          </div>

          <div v-else-if="isLoading" class="text-center text-grey py-6">
            <v-skeleton-loader type="list-item-two-line@10"></v-skeleton-loader>
          </div>

          <div v-else-if="curations.length === 0" class="text-center pb-8 pt-12">
            <div v-if="isModerationQueue" class="text-center text-grey-darken-2">
              <v-icon icon="mdi-trophy-award" color="amber" size="150" class="mb-4"></v-icon>
              <br>
              There are no more requests in need of moderation.
              <br>
              You get a gold star!
            </div>
            <div v-else class="text-grey-darken-2">
              No curation requests matched your filters.
            </div>
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
const moderatedOffset          = ref(0);
const pagination              = ref(null);
  
// Filter variables
const entityFilter = useParams('entity', 'string', 'all');
const propertyFilter = useParams('property', 'string', 'all');
const statusFilter = useParams('status', 'string', 'needs-moderation');
const sortOrder = useParams('sort_order', 'string', 'desc');
const submitterEmailFilter = useParams('email', 'string', '');

// Menu states
const entityMenu = ref(false);
const propertyMenu = ref(false);
const statusMenu = ref(false);
const sortMenu = ref(false);
const submitterMenu = ref(false);

// Email input for submitter filter
const submitterEmailInput = ref('');

const isAdmin = computed(() => store.state.user.isAdmin);
const moderatorEmail = computed(() => store.getters['user/userEmail']);

const snackbar = (val) => store.commit('snackbar', val);

const statusDisplayNames = {
  'needs-moderation': 'Needs Moderation',
  'approved': 'Approved',
  'denied': 'Denied',
  'live': 'Live'
};

// Select all functionality
const selectAll = computed({
  get: () => curations.value.length > 0 && selectedRows.value.length === curations.value.length,
  set: (value) => {
    if (value) {
      selectedRows.value = curations.value.filter(item => item.status !== 'live').map(item => item.id);
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
  { title: 'Status', key: 'status'},
  { title: 'Title', key: 'entity_id'},
  { title: 'Property', key: 'property'},
  { title: 'Value', key: 'property_value'},
  { title: 'Submitted', key: 'submitted_date'},
  { title: 'Live', key: 'live_date'},
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
  const offset = (page.value - 1) * perPage.value - moderatedOffset.value;
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
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === 'approved') {
        params.append('status', 'approved');
        params.append('is_live', 'false');
      } else if (statusFilter.value === 'live') {
        params.append('is_live', 'true');
      } else {
        params.append('status', statusFilter.value);
      }
    }
    if (submitterEmailFilter.value) {
      params.append('submitter_email', submitterEmailFilter.value);
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

const isModerationQueue = computed(() => {
  return entityFilter.value === 'all' && 
    propertyFilter.value === 'all' && 
    statusFilter.value === 'needs-moderation' && 
    submitterEmailFilter.value === '';
});

const moderateCorrection = (id, value) => {
  const status = value ? "approved" : "denied";
  try {
    axios.post(`${correctionsHost}/v2/corrections/${id}`, { status: status, moderator_email: moderatorEmail.value });
    curations.value = curations.value.map(c => c.id === id ? { ...c, status: status } : c);
    if (statusFilter.value === "needs-moderation") {
      moderatedOffset.value++;
    }
  } catch (error) {
    console.error('Error in moderate correction:', error);
    snackbar("There was an error processing your moderation request. Please try again.");
    curations.value = curations.value.map(c => c.id === id ? { ...c, status: "needs-moderation" } : c);
    if (statusFilter.value === "needs-moderation") {
      moderatedOffset.value--;
    }
  }
};

const bulkModerate = async (value) => {
  try {
    // Process all selected rows
    const promises = selectedRows.value.map(id => 
      moderateCorrection(id, value)
    );
    
    await Promise.all(promises);
    selectedRows.value = [];
    
  } catch (error) {
    console.error('Error in bulk approve:', error);
  }
};

const applyEmailFilter = () => {
  submitterEmailFilter.value = submitterEmailInput.value.trim();
  submitterMenu.value = false;
  page.value = 1;
  getCurations();
};

const clearEmailFilter = () => {
  submitterEmailFilter.value = '';
  submitterEmailInput.value = '';
};

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

getCurations();

// Initialize email input with current filter value
if (submitterEmailFilter.value) {
  submitterEmailInput.value = submitterEmailFilter.value;
}

watch(page, () => {
  getCurations();
});

// Watch all filter changes and reset pagination
watch([entityFilter, propertyFilter, statusFilter, sortOrder, submitterEmailFilter], () => {
  page.value = 1;
  moderatedOffset.value = 0;
  getCurations();
});

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
