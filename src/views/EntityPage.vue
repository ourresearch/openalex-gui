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
                        <v-card-text class="py-4">
                          <!-- Use EntityNew component to show all location fields -->
                          <entity-new
                            :data="location"
                            type="locations"
                          />
                        </v-card-text>
                        
                        <!-- Chips at bottom -->
                        <v-card-actions v-if="location.isPrimary || location.isBestOa" class="d-flex justify-end">
                          <v-chip
                            v-if="location.isPrimary"
                            size="x-small"
                            variant="outlined"
                            class="mr-1"
                          >
                            primary
                          </v-chip>
                          <v-chip
                            v-if="location.isBestOa"
                            size="x-small"
                            variant="outlined"
                          >
                            best oa
                          </v-chip>
                        </v-card-actions>
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
  
  const work = entityData.value;
  
  // Helper function to create a unique key for location comparison
  const getLocationKey = (loc) => {
    if (!loc) return null;
    // Use landing_page_url as unique identifier, or fallback to stringified object
    return loc.landing_page_url || JSON.stringify(loc);
  };
  
  // Just use the locations array (which already contains primary and best OA)
  // and mark which ones are special
  const locations = [];
  const primaryKey = getLocationKey(work.primary_location);
  const bestOaKey = getLocationKey(work.best_oa_location);
  
  if (work.locations && Array.isArray(work.locations)) {
    work.locations.forEach(loc => {
      const locKey = getLocationKey(loc);
      locations.push({
        ...loc,
        isPrimary: locKey === primaryKey,
        isBestOa: locKey === bestOaKey
      });
    });
  }
  
  console.log('allLocations:', locations);
  return locations;
});

const getEntityData = async () => {
  store.state.isLoading = true;
  // Clear old data first to prevent mixing location and work data
  entityData.value = null;
  
  const data = await api.get(apiPath.value);
  
  // For locations, massage the data to create entity objects for better rendering
  if (myEntityType.value === 'locations' && data) {
    // Add the id field from the route params
    if (!data.id) {
      data.id = route.params.entityId;
    }
    
    // Transform source_name + source_id into a source object
    if (data.source_id && data.source_name) {
      data.source = {
        id: data.source_id,
        display_name: data.source_name
      };
    }
    
    // Transform work_id into a work object
    if (data.work_id) {
      const shortId = data.work_id.replace('https://openalex.org/', '');
      data.work = {
        id: data.work_id,
        display_name: shortId // Show as "works/W12345" format
      };
    }
  }
  
  entityData.value = data;
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