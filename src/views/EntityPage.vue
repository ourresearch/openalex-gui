<template>
  <div style="min-height: 80vh">
    <v-container v-if="entityData" class="entity-page">
      <div>
        <v-btn
          color="primary"
          size="small"
          density="compact"
          variant="text"
          class="my-2 px-2"
          @click="$router.back()"
        >
          <v-icon size="small" start>mdi-arrow-left</v-icon>
          back
        </v-btn>
      </div>
      <entity-header
        :entity-data="entityData"
        :entity-type="myEntityType"
        class="mb-4"
      >
        <template v-if="authorCurationEnabled && isAuthorOwner" #after-title>
          <AuthorDisplayNameEditor
            :current-display-name="entityData.display_name"
            :is-owner="isAuthorOwner"
            @update-name="handleDisplayNameUpdate"
          />
        </template>
      </entity-header>

      <v-row v-if="myEntityType === 'works'">
        <v-col>
          <v-card variant="outlined" rounded class="bg-white">
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

      <!-- Generic entity page (non-works) -->
      <v-row v-else>
        <v-col v-if="showEntityPageStats" cols="12" md="7">
          <v-card variant="outlined" class="rounded-o py-6 bg-white">
            <entity-new
              :data="entityData"
              :type="myEntityType"
            />
          </v-card>

          <v-card variant="outlined" class="rounded-o mt-3 bg-white">
            <selection-toolbar>
              <template #trailing>
                <v-spacer/>
                <template v-if="isAuthorOwner">
                  <v-tooltip location="bottom" text="Remove works">
                    <template v-slot:activator="{ props: rmProps }">
                      <v-btn
                        v-bind="rmProps"
                        variant="text"
                        icon
                        class="oa-cur-iconbtn"
                        :color="worksCuration.canRemove.value ? 'error' : undefined"
                        :disabled="!worksCuration.canRemove.value"
                        aria-label="Remove works"
                        @click="worksCuration.removeSelected()"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-menu v-model="addMenuOpen" location="bottom end">
                    <template v-slot:activator="{ props: menuProps }">
                      <v-tooltip location="bottom" text="Add works" :disabled="addMenuOpen">
                        <template v-slot:activator="{ props: addTip }">
                          <v-btn
                            v-bind="mergeProps(menuProps, addTip)"
                            variant="text"
                            icon
                            color="success"
                            aria-label="Add works"
                          >
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                    </template>
                    <v-list density="compact">
                      <v-list-item title="Add from search" @click="worksCuration.openSearch()" />
                      <v-list-item title="Add from CV" @click="worksCuration.openCv()" />
                    </v-list>
                  </v-menu>
                </template>
                <v-tooltip location="bottom" text="View as search filter">
                  <template v-slot:activator="{ props: tipProps }">
                    <v-btn
                      v-bind="tipProps"
                      variant="plain"
                      icon
                      aria-label="View as search filter"
                      @click="viewMyWorks"
                    >
                      <v-icon>mdi-filter-variant</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
              </template>
            </selection-toolbar>

            <div v-if="isAuthorOwner && worksCuration.pendingAdditions.value.length">
              <div class="px-4 pt-3 pb-1 text-caption text-medium-emphasis font-weight-medium">
                Pending additions
              </div>
              <div
                v-for="(item, idx) in worksCuration.pendingAdditions.value"
                :key="item.work.id"
                class="oa-cur-row"
              >
                <div class="oa-cur-body">
                  <serp-results-list-item :result="item.work" />
                </div>
                <div class="oa-cur-badge">
                  <v-chip size="x-small" color="success" variant="flat" label>
                    addition pending
                  </v-chip>
                  <v-btn variant="text" size="x-small" class="ml-1" @click="worksCuration.undoAddition(idx)">
                    Undo
                  </v-btn>
                </div>
              </div>
              <v-divider />
            </div>

            <div v-if="isAuthorOwner">
              <div
                v-for="result in worksResultObject.results"
                :key="result.id"
                class="oa-cur-row"
                :class="{ 'oa-cur-pending': worksCuration.isPendingRemoval(result.id) }"
              >
                <div class="oa-cur-body">
                  <serp-results-list-item :result="result" />
                </div>
                <div v-if="worksCuration.isPendingRemoval(result.id)" class="oa-cur-badge">
                  <v-chip size="x-small" color="error" variant="flat" label>
                    removal pending
                  </v-chip>
                  <v-btn variant="text" size="x-small" class="ml-1" @click="worksCuration.undoRemoval(result.id)">
                    Undo
                  </v-btn>
                </div>
              </div>
            </div>
            <div v-else>
              <serp-results-list-item
                  v-for="result in worksResultObject.results"
                  :key="result.id"
                  :result="result"
              />
            </div>

            <div v-if="hasMoreWorks" class="pa-3 text-center">
              <v-btn
                variant="text"
                rounded
                size="small"
                color="primary"
                :loading="worksLoadingMore"
                @click="showMoreWorks"
              >
                Show more works
              </v-btn>
            </div>

            <template v-if="isAuthorOwner">
              <AddWorksModal
                v-model="worksCuration.searchOpen.value"
                mode="search"
                :author-name="entityData.display_name"
                :author-id="entityData.id"
                @add-work="worksCuration.onAddWork"
              />
              <AddWorksModal
                v-model="worksCuration.cvOpen.value"
                mode="cv"
                :author-name="entityData.display_name"
                :author-id="entityData.id"
                @add-work="worksCuration.onAddWork"
              />
            </template>
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
          <v-card flat class="rounded-o px-2 pt-4 pb-3">
            <entity-metrics
              :data="entityData"
              :type="myEntityType"
              class="entity-metrics-block mb-3 pb-3"
            />
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
import { ref, computed, watch, onMounted, mergeProps } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import { api } from '@/api';
import { url } from '@/url';
import { getEntityConfig } from '@/entityConfigs';
import { createSimpleFilter, filtersAsUrlStr } from '@/filterConfigs';

import EntityNew from '@/components/Entity/EntityNew.vue';
import EntityHeader from '@/components/Entity/EntityHeader.vue';
import EntityMetrics from '@/components/Entity/EntityMetrics.vue';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';
import SelectionToolbar from '@/components/SelectionToolbar.vue';
import GroupBy from '@/components/GroupBy/GroupBy.vue';
import { useSelectionContext } from '@/composables/useSelectionContext';

// Author curation components (feature-flagged display-name editors only)
import AuthorDisplayNameEditor from '@/components/AuthorCuration/AuthorDisplayNameEditor.vue';
import AddWorksModal from '@/components/AuthorCuration/AddWorksModal.vue';
import { useAuthorWorksCuration } from '@/composables/useAuthorWorksCuration';

defineOptions({ name: 'EntityPage' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const entityData = ref(null);
const myEntityType = ref(route.params.entityType);
const worksResultObject = ref({});
const worksPage = ref(1);
const worksLoadingMore = ref(false);
const activeTab = ref(route.query.tab === 'locations' ? 'locations' : 'details');

const WORKS_PER_PAGE = 25;

const hasMoreWorks = computed(() => {
  const loaded = worksResultObject.value.results?.length || 0;
  const total = worksResultObject.value.meta?.count || 0;
  return loaded > 0 && loaded < total;
});

const myEntityConfig = computed(() => myEntityType.value ? getEntityConfig(myEntityType.value) : null);

const myWorksFilter = computed(() => {
  if (!myEntityConfig.value) return null;
  // For repository sources, use locations.source.id to show all works
  // where this repo appears in any location (not just primary)
  const isRepository = myEntityType.value === 'sources' && entityData.value?.type === 'repository';
  const filterKey = isRepository ? 'locations.source.id' : myEntityConfig.value.filterKey;
  return createSimpleFilter('works', filterKey, route.params.entityId);
});

const apiPath = computed(() => `${route.params.entityType}/${route.params.entityId}`);

const groupByKeys = computed(() => {
  if (myEntityType.value === 'awards') {
    return ['publication_year', 'primary_topic.id'];
  }
  return ['publication_year', 'primary_topic.id', 'type'];
});

const isAward = computed(() => myEntityType.value === 'awards');

const showEntityPageStats = computed(() => store.state.showEntityPageStats);

// Author curation computed properties
const isAuthor = computed(() => myEntityType.value === 'authors');
const authorCurationEnabled = computed(() => !!store.getters.featureFlags?.author_curation);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const isAuthorOwner = computed(() => {
  if (!authorCurationEnabled.value) return false;
  if (!isAuthor.value || !userAuthorId.value || !entityData.value?.id) return false;
  const normalize = (id) => (String(id || '').match(/A\d+/i) || [''])[0].toUpperCase();
  const a = normalize(userAuthorId.value);
  return !!a && a === normalize(entityData.value.id);
});

// Owner-only add/remove-works curation, layered on the existing works list
// and the shared selection store. oxjob #187.
const addMenuOpen = ref(false);
const worksCuration = useAuthorWorksCuration({
  authorId: computed(() => (isAuthorOwner.value ? entityData.value?.id || '' : '')),
  authorName: computed(() => entityData.value?.display_name || ''),
  works: computed(() => worksResultObject.value.results || []),
});
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

const fetchWorksPage = async (page) => {
  if (myEntityType.value === 'works') return null;
  if (!myEntityConfig.value) return null;
  if (!showEntityPageStats.value) return null;

  const filterString = filtersAsUrlStr([myWorksFilter.value]);
  // For awards, sort by publication year (most recent funded works first)
  // For other entities, sort by citation count (most cited works first)
  const sortOrder = isAward.value ? 'publication_year:desc' : 'cited_by_count:desc';
  const apiUrl = api.makeUrl('works', {
    filter: filterString,
    sort: sortOrder,
    'per-page': WORKS_PER_PAGE,
    page,
  }, true);

  return api.getResultsList(apiUrl);
};

const getWorks = async () => {
  worksResultObject.value = {};
  worksPage.value = 1;
  const resp = await fetchWorksPage(1);
  if (resp) worksResultObject.value = resp;
};

const showMoreWorks = async () => {
  if (worksLoadingMore.value || !hasMoreWorks.value) return;
  worksLoadingMore.value = true;
  try {
    const nextPage = worksPage.value + 1;
    const resp = await fetchWorksPage(nextPage);
    if (resp?.results?.length) {
      worksResultObject.value = {
        ...resp,
        results: [...(worksResultObject.value.results || []), ...resp.results],
      };
      worksPage.value = nextPage;
    }
  } finally {
    worksLoadingMore.value = false;
  }
};

const viewMyWorks = () => {
  console.log(myWorksFilter.value);
  return url.pushNewFilters([myWorksFilter.value], 'works');
};

// Author curation handlers (oxjob #187)
const handleDisplayNameUpdate = async (newName) => {
  try {
    await store.dispatch('user/submitAuthorCurations', [{
      entity: 'authors',
      entity_id: entityData.value.id,
      property: 'display_name',
      action: 'replace',
      value: newName,
    }]);
    store.commit('snackbar', `Display name change to "${newName}" submitted. It should appear within 24 hours.`);
  } catch (e) {
    store.commit('snackbar', e.message);
  }
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

useSelectionContext(() => worksResultObject.value);
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
.entity-page .entity-metrics-block {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.entity-page .oa-cur-row {
  display: flex;
  align-items: flex-start;
}
.entity-page .oa-cur-body {
  flex: 1 1 auto;
  min-width: 0;
}
.entity-page .oa-cur-badge {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 12px 12px 0 4px;
  white-space: nowrap;
}
.entity-page .oa-cur-pending {
  opacity: 0.55;
}
.entity-page .oa-cur-iconbtn.v-btn--disabled {
  background: transparent !important;
}
.entity-page .oa-cur-iconbtn.v-btn--disabled .v-btn__overlay,
.entity-page .oa-cur-iconbtn.v-btn--disabled .v-btn__underlay {
  opacity: 0 !important;
}
</style>