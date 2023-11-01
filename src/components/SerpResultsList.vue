<template>
  <div class="">


    <template v-if="resultsObject">
      <div v-if="!resultsCount" class="mt-8 grey--text">
        There are no results for this search.
      </div>
      <v-card outlined rounded class="ma-3 py-3">
        <table v-if="resultsCount" class="serp-results-table">
          <results-table-header/>
          <tbody>
          <results-table-row
              v-for="result in resultsObject.results"
              :key="result.id"
              :entity="result"
          />
          </tbody>
        </table>

      </v-card>


      <v-list v-if="0 && resultsCount" class="serp-results-list" nav>
        <component
            v-for="result in resultsObject.results"
            :key="result.id"
            :is="resultComponentName"
            :data="result"
        />
      </v-list>
      <div class="serp-bottom" v-if="resultsObject.results && resultsObject.results.length">
        <v-pagination
            v-model="page"
            :length="numPages"
            :total-visible="10"
            light
        />
      </div>

    </template>
    <template v-else>

    </template>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import VueJsonPretty from 'vue-json-pretty'

import {url} from "@/url";


import ResultWork from "./Result/ResultWork.vue";
import ResultAuthor from "./Result/ResultAuthor.vue";
import ResultSource from "./Result/ResultSource.vue";
import ResultPublisher from "./Result/ResultPublisher.vue";
import ResultFunder from "@/components/Result/ResultFunder.vue";
import ResultInstitution from "./Result/ResultInstitution.vue";
import ResultConcept from "./Result/ResultConcept.vue";
import {entityTypes} from "../util";
import router from "../router";
import ResultsTableHeader from "@/components/ResultsTable/ResultsTableHeader.vue";
import ResultsTableRow from "@/components/ResultsTable/ResultsTableRow.vue";
import ActionMenuItem from "@/components/Action/ActionMenuItem.vue";
import ExportButton from "@/components/ExportButton.vue";

export default {
  name: "SerpResultsList",
  components: {
    VueJsonPretty,

    ResultWork,
    ResultAuthor,
    ResultSource,
    ResultPublisher,
    ResultFunder,
    ResultInstitution,
    ResultConcept,

    ResultsTableHeader,
    ResultsTableRow,

    ActionMenuItem,
    ExportButton,


  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      resultsPerPage: 25, // not editable now, but could be in future
      // activeSortKey: "cited_by_count:desc",
    }
  },
  computed: {
    ...mapGetters([
      "entityConfig",
      "entityType",
    ]),
    resultComponentName() {
      return "result-" + this.entityConfig.nameSingular
    },
    resultsCount() {
      return this.resultsObject.meta.count
    },
    page: {
      get() {
        return this.resultsObject.meta.page
      },
      set(val) {
        url.setPage(val)
      }
    },
    numPages() {
      return Math.min(
          Math.ceil(this.resultsObject.meta.count / this.resultsPerPage),
          10
      )
    },


  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">
table.serp-results-table {

  th {
    padding: 0 10px;
    white-space: nowrap;
    background: #fff;
    display: table-cell;
    text-align: left;
    vertical-align: center;
    border-bottom: 1px solid #eee;

    .header-cell-contents {
      position: absolute;
      padding-top: 10px;
      top: 0;

    }

    .header-width {
      visibility: hidden;
      display: block;
      height: 0;
    }

    &.title-header {
      text-align: left;
      padding-left: 70px;

    }

  }
}


div.serp-results-list {
  .v-list-item__title, .v-list-item__subtitle {
    white-space: normal !important;
    line-height: 1.4 !important;
  }

}

.vjs-tree-node.is-highlight, .vjs-tree-node:hover {
  background-color: transparent !important;
}
</style>