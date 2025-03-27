<template>
  <div>
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
      </div>
      <div class="search-controls-box">
        <span class="search-controls">
          <query-search-controls v-if="hasQueryChanged || isSearchCanceled"/>
        </span>
        <query-outline-view class="ml-1"/>
      </div>
    </div>
    <query-results-count />
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryOutlineView from "@/components/Query/QueryOutlineView.vue";
import QueryResultsCount from "@/components/Query/QueryResultsCount.vue";
import QueryActions from "@/components/Query/QueryActions.vue";
import QuerySearchControls from "@/components/Query/QuerySearchControls.vue";

export default {
  name: "QuerySentence",
  components: {
    QueryFilterTree,
    QuerySearchControls,
    QueryOutlineView,
    QueryResultsCount,
    QueryActions
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search",[
      "query",
      "querySubjectEntity",
      "hasQueryChanged",
      "isSearchCanceled",
    ]),
    isWorks() { 
      return ['works', 'summary'].includes(this.querySubjectEntity);
    },
  }
};
</script>

<style>
.query-sentence-box {
  padding-bottom: 5px;
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
.results-count {
  font-size: 11px;
  text-align: right;
  height: 20px;
  color: #666;
  padding: 0 7px 2px 7px;
  align-self: end;
  white-space: nowrap;
  display: flex;
  justify-content: space-between;
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
.query-sentence .query-section-label,
.query-sentence .query-filter-leaf {
  white-space: nowrap;
}
.query-sentence .query-builder-input {
  display: inline-block !important;
  width: 250px;
}
.query-sentence .path-label {
  margin-right: 0;
}
.search-controls-box {
  padding-top: 4px;
  white-space: nowrap;
  text-align: right;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 234px;
}
.search-controls {
  padding: 0px 0px;
  flex-grow: 1;
  text-align: left;
}
</style>
