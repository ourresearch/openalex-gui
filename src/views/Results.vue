<template>
  <v-container fluid class="results-box pt-0">
    <v-row class="">
      <!-- Left Panel -->
      <v-col cols="12" lg="5">
        <v-row>
          <!-- Query Builder -->
          <v-col cols="12" :md="uiVariant === 'chips' ? 12 : 7" lg="12">
            <v-card flat rounded style="padding: 16px 10px">
              <div :class="{'query-section-label': true, 'inline': uiVariant === 'inline'}">Show<span v-if="!areTopLevelFiltersApplied"> all</span></div> 
              <query-summarize-by style="margin-left: 8px"/>

              <query-filter-tree
                  v-if="querySubjectEntity !== 'works'"
                  :subject-entity="querySubjectEntity"
                  :filters="query.filter_aggs"
              />
              <query-filter-tree
                  subject-entity="works"
                  :isWithAggs="querySubjectEntity !== 'works'"
                  :filters="query.filter_works"
              />

              <query-columns-controls
                :subject-entity="querySubjectEntity"
                :show_columns="query.show_columns"
                :sort_by_column="query.sort_by_column"
                :sort_by_order="query.sort_by_order"
              />
            </v-card>
          </v-col>

          <!-- Query Tabs -->
          <v-col cols="12" lg="12" md="5" v-if="uiVariant !== 'chips'">
            <v-card flat rounded>
              <v-tabs v-model="tab"> 
                <v-tab>OQL</v-tab>
                <v-tab>Query Object</v-tab>
                <v-tab>API</v-tab>
              </v-tabs>

              <v-tabs-items v-model="tab" style="padding: 10px; border-radius: 15px;"> 
                <v-tab-item>
                  <search-from-text :disabled="!$store.state.search.is_completed" />
                </v-tab-item>

                <v-tab-item>
                  <v-card-text>
                    <pre>{{ query }}</pre>
                  </v-card-text>
                </v-tab-item>

                <v-tab-item>
                  <v-btn icon :href="searchApiUrl" target="_blank">
                    <v-icon>mdi-api</v-icon>
                  </v-btn>
                </v-tab-item>
              </v-tabs-items>
            <v-spacer />
            </v-card>
          </v-col>

        </v-row>
      </v-col>

      <!-- Results Table -->
      <v-col cols="12" lg="7">
        <v-card flat rounded style="min-height: 100%;">
          <results-error v-if="$store.state.search.backend_error" />
          <results-table v-else-if="$store.state.search.is_completed" />
          <results-searching v-else />
        </v-card>
      </v-col>

    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {urlBase} from "@/apiConfig";
import {DISABLE_SERVER_CACHE} from "@/apiConfig";
import OqlBox from "@/components/OqlBox.vue";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import PropSelector from "@/components/PropSelector.vue";
import SerpResultsList from "@/components/SerpResultsList.vue";
import AnalyticViews from "@/components/AnalyticViews.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import QueryColumnsControls from "@/components/Query/QueryColumnsControls.vue";
import SearchFromText from "@/components/SearchFromText.vue";


export default {
  name: "Results",
  components: {
    SearchFromText,
    ResultsTable,
    ResultsSearching,
    ResultsError,
    QuerySummarizeBy,
    QueryOql,
    QueryFilterTree,
    QueryColumnsControls,
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
      tab: 1,
      uiVariant: this.$store.state.uiVariant,
      hasPolledOnce: false
    }
  },
  computed: {
    ...mapGetters([
      "isLocalEnv",
      "entityType",
    ]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
    ]),
    areTopLevelFiltersApplied() {
      if (this.querySubjectEntity !== 'works') {
        return this.query.filter_aggs.length !== 0
      } else {
        return this.query.filter_works.length !== 0
      }
    },
    searchApiUrl() {
      return urlBase.api + '/searches/' + this.$route.params.id
    }
  },
  methods: {
    ...mapActions("search", [
      "createSearch",
      "getSearch",
      "createSearchFromOql",
    ]),
    applyOql() {
      this.isOqlEditDialogOpen = false
      this.createSearchFromOql(this.oql)
      // this.createSearch()
    },
    toggleCard(cardId) {
      if (this.cardsToShowSelected.includes(cardId)) {
        this.cardsToShowSelected = this.cardsToShowSelected.filter(c => c !== cardId)
      } else {
        this.cardsToShowSelected.push(cardId)
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
      //console.log("pollSearch")
      await this.getSearch({
        id: this.$route.params.id,
        bypass_cache: !this.hasPolledOnce && DISABLE_SERVER_CACHE // allow a fresh page load of a query to bypass cache
      });
      this.hasPolledOnce = true;
      if (!this.$store.state.search.is_completed) {
        setTimeout(() => {
          //console.log("polling search")
          this.pollSearch();
        }, 500);
      }
    },
  },
  created() {
    this.loadFromLocalStorage()
    //console.log("Results state: ")
    //console.log(this.$store.state)
  },
  mounted() {
  },
  watch: {
    "$route.params.id": {
      handler: function () {
        this.pollSearch()
      },
      immediate: true
    },
    isOqlEditDialogOpen() {
      this.oql = this.$store.state.search.oql
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
  margin-bottom: 4px;
  margin-left: 16px;
}
.query-section-label.inline {
  display: inline-block;
}
.v-tabs {
  padding: 0 20px;
}
.v-tab {
  text-transform: none;
}
</style>