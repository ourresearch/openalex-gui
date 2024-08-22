<template>
  <v-container fluid class="pt-0">
<!--    <div class="d-flex align-center">-->
<!--      <v-spacer/>-->
<!--      Show:-->
<!--      <v-chip-group-->
<!--          class="ml-4"-->
<!--          multiple-->
<!--          v-model="cardsToShowSelected"-->
<!--          active-class="primary"-->

<!--      >-->
<!--        <v-chip-->
<!--            label-->
<!--            :value="cardName"-->
<!--            v-for="cardName in cardsToShowOptions"-->
<!--            :key="cardName"-->
<!--        >-->
<!--          {{ cardName }}-->
<!--        </v-chip>-->
<!--      </v-chip-group>-->
<!--    </div>-->


<!--    <v-row>-->
<!--      <v-col cols="6" v-if="cardsToShowSelected.includes('naturalLanguage')">-->
<!--        <v-card rounded flat>-->
<!--          <v-toolbar dense flat color="transparent">-->
<!--            <v-toolbar-title>-->
<!--              <v-icon>mdi-chat-outline</v-icon>-->
<!--              Natural language-->
<!--            </v-toolbar-title>-->
<!--            <v-spacer></v-spacer>-->
<!--            <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'naturalLanguage')">-->
<!--              <v-icon>mdi-close</v-icon>-->
<!--            </v-btn>-->
<!--          </v-toolbar>-->
<!--          <v-card-text>-->
<!--            natural language queries go here-->
<!--          </v-card-text>-->
<!--        </v-card>-->
<!--      </v-col>-->
<!--      <v-col cols="6" v-if="cardsToShowSelected.includes('oql')">-->
<!--        <v-card rounded flat class="">-->
<!--          <v-toolbar dense flat color="transparent">-->
<!--            <v-toolbar-title>-->
<!--              <v-icon>mdi-code-parentheses-box</v-icon>-->
<!--              OQL query-->
<!--            </v-toolbar-title>-->
<!--            <v-spacer></v-spacer>-->
<!--            <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'oql')">-->
<!--              <v-icon>mdi-close</v-icon>-->
<!--            </v-btn>-->
<!--          </v-toolbar>-->
<!--          <query-oql class="pa-4"/>-->
<!--        </v-card>-->
<!--      </v-col>-->
<!--    </v-row>-->


    <v-row class="">



      <v-col cols="6" xl="4" v-if="cardsToShowSelected.includes('filters')">
        <v-card rounded flat class="py-4">
<!--          <v-subheader>Filter works</v-subheader>-->
          <v-subheader>JSON Query</v-subheader>
          <pre style="font-size: 10px; line-height: 1.2;">{{ query }}</pre>
<!--          <query-filter-tree />-->

        </v-card>
      </v-col>
      <v-col cols="6" xl="8"  v-if="cardsToShowSelected.includes('results')">
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
import QuerySummarize from "@/components/Query/QuerySummarize.vue";
import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryOql from "@/components/Query/QueryOql.vue";
import QueryFilterTree from "@/components/Query/QueryFilterTree.vue";

export default {
  name: "Template",
  components: {
    ResultsTable,
    QueryFilterBranch,

    QuerySummarize,
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
      "returnedEntityType",
      "querySubjectEntityConfig",
      "query",
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