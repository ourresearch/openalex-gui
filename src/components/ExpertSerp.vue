<template>
  <v-container fluid class="pt-0">
    <!-- Desktop two-column layout (newSearch enabled) -->
    <template v-if="newSearchEnabled && mdAndUp">
      <serp-right-toolbar :results-object="resultsObject" style="margin-top: 14px; margin-bottom: 6px;" />
      <v-row>
        <v-col cols="6">
          <search-box style="width: 100%;" class="mb-4" />
          <filter-list class="mt-0 mb-6" />
          <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6" />
          <serp-results-list v-if="url.isViewSet($route, 'list')" :results-object="resultsObject" hide-export />
        </v-col>
        <v-col cols="6">
          <template v-if="isSemanticSearch">
            <v-card variant="outlined" class="bg-white pa-4 text-medium-emphasis text-body-2 d-flex align-center">
              <v-icon size="18" class="mr-2">mdi-information-outline</v-icon>
              Semantic search does not support group by.
            </v-card>
          </template>
          <group-by-views v-else-if="url.isViewSet($route, 'report')" :results-object="resultsObject" hide-toolbar hide-results-count hide-more />
        </v-col>
      </v-row>
    </template>

    <!-- Fallback: stacked layout (mobile or non-newSearch) -->
    <template v-else>
      <div v-if="newSearchEnabled" class="d-flex justify-center mb-4 mt-2">
        <search-box style="max-width: 800px; width: 100%;" />
      </div>
      <serp-toolbar :results-object="resultsObject"/>
      <filter-list class="mb-6 mt-0"/>
      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <v-row v-if="mdAndUp">
        <v-col cols="6" xl="4" v-if="url.isViewSet($route, 'list')">
          <serp-results-list :results-object="resultsObject"/>
        </v-col>
        <v-col class="flex-grow-1" v-if="url.isViewSet($route, 'report') && !isSemanticSearch">
          <group-by-views :results-object="resultsObject"/>
        </v-col>
      </v-row>

      <v-row v-else class="mb-12">
        <v-col>
          <template v-if="isSemanticSearch">
            <v-card variant="outlined" class="bg-white pa-4 text-medium-emphasis text-body-2 d-flex align-center">
              <v-icon size="18" class="mr-2">mdi-information-outline</v-icon>
              Semantic search does not support group by.
            </v-card>
          </template>
          <template v-else>
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

            <v-card variant="outlined">
              <div v-if="resultsTab === 'results'">
                <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject"/>
              </div>
              <div v-if="resultsTab === 'stats'">
                <group-by-views :results-object="resultsObject" />
              </div>
            </v-card>
          </template>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';

import { url } from '@/url';

import SerpResultsList from '@/components/SerpResultsList.vue';
import GroupByViews from '@/components/GroupByViews.vue';
import FilterList from '@/components/Filter/FilterList.vue';
import SerpToolbar from '@/components/SerpToolbar/SerpToolbar.vue';
import SerpRightToolbar from '@/components/SerpRightToolbar.vue';
import SerpApiEditor from '@/components/SerpApiEditor.vue';
import SearchBox from '@/components/SearchBox.vue';

defineOptions({ name: 'ExpertSerp' });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const { mdAndUp } = useDisplay();

const newSearchEnabled = computed(() => store.getters.featureFlags.newSearch);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);
const resultsTab = ref('results');
</script>
