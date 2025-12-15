<template>
  <div style="min-height: 80vh">
    <div class="container mx-auto px-4 pt-0">
      <serp-toolbar :results-object="resultsObject"/>
      <filter-list class="mb-6 mt-0"/>
      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <div v-if="mdAndUp" class="grid grid-cols-12 gap-4">
        <div
          class="col-span-6 xl:col-span-4"
          v-if="url.isViewSet($route, 'list')"
        >
          <serp-results-list :results-object="resultsObject"/>
        </div>
        <div
          class="flex-grow col-span-6 xl:col-span-8"
          v-if="url.isViewSet($route, 'report')"
        >
          <group-by-views :results-object="resultsObject"/>
        </div>
      </div>

      <template v-else>
        <div class="mb-12">
          <Tabs v-model="resultsTab" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="results" class="uppercase">Results</TabsTrigger>
              <TabsTrigger value="stats" class="uppercase">Stats</TabsTrigger>
            </TabsList>

            <Card class="mt-2">
              <TabsContent value="results">
                <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject"/>
              </TabsContent>
              <TabsContent value="stats">
                <group-by-views :results-object="resultsObject" />
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

import { useBreakpoints } from '@/composables/useBreakpoints';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

import { url } from '@/url';
import { api } from '@/api';
import { entityConfigs } from '@/entityConfigs';
import { filtersFromUrlStr } from '@/filterConfigs';

import SerpResultsList from '@/components/SerpResultsList.vue';
import GroupByViews from '@/components/GroupByViews.vue';
import FilterList from '@/components/Filter/FilterList.vue';
import SerpToolbar from '@/components/SerpToolbar/SerpToolbar.vue';
import SerpApiEditor from '@/components/SerpApiEditor.vue';

defineOptions({ name: 'Serp' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const { mdAndUp } = useBreakpoints();

// Data
const resultsFilters = ref([]);
const resultsObject = ref(null);
const resultsTab = ref('results');

const selectedEntityType = computed(() => route.params.entityType);
const selectedEntityTypeConfig = computed(() => entityConfigs[selectedEntityType.value]);

useHead({
  title: _.capitalize(selectedEntityTypeConfig.value.displayName) + ' search',
});

const userId = computed(() => store.getters['user/userId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);

watch(
  () => route.params.entityType,
  (to) => {
    store.state.entityType = to;
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  async () => {
    if (
      route.query.id &&
      !userSavedSearches.value.find((s) => s.id === route.query.id)
    ) {
      url.pushToRoute(router, {
        name: 'Serp',
        query: { ...route.query, id: undefined },
      });
      return;
    }

    if (userId.value) {
      store.commit('user/setActiveSearchId', route.query.id);
    }

    const apiQuery = url.makeApiUrl(route);
    store.state.isLoading = true;
    const resp = await api.getResultsList(apiQuery);
    store.state.isLoading = false;
    resultsObject.value = resp;
    store.state.resultsObject = resp;

    resultsFilters.value = filtersFromUrlStr(
      selectedEntityType.value,
      route.query.filter
    );

    window.scroll(0, 0);
  },
  { immediate: true }
);
</script>


<style lang="scss">
.v-pagination__item, .v-pagination__navigation {
  box-shadow: none;
}
table.serp-results-table {
  border-collapse: collapse;

  tr {
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, .05)
    }
  }

  td {
    border: none;
    margin: 0;
    padding: 5px 10px;

    &.range {
      text-align: right;
      //font-family: Monaco, Menlo, Consolas, Bitstream Vera Sans Mono, monospace;
    }

    &.boolean {
      text-align: center;
    }
  }

}
</style>