<template>
  <div class="results-count">
    <span class="results-count" v-if="hasResults">
      Found
      {{ resultsMeta?.count > 10000 ? "about " : "" }}
      {{ resultsMeta?.count | toPrecision }}
      {{ querySubjectEntity | pluralize }}
    </span>
    <span v-if="querySubjectEntity !== 'works' && hasResults" class="works-count">
      From
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
