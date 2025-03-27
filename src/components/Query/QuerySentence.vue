<template>
  <div>
  <div :class="['query-sentence-container', {'in-progress': hasQueryChanged || isSearchCanceled}]">
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
      <template v-else>
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

      <div class="sentence-buttons-box">
        <query-outline-view class="mx-1"/>
        <new-query-button small button-text="" icon="mdi-refresh"/>
      </div>
    </div>
    <query-search-controls v-if="hasQueryChanged || isSearchCanceled"/>
  </div>
  <div class="results-top-line">
      <query-results-count />
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryOutlineView from "@/components/Query/QueryOutlineView.vue";
import QueryResultsCount from "@/components/Query/QueryResultsCount.vue";
import QueryActions from "@/components/Query/QueryActions.vue";
import QuerySearchControls from "@/components/Query/QuerySearchControls.vue";
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";

export default {
  name: "QuerySentence",
  components: {
    QueryFilterTree,
    QuerySearchControls,
    QueryOutlineView,
    QueryResultsCount,
    QueryActions,
    NewQueryButton
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
  padding-bottom: 8px;
  display: flex;
  justify-content: space-between;
}
.query-sentence-container.in-progress {
  background-color: #fcfcfc;
  border-radius: 5px;
  border: 1px solid #e0e0e0;
  padding: 10px;
}
.query-sentence {
  padding: 0px 10px 3px 3px; 
  max-width: 950px;
  line-height: 2;
  text-indent: -20px;
  margin-left: 20px;
} 
.query-sentence * {
  text-indent: 0;
}
.sentence-buttons-box .v-btn {
  min-width: 20px !important;
  width: 28px;
}
.search-controls {
  padding: 10px 0px 0px 0px;
  margin-top: 10px;
  text-align: left;
  border-top: 1px solid #e0e0e0;
}
.results-top-line {
  display: flex;
  justify-content:
}
.results-count-box {
  font-size: 12px;
  text-align: right;
  height: 28px;
  color: #666;
  padding: 0 3px 4px 3px;
  align-self: end;
  white-space: nowrap;
  display: flex;
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
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
</style>
