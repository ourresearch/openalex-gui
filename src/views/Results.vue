<template>
  <v-container fluid class="pt-0">
    <v-row class="">
      <v-col cols="12" lg="4">
        <v-row>
        <v-col cols="12" :md="uiVariant === 'chips' ? 12 : 7" lg="12">
          <v-card flat rounded style="padding: 16px 10px">
            
            <div class="query-section-label">Show<span v-if="!areTopLevelFiltersApplied"> all</span></div> 
            <query-summarize-by style="margin-left: 12px"/>

            <query-filter-tree
                v-if="uiVariant === null && querySubjectEntity !== 'works'"
                :subject-entity="querySubjectEntity"
                :filters="$store.state.search.query.filter_aggs"
            />
            <query-filter-tree
                v-if="uiVariant === null"
                subject-entity="works"
                :isWithAggs="querySubjectEntity !== 'works'"
                :filters="$store.state.search.query.filter_works"
            />

            <div v-if="uiVariant === 'chips'">
              <query-filter-chips
                  v-if="querySubjectEntity !== 'works'"
                  :subject-entity="querySubjectEntity"
                  :filters="$store.state.search.query.filter_aggs"
              />
              <query-filter-chips
                  subject-entity="works"
                  :isWithAggs="querySubjectEntity !== 'works'"
                  :filters="$store.state.search.query.filter_works"
              />
            </div>


           <!-- <v-toolbar flat color="transparent">
              <div class="text-h6">Query</div>
              <v-spacer/>

              <v-menu rounded offset-y>
                <template v-slot:activator="{ on }">
                  
                  <v-btn icon :href="searchApiUrl" target="_blank">
                    <v-icon>mdi-api</v-icon>
                  </v-btn>

                  <v-btn icon v-on="on" class=" ml-1">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item @click="toggleCard('queryJson')">
                    <v-list-item-icon>
                      <v-icon>mdi-code-braces-box</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>Show Query object</v-list-item-title>
                    <v-list-item-icon v-if="cardsToShowSelected.includes('queryJson')">
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-toolbar>


            <div class="d-flex align-start mb-3">
              <search-from-text :disabled="!$store.state.search.is_completed" />
            </div>

            <v-card flat rounded class="my-2" v-if="cardsToShowSelected.includes('queryJson')">
              <v-card-title class="d-flex">
                <v-icon left>mdi-code-braces-box</v-icon>
                Query object
                <v-spacer/>
                <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'queryJson')">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text>
                <pre>{{ $store.state.search.query }}</pre>
              </v-card-text>
            </v-card>
          -->

          </v-card>
        </v-col>

        <!-- Query Tabs -->
        <v-col cols="12" lg="12" md="5" v-if="uiVariant !== 'chips'">
          <v-card flat rounded>
            <v-tabs v-model="tab"> 
              <v-tab>String</v-tab>
              <v-tab>Object</v-tab>
              <v-tab>API</v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab" style="padding: 10px"> 
              <v-tab-item>
                <search-from-text :disabled="!$store.state.search.is_completed" />
              </v-tab-item>

              <v-tab-item>
                <v-card-text>
                  <pre>{{ $store.state.search.query }}</pre>
                </v-card-text>
              </v-tab-item>

              <v-tab-item>
                <v-btn icon :href="searchApiUrl" target="_blank">
                  <v-icon>mdi-api</v-icon>
                </v-btn>
              </v-tab-item>
            </v-tabs-items>
          </v-spacer>
          </v-card>
        </v-col>

        </v-row>
      </v-col>


      <!-- Results Table -->
      <v-col cols="12" lg="8">
        <v-card flat rounded>
          <results-error v-if="$store.state.search.backend_error" />
          <results-table v-else-if="$store.state.search.is_completed" />
          <results-searching v-else />
        </v-card>
      </v-col>

    </v-row>

    <v-dialog scrollable v-model="isOqlEditDialogOpen" max-width="600">
      <v-card flat rounded>
        <v-toolbar flat>
          <v-toolbar-title>Edit OQL</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="isOqlEditDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>

          <v-textarea
              v-model="oql"
              :disabled="!$store.state.search.is_completed"
              style="font-family: monospace;"
              autofocus
              auto-grow
              rounded
              filled
              rows="1"
              placeholder="OQL goes here"
              @keydown.enter.exact.prevent="applyOql"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn rounded text @click="isOqlEditDialogOpen = false">
            Cancel
          </v-btn>
          <v-btn color="primary" text @click="applyOql" :disabled="oql === $store.state.search.oql">
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
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
import QueryFilterChips from "@/components/Query/QueryFilterChips.vue";
import app from "@/App.vue";
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
    QueryFilterChips,
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
      uiVariant: this.$store.state.uiVariant,
    }
  },
  computed: {
    ...mapGetters([
      "isLocalEnv",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "worksFilters",
      "entityFilters",
      "querySubjectEntityConfig",
      "querySubjectEntity",
      "query",
      "searchApiUrl",
      "queryColumns",
    ]),
    areTopLevelFiltersApplied() {
      if (this.querySubjectEntity !== 'works') {
        return this.$store.state.search.query.filter_aggs.length !== 0
      } else {
        return this.$store.state.search.query.filter_works.length !== 0
      }
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "createSearch",
    ]),
    ...mapActions("user", []),
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
      await this.getSearch(this.$route.params.id);
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
.query-section-label {
  font-size: 16px;
  margin-bottom: 4px;
  margin-left: 16px;
}
.v-tabs {
  padding: 0 20px;
}
.v-tab {
  text-transform: none;
}
</style>