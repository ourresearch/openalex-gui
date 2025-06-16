<template>
  <filter-base :filter-key="filterKey" :index="index" >
    <span class="pl-6">
      {{ config.displayName }}
    </span>
  </filter-base>
</template>


<script setup>
import { computed } from 'vue';
import { facetConfigs } from '@/facetConfigs';
import FilterBase from '@/components/Filter/FilterBase.vue';

defineOptions({name: "FilterBoolean"});

const {filterKey, index} = defineProps({
  filterKey: String,
  index: Number
});

// Config for this filter
const config = computed(() =>
  facetConfigs().find(c => c.key === filterKey)
);
</script>