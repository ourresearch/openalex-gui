<template>
  <div style="min-height: 80vh">
    <novice-serp v-if="!isExpertMode" :results-object="resultsObject" />
    <expert-serp v-else :results-object="resultsObject" />
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
import NoviceSerp from '@/components/NoviceSerp.vue';

defineOptions({ name: 'Serp' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const aliceFeatures = computed(() => store.getters.featureFlags.aliceFeatures);
const isExpertMode = computed(() => !aliceFeatures.value || store.state.user.expertMode);

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
    }

    &.boolean {
      text-align: center;
    }
  }

}
</style>
