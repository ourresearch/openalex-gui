<template>
  <div class="query-sentence">
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

  </div>
</template>

<script>
import {mapGetters} from "vuex";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";

export default {
  name: "QuerySentence",
  components: {
    QueryFilterTree,
  },
  computed: {
    ...mapGetters("search",[
      "query",
      "querySubjectEntity",
    ]),
  }
};
</script>

<style>
.query-sentence {
  padding: 10px 10px 25px 10px; 
  max-width: 85%;
} 
.query-sentence .query-filter-tree,
.query-sentence .query-filter-tree div,
.query-sentence .query-filter-leaf,
.query-sentence .query-filter-branch,
.query-sentence .query-wrapper {
  display: inline !important;
  border: none;
  margin: 0;
  padding: 0;

}
.query-sentence .path-label {
  margin-right: 0;
}
</style>
