<template>
  <div class="serp-results-list">
    <v-toolbar dense flat style="margin-bottom: -10px;" class="pr-0" color="transparent">
      <v-toolbar-title class="font-weight-bold ml-0 mr-2">
        {{ filters.capitalize(filters.pluralize(entityType, 2)) }}
      </v-toolbar-title>  
      <v-spacer/>
      <serp-results-sort-button />

      <serp-results-export-button v-if="entityType === 'works'" />
      <v-menu location="bottom" class="rounder-lg">
        <template v-slot:activator="{props}">
          <v-btn
            v-bind="props"
            icon
          >
            <v-icon color="grey-darken-1">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-subheader>Results per page:</v-list-subheader>
          <v-list-item @click="url.setPerPage(10)">          
            <v-list-item-title>10</v-list-item-title>
            <v-icon v-if="url.getPerPage() === 10">mdi-check</v-icon>
          </v-list-item>

          <v-list-item @click="url.setPerPage(100)">
            <v-list-item-title>100</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

  <v-card flat>

    <v-list nav v-if="resultsObject?.results" class="" color="">
      <serp-results-list-item
        v-for="result in resultsObject.results"
        :key="result.id"
        :result="result"
        show-icon
      />

    </v-list>
    <div class="serp-bottom" v-if="resultsObject?.results?.length">
      <v-pagination
          v-if="showPagination"
          class="pb-8 pt-3 elevation-0"
          rounded
          active-color="primary"
          v-model="page"
          :length="numPages"
          :total-visible="10"
          light
      />
    </div>
    <v-card v-if="!resultsObject?.meta?.count" flat class="text-grey mt-2 pa-4 color-3">
      There are no results for this search.
    </v-card>
  </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';

import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';
import SerpResultsSortButton from '@/components/SerpResultsSortButton.vue';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';

defineOptions({
  name: 'SerpResultsList',
});

const props = defineProps({
  resultsObject: Object,
});

const store = useStore();

const entityType = computed(() => store.getters['entityType']);

const isMobile = computed(() => {
  // Vuetify 3 support
  return typeof window !== 'undefined' && window.innerWidth <= 600;
});

const numPages = computed(() => {
  const maxToShow = isMobile.value ? 4 : 10;
  const count = props.resultsObject.meta?.count || 0;
  const perPage = url.getPerPage();
  return Math.min(Math.floor(count / perPage), maxToShow);
});

const showPagination = computed(() => {
  return props.resultsObject.meta?.count > url.getPerPage();
});

const page = computed({
  get() {
    return props.resultsObject.meta?.page ?? 1;
  },
  set(val) {
    const valToUse = val === 1 ? undefined : val;
    url.setPage(valToUse);
  },
});
</script>


<style lang="scss">
.serp-results-list .v-toolbar__content {
  padding-right: 0 !important;
}
</style>