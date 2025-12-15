<template>
  <Card
    class="button-card p-4 flex items-end h-[100px]"
  >
    <BarGraph
      :bars="countsByYear.map(y => ({ key: y.year, count: y.works_count }))"
      style="height: 100%;"
      class="flex-grow"
      @click="clickBar"
    />
    <Separator orientation="vertical" class="mx-3" />
    <div>
      <div class="text-3xl font-bold">
        {{ filters.toPrecision(worksCount) }}
      </div>
      <div class="text-right">Works</div>
    </div>
  </Card>
</template>

<script setup>
import { useStore } from 'vuex';
import { computed } from 'vue';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
