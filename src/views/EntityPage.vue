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
        :entity-type="myEntityType"
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
                    :type="myEntityType"
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
                      xl="4"
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
                          <div class="d-flex flex-wrap align-center" style="margin-left: 8px; gap: 4px;">
                            <v-icon
                              v-if="location.isPrimary"
                              color="primary"
                              size="small"
                            >
                              mdi-check-decagram
                            </v-icon>
                            <v-tooltip v-if="location.isBestOa" text="best open location: the most complete available fulltext is here">
                              <template #activator="{ props }">
                                <v-icon
                                  v-bind="props"
                                  color="black"
                                  size="small"
                                >
                                  mdi-lock-open-variant
                                </v-icon>
                              </template>
                            </v-tooltip>
                            <v-tooltip v-else-if="location.is_oa" text="open location: fulltext available here">
                              <template #activator="{ props }">
                                <v-icon
                                  v-bind="props"
                                  color="black"
                                  size="small"
                                >
                                  mdi-lock-open-variant-outline
                                </v-icon>
                              </template>
                            </v-tooltip>
                            <v-tooltip v-else text="closed location: fulltext not freely available here">
                              <template #activator="{ props }">
                                <v-icon
                                  v-bind="props"
                                  color="grey"
                                  size="small"
                                >
                                  mdi-lock-outline
                                </v-icon>
                              </template>
                            </v-tooltip>
                            <v-btn
                              v-if="location.id"
                              icon
                              variant="text"
                              size="small"
                              :to="`/locations/${location.id.replace('https://openalex.org/', '')}`"
                            >
                              <v-icon>mdi-link</v-icon>
                            </v-btn>
                          </div>
                        </v-card-title>
                        <v-divider />
                        <v-card-text style="flex: 1;">
                          <div class="text-body-1 mb-2">
                            <strong>Landing page:</strong>
                            <a v-if="location.landing_page_url" :href="location.landing_page_url" target="_blank" class="ml-1">
                              {{ formatUrl(location.landing_page_url) }}
                              <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
                            </a>
                            <span v-else class="ml-1 text-grey">none</span>
                          </div>
                          
                          <div class="text-body-1 mb-2">
                            <strong>PDF:</strong>
                            <a v-if="location.pdf_url" :href="location.pdf_url" target="_blank" class="ml-1">
                              {{ formatUrl(location.pdf_url) }}
                              <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
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
              :type="myEntityType"
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
              :type="myEntityType"
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
import { useRoute, useRouter } from 'vue-router';
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
const router = useRouter();

const entityData = ref(null);
const myEntityType = ref(route.params.entityType);
const worksResultObject = ref({});
const activeTab = ref(route.query.tab === 'locations' ? 'locations' : 'details');

const myEntityConfig = computed(() => myEntityType.value ? getEntityConfig(myEntityType.value) : null);

const myWorksFilter = computed(() => {
  if (!myEntityConfig.value) return null;
  return createSimpleFilter('works', myEntityConfig.value.filterKey, route.params.entityId);
});

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
  
  console.log('allLocations:', locations);
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
    return urlObj.hostname;
  } catch (e) {
    // If URL parsing fails, just remove protocol manually
    const withoutProtocol = url.replace(/^https?:\/\//, '');
    const firstSlash = withoutProtocol.indexOf('/');
    
    if (firstSlash === -1) {
      return withoutProtocol;
    }
    
    return withoutProtocol.substring(0, firstSlash);
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

// Sync activeTab to URL query parameter
watch(activeTab, (newTab) => {
  if (newTab === 'locations') {
    // Add tab query parameter for locations
    router.replace({ query: { ...route.query, tab: 'locations' } });
  } else {
    // Remove tab query parameter for details (default)
    const query = { ...route.query };
    delete query.tab;
    router.replace({ query });
  }
});

// Update activeTab when URL changes
watch(() => route.query.tab, (newTab) => {
  if (newTab === 'locations') {
    activeTab.value = 'locations';
  } else {
    activeTab.value = 'details';
  }
});
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