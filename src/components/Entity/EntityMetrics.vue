<template>
  <div v-if="metricRows.length">
    <entity-datum-row
      v-for="filterKey in metricRows"
      :key="filterKey"
      :filter-key="filterKey"
      :data="data"
      :type="type"
      class="px-4 pb-1"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getEntityConfig, metricsPriorityOrder } from '@/entityConfigs';
import EntityDatumRow from '@/components/Entity/EntityDatumRow.vue';

defineOptions({ name: 'EntityMetrics' });

const props = defineProps({
  data: Object,
  type: String,
});

const myEntityConfig = computed(() => props.type ? getEntityConfig(props.type) : null);

const metricRows = computed(() => {
  const include = new Set(myEntityConfig.value?.metricsToShowOnEntityPage || []);
  return metricsPriorityOrder.filter(m => include.has(m));
});
</script>
