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
        <v-toolbar v-else dense flat class="">
          <div class="grey--text">
            {{ resultsCount | toPrecision }} results
          </div>
          <v-spacer/>
          <v-menu>
            <template v-slot:activator="{on}">
              <v-btn
                  :icon="$vuetify.breakpoint.mobile"
                  text
                  rounded
                  class="font-weight-regular"
                  v-on="on"
              >
                <v-icon v-if="$vuetify.breakpoint.mobile">mdi-sort</v-icon>
                <template v-else>
                  <v-icon left class="">mdi-sort</v-icon>
                  Sort by {{ activeSortConfig.displayName }}
                </template>
              </v-btn>
            </template>
            <v-list>
              <v-subheader>Sort by</v-subheader>
              <v-divider></v-divider>
              <v-list-item-group
                  mandatory
                  v-model="activeSortKey"
              >
                <v-list-item
                    v-for="sortConfig in sortObjectOptions"
                    :key="sortConfig.key"
                    :value="sortConfig.key"
                >
                  <v-list-item-icon>
                      <v-icon v-if="activeSortKey === sortConfig.key">mdi-check</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ sortConfig.displayName }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

              </v-list-item-group>
            </v-list>
          </v-menu>

        </v-toolbar>
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
import router from "../router";


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
      // activeSortKey: "cited_by_count:desc",
    }
  },
  computed: {
    ...mapGetters([
      "entityConfig",
      "entityType",
    ]),
    activeSortKey: {
      get(){
        const fromUrl = this.$route.query.sort
        const fromDefault = this.defaultSort
        return fromUrl ?? fromDefault
      },
      set(val){
        this.pushQueryChanges({
          sort: val
        })
      }
    },
    resultComponentName() {
      return "result-" + this.entityConfig.nameSingular
    },
    isSearchFilterApplied() {
      const params = new URLSearchParams(this.$route.query)
      return params.toString().indexOf(".search") > -1
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
      return sortDefaults[this.entityType][(this.isSearchFilterApplied) ? "textSearch" : "noTextSearch"]
    },

    sortObjectOptions() {
      // if (!this.resultsCount) return
      return sortConfigs.filter(sortConfig => {
        if (sortConfig.requiresTextSearch && !this.isSearchFilterApplied) return false
        if (!sortConfig.showForEntityTypes.includes(this.entityType)) return false
        return true
      })
    },
    activeSortConfig() {
      return sortConfigs.find(sortConfig => {
        return sortConfig.key === this.activeSortKey
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
    async pushQueryChanges(query) {

      const pushTo = {
        name: "Serp",
        query: {
          ...this.$route.query,
          ...query,
        }
      }
      console.log("pushQueryChanges", query)
      await this.$router.push(pushTo)
          .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
              throw e
            }
          })

    }



  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    },
    // "$route": {
    //   immediate: true,
    //   handler(to){
    //     if (this.isSearchFilterApplied && this.activeSortConfig.requiresTextSearch) {
    //       this.activeSortKey = this.defaultSort
    //     }
    //   }
    // }
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