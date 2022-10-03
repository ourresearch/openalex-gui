<template>
  <v-card
      flat
      :loading="isLoading"
      tile
  >
    <v-toolbar
        v-if="!filterTypeKey"
        flat
        extended
        color="#eee"
    >

      <v-btn icon @click="filterTypeKey = null">
        <v-icon color="#333">mdi-filter</v-icon>
      </v-btn>
      <div class="text-h6">
        Filters
      </div>
      <v-spacer/>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>

      <template v-slot:extension v-if="!filterTypeKey">
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

            v-model="filterTypeSearch"
            placeholder="Search for filters"
        />
      </template>
    </v-toolbar>


    <!--      <v-divider color="#333" />-->


    <v-card
        v-if="!filterTypeKey"
        flat
    >
      <v-list
          dense
      >
        <filter-type-list-item
            v-for="facet in filterTypeSearchResults"
            :key="facet.key"
            :facet-key="facet.key"
            @select="filterTypeKey = facet.key"
        />

      </v-list>
    </v-card>


    <v-card
        v-if="filterTypeKey"
        flat
    >
      <v-toolbar
          v-if="filterTypeKey"
          flat
          dense
          class="px-0"
          @click="filterTypeKey = null"
          color="#ddd"
      >
        <v-toolbar-items>
          <v-btn  text class="body-2 low-key-button" style="margin-left: -20px;">
            <v-icon small>mdi-arrow-left</v-icon>
            Back to filters

          </v-btn>
        </v-toolbar-items>
        <v-spacer/>

      </v-toolbar>

      <v-toolbar
          flat
          extended
          color="#eee"
      >
        <v-chip
            v-if="filtersFromServer.length"
            small
            outlined
            color="primary"
            class="px-2"
        >
          {{ filtersFromServer.length }}
        </v-chip>
        <v-icon v-else class="">mdi-filter-outline</v-icon>

        <div class="text-h6 ml-1" style="font-weight: normal;">
          {{ myFacetConfig.displayName }}
        </div>
        <v-spacer/>
        <v-btn icon @click="filterTypeKey = null">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <template v-slot:extension>
          <v-text-field
              flat
              outlined
              dense
              solo
              hide-details
              prepend-inner-icon="mdi-magnify"
              full-width
              clearable
              class="pb-4"

              v-model="search"
              :placeholder="searchPlaceholder"
          />
        </template>
      </v-toolbar>


      <div
          style="height: 80vh; overflow-y:scroll;"
      >
        <facet-option
            v-for="filter in filtersToShow"
            :filter="filter"
            :show-checked="filter.isResultsFilter"
            :key="filter.asStr + filter.isResultsFilter"
            :indent="filterTypeKey === 'oa_status' && filter.value != 'closed'"

        />
      </div>


    </v-card>


  </v-card>

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
  props: {},
  data() {
    return {
      search: "",
      filterTypeSearch: "",
      filterTypeKey: null,
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
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    filterTypeSearchResults() {
      return this.searchFacetConfigs.filter(c => {
        return c.displayName.toLowerCase().match(this.filterTypeSearch.toLowerCase())
      })
    },
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.filterTypeKey)
    },
    filtersToShow() {
      // let ret = [...this.filtersFromServer]
      if (!this.filtersFromAutocomplete.length) return []
      const fromAutocomplete = this.filtersFromAutocomplete
          .filter(f => f.value !== "unknown")
          .filter(f => {

            // only push potential filter values if they're not already loaded as
            // in a resultsFilter
            return !this.filtersFromServer.map(f => f.asStr).includes(f.asStr)
          })


      if (this.myFacetConfig.sortByValue) {
        fromAutocomplete.sort((a, b) => {
          return (a.value > b.value) ? -1 : 1
        })
      }

      const ret = [...this.filtersFromServer, ...fromAutocomplete]


      const maxCount = Math.max(...ret.map(r => r.count))
      ret.forEach(f => {
        f.countNormalized = f.count / maxCount
      })


      return ret
    },


    filtersFromServer() {
      // these ones are already selected by the user. we got them from the store,
      // which refreshes them from the server every time we search.
      // (which may have gotten from either user action or the URL)
      return this.$store.state.resultsFilters
          .filter(f => {
            return f.key === this.filterTypeKey
          })
          .map(f => {
            return {...f, isResultsFilter: true}
          })
    },
    autocompleteUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `autocomplete/${this.entityType}/filters/${this.myFacetConfig.key}`
      console.log("calling autocomplete url", url.pathname)

      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.filterTypeKey)
      url.searchParams.set("filter", filtersAsUrlStr(myFilters))

      if (this.textSearch) url.searchParams.set("search", this.textSearch)

      console.log("set searchParams: ", this.search, this.search === "")
      url.searchParams.set("q", "")
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
    },
    "filterTypeKey": {
      handler(newVal, oldVal) {
        this.filtersFromAutocomplete = []
        this.setFilterOptions()
        this.search = ""
      }
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