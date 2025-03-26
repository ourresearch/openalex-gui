<template>
  <div class="results-count" v-if="hasResults">
    {{ resultsMeta?.count > 10000 ? "about " : "" }}
    {{ resultsMeta?.count | toPrecision }}
    results
    <span v-if="querySubjectEntity !== 'works'">
      found in
      {{ resultsMeta?.works_count > 10000 ? "about " : "" }}
      {{ resultsMeta?.works_count | toPrecision }}
      works
    </span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters("search", [
      "resultsMeta",
      "hasResults",
      "querySubjectEntity",
    ]),
  },
};
</script>

<style>

</style>
