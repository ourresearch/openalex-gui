<template>
  <div class="py-7">
    <v-container fluid :class="['results-box', `ui-${uiVariant}`]">
      <v-row>
        <!-- Top Panel / Query Builder -->
        <v-col cols="12" class="query-builder py-0 px-6">
          <query-builder />
        </v-col>

        <!-- Results Table -->
        <v-col cols="12 pt-0 px-6">
          <v-card flat rounded class="results-table-box" style="min-height: 100%;">
            <results-table />
          </v-card>
        </v-col>

      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { getLabelsInQuery } from '@/query';
import { DISABLE_SERVER_CACHE } from '@/apiConfig';

import ResultsTable from '@/components/Results/ResultsTable.vue';
import QueryBuilder from '@/components/Query/QueryBuilder.vue';

defineOptions({ name: 'ResultsPage' });

const route = useRoute();
const store = useStore();

const pollCount = ref(0);
const pollTimer = ref(null);

const isInitialLoad      = computed(() => store.state.isInitialLoad);
const queryIsCompleted   = computed(() => store.getters['search/queryIsCompleted']);
const isSearchCanceled   = computed(() => store.getters['search/isSearchCanceled']);
const querySubjectEntity = computed(() => store.getters['search/querySubjectEntity']);
const uiVariant          = computed(() => store.state.uiVariant);

// Vuex mutations/actions
const setIsInitialLoad = (v) => store.commit('setIsInitialLoad', v);
const getSearch = (payload) => store.dispatch('search/getSearch', payload);
const prefetchUnderlyingWorksQuery = (query) => store.dispatch('search/prefetchUnderlyingWorksQuery', query);

// Title
onMounted(() => {
  useHead({ title: store.state.search.pageTitle });
});

// Methods
const pollSearch = async () => {
  if (queryIsCompleted.value || isSearchCanceled.value) { return; }

  const data = await getSearch({
    id: route.params.id,
    is_polling: true,
  });

  if (data?.backend_error) {
    cancelPollTimer();
    return;
  }

  pollCount.value++;
  pollTimer.value = setTimeout(() => {
    pollSearch();
  }, 500);
};

const cancelPollTimer = () => {
  if (pollTimer.value) {
    pollCount.value = 0;
    clearTimeout(pollTimer.value);
  }
};

const areResultsStale = () => {
  // Checks for statel results when query has a label that has changed
  const searchState = store.state.search;
  const userState = store.state.user;

  if (
    searchState.id &&
    searchState.query &&
    searchState.results_timestamps?.completed
  ) {
    const labelsInQuery = getLabelsInQuery(searchState.query);
    const labelModTimestamps = userState.labelLastModified;
    const resultsTime = new Date(searchState.results_timestamps.completed).getTime();

    for (const labelId of labelsInQuery) {
      if (labelModTimestamps[labelId] && labelModTimestamps[labelId] > resultsTime) {
        console.log('Results are stale');
        return true;
      }
    }
  }

  return false;
};

// Watchers
watch(
  () => route.params.id,
  async (id) => {
    if (!id) { return; }

    cancelPollTimer();
    //console.log('Initial load with ID, poll count:', pollCount.value);

    const bypass_cache =
      areResultsStale() ||
      (isInitialLoad.value && pollCount.value === 0 && DISABLE_SERVER_CACHE);

    await getSearch({
      id,
      is_polling: !isInitialLoad.value,
      bypass_cache,
    });

    if (isInitialLoad.value && !["works", "summary"].includes(querySubjectEntity.value)) {
      prefetchUnderlyingWorksQuery(store.state.search.submittedQuery);
    }

    pollCount.value = 0;
    pollSearch();
    setIsInitialLoad(false);
  },
  { immediate: true }
);

// Lifecycle
onBeforeUnmount(() => {
  cancelPollTimer();
});
</script>

<style lang="scss">
.results-box {
  padding: 0 20px;
}
body .results-box .v-card.query-builder {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 10px;
}
body .results-box .v-card.results-table-box {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
  padding-top: 0 !important;
  margin-top: 0 !important;
}
.results-box .query-filter-tree {
  margin-bottom: 0px !important;
}
</style>