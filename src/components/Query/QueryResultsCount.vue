<template>
  <div class="results-count-box">
    <span class="results-count" v-if="hasResults">

      {{ resultsMeta?.count > 10000 ? "about " : "" }}
      {{ resultsMeta?.count | toPrecision }}
      {{ querySubjectEntity | pluralize }}
      <query-actions />

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
import QueryActions from './QueryActions.vue';

export default {
  components: {
    QueryActions
  },
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
