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
        <div class="mx-4">
          <div v-if="!resultsCount" class="mt-8 grey--text">
            There are no results for this search.
          </div>
          <div v-else class="d-flex">
            <div class="mt-4 grey--text">
              {{ resultsCount | toPrecision }} results
            </div>
            <v-spacer/>
            <v-menu>
              <template v-slot:activator="{on}">
                <v-btn icon class="font-weight-regular" text v-on="on">
                  <v-icon>mdi-sort</v-icon>
                  <v-icon v-if="$vuetify.breakpoint.mobile">mdi-sort</v-icon>
                  <template v-else>
                    <v-icon left class="">mdi-sort</v-icon>
                    Sort by {{ sortObject.displayName }}
                  </template>
                </v-btn>
              </template>
              <v-list>
                <v-subheader>Sort by</v-subheader>
                <v-divider></v-divider>
                <v-list-item
                    v-for="mySortOption in sortObjectOptions"
                    :key="mySortOption.key"
                    @click="setSort(mySortOption.key)"
                >
                  <v-list-item-icon>
                    <v-icon>
                      {{ (sortObject.key === mySortOption.key) ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ mySortOption.displayName }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>

          </div>
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
      <div class="serp-bottom" v-if="resultsObject.results.length">
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


const sortConfigs = [
  {
    key: "cited_by_count:desc",
    displayName: "Citations",
    showForEntityTypes: entityTypes.all(),
  },
  {
    // only for non-work entities
    key: "works_count:desc",
    displayName: "Works",
    showForEntityTypes: entityTypes.allExcept("works"),
  },
  {
    // only for works
    key: "publication_date:desc",
    displayName: "Date",
    showForEntityTypes: ["works"],
  },
  {
    // only if there's a text search on
    key: "relevance_score:desc",
    displayName: "Relevance",
    showForEntityTypes: entityTypes.all(),
    requiresTextSearch: true,
  },
]


const sortDefaults = {
    works: {
        textSearch: "relevance_score:desc",
        // noTextSearch: "publication_date:desc",
        noTextSearch: "cited_by_count:desc",
    },
    authors: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    sources: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    publishers: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    funders: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    institutions: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
    concepts: {
        textSearch: "relevance_score:desc",
        noTextSearch: "works_count:desc",
    },
}

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
      isTextSearch: false,
      sort: "cited_by_count:desc",
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
    defaultSort() {
      return sortDefaults[this.entityType][(this.isTextSearch) ? "textSearch" : "noTextSearch"]
    },

    sortObjectOptions() {
      return sortConfigs
      if (!this.resultsCount) return
      return sortConfigs.filter(sortConfig => {
        if (sortConfig.requiresTextSearch && !this.isTextSearch) return false
        if (!sortConfig.showForEntityTypes.includes(this.entityType)) return false
        return true
      })
    },
    sortObject() {
      return sortConfigs.find(sortOption => {
        return sortOption.key === this.sort
      })
    },


  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "setSort",
    ]),

    setSort(sortKey) {
      const mySortConfig = sortConfigs.find(c => c.key === sortKey)
      if (mySortConfig) this.sort = mySortConfig.key
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
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