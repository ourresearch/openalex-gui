<template>
  <v-card v-if="uiVariant === 'side'" flat rounded class="query-builder px-5 pt-6 pb-5">
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

  <!-- Top UI-->
  <v-card v-else flat rounded class="query-builder mb-0 px-6 pt-5 pb-0">
    <template v-if="uiVariant.includes('sentence')">
      <QuerySentence />
    </template>

    <template v-else>
      <div class="query-builder-top">
        <!-- Entity Filters -->
        <div class="mr-4" v-if="querySubjectEntity !== 'works'">
          <query-filter-tree
            :subject-entity="querySubjectEntity"
            :filters="query.filter_aggs" />
        </div>

        <!-- Works Filters -->
        <div :style="metricsColStyle">
          <query-filter-tree
            subject-entity="works"
            :isWithAggs="querySubjectEntity !== 'works'"
            :filters="query.filter_works" />
        </div>
      </div>
    </template>
  </v-card>
</template>


<script>
import { mapGetters, mapState } from "vuex";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";
import QueryActions from "@/components/Query/QueryActions.vue";
import QuerySentence from "@/components/Query/QuerySentence.vue";

export default {
  name: "QueryBuilder",
  components: {
    QuerySummarizeBy,
    QueryFilterTree,
    QueryColumnsControls,
    QueryActions,
    QuerySentence,
    NewQueryButton
  },
  computed: {
    ...mapState(['uiVariant']),
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
      "metricsColumnPercentage",
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
    },
    metricsColStyle() {
      return this.isWorks ? {} : {
        flexBasis: `${this.metricsColumnPercentage}%`,
        maxWidth: `${this.metricsColumnPercentage}%`,
      };
    },
  }
}
</script>

<style>
.results-box .query-builder {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-bottom: 0 !important;
}
.results-box.ui-side .query-builder {
  border-bottom-left-radius: 10px !important;
  border-bottom-right-radius: 10px !important;
  padding-bottom: 0 !important;
}
.query-builder-top {
  display: flex;
  align-items: stretch;
}
.query-builder-top > div {
  flex: 1;
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
  padding: 0px 5px !important;
}
.query-builder .menu-chip {
  cursor: pointer;
  background-color: transparent !important;
  border: none;
  border-bottom: 1px solid;
  border-radius: 0 !important;
  padding: 0px 0px !important;
  margin: 0 3px;
  height: 20px !important;
}
.query-builder .menu-chip .v-icon {
  margin-right: -4px;
}
.query-builder-input.v-text-field .v-input__control .v-input__slot {
    min-height: auto !important;
    display: flex !important;
    align-items: center !important;
    padding: 2px 4px !important;
  }
.query-builder-input.v-text-field .v-input__control .v-input__slot .v-input__append-inner {
  margin-top: 2px;
}
.query-builder-button.tight {
  padding: 0px 0px !important;
  height: 20px !important;
  width: 20px !important;
  min-width: 20px !important;
}
.new-query-button {
  margin-top: 0px;
}
.section-divider {
  border-top: 1px solid #eee;
  margin: 20px 0;
}
.section-divider.clear {
  border: none;
  margin: 20px 0;
}
</style>