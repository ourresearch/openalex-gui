<template>
  <v-card
    flat
    rounded
    class="button-card pa-4 d-flex align-end"
    height="100"
  >
    <BarGraph
      :bars="countsByYear.map(y => ({ key: y.year, count: y.works_count }))"
      style="height: 100%;"
      class="flex-grow-1"
      @click="clickBar"
    />
    <v-divider vertical class="mx-3"></v-divider>
    <div>
      <div class="text-h3">
        {{ filters.toPrecision(worksCount) }}
      </div>
      <div class="text-right">Works</div>
    </div>
  </v-card>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { entityTypeFromId, shortenOpenAlexId } from '@/util';
import { getEntityConfig } from '@/entityConfigs';

import BarGraph from '@/components/BarGraph.vue';

defineProps({
  countsByYear: Array,
  worksCount: Number,
  id: String,
});

const store = useStore();
const entityType = computed(() => store.getters.entityType);

function clickBar(barKey) {
  const myEntityType = entityTypeFromId(id);
  const shortId = shortenOpenAlexId(id);
  const filterKey = getEntityConfig(myEntityType)?.filterKey;

  const worksFilter = createSimpleFilter(entityType.value, filterKey, shortId);
  const countFilter = createSimpleFilter(entityType.value, 'publication_year', barKey);

  url.pushNewFilters([worksFilter, countFilter]);
}
</script>

<style scoped lang="scss">
</style>
