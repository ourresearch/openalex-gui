<template>
  <v-container fluid :class="{'results-box': true, 'ui-side': uiVariant === 'side'}">
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
</template>

<script>

import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
import {DISABLE_SERVER_CACHE} from "@/apiConfig";
import ResultsTable from "@/components/Results/ResultsTable.vue";
import ResultsSearching from "@/components/Results/ResultsSearching.vue";
import ResultsError from "@/components/Results/ResultsError.vue";
import QueryBuilder from "@/components/Query/QueryBuilder.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryTabs from "@/components/Query/QueryTabs.vue";

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
      pollCount: 0
    }
  },
  computed: {
    ...mapState(['uiVariant', 'isInitialLoad']),
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
        bypass_cache: this.isIntialLoad && this.pollCount === 0 && DISABLE_SERVER_CACHE,
        is_polling: true,
      });
      this.pollCount++;
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
      handler: async function (id) {
        if (!id) { return; }
        await this.getSearch({id, is_polling: !this.isInitialLoad});
        this.pollCount = 0;
        this.pollSearch();
        this.setIsInitialLoad(false);
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