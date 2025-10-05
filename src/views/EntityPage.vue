<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container v-if="entityData" class="entity-page">
      <div>
        <v-btn
          color="primary"
          rounded
          class="my-2"
          variant="text"
          @click="$router.back()"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          back
        </v-btn>
      </div>
      <entity-header
        :entity-data="entityData"
        class="mb-4"
      />

      <v-row v-if="myEntityType === 'works'">
        <v-col>
          <v-card flat rounded>
            <v-tabs v-model="activeTab" bg-color="transparent">
              <v-tab value="details">Details</v-tab>
              <v-tab value="locations">Locations</v-tab>
            </v-tabs>

            <v-divider />

            <v-window v-model="activeTab">
              <v-window-item value="details">
                <div class="py-6">
                  <entity-new
                    :data="entityData"
                  />
                </div>
              </v-window-item>

              <v-window-item value="locations">
                <div class="pa-6">
                  <v-alert v-if="allLocations.length === 0" type="info" variant="tonal">
                    No locations available for this work.
                  </v-alert>
                  <v-row v-else>
                    <v-col
                      v-for="(location, index) in allLocations"
                      :key="index"
                      cols="12"
                      sm="6"
                      md="4"
                      class="d-flex"
                    >
                      <v-card variant="outlined" :elevation="0" class="d-flex flex-column" style="width: 100%;">
                        <v-card-title class="d-flex align-start">
                          <div style="flex: 1;">
                            <div>{{ formatSourceName(location.source?.display_name) }}</div>
                            <div v-if="location.source?.host_organization_name" class="text-subtitle-2 font-weight-regular text-grey">
                              {{ location.source.host_organization_name }}
                            </div>
                          </div>
                          <div class="d-flex flex-wrap" style="margin-left: 8px; gap: 4px;">
                            <v-chip
                              v-if="location.isBestOa"
                              color="success"
                              size="small"
                            >
                              Best Open
                            </v-chip>
                            <v-chip
                              v-else-if="location.is_oa"
                              color="success"
                              size="small"
                            >
                              Open
                            </v-chip>
                            <v-chip
                              v-if="location.isPrimary"
                              color="primary"
                              size="small"
                            >
                              Primary
                            </v-chip>
                          </div>
                        </v-card-title>
                        <v-divider />
                        <v-card-text style="flex: 1;">
                          <div class="text-body-1 mb-2">
                            <strong>Landing page:</strong>
                            <a v-if="location.landing_page_url" :href="location.landing_page_url" target="_blank" class="ml-1">
                              {{ formatUrl(location.landing_page_url) }}
                              <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                            </a>
                            <span v-else class="ml-1 text-grey">none</span>
                          </div>
                          
                          <div class="text-body-1 mb-2">
                            <strong>PDF:</strong>
                            <a v-if="location.pdf_url" :href="location.pdf_url" target="_blank" class="ml-1">
                              {{ formatUrl(location.pdf_url) }}
                              <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
                            </a>
                            <span v-else class="ml-1 text-grey">none</span>
                          </div>
                          
                          <div class="text-body-1 mb-2">
                            <strong>License:</strong>
                            <span v-if="location.license" class="ml-1">{{ location.license }}</span>
                            <span v-else class="ml-1 text-grey">none</span>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-if="showEntityPageStats" cols="12" md="7">
          <v-card flat class="rounded-o py-6">
            <entity-new
              :data="entityData"
            />
          </v-card>

          <v-card flat class="rounded-o mt-3">
            <v-toolbar flat color="white" class="entity-page-section-title">
              <template #prepend>
                <v-icon variant="text" color="grey-darken-2" start>mdi-file-document-outline</v-icon>
              </template>
              <v-toolbar-title class="font-weight-bold">
                Top works
              </v-toolbar-title>
              <v-spacer/>
              <v-btn color="primary" rounded variant="text" @click="viewMyWorks">
                View all
              </v-btn>
            </v-toolbar>
            <v-list>
              <serp-results-list-item
                  v-for="result in worksResultObject.results"
                  :key="result.id"
                  :result="result"
              />
            </v-list>
          </v-card>
        </v-col>

        <v-col v-else cols="12">
          <v-card flat class="rounded-o py-6">
            <entity-new
              :data="entityData"
            />
          </v-card>
        </v-col>

        <v-col v-if="showEntityPageStats" cols="12" md="5">
          <v-card flat class="rounded-o px-2 pb-3">
            <v-toolbar flat color="white" class="entity-page-section-title">
              <template #prepend>
                <v-icon variant="text" color="grey-darken-2" start>mdi-clipboard-outline</v-icon>
              </template>
              <v-toolbar-title class="font-weight-bold">
                Key stats
              </v-toolbar-title>
              <v-spacer/>
            </v-toolbar>
            <group-by
              v-for="groupByKey in groupByKeys"
              :key="groupByKey"
              :filter-key="groupByKey"
              :filter-by="[myWorksFilter]"
              entity-type="works"
              :is-entity-page="true"
              class="mb-3"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

import { api } from '@/api';
import { url } from '@/url';
import { getEntityConfig } from '@/entityConfigs';
import { createSimpleFilter, filtersAsUrlStr } from '@/filterConfigs';

import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import GroupBy from '@/components/GroupBy/GroupBy.vue';

defineOptions({ name: 'EntityPage' });

const store = useStore();
const route = useRoute();

const entityData = ref(null);
const myEntityType = ref(null);
const worksResultObject = ref({});
const activeTab = ref('details');

const myEntityConfig = computed(() => getEntityConfig(myEntityType.value));

const myWorksFilter = computed(() =>
  createSimpleFilter('works', myEntityConfig.value.filterKey, route.params.entityId)
);

const apiPath = computed(() => `${route.params.entityType}/${route.params.entityId}`);

const groupByKeys = [
  'publication_year',
  'open_access.is_oa',
  'primary_topic.id',
  'type'
];

const showEntityPageStats = computed(() => store.state.showEntityPageStats);

const allLocations = computed(() => {
  if (!entityData.value || myEntityType.value !== 'works') return [];
  
  const locations = [];
  const work = entityData.value;
  
  // Collect all unique locations
  const locationSet = new Set();
  
  // Add primary location
  if (work.primary_location) {
    locationSet.add(JSON.stringify(work.primary_location));
  }
  
  // Add best OA location
  if (work.best_oa_location) {
    locationSet.add(JSON.stringify(work.best_oa_location));
  }
  
  // Add other locations
  if (work.locations && Array.isArray(work.locations)) {
    work.locations.forEach(loc => {
      locationSet.add(JSON.stringify(loc));
    });
  }
  
  // Convert back to objects and mark special ones
  locationSet.forEach(locStr => {
    const location = JSON.parse(locStr);
    locations.push({
      ...location,
      isPrimary: work.primary_location && JSON.stringify(work.primary_location) === locStr,
      isBestOa: work.best_oa_location && JSON.stringify(work.best_oa_location) === locStr
    });
  });
  
  return locations;
});

const formatSourceName = (name) => {
  if (!name) return 'Unknown Source';
  
  // Remove content in parentheses
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

const formatUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // If no path or just '/', return hostname only
    if (pathname === '/') {
      return hostname;
    }
    
    // Get first path segment (everything up to second slash)
    const pathParts = pathname.split('/').filter(p => p); // Remove empty strings
    const firstSegment = pathParts[0] || '';
    
    // Check if there's more after the first segment
    const hasMore = pathParts.length > 1 || urlObj.search || urlObj.hash;
    
    return hasMore ? `${hostname}/${firstSegment}...` : `${hostname}/${firstSegment}`;
  } catch (e) {
    // If URL parsing fails, just remove protocol manually
    const withoutProtocol = url.replace(/^https?:\/\//, '');
    const firstSlash = withoutProtocol.indexOf('/');
    
    if (firstSlash === -1) {
      return withoutProtocol;
    }
    
    const afterFirstSlash = withoutProtocol.substring(firstSlash + 1);
    const secondSlash = afterFirstSlash.indexOf('/');
    
    if (secondSlash === -1) {
      return withoutProtocol;
    }
    
    return withoutProtocol.substring(0, firstSlash + secondSlash + 1) + '...';
  }
};

const getEntityData = async () => {
  store.state.isLoading = true;
  entityData.value = await api.get(apiPath.value);
  store.state.isLoading = false;
};

const getWorks = async () => {
  worksResultObject.value = {};
  if (myEntityType.value === 'works') return;
  if (!myEntityConfig.value) return;
  if (!showEntityPageStats.value) return; // Skip fetching if stats are hidden

  const filterString = filtersAsUrlStr([myWorksFilter.value]);
  const apiUrl = api.makeUrl('works', {
    filter: filterString,
    sort: 'cited_by_count:desc',
    'per-page': 7
  }, true);

  //console.log('getWorks() calling this url', apiUrl);
  const resp = await api.getResultsList(apiUrl);
  //console.log('getWorks() got response back', resp);
  worksResultObject.value = resp;
};

const viewMyWorks = () => {
  console.log(myWorksFilter.value);
  return url.pushNewFilters([myWorksFilter.value], 'works');
};

useHead(() => ({
  title: entityData.value?.display_name
}));

onMounted(() => {
  console.log('EntityPage mounted', route.params.entityType, route.params.entityId);
  store.state.entityType = route.params.entityType;
});

watch(apiPath, async () => {
  myEntityType.value = route.params.entityType;
  await getEntityData();
  await getWorks();
}, { immediate: true });
</script>


<style lang="scss">
.entity-page-section-title .v-toolbar__content {
  margin-inline-start: 0px !important;
  padding: 4px 12px !important;
}
.entity-page-section-title .v-toolbar-title {
  margin-inline-start: 0px !important;
}
.entity-page  .v-list .v-list-item--active {
  color: #1976d2; // primary
}
.entity-page .text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>