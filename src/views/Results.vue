<template>
  <v-container fluid class="pt-0">
<!--    <div>-->
<!--      {{ $store.state.search.oql }}-->
<!--    </div>-->
    <v-card flat rounded class="mb-3 pa-3 d-flex" style="font-family: monospace;">
      <div class=" font-weight-bold d-flex flex-column align-center mr-6">
        <v-icon>mdi-code-parentheses-box</v-icon>
        <span style="font-size: 12px;">OQL</span>
      </div>
      <div class=" flex-grow-1">
        <v-textarea
            style="font-size: 12px !important; line-height: 1.2 !important;"
            v-model="oql"
            :disabled="!$store.state.search.is_ready"
            autofocus
            auto-grow
            rounded
            filled
            rows="1"
            placeholder="OQL goes here"
            @keydown.enter.exact.prevent="applyOql"
        />
      </div>
      <v-btn color="primary" icon @click="applyOql" :disabled="oql === query.oql">
        <v-icon>mdi-arrow-down</v-icon>
      </v-btn>
    </v-card>

    <v-row class="">


      <v-col cols="6" xl="4">
        <v-card rounded flat class="">
          <v-toolbar flat dense>
            <v-toolbar-title>
              Filters
            </v-toolbar-title>
            <v-spacer/>
            <v-btn
                :disabled="!filtersAreDirty || !$store.state.search.is_ready"
                rounded
                @click="applyFilters"
                color="primary"
            >
              Apply
            </v-btn>
          </v-toolbar>
          <query-filter-tree/>
        </v-card>
        <v-card rounded flat class="pa-5 my-8">
          <pre>{{ $store.state.search.query }}</pre>
        </v-card>
      </v-col>
      <v-col cols="6" xl="8" v-if="cardsToShowSelected.includes('results')">
        <v-card flat rounded>

          <div class="d-flex py-2 px-4 pr-2">
            <query-summarize-by style="position: relative; left: -20px; z-index: 99999;"/>
            <v-spacer></v-spacer>
            <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'results')">
              <v-icon>mdi-close</v-icon>
            </v-btn>

          </div>

          <results-table
              v-if="$store.state.search.is_ready"
          />
        </v-card>
      </v-col>
    </v-row>
    <!--    <v-dialog scrollable v-model="isPropSelectorDialogOpen">-->
    <!--      <prop-selector-->
    <!--          :subject-entity="'works'"-->
    <!--          @close="isPropSelectorDialogOpen = false"-->
    <!--      />-->
    <!--    </v-dialog>-->
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import OqlBox from "@/components/OqlBox.vue";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import PropSelector from "@/components/PropSelector.vue";
import SerpResultsList from "@/components/SerpResultsList.vue";
import AnalyticViews from "@/components/AnalyticViews.vue";
import QueryFilterBranch from "@/components/Query/QueryFilterBranch.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";
import app from "@/App.vue";

export default {
  name: "Template",
  components: {
    ResultsTable,
    QueryFilterBranch,

    QuerySummarizeBy,
    QueryOql,
    QueryFilterTree,
  },
  props: {},
  data() {
    return {
      isPropSelectorDialogOpen: false,
      oql: "",

      selectedFiltersTab: 0,
      selectedQueriesTab: 0,
      cardsToShowSelected: [
        "oql",
        "queryJson",
        "results",
      ],
      cardsToShowOptions: [
        "naturalLanguage",
        "oql",
        "queryJson",
        "filters",
        "results",
      ]
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
      "worksFiltersRoot",
      "summarizeByFiltersRoot",
      "querySubjectEntityConfig",
      "query",
      "filtersAreDirty",
    ]),
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
      "setQueryFromOql",
    ]),
    applyFilters() {
      this.createSearch()
    },
    applyOql() {
      this.setQueryFromOql(this.oql)
      // this.createSearch()

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
      if (!this.$store.state.search.is_ready) {
        setTimeout(() => {
          console.log("polling search")
          this.pollSearch();
        }, 500);
      }
    },
  },
  created() {
    this.loadFromLocalStorage();
  },
  mounted() {
  },
  watch: {
    "query.id": {
      handler: function () {
        this.pollSearch()
      },
      immediate: true
    },
    "$store.state.search.oql": {
      handler: function (newVal) {
        this.oql = newVal
      },
      immediate: true
    },

    cardsToShowSelected() {
      this.saveToLocalStorage();
    }
  }
}
</script>

<style scoped lang="scss">

</style>