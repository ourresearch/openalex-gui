<template>
  <v-card
    flat
    rounded
    class="button-card pa-4 d-flex align-end"
    height="100"
    @click="clickCard"
  >
    <BarGraph
      :bars="countsByYear.map(y => ({ key: y.year, count: y.cited_by_count }))"
      style="height: 100%;"
      class="flex-grow-1"
      @click="clickBar"
    />
    <v-divider vertical class="mx-3"></v-divider>
    <div>
      <div class="text-h3">
        {{ filters.toPrecision(citedByCount) }}
      </div>
      <div class="text-right">Citations</div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import * as openalexId from '@/openalexId';

import BarGraph from '@/components/BarGraph.vue';

defineOptions({ name: 'CitationsGraph' });

const {id} = defineProps({
  countsByYear: Array,
  citedByCount: Number,
  id: String,
});

const store = useStore();
const entityType = computed(() => store.getters.entityType);

const citesFilter = computed(() => {
  const shortId = openalexId.getShortId(id);
  return createSimpleFilter(entityType.value, 'cites', shortId);
});

function clickCard() {
  url.pushNewFilters([citesFilter.value]);
}

function clickBar(barKey) {
  const yearFilter = createSimpleFilter(entityType.value, 'publication_year', barKey);
  url.pushNewFilters([citesFilter.value, yearFilter]);
}
</script>

<style scoped lang="scss">
</style>
