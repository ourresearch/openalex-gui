<template>
  <div class="min-h-[80vh]">
    <div v-if="entityData" class="container mx-auto px-4 entity-page">
      <div>
        <Button
          variant="ghost"
          class="my-2"
          @click="$router.back()"
        >
          <ArrowLeft class="h-4 w-4 mr-1" />
          back
        </Button>
      </div>
      <entity-header
        :entity-data="entityData"
        :entity-type="myEntityType"
        class="mb-4"
      />

      <div v-if="myEntityType === 'works'" class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <Card class="border bg-white">
            <Tabs v-model="activeTab" class="w-full">
              <TabsList class="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                <TabsTrigger value="details" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">Details</TabsTrigger>
                <TabsTrigger value="locations" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">Locations</TabsTrigger>
              </TabsList>

              <TabsContent value="details" class="py-6">
                <entity-new
                  :data="entityData"
                  :type="myEntityType"
                />
              </TabsContent>

              <TabsContent value="locations" class="p-6">
                <Alert v-if="allLocations.length === 0">
                  <Info class="h-4 w-4" />
                  <AlertDescription>No locations available for this work.</AlertDescription>
                </Alert>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Card
                    v-for="(location, index) in allLocations"
                    :key="index"
                    class="border flex flex-col"
                  >
                    <CardContent class="py-4 flex-1">
                      <entity-new
                        :data="location"
                        type="locations"
                      />
                    </CardContent>
                    
                    <div v-if="location.isPrimary || location.isBestOa" class="flex justify-end p-2 gap-1">
                      <Badge
                        v-if="location.isPrimary"
                        variant="outline"
                        class="text-xs"
                      >
                        primary
                      </Badge>
                      <Badge
                        v-if="location.isBestOa"
                        variant="outline"
                        class="text-xs"
                      >
                        best oa
                      </Badge>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <div v-else class="grid grid-cols-12 gap-4">
        <div v-if="showEntityPageStats" class="col-span-12 md:col-span-7">
          <Card class="border py-6 bg-white">
            <entity-new
              :data="entityData"
              :type="myEntityType"
            />
          </Card>

          <Card class="border mt-3 bg-white">
            <div class="flex items-center justify-between px-4 py-3 border-b">
              <div class="flex items-center gap-2">
                <FileText class="h-5 w-5 text-muted-foreground" />
                <span class="font-bold">{{ isAward ? 'Funded works' : 'Top works' }}</span>
              </div>
              <Button variant="ghost" @click="viewMyWorks">
                View all {{ worksResultObject.meta?.count ? `(${filters.toPrecision(worksResultObject.meta.count)})` : '' }}
              </Button>
            </div>
            <div>
              <serp-results-list-item
                  v-for="result in worksResultObject.results"
                  :key="result.id"
                  :result="result"
              />
            </div>
          </Card>
        </div>

        <div v-else class="col-span-12">
          <Card class="py-6">
            <entity-new
              :data="entityData"
              :type="myEntityType"
            />
          </Card>
        </div>

        <div v-if="showEntityPageStats" class="col-span-12 md:col-span-5">
          <Card class="px-2 pb-3">
            <div class="flex items-center gap-2 px-4 py-3">
              <ClipboardList class="h-5 w-5 text-muted-foreground" />
              <span class="font-bold">{{ isAward ? 'Funded works stats' : 'Key stats' }}</span>
            </div>
            <group-by
              v-for="groupByKey in groupByKeys"
              :key="groupByKey"
              :filter-key="groupByKey"
              :filter-by="[myWorksFilter]"
              entity-type="works"
              :is-entity-page="true"
              class="mb-3"
            />
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import { ArrowLeft, FileText, ClipboardList, Info } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { api } from '@/api';
import { url } from '@/url';
import filters from '@/filters';
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

const groupByKeys = computed(() => {
  if (myEntityType.value === 'awards') {
    return ['publication_year', 'open_access.is_oa', 'primary_topic.id'];
  }
  return ['publication_year', 'open_access.is_oa', 'primary_topic.id', 'type'];
});

const isAward = computed(() => myEntityType.value === 'awards');

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
  // For awards, sort by publication year (most recent funded works first)
  // For other entities, sort by citation count (most cited works first)
  const sortOrder = isAward.value ? 'publication_year:desc' : 'cited_by_count:desc';
  const apiUrl = api.makeUrl('works', {
    filter: filterString,
    sort: sortOrder,
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


<style scoped>
/* Styles handled via Tailwind classes */
</style>