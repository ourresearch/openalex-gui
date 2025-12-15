<template>
  <div class="group-by-views">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-bold text-lg">Stats</h3>
      <div class="flex items-center gap-1">
        <action-menu v-if="entityType === 'works'" class="ml-2" action="group_by"/>
        <Button variant="ghost" size="icon" asChild>
          <a :href="csvUrl">
            <Download class="h-5 w-5 text-muted-foreground" />
          </a>
        </Button>
      </div>
    </div>
    
    <div class="pt-0">
      <div v-if="resultsObject?.meta?.count" class="grid gap-4">
        <div
            v-for="(key, i) in groupByKeys"
            :key="key"
            class="flex flex-col"
        >
          <template v-if="i === 0">
            <Card class="bg-white p-3 mb-3">
              <serp-results-count :results-object="resultsObject" class="text-xl"/>
            </Card>
          </template>

          <Card v-if="key === 'apc_sum'" class="bg-white">
            <div class="flex items-center justify-between p-3 border-b">
              <div class="flex items-center gap-2">
                <DollarSign class="h-5 w-5 text-muted-foreground" />
                <span class="font-medium">APC sums</span>
              </div>
              <Button variant="ghost" size="icon" @click="url.toggleGroupBy('apc_sum')">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div class="p-4">
              <div class="text-xl">
                <span class="font-bold mr-2">${{ filters.toPrecision(resultsObject?.meta?.apc_paid_sum_usd) }}</span>
              </div>
              <div class="text-sm text-muted-foreground">Sum APCs paid (est)</div>
              <div class="mt-3">
                <span class="font-bold mr-2">${{ filters.toPrecision(resultsObject?.meta?.apc_list_sum_usd) }}</span>
              </div>
              <div class="text-sm text-muted-foreground">Sum APCs list (est)</div>
            </div>
          </Card>

          <Card v-else-if="key === 'cited_by_count_sum'" class="flex items-baseline p-2 bg-white">
            <Quote class="h-5 w-5 text-muted-foreground mr-2" />
            <span class="text-xl mr-2">{{ filters.toPrecision(resultsObject?.meta?.cited_by_count_sum) }}</span>
            <div class="self-baseline">citations</div>
            <div class="flex-1"></div>
            <Button variant="ghost" size="icon" @click="url.toggleGroupBy('cited_by_count_sum')">
              <X class="h-4 w-4 text-muted-foreground" />
            </Button>
          </Card>

          <group-by
            v-else
            :filter-key="key"
            :entity-type="entityType"
          />

        </div>

      </div>
      <Card v-else class="text-muted-foreground mt-2 p-4 bg-white">
        There are no results to analyze.
      </Card>

    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { Download, DollarSign, X, Quote } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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


<style scoped>
/* Styles handled via Tailwind classes */
</style>