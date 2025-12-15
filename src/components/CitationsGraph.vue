<template>
  <Card
    class="button-card p-4 flex items-end h-[100px] cursor-pointer"
    @click="clickCard"
  >
    <BarGraph
      :bars="countsByYear.map(y => ({ key: y.year, count: y.cited_by_count }))"
      style="height: 100%;"
      class="flex-grow"
      @click="clickBar"
    />
    <Separator orientation="vertical" class="mx-3" />
    <div>
      <div class="text-3xl font-bold">
        {{ filters.toPrecision(citedByCount) }}
      </div>
      <div class="text-right">Citations</div>
    </div>
  </Card>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { shortenOpenAlexId } from '@/util';

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
  const shortId = shortenOpenAlexId(id);
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
