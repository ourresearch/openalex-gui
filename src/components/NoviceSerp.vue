<template>
  <v-container fluid class="pt-0">
    <div class="d-flex justify-center mb-4 mt-2">
      <search-box style="max-width: 800px; width: 100%;" />
    </div>

    <div class="novice-serp mx-auto">
      <novice-filter-chips v-if="isWorks" style="margin-bottom: 100px;" />

      <!-- Results header -->
      <div class="d-flex align-center mb-2">
        <div class="text-body-2 text-medium-emphasis flex-grow-1">
          <template v-if="!resultsObject?.meta">
          </template>
          <template v-else-if="isSemanticSearch">
            50 most semantically similar works
          </template>
          <template v-else-if="resultsObject.meta.count === 0">
            There are no results for this search.
          </template>
          <template v-else>
            About {{ filters.toPrecision(resultsObject.meta.count) }} {{ filters.pluralize(entityType, 2) }}
          </template>
        </div>
        <div v-if="isWorks" class="d-flex align-center ga-1">
          <novice-sort-button />
          <novice-toolbar-menu />
        </div>
      </div>

      <!-- Results list -->
      <div v-if="resultsObject?.results">
        <novice-result-item
          v-for="result in resultsObject.results"
          :key="result.id"
          :result="result"
        />
      </div>

      <!-- No results -->
      <div
        v-if="resultsObject?.meta?.count === 0"
        class="text-medium-emphasis text-center py-8"
      >
        Try adjusting your search or filters.
      </div>

      <!-- Pagination -->
      <v-pagination
        v-if="showPagination"
        class="pb-8 pt-4"
        rounded
        active-color="primary"
        v-model="page"
        :length="numPages"
        :total-visible="7"
      />
    </div>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { url } from '@/url';
import filters from '@/filters';

import SearchBox from '@/components/SearchBox.vue';
import NoviceFilterChips from '@/components/NoviceFilterChips.vue';
import NoviceResultItem from '@/components/NoviceResultItem.vue';
import NoviceSortButton from '@/components/NoviceSortButton.vue';
import NoviceToolbarMenu from '@/components/NoviceToolbarMenu.vue';

defineOptions({ name: 'NoviceSerp' });

const props = defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const isWorks = computed(() => entityType.value === 'works');
const isSemanticSearch = computed(() => !!route.query['search.semantic']);

const numPages = computed(() => {
  const count = props.resultsObject?.meta?.count || 0;
  const perPage = url.getPerPage();
  return Math.min(Math.ceil(count / perPage), 10);
});

const showPagination = computed(() => {
  return (props.resultsObject?.meta?.count || 0) > url.getPerPage();
});

const page = computed({
  get() {
    return props.resultsObject?.meta?.page ?? 1;
  },
  set(val) {
    url.setPage(val === 1 ? undefined : val);
  },
});
</script>

<style scoped>
.novice-serp {
  max-width: 800px;
  width: 100%;
}
</style>
