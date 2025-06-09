<template>
  <div class="results-count-box">
    <span class="results-count">

      <!-- Entity Tab -->
      <span v-if="this.stashedQueryState || this.querySubjectEntity !== 'works'"
        :class="['entities-count']"
        @click="entityTabClick">
        <span v-if="this.stashedQueryState">
          {{ filters.millify(stashedQueryState.results_meta?.count) }}
          {{ filters.pluralize(stashedQueryState.query.get_rows) }}
        </span>
        <span v-else>
          <span v-if="hasResults">
          {{ filters.millify(resultsMeta?.count) }}
          </span>
          {{ filters.pluralize(querySubjectEntity) }}
        </span>
      </span>

      <!-- Works Tab -->
      <span 
        :class="['works-count']"
        @click="worksTabClick">
        <span v-if="querySubjectEntity === 'works' && hasResults">
          {{ filters.millify(resultsMeta?.count)}}
          works
        </span>
        <span v-else-if="hasResults">
          {{ filters.millify(resultsMeta?.works_count)}}
          works
        </span>
        <span v-else>
          Works
        </span>
      </span>

      <query-actions />

    </span>

  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import filters from "@/filters";

import QueryActions from './QueryActions.vue';

export default {
  components: {
    QueryActions
  },
  data() {
    return {
      filters,
    }
  },
  computed: {
    ...mapGetters("search", [
      "resultsMeta",
      "hasResults",
      "querySubjectEntity",
      "stashedQueryState",
    ]),
  },
  methods: {
    ...mapMutations("search", [
      "setStashedQueryState",
    ]),
    ...mapActions("search", [
      "createUnderlyingWorksQuery",
      "createSearchFromQuery",
    ]),
    entityTabClick() {
      if (this.stashedQueryState) {
        this.createSearchFromQuery(this.stashedQueryState.query);
        this.setStashedQueryState(null);      
      }
    },
    worksTabClick() {
      if (this.querySubjectEntity !== 'works') {
        this.createUnderlyingWorksQuery();
      }
    },
  },
};
</script>

<style lang="scss">
.results-count {
  display: flex;
}
.entities-count,
.works-count {
  display: inline-block;
  text-align: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 3px 12px;
  margin-right: 3px;
  min-width: 80px;
  cursor: pointer;

  &:hover {
    background-color: #eee;
  }
}
.entities-count {
  background-color: rgb(var(--v-theme-catEntity));
}
.entities-count.inactive {
  background-color: rgb(var(--v-theme-catEntity));
}
.works-count {
  background-color: rgb(var(--v-theme-catWorks));
}
.works-count.inactive {
  background-color: rgb(var(--v-theme-catWorks));
}
.ui-sentence-worksfirst .works-count {
  order: 1
}
.ui-sentence-worksfirst .entities-count {
  order: 2
}
.ui-sentence-worksfirst .query-actions {
  order: 3
}

</style>
