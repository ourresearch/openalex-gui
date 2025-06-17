<template>
  <span>
    <v-progress-circular
      :color="props.color"
      :size="props.loadingSpinnerSize"
      v-if="isLoading"
      indeterminate
    />
    <span v-else-if="count">
      {{ filters.millify(count) }}
    </span>
  </span>
</template>


<script setup>
import { ref, watchEffect } from 'vue';
import { api } from '@/api';
import filters from '@/filters';

defineOptions({ name: 'OurStatsEntry' });

const props = defineProps({
  entityType: String,
  loadingSpinnerSize: {
    type: Number,
    default: 28,
  },
  filterKey: String,
  filterValue: [String, Boolean],
  color: String,
});

const count = ref(null);
const isLoading = ref(false);

watchEffect(async () => {
  isLoading.value = true;
  const myUrl = `/${props.entityType}`;
  const params = {};
  if (props.filterKey && props.filterValue !== undefined) {
    params.filter = `${props.filterKey}:${props.filterValue}`;
  }

  try {
    const resp = await api.get(myUrl, params);
    count.value = resp.meta.count;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped lang="scss">
</style>