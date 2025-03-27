<template>
  <div class="results-count">
    <span v-if="hasResults">
      <span class="results-count">
        Found
        {{ resultsMeta?.count > 10000 ? "about " : "" }}
        {{ resultsMeta?.count | toPrecision }}
        {{ querySubjectEntity | pluralize }}
      </span>
      <span v-if="querySubjectEntity !== 'works'" class="works-count">
        From
        {{ resultsMeta?.works_count > 10000 ? "about " : "" }}
        {{ resultsMeta?.works_count | toPrecision }}
        works
      </span>
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
