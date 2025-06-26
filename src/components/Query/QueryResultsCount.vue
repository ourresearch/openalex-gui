<template>
    <span class="results-count">

      <!-- Entity Tab -->
      <span v-if="this.stashedQueryState || this.querySubjectEntity !== 'works'"
        class="entities-count"
        @click="entityTabClick">
        <span v-if="this.stashedQueryState">
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
        class="works-count"
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

</template>


<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import filters from "@/filters";

import QueryActions from "./QueryActions.vue";

defineOptions({ name: "QueryResultsCount" });

const store = useStore();

const resultsMeta = computed(() => store.getters["search/resultsMeta"]);
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
  margin-bottom: -8px;
}
.entities-count,
.works-count {
  display: inline-block;
  text-align: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 0px 24px;
  margin-right: 4px;
  min-width: 90px;
  height: 40px;
  line-height: 40px;
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
