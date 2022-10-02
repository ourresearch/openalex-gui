<template>
  <div>
    <v-dialog
        v-model="zoomIsOpen"
        scrollable
        max-width="500"
    >


      <v-card flat :loading="isLoading">
        <v-toolbar
            class="px-0"
            flat
            :extended="!!myFacetConfig"
        >
          <v-icon class="mr-2">mdi-filter-outline</v-icon>
          <v-toolbar-title class="mr-6">
            <template v-if="myFacetConfig">
              <router-link
                  :to="{name: 'filter-types', query: {...$route.query}}"
                  class="text-decoration-none"
              >
                Filters
              </router-link>
              <v-icon>mdi-chevron-right</v-icon>
              <span class="font-weight-bold">{{ myFacetConfig.displayName }}</span>
            </template>
            <span v-else>Filters</span>

          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon :to="{name: 'Serp', query: {...$route.query}}" class="no-active">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <template v-slot:extension v-if="myFacetConfig">
            <v-text-field
                flat
                outlined
                dense
                solo
                hide-details
                prepend-inner-icon="mdi-magnify"
                full-width
                clearable
                class="pb-2"

                v-model="search"
                :placeholder="searchPlaceholder"
            />
          </template>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text
            v-if="$route.params.filterTypeKey"
            class="pa-0"
            style="font-size: 16px; min-height: 70vh;"
        >
          <facet-option
              v-for="filter in filtersFromServer"
              :filter="filter"
              :show-checked="filter.isResultsFilter"
              :key="filter.asStr + filter.isResultsFilter"
              :indent="$route.params.filterTypeKey === 'oa_status' && filter.value != 'closed'"
          />
          <facet-option
              v-for="filter in filtersToShow"
              :filter="filter"
              :show-checked="filter.isResultsFilter"
              :key="filter.asStr + filter.isResultsFilter"
              :indent="$route.params.filterTypeKey === 'oa_status' && filter.value != 'closed'"
          />
        </v-card-text>


        <v-card-text
            v-else
            class="pa-0"
            style="font-size: 16px; min-height: 20vh;"
        >
          <v-list
              dense
          >
            <filter-type-list-item
                v-for="facet in searchFacetConfigs"
                :key="facet.key"
                :facet-key="facet.key"
            />
          </v-list>
        </v-card-text>
        <v-divider/>


        <v-card-actions class="">
          <v-btn
              text
          >
            View {{ resultsCount | millify }} results
          </v-btn>
          <v-spacer />
          <v-btn>export</v-btn>
        </v-card-actions>


      </v-card>
    </v-dialog>
  </div>

</template>


<script>
import {entityConfigs} from "../../entityConfigs";

import {entityTypeFromId} from "../../util";
import {createDisplayFilter, createSimpleFilter, filtersAsUrlStr} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import FacetOption from "../Facet/FacetOption";
import {api} from "../../api";
import axios from "axios";
import {url} from "../../url";
import FilterTypeListItem from "../Facet/FilterTypeListItem";
import _ from "lodash"

const compareByCount = function (a, b) {
  if (a.count > b.count) {
    return -1;
  }
  if (a.count < b.count) {
    return 1;
  }
  return 0;
}


export default {
  components: {
    FacetOption,
    FilterTypeListItem,
  },
  props: {
    data: Object,
    append: String,
  },
  data() {
    return {
      search: "",
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,
    }
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "resultsCount",
      "entityZoomData",
      "searchFacetConfigs",
      "resultsFilters",
      "zoomId",
      "textSearch",
      "entityType",
      "zoomTypeConfig",
      "entityZoomHistoryData",
    ]),
    zoomIsOpen: {
      get() {
        return true
      },
      set(newVal) {
        console.log("close filter zoom")
        this.$router.push({name: "Serp", query: {...this.$route.query}})
      }
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.$route.params.filterTypeKey)
    },
    filtersToShow() {
      // let ret = [...this.filtersFromServer]
      const ret = this.filtersFromAutocomplete
          .filter(f => f.value !== "unknown")
          .filter(f => {

            // only push potential filter values if they're not already loaded as
            // in a resultsFilter
            return !this.filtersFromServer.map(f => f.asStr).includes(f.asStr)
          })

      const maxCount = Math.max(...ret.map(r => r.count))
      console.log("max count", maxCount)
      ret.forEach(f => {
        f.countNormalized = f.count / maxCount
      })

      if (this.myFacetConfig.sortByValue) {
        ret.sort((a, b) => {
          return (a.value > b.value) ? -1 : 1
        })
      }

      return ret
    },


    filtersFromServer() {
      // these ones are already selected by the user. we got them from the store,
      // which refreshes them from the server every time we search.
      // (which may have gotten from either user action or the URL)
      return this.$store.state.resultsFilters
          .filter(f => {
            return f.key === this.$route.params.filterTypeKey
          })
          .map(f => {
            return {...f, isResultsFilter: true}
          })
    },
    autocompleteUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `autocomplete/${this.entityType}/filters/${this.myFacetConfig.key}`
      console.log("calling autocomplete url", url.pathname)

      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.$route.params.filterTypeKey)
      url.searchParams.set("filter", filtersAsUrlStr(myFilters))

      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("q", this.search ?? "")
      url.searchParams.set("email", "team@ourresearch.org")

      return url.toString()
    },
  },

  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),


    facetZoomLink(key) {
      return url.addZoomToRoute(
          this.$router,
          "filters:" + key,
          false
      )
    },
    async setFilterOptions() {
      if (!this.myFacetConfig || this.myFacetConfig.noOptions) return
      await this.fetchSuggestions()
    },
    fetchSuggestions: _.debounce(
        function () {
          this.isLoading = true
          console.log("fetchSuggestions calling", this.autocompleteUrl)
          axios.get(this.autocompleteUrl)
              .then(resp => {
                this.filtersFromAutocomplete = resp.data.filters.map(apiData => {
                  return createDisplayFilter(
                      this.myFacetConfig.key,
                      apiData.value,
                      apiData.display_value,
                      apiData.works_count,
                  )
                })
                this.isLoading = false
              })
        },
        250
    )


  },
  created() {
  },
  mounted() {
  },
  watch: {
    search(newVal, oldVal) {
      console.log("search changed", newVal)
      this.fetchSuggestions()
    },
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.setFilterOptions()
        this.search = ""
      }
      ,
    },
  }
}
</script>

<style lang="scss">
.entity-zoom-container {
  //position: absolute;
  //top: 0;
  //right: 0;
  //left: 0;
  //bottom: 0;
}

</style>