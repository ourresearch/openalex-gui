<template>
  <div class="color-2 py-12">
    <v-container fluid :class="['results-box', `ui-${uiVariant}`]">
      <v-row>
        <!-- Left Panel -->
        <v-col cols="12" :md="uiVariant === 'side' ? 5 : 12" class="py-0">
          <v-row>
            <!-- Query Builder -->
            <v-col cols="12" class="query-builder">
              <query-builder />
            </v-col>

            <!-- Query Tabs -->
            <v-col v-if="uiVariant === 'side'" class="d-none d-md-block" cols="12">
              <query-tabs />
            </v-col>

          </v-row>
        </v-col>

        <!-- Results Table -->
        <v-col cols="12" :md="uiVariant === 'side' ? 7 : 12">
          <v-card flat rounded class="results-table-box" style="min-height: 100%;">
            <results-table/>
          </v-card>
        </v-col>

      </v-row>
    </v-container>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
import store from "@/store";
import {DISABLE_SERVER_CACHE} from "@/apiConfig";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import QueryBuilder from "@/components/Query/QueryBuilder.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryTabs from "@/components/Query/QueryTabs.vue";
import {getLabelsInQuery} from "@/query";

export default {
  name: "Results",
  metaInfo() {
    return {
      title: this.$store.state.search.pageTitle,
    };
  },
  components: {
    ResultsTable,
    ResultsSearching,
    ResultsError,
    QueryOql,
    QueryBuilder,
    QueryTabs,
  },
  props: {},
  data() {
    return {
      pollCount: 0,
      pollTimer: null,
    }
  },
  computed: {
    ...mapState(['uiVariant', 'isInitialLoad']),
    ...mapGetters("user", [
      "userId",
      "isTester",
    ]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
      "queryIsCompleted",
      "queryBackendError",
      "querySql",
      "queryOql",
      "isSearchCanceled",
      "hasQueryChanged",
      "isBaseQuery",
    ]),
  },
  methods: {
    ...mapMutations([
      "setIsInitialLoad",
    ]),
    ...mapActions("search", [
      "createSearch",
      "getSearch",
      "createSearchFromOql",
      "resetToSubmittedQuery",
    ]),
    ...mapMutations("search", [
      "setSearchCanceled",
    ]),
    async pollSearch() {
      if (this.queryIsCompleted || this.isSearchCanceled) { return; }
      
      await this.getSearch({
        id: this.$route.params.id,
        is_polling: true,
      });
      this.pollCount++;
      this.pollTimer = setTimeout(() => {
        //console.log("polling search")
        this.pollSearch();
      }, 500);
    },
    cancelSearch() {
      if (!this.queryIsCompleted) { 
        this.setSearchCanceled(true);
      } else {
        this.resetToSubmittedQuery();
      }
    },
    cancelPollTimer() {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
      }
    },
    areResultsStale() {
      const searchState = store.state.search;
      const userState = store.state.user; 

      if (searchState.id && searchState.query && searchState.results_timestamps?.completed) {
        const labelsInQuery = getLabelsInQuery(searchState.query);
        const labelModTimestamps = userState.labelLastModified;
        
        let needsRefresh = false;
        const resultsTime = new Date(searchState.results_timestamps.completed).getTime();
        for (const labelId of labelsInQuery) {
            if (labelModTimestamps[labelId] && labelModTimestamps[labelId] > resultsTime) {
              needsRefresh = true;
              break; 
            }
        }

        if (needsRefresh) {
          console.log("Results are stale");
        }

        return needsRefresh;
      }
    },
  },
  created() {
    if (this.userId && !this.isTester) {
      this.$router.replace({name: 'AnalyticsTesting'});
    }
  },
  beforeDestroy() {
    this.cancelPollTimer();
  },
  watch: {
    "$route.params.id": {
      handler: async function (id) {
        if (!id) { return; }
        this.cancelPollTimer();
        console.log("Initial load with ID, poll count: ", this.pollCount);
        const bypass_cache = this.areResultsStale() || (this.isInitialLoad && this.pollCount === 0 && DISABLE_SERVER_CACHE);
        await this.getSearch({id, is_polling: !this.isInitialLoad, bypass_cache});
        this.pollCount = 0;
        this.pollSearch();
        this.setIsInitialLoad(false);
      },
      immediate: true
    },
  }
}
</script>


<style lang="scss">
.results-box {
  padding: 0 20px;
}
body .results-box .v-card.query-builder {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 10px;
}
body .results-box .v-card.results-table-box {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
  padding-top: 0 !important;
  margin-top: 0 !important;
}
.results-box .query-filter-tree {
  margin-bottom: 0px !important;
}
</style>