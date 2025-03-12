<template>
  <v-container fluid class="results-box pt-0">
    <v-row class="">
      <!-- Left Panel -->
      <v-col cols="12" md="5">
        <v-row>
          <!-- Query Builder -->
          <v-col cols="12">
            <v-card flat rounded class="px-5 pt-3 pb-5">
              <div class="d-flex justify-space-between">
                <div>
                  <div :class="{'query-section-label': true, 'inline': uiVariant === 'inline'}">Show<span v-if="!areTopLevelFiltersApplied"> all</span></div> 
                  <query-summarize-by />
                </div>
              </div>

              <query-filter-tree
                v-if="querySubjectEntity !== 'works'"
                :subject-entity="querySubjectEntity"
                :filters="query.filter_aggs"
              />

              <div class="section-divider" v-if="querySubjectEntity !== 'works'"/>

              <query-filter-tree
                subject-entity="works"
                :isWithAggs="querySubjectEntity !== 'works'"
                :filters="query.filter_works"
              />

              <div class="section-divider"/>

              <query-columns-controls />

              <div class="section-divider"/>

              <div class="new-query-box">
                <new-query-button rounded />
              </div>
            </v-card>
          </v-col>

          <!-- Query Tabs -->
          <v-col class="d-none d-md-block" cols="12" v-if="uiVariant !== 'chips'">
            <v-card flat rounded>
              <v-tabs v-model="tab"> 
                <v-tab>Query Object</v-tab>
                <v-tab>OQL</v-tab>
                <v-tab>SQL</v-tab>
                <v-tab>API</v-tab>
              </v-tabs>

              <v-tabs-items v-model="tab" style="padding: 10px; border-radius: 15px;"> 
                <v-tab-item>
                  <v-card-text>
                    <pre>{{ query }}</pre>
                  </v-card-text>
                </v-tab-item>
                
                <v-tab-item>
                  <search-from-text :disabled="!queryIsCompleted" />
                </v-tab-item>

                <v-tab-item>
                  <v-card-text>
                    <pre class="sql">{{ formattedSql }}</pre>
                  </v-card-text>
                </v-tab-item>

                <v-tab-item>
                  <a class="api-link" :href="searchApiUrl" target="_blank">{{ searchApiUrl }}</a>
                </v-tab-item>
              </v-tabs-items>
            <v-spacer />
            </v-card>
          </v-col>

        </v-row>
      </v-col>

      <!-- Results Table -->
      <v-col cols="12" md="7">
        <v-card flat rounded style="min-height: 100%;">
          <results-error v-if="queryBackendError" />
          <results-table v-else-if="queryIsCompleted" />
          <results-searching v-else />
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
import { format } from 'sql-formatter';
import {urlBase} from "@/apiConfig";
import {DISABLE_SERVER_CACHE} from "@/apiConfig";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import SearchFromText from "@/components/SearchFromText.vue";
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";


export default {
  name: "Results",
  metaInfo() {
    return {
      title: this.$store.state.search.pageTitle,
    };
  },
  components: {
    SearchFromText,
    ResultsTable,
    ResultsSearching,
    ResultsError,
    QuerySummarizeBy,
    QueryOql,
    QueryFilterTree,
    QueryColumnsControls,
    NewQueryButton
  },
  props: {},
  data() {
    return {
      isPropSelectorDialogOpen: false,
      isOqlEditDialogOpen: false,
      oql: "",
      resetSearchFromTextDialog: false,
      cards: [
        "oql",
        "queryJson",
      ],
      cardsToShowSelected: [
        "oql",
        "queryJson",
      ],
      tab: 0,
      pollCount: 0
    }
  },
  computed: {
    ...mapState(['uiVariant', 'isIntialLoad']),
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
    areTopLevelFiltersApplied() {
      if (this.querySubjectEntity !== 'works') {
        return this.query.filter_aggs.length !== 0;
      } else {
        return this.query.filter_works.length !== 0;
      }
    },
    searchApiUrl() {
      return urlBase.api + '/searches/' + this.$route.params.id;
    },
    formattedSql() {
      const rawSql = this.querySql;
      if (!rawSql) { return ""; }
      return format(rawSql, {language: "redshift"});
    }
  },
  methods: {
    ...mapMutations([
      "setIsIntialLoad",
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
    applyOql() {
      this.isOqlEditDialogOpen = false;
      this.createSearchFromOql(this.oql);
    },
    toggleCard(cardId) {
      if (this.cardsToShowSelected.includes(cardId)) {
        this.cardsToShowSelected = this.cardsToShowSelected.filter(c => c !== cardId);
      } else {
        this.cardsToShowSelected.push(cardId);
      }
    },
    saveToLocalStorage() {
      const dataToSave = {
        cardsToShowSelected: this.cardsToShowSelected,
      };
      localStorage.setItem('resultsPageData', JSON.stringify(dataToSave));
    },
    loadFromLocalStorage() {
      const savedData = localStorage.getItem('resultsPageData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.cardsToShowSelected = parsedData.cardsToShowSelected;
      }
    },
    async pollSearch() {
      if (this.queryIsCompleted || this.isSearchCanceled) { return; }
      
      await this.getSearch({
        id: this.$route.params.id,
        bypass_cache: this.isIntialLoad && this.pollCount === 0 && DISABLE_SERVER_CACHE // allow a fresh page load of a query to bypass cache
      });
      this.pollCount++;
      this.setIsIntialLoad(false);
      setTimeout(() => {
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
    }
  },
  created() {
    this.loadFromLocalStorage();
    //console.log("Results state: ")
    //console.log(this.$store.state)
  },
  mounted() {
  },
  watch: {
    "$route.params.id": {
      handler: function () {
        this.pollCount = 0;
        this.pollSearch();
      },
      immediate: true
    },
    isOqlEditDialogOpen() {
      this.oql = this.queryOql;
    },
    cardsToShowSelected() {
      this.saveToLocalStorage();
    },
  }
}
</script>


<style lang="scss">
.results-box {
  margin-bottom: 20px;
}
.query-section-label {
  font-size: 18px;
  margin-bottom: 6px;
}
.query-section-label.inline {
  display: inline-block;
}
.section-divider {
  border-top: 1px #ddd solid;
  margin: 24px 40px;
}
.new-query-button {
  margin-top: 0px;
}
.v-tabs {
  padding: 0 20px;
}
.v-tab {
  text-transform: none;
}
.sql {
  overflow-x: scroll;
}
</style>