<template>
  <v-card class="group-by-views" variant="flat" color="transparent">
    <v-toolbar dense flat color="transparent" style="margin-bottom: -16px;" >
      <v-toolbar-title class="font-weight-bold">Stats</v-toolbar-title>
      <v-spacer/>
      <action-menu v-if="entityType === 'works'" class="ml-2" action="group_by"/>
      <v-btn icon :href="csvUrl">
        <v-icon color="grey-darken-2">mdi-tray-arrow-down</v-icon>
      </v-btn>
      <v-menu location="bottom" v-if="0">
        <template v-slot:activator="{props}">
          <v-btn icon v-bind="props">
            <v-icon color="grey-darken-2">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="url.setGroupBy(undefined)">
            <template #prepend>
              <v-icon color="grey-darken-2">mdi-restore</v-icon>
            </template>
            <v-list-item-title>Restore report defaults</v-list-item-title>
          </v-list-item>

          <v-divider/>

          <v-list-item :href="csvUrl">
            <template #prepend>
              <v-icon color="grey-darken-2">mdi-tray-arrow-down</v-icon>
            </template>
            <v-list-item-title>Export all</v-list-item-title>
            <v-list-item-subtitle>.csv</v-list-item-subtitle>
          </v-list-item>

          <v-list-item :href="apiUrl" target="_blank">
            <template #prepend>
              <v-icon color="grey-darken-2">mdi-api</v-icon>
            </template>
            <v-list-item-title>View in API</v-list-item-title>
            <v-list-item-subtitle>.json</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    
    <v-container class="pt-0">
      <v-row v-if="resultsObject?.meta?.count" dense class="">
        <v-col
            v-for="(key, i) in groupByKeys"
            :key="key"
            class="d-flex flex-column"
        >
          <template v-if="i === 0">
            <v-card variant="outlined" class="bg-white pa-3 mb-3">
              <serp-results-count :results-object="resultsObject" class="text-h5"/>
            </v-card>
          </template>

          <v-card variant="outlined" v-if="key === 'apc_sum'" class="bg-white">
            <v-toolbar flat>
              <v-icon color="grey-darken-2" start>mdi-currency-usd</v-icon>
              <v-toolbar-title>APC sums</v-toolbar-title>
              <v-spacer/>
              <v-btn icon @click="url.toggleGroupBy('apc_sum')">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-toolbar>
            <v-divider/>
            <div class="ma-4">
              <div class="text-h5">
                <span class="font-weight-bold mr-2">${{ filters.toPrecision(resultsObject?.meta?.apc_paid_sum_usd) }}</span>
              </div>
              <div class="text-body-2">Sum APCs paid (est)</div>
              <div class="mt-3">
                <span class="font-weight-bold mr-2">${{ filters.toPrecision(resultsObject?.meta?.apc_list_sum_usd) }}</span>
              </div>
              <div class="text-body-2">Sum APCs list (est)</div>
            </div>
          </v-card>

          <v-card variant="outlined" v-else-if="key === 'cited_by_count_sum'" class="d-flex align-baseline pa-2 bg-white">
            <v-icon color="grey-darken-2" start>mdi-format-quote-close</v-icon>
            <span class="text-h5 mr-2">{{ filters.toPrecision(resultsObject?.meta?.cited_by_count_sum) }}</span>
            <div class="align-self-baseline ">citations</div>
            <v-spacer/>
            <v-btn icon @click="url.toggleGroupBy('cited_by_count_sum')">
              <v-icon color="grey-darken-2">mdi-close</v-icon>
            </v-btn>
          </v-card>

          <group-by
            v-else
            :filter-key="key"
            :entity-type="entityType"
          />

        </v-col>

      </v-row>
      <v-card v-else variant="outlined" class="text-grey mt-2 pa-4 bg-white">
        There are no results to analyze.
      </v-card>

    </v-container>
  </v-card>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { filtersFromUrlStr } from '@/filterConfigs';

import GroupBy from '@/components/GroupBy/GroupBy.vue';
import ActionMenu from '@/components/Action/ActionMenu.vue';
import SerpResultsCount from '@/components/SerpResultsCount.vue';

defineOptions({ name: 'GroupByViews'});

// Props
defineProps({
  resultsObject: Object
});

// Store and router
const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);

// Group by keys, sorted
const groupByKeys = computed(() => {
  const keys = url.getGroupBy(route);
  keys.sort((a) => ['apc_sum', 'cited_by_count_sum'].includes(a) ? -1 : 1);
  return keys;
});


// API URL based on current filters
const apiUrl = computed(() => {
  const myFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  return url.makeGroupByUrl(
    entityType.value,
    groupByKeys.value.join(','),
    {
      filters: myFilters,
      isMultipleGroups: true
    }
  );
});

// CSV export URL
const csvUrl = computed(() => {
  const myFilters = filtersFromUrlStr(entityType.value, route.query.filter);
  return url.makeGroupByUrl(
    entityType.value,
    groupByKeys.value.join(','),
    {
      filters: myFilters,
      isMultipleGroups: true,
      formatCsv: true
    }
  );
});
</script>


<style scoped lang="scss">
.group-by-views .v-toolbar__content {
  padding-left: 0 !important;
}
.group-by-views .v-toolbar__content > .v-toolbar-title {
  margin-inline-start: 16px !important;
}
</style>