<template>
  <div class="rounded-o serp-results-count">
    <span class="font-weight-bold">
      {{ filters.toPrecision(resultsObject?.meta.count) }}
    </span> results
    <span v-if="includeTime">
      ({{  filters.toPrecision(resultsObject?.meta?.db_response_time_ms / 1000, 2) }} seconds)
    </span>
  </div>
</template>


<script setup>
import filters from '@/filters';

defineOptions({
  name: 'SerpResultsCount',
});

defineProps({
  resultsObject: Object,
  includeTime: Boolean,
});
</script>