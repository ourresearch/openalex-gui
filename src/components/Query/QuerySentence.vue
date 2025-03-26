<template>
  <div class="query-sentence-box">
    <div class="query-sentence">
      <!-- Work First -->
      <template v-if="uiVariant === 'sentence-worksfirst'">
        <!-- Works Filters -->
        <query-filter-tree
          subject-entity="works"
          :isWithAggs="querySubjectEntity !== 'works'"
          :filters="query.filter_works"
          :is-sentence="true" />

        <!-- Entity Filters -->
        <query-filter-tree
          :subject-entity="isWorks ? null : querySubjectEntity"
          :filters="query.filter_aggs"
          :is-sentence="true" />
      </template>

      <!-- Entity First -->
      <template v-else-if="uiVariant === 'sentence'">
        <!-- Entity Filters -->
        <query-filter-tree
          v-if="querySubjectEntity !== 'works'"
          :subject-entity="querySubjectEntity"
          :filters="query.filter_aggs"
          :is-sentence="true" />

        <!-- Works Filters -->
        <query-filter-tree
          subject-entity="works"
          :isWithAggs="querySubjectEntity !== 'works'"
          :filters="query.filter_works"
          :is-sentence="true" />
      </template>
      <query-outline-view />
    </div>
    <query-results-count />
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryOutlineView from "@/components/Query/QueryOutlineView.vue";
import QueryResultsCount from "@/components/Query/QueryResultsCount.vue";

export default {
  name: "QuerySentence",
  components: {
    QueryFilterTree,
    QueryOutlineView,
    QueryResultsCount,
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search",[
      "query",
      "querySubjectEntity",
    ]),
    isWorks() { 
      return ['works', 'summary'].includes(this.querySubjectEntity);
    },
  }
};
</script>

<style>
.query-sentence-box {
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
.query-sentence {
  padding: 0px 10px 3px 10px; 
  max-width: 950px;
  line-height: 2;
  text-indent: -20px;
  margin-left: 20px;
} 
.query-sentence * {
  text-indent: 0;
}
.query-sentence-box .results-count {
  flex-grow: 1;
  font-size: 12px;
  text-align: right;
  color: #444;
  padding: 0 5px 0px 5px;
  align-self: end;
  white-space: nowrap;
}
.query-sentence .query-filter-tree,
.query-sentence .query-filter-tree > div,
.query-sentence .query-wrapper,
.query-sentence .query-filter-tree-branch,
.query-sentence .query-filter-leaf,
.query-sentence .query-section-label,
.query-sentence .leaf-content,
.query-sentence .bottom-button-wrapper,
.query-sentence .query-outline-view {
  display: inline !important;
  border: none;
  margin: 0;
  padding: 0;
}
/*.query-sentence .query-section-label,
.query-sentence .query-filter-leaf {
  white-space: nowrap;
}*/
.query-sentence .query-builder-input {
  display: inline-block !important;
  width: 250px;
}
.query-sentence .path-label {
  margin-right: 0;
}
</style>
