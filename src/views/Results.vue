<template>
  <v-container fluid class="pt-0">
    <!--    <div>-->
    <!--      {{ $store.state.search.oql }}-->
    <!--    </div>-->


    <v-row class="">


      <v-col cols="12" lg="5">
        <v-toolbar flat color="transparent">
          <div class="text-h6">Query</div>
          <v-spacer/>
          <v-btn icon :href="searchApiUrl" target="_blank">
            <v-icon>mdi-api</v-icon>
          </v-btn>
          <v-menu rounded offset-y>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on" class=" ml-1">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item :href="searchApiUrl" target="_blank">
                <v-list-item-icon>
                  <v-icon>mdi-api</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  View in API
                  <v-icon x-small right>mdi-open-in-new</v-icon>
                </v-list-item-title>
              </v-list-item>
              <v-divider/>
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
          <search-from-text
              :disabled="!$store.state.search.is_completed"
              selected="oql"
          />


        </div>


        <query-filter-tree
            subject-entity="works"
            :filters="$store.state.search.query.filter_works"
        />
<!--        <query-filter-tree-->
<!--            class="mt-3"-->
<!--            v-if="query.summarize_by"-->
<!--            :subject-entity="query.summarize_by"-->
<!--            :filters="entityFilters"-->
<!--        />-->

        <v-card flat rounded class="my-2" v-if="cardsToShowSelected.includes('queryJson')">
          <v-card-title class="d-flex">
            <v-icon left>mdi-code-braces-box</v-icon>
            Query object
            <v-spacer/>
            <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'queryJson')">
              <!--              <v-icon>mdi-pin-off-outline</v-icon>-->
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <pre>{{ $store.state.search.query }}</pre>
          </v-card-text>
        </v-card>


      </v-col>
      <v-col cols="12" lg="7">
        <v-toolbar color="transparent" flat>
          <!--          <div class="text-h6">Results:</div>-->
          <query-summarize-by style="margin-left: -13px;"/>

          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card flat rounded>

          <results-table
              v-if="$store.state.search.is_completed"
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

    <v-dialog max-width="800" v-model="isSearchFromTextDialogOpen">
      <search-from-text :reset-query="resetSearchFromTextDialog"/>
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
        "oql",
        "queryJson",
      ],
      cardsToShowSelected: [
        "oql",
        "queryJson",
      ],
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
      "query",
      "searchApiUrl",
        "queryColumns",
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
      this.saveToLocalStorage();
    },
    isSearchFromTextDialogOpen(val) {
      this.resetSearchFromTextDialog = !this.resetSearchFromTextDialog
    }
  }
}
</script>

<style scoped lang="scss">

</style>