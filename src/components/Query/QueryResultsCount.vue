<template>
    <span class="results-count">

      <!-- Entity Tab -->
      <span 
        v-if="stashedQueryState || querySubjectEntity !== 'works'"
        class="tab entities-count"
        @click="entityTabClick"
      >
        <span v-if="stashedQueryState">
          {{ filters.millify(stashedQueryState.results_meta?.count) }}
          {{ filters.pluralize(stashedQueryState.query.get_rows) }}
        </span>
        <span v-else>
          <span v-if="hasResults">
            {{ filters.millify(resultsMeta?.count) }}
            {{ filters.pluralize(querySubjectEntity) }}
          </span>
          <span v-else>
            {{ filters.capitalize(filters.pluralize(querySubjectEntity)) }}
          </span>
        </span>
      </span>

      <!-- Works Tab -->
      <span 
        class="tab works-count"
        @click="worksTabClick">
        <span v-if="querySubjectEntity === 'works' && hasResults">
          {{ filters.millify(resultsMeta?.count)}}
          works
        </span>
        <span v-else-if="hasResults && resultsWorksCount !== null">
          {{ filters.millify(resultsWorksCount)}}
          works
        </span>
        <span v-else>
          Works
        </span>
      </span>

      <query-actions />

    </span>

</template>


<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import filters from "@/filters";

import QueryActions from "./QueryActions.vue";

defineOptions({ name: "QueryResultsCount" });

const store = useStore();

const resultsMeta = computed(() => store.getters["search/resultsMeta"]);
const resultsWorksCount = computed(() => store.getters["search/resultsWorksCount"]);
const hasResults = computed(() => store.getters["search/hasResults"]);
const querySubjectEntity = computed(() => store.getters["search/querySubjectEntity"]);
const stashedQueryState = computed(() => store.getters["search/stashedQueryState"]);

function entityTabClick() {
  if (stashedQueryState.value) {
    store.dispatch("search/createSearchFromQuery", stashedQueryState.value.query);
    store.commit("search/setStashedQueryState", null);
  }
}

function worksTabClick() {
  if (querySubjectEntity.value !== "works") {
    store.dispatch("search/createUnderlyingWorksQuery");
  }
}
</script>


<style lang="scss">
.results-count {
  display: flex;
  margin-bottom: -16px;
}
.tab {
  display: inline-block;
  text-align: center;
  color: #555;
  font-size: 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 0px 16px;
  margin-right: 4px;
  min-width: 70px;
  height: 32px;
  line-height: 32px;
  cursor: pointer;

  &:hover {
    filter: brightness(0.95);
  }
  &:active {
    filter: brightness(0.85);
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
.query-actions-box {
  margin-top: -8px;
}

</style>
