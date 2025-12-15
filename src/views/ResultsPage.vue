<template>
  <div class="py-7">
    <div :class="['container mx-auto px-5', `ui-${uiVariant}`]">
      <div class="space-y-0">
        <!-- Top Panel / Query Builder -->
        <div class="py-0 px-6">
          <query-builder />
        </div>

        <!-- Results Table -->
        <div class="pt-0 px-6">
          <Card class="min-h-full rounded-t-none">
            <results-table />
          </Card>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { getLabelsInQuery } from '@/query';
import { DISABLE_SERVER_CACHE } from '@/apiConfig';

import { Card } from '@/components/ui/card';

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

<style scoped>
/* Styles handled via Tailwind classes */
</style>