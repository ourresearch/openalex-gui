<template>
  <v-container fluid class="pt-0">
    <!--    <div>-->
    <!--      <v-select-->
    <!--          v-model="cardsToShowSelected"-->
    <!--          :items="cardsToShowOptions"-->
    <!--          chips-->
    <!--          multiple-->
    <!--          clearable-->
    <!--          deletable-chips-->
    <!--          rounded-->
    <!--          filled-->
    <!--          ref="cardsToShow"-->
    <!--          @input="$refs.cardsToShow.blur()"-->
    <!--      >-->

    <!--      </v-select>-->
    <!--    </div>-->
    <div class="d-flex align-center">
      <v-spacer />
      Show:
      <v-chip-group
          class="ml-4"
          multiple
          v-model="cardsToShowSelected"
          active-class="primary"

      >
        <v-chip
            label
            :value="cardName"
            v-for="cardName in cardsToShowOptions"
            :key="cardName"
        >
          {{ cardName }}
        </v-chip>
      </v-chip-group>
    </div>

    <v-row class="mt-12">

      <v-col v-if="cardsToShowSelected.includes('naturalLanguage')">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>
            <v-icon>mdi-chat-outline</v-icon>
            Natural language
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'naturalLanguage')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card rounded flat>
          <v-card-text>
            natural language queries go here
          </v-card-text>
        </v-card>
      </v-col>


      <v-col v-if="cardsToShowSelected.includes('oql')">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>
            <v-icon>mdi-code-parentheses-box</v-icon>
            OQL query
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'oql')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card rounded flat>
          OQL goes here
        </v-card>
      </v-col>


      <v-col v-if="cardsToShowSelected.includes('queryJson')">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>
            <v-icon>mdi-code-json</v-icon>
            JSON query
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'queryJson')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card rounded flat>
          <v-card-text>
            <pre style="font-size: 11px;line-height: 1.2;">{{ query }}</pre>
          </v-card-text>
        </v-card>
      </v-col>


      <v-col v-if="cardsToShowSelected.includes('filters')">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>
            <v-icon>mdi-filter-outline</v-icon>
            Filter
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'filters')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card rounded flat>
          <v-tabs
              v-model="selectedFiltersTab"
              background-color="transparent"
              grow
              class=""
          >
            <v-tab key="0" class="text-lowercase">
              <v-icon left>mdi-file-document-outline</v-icon>
              works
            </v-tab>
            <v-tab
                key="1"
                class="text-lowercase"
                :disabled="!query.summarize_by"
            >
              <v-icon left>mdi-format-list-group</v-icon>
              summaries
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="selectedFiltersTab">
            <v-tab-item key="0">
              <query-filter-branch
                  subject-entity="works"
                  :id="worksFiltersRoot?.id"
              />
            </v-tab-item>
            <v-tab-item key="1">
              <query-filter-branch
                  :subject-entity="query.summarize_by"
                  :id="summarizeByFiltersRoot?.id"
              />
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </v-col>
      <v-col v-if="cardsToShowSelected.includes('results')">
        <v-toolbar dense flat color="transparent">
          <v-toolbar-title>
            <v-icon>mdi-file-document-outline</v-icon>
            Works
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="cardsToShowSelected = cardsToShowSelected.filter(c => c !== 'results')">
            <v-icon>mdi-close</v-icon>
          </v-btn>

        </v-toolbar>
        <v-card flat rounded>
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

export default {
  name: "Template",
  components: {
    AnalyticViews, SerpResultsList,
    OqlBox,
    ResultsTable,
    PropSelector,
    QueryFilterBranch,
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
    }


  },
  created() {
    this.loadFromLocalStorage();
  },
  mounted() {
  },
  watch: {
    "$route.params.id": {
      handler: function (value) {
        this.getSearch(value)
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