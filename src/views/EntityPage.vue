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
          <v-card flat rounded class="py-6">
            <entity-new
              :data="entityData"
            />
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
</style>