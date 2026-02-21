<template>
  <v-container fluid class="pt-0">
    <div v-if="newSearchEnabled" class="d-flex justify-center mb-4 mt-2">
      <search-box style="max-width: 800px; width: 100%;" />
    </div>
    <serp-toolbar :results-object="resultsObject"/>
    <filter-list class="mb-6 mt-0"/>
    <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

    <v-row v-if="mdAndUp">
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

          <v-card variant="outlined">
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
const resultsTab = ref('results');
</script>
