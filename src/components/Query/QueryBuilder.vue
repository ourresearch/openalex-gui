<template>
  <v-card flat rounded class="px-5 pt-5 pb-5">
    
    <!-- Works First UI -->
    <div v-if="uiVariant === 'worksfirst'">
      <!-- Works Filters -->
      <query-filter-tree
        subject-entity="works"
        :isWithAggs="true"
        :filters="query.filter_works" />

      <!-- Entity Filters -->
      <query-filter-tree
        :subject-entity="isWorks ? null :querySubjectEntity"
        :filters="query.filter_aggs" />
    </div>

    <!-- Entity First UI -->
    <div v-else>
      <!-- Entity Filters -->
      <query-filter-tree
        v-if="querySubjectEntity !== 'works'"
        :subject-entity="querySubjectEntity"
        :filters="query.filter_aggs" />
      
      <query-columns-controls 
        v-if="querySubjectEntity !== 'works'"
        :isExpanded="query.filter_aggs.length > 0"
        :show-sections="['display']" />
 
      <div v-if="querySubjectEntity !== 'works'" class="section-divider clear" /> 

      <!-- Works Filters -->
      <query-filter-tree
        subject-entity="works"
        :isWithAggs="querySubjectEntity !== 'works'"
        :filters="query.filter_works" />

      <query-columns-controls
        :show-sections="querySubjectEntity === 'works' ? ['display', 'calculate', 'sort'] : ['calculate', 'sort']"
        :isExpanded="query.filter_works.length > 0" />
 
    </div>

    <div class="section-divider" />

    <div class="new-query-box">
      <new-query-button small />
    </div>

  </v-card>
</template>


<script>
import { mapGetters, mapState } from "vuex";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";

export default {
  name: "QueryBuilder",
  components: {
    QuerySummarizeBy,
    QueryFilterTree,
    QueryColumnsControls,
    NewQueryButton
  },
  computed: {
    ...mapState(['uiVariant']),
    ...mapGetters("search", [
      "query",
      "querySubjectEntity"
    ]),
    isWorks() {
      return this.querySubjectEntity === 'works';
    },
    areTopLevelFiltersApplied() {
      if (this.querySubjectEntity !== 'works' && this.querySubjectEntity !== 'summary') {
        return this.areEntityFiltersApplied;
      } else {
        return this.areWorksFiltersApplied;
      }
    },
    areWorksFiltersApplied() {
      return this.query.filter_works.length !== 0;
    },
    areEntityFiltersApplied() {
      return this.query.filter_aggs.length !== 0;
    },
    showAllLabel() {
      return !this.areTopLevelFiltersApplied && this.query.get_rows !== 'summary';
    }
  }
}
</script>

<style>
.section-divider {
  border-top: 1px solid #eee;
  margin: 20px 0;
}
.section-divider.clear {
  border: none;
  margin: 30px 0;
}
.query-section-label {
  font-size: 16px;
}
.entity-chip {
  font-weight: bold;
  letter-spacing: 0.0125em;
  font-size: 18px !important;
  margin: 0;
  height: 28px !important;
}
.query-builder-chip {
  display: inline-block;
  margin: 0px;
  height: 28px;
}
.query-builder-chip .v-chip,
.query-builder-chip.v-chip {
  font-size: 12px !important;
}
.entity-chip,
.entity-chip.v-chip,
.query-builder-chip.v-chip,
.query-builder-chip .v-chip,
.query-builder-button {
  height: 22px;
  padding: 0px 10px !important;
}
.menu-chip {
  cursor: pointer;
  font-size: 15px !important; 
  background-color: transparent !important;
  border-bottom: 3px solid;
  border-radius: 0 !important;
  padding: 2px 2px !important;
  height: auto;
}
.query-builder-button {
}
.query-builder-button.tight {
  padding: 0px 0px !important;
}
.new-query-button {
  margin-top: 0px;
}
</style>