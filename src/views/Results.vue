<template>
  <v-container fluid class="pt-0">

    <v-row class="">


      <v-col cols="6" xl="4" v-if="cardsToShowSelected.includes('filters')">
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
    ]),
    applyFilters() {
      this.createSearch()
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
    "$route.params.id": {
      handler: function () {
        this.pollSearch()
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