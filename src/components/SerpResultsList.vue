<template>
  <div class="">
    <template v-if="resultsObject">
      <v-card flat dark class="ma-2" v-if="apiMode">
        <vue-json-pretty
            v-if="resultsObject"
            :data="resultsObject"
            :deep="3"
            :show-icon="true"
            :show-length="true"
            style="font-size: 12px;"
            class="pa-4"

        />
      </v-card>
      <v-card flat v-else>
        <div v-if="!resultsCount" class="mt-8 grey--text">
          There are no results for this search.
        </div>
        <v-list v-if="resultsCount" class="serp-results-list" nav>
          <component
              v-for="result in resultsObject.results"
              :key="result.id"
              :is="resultComponentName"
              :data="result"
          />
        </v-list>
      </v-card>
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
  },
  props: {
    apiMode: Boolean,
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
    ...mapActions([
    ]),



  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style lang="scss">
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