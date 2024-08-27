<template>
  <v-container fluid class="pt-0">
    <!--    <div>-->
    <!--      {{ $store.state.search.oql }}-->
    <!--    </div>-->


    <v-row class="">


      <v-col cols="12" xl="4">
        <div class="d-flex align-start">
          <v-text-field
              rounded
              filled
              class="mb-2"
              hide-details
              placeholder="Search with natural language or OQL"
              prepend-inner-icon="mdi-magnify"
              readonly
              full-width
              @click="isSearchFromTextDialogOpen = true"
          />
          <v-btn icon class="mt-2">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>

        </div>
        <v-card flat rounded class="mb-2">
          <v-card-title class="d-flex">
            <v-icon left>mdi-code-parentheses-box</v-icon>
            OQL
            <v-spacer/>
            <v-btn icon @click="isOqlEditDialogOpen = true" :disabled="!$store.state.search.is_ready">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div style="font-family: monospace;">
              {{ $store.state.search.oql }}
            </div>
          </v-card-text>
        </v-card>


        <v-card rounded flat class="">
          <query-filter-tree/>
        </v-card>


        <v-card flat rounded class="my-2">
          <v-card-title class="d-flex">
            <v-icon left>mdi-code-braces-box</v-icon>
            Query object
            <v-spacer/>
          </v-card-title>
<!--          <v-card-text>-->
<!--            <pre>{{ $store.state.search.query }}</pre>-->
<!--          </v-card-text>-->
        </v-card>


      </v-col>
      <v-col cols="12" xl="8">
        <v-card flat rounded>

          <div class="d-flex py-2 px-4 pr-2">
            <query-summarize-by/>
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
              :disabled="!$store.state.search.is_ready"
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

    <v-dialog max-width="800" v-model="isSearchFromTextDialogOpen">
        <search-from-text :reset-query="resetSearchFromTextDialog" />
    </v-dialog>


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
import SearchFromText from "@/components/SearchFromText.vue";

export default {
  name: "Template",
  components: {
    SearchFromText,
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
      isOqlEditDialogOpen: false,
      oql: "",

      isSearchFromTextDialogOpen: false,
      resetSearchFromTextDialog: false,


      cards: [
        {
          id: "oql",
          isShowing: true,
          isMinimized: true,
        },
        {
          id: "queryJson",
          isShowing: true,
          isMinimized: true,
        },

      ],
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
      "createSearchFromOql",
    ]),
    applyOql() {
      this.isOqlEditDialogOpen = false
      this.createSearchFromOql(this.oql)
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
      // this.saveToLocalStorage();
    },
    isSearchFromTextDialogOpen(val) {
      this.resetSearchFromTextDialog = !this.resetSearchFromTextDialog
    }
  }
}
</script>

<style scoped lang="scss">

</style>