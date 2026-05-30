<template>
  <div style="min-height: 80vh">
    <expert-serp :results-object="resultsObject" :search-error="searchError" />
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

import ExpertSerp from '@/components/ExpertSerp.vue';

defineOptions({ name: 'Serp' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// Data
const resultsFilters = ref([]);
const resultsObject = ref(null);
const searchError = ref(null);

const selectedEntityType = computed(() => route.params.entityType);
const selectedEntityTypeConfig = computed(() => entityConfigs[selectedEntityType.value]);

useHead({
  title: computed(() => _.capitalize(selectedEntityTypeConfig.value.displayName) + ' search'),
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

    // Adopt a deep-link `per_page` into the page-size store (session override)
    // before building the fetch URL, so the first request uses the linked size.
    url.adoptPerPageFromUrl(route);

    store.state.isLoading = true;
    try {
      // makeApiUrl is INSIDE the try block so a synchronous throw — e.g.
      // filtersFromUrlStr → createSimpleFilter on a URL filter whose key has
      // no facetConfig for this entity type (`?filter=is_oa:true` on /works,
      // since is_oa is registered for /sources and /locations only) —
      // surfaces inline via searchError instead of silently killing the
      // watcher. Caught during oxjob #228 QA-051: combined
      // `?filter=collection:X,is_oa:true` rendered a completely empty SERP
      // with no chips, facets, or error message because the throw bypassed
      // the request flow entirely. Same shape would break any URL containing
      // an unknown filter key (typo, doc copy-paste, old saved search).
      const apiQuery = url.makeApiUrl(route);
      const resp = await api.getResultsList(apiQuery);
      resultsObject.value = resp;
      store.state.resultsObject = resp;
      searchError.value = null;
    } catch (e) {
      resultsObject.value = null;
      store.state.resultsObject = null;
      // Surface the API's message field (e.g. wrong-entity-type collection
      // filter, malformed boolean search) instead of silently rendering an
      // empty SERP. Falls back to generic copy if the body is missing.
      searchError.value =
        e?.response?.data?.message ||
        e?.message ||
        'Search failed.';
    }
    store.state.isLoading = false;

    // filtersFromUrlStr can throw on an unknown filter key — same shape as
    // makeApiUrl above. Guard so the chip strip doesn't crash the watcher.
    try {
      resultsFilters.value = filtersFromUrlStr(
        selectedEntityType.value,
        route.query.filter
      );
    } catch (e) {
      resultsFilters.value = [];
    }

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
    }

    &.boolean {
      text-align: center;
    }
  }

}
</style>
