<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container fluid class="pt-0">
      <serp-toolbar :results-object="resultsObject"/>
      <filter-list class="mb-6 mt-3"/>
      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <v-row v-if="!$vuetify.display.mobile">
        <v-col
          cols="6"
          xl="4"
          v-if="url.isViewSet($route, 'list')"
        >
          <serp-results-list :results-object="resultsObject"/>
        </v-col>
        <v-col
          class="flex-grow-1"
          v-if="url.isViewSet($route, 'report')"
        >
          <group-by-views :results-object="resultsObject"/>
        </v-col>
      </v-row>

      <template v-else>
        <v-row class="mb-12">
          <v-col>
            <v-tabs
              v-model="resultsTab"
              bg-color="transparent"
              color="primary"
              grow
              class="px-3"
            >
              <v-tab value="results" class="text-uppercase">Results</v-tab>
              <v-tab value="stats" class="text-uppercase">Stats</v-tab>
            </v-tabs>

            <v-card rounded flat class="rounded-o">
              <div v-if="resultsTab === 'results'">
                <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject"/>
              </div>
              <div v-if="resultsTab === 'stats'">
                <group-by-views :results-object="resultsObject" />
              </div>
            </v-card>

          </v-col>
        </v-row>
      </template>
    </v-container>
  </div>
</template>

<script setup>
import _ from 'lodash';
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

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

// Data
const resultsFilters = ref([]);
const resultsObject = ref(null);

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