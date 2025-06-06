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


<script>

import filters from '@/filters';

export default {
  name: "SerpResultsCount",
  components: {
  },
  props: {
    resultsObject: Object,
    includeTime: Boolean
  },
  data() {
    return {
      filters,
    }
  },
}
</script>


<style scoped lang="scss">

</style>