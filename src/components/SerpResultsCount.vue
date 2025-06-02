<template>
  <span class="">
    <template  class="">
      <span class="font-weight-regular" v-if="resultsObject?.meta?.count >= 1000"></span><span
        class="font-weight-bold">{{ filters.toPrecision(resultsObject?.meta.count) }}</span> results
      <span v-if="includeTime">({{  filters.toPrecision(resultsObject?.meta?.db_response_time_ms / 1000, 2) }} seconds)</span>
    </template>
  </span>
</template>


<script>

import filters from '@/filters';
import Action from "@/components/Action/Action.vue";

export default {
  name: "SerpResultsCount",
  components: {
    Action
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
  computed: {
  },
  methods: {
  },
}
</script>


<style scoped lang="scss">

</style>