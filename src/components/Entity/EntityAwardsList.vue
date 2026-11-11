<template>
  <div>
    <div v-if="loading && !results.length" class="pa-6 text-center">
      <v-progress-circular indeterminate size="24" width="2" color="grey" />
    </div>
    <div v-else-if="!results.length" class="pa-6 text-medium-emphasis">
      No awards found.
    </div>
    <serp-results-list-item
      v-for="result in results"
      :key="result.id"
      :result="result"
    />
    <div v-if="results.length" class="pa-3 text-center">
      <v-btn
        variant="text"
        rounded
        size="small"
        color="primary"
        prepend-icon="mdi-chevron-down"
        :disabled="!hasMore"
        :loading="loading"
        @click="fetchPage(page + 1)"
      >
        Show more awards
      </v-btn>
      <v-btn
        variant="text"
        rounded
        size="small"
        color="primary"
        prepend-icon="mdi-open-in-new"
        @click="viewAsSearch"
      >
        View as search
      </v-btn>
    </div>
  </div>
</template>

<script setup>
// The awards tab on author, topic and institution pages: the awards that name
// this entity (author = investigator, topic = primary topic, institution =
// awarded institution, with its child institutions).
import { ref, computed, watch, onMounted } from 'vue';

import { api } from '@/api';
import { url } from '@/url';
import { createSimpleFilter, filtersAsUrlStr } from '@/filterConfigs';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';

defineOptions({ name: 'EntityAwardsList' });

const props = defineProps({
  filterKey: { type: String, required: true },
  entityId: { type: String, required: true },
});

const PER_PAGE = 25;

const results = ref([]);
const count = ref(0);
const page = ref(1);
const loading = ref(true); // until the first page arrives (no "No awards" flash)

const awardsFilter = computed(() => createSimpleFilter('awards', props.filterKey, props.entityId));
const hasMore = computed(() => results.value.length > 0 && results.value.length < count.value);

let inFlight = false;
async function fetchPage(nextPage) {
  if (inFlight) return;
  inFlight = true;
  loading.value = true;
  try {
    const apiUrl = api.makeUrl('awards', {
      filter: filtersAsUrlStr([awardsFilter.value]),
      sort: 'start_year:desc',
      'per-page': PER_PAGE,
      page: nextPage,
    }, true);
    const resp = await api.getResultsList(apiUrl);
    const rows = resp?.results || [];
    results.value = nextPage === 1 ? rows : [...results.value, ...rows];
    count.value = resp?.meta?.count || 0;
    page.value = nextPage;
  } finally {
    inFlight = false;
    loading.value = false;
  }
}

const viewAsSearch = () => url.pushNewFilters([awardsFilter.value], 'awards');

// Browser only: record pages never call the API during the server render (#1689).
const reload = () => {
  results.value = [];
  count.value = 0;
  fetchPage(1);
};
onMounted(reload);
watch(() => [props.filterKey, props.entityId], reload);
</script>
