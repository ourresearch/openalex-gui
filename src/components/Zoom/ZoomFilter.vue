<template>


  <v-navigation-drawer
      app
      width="400"
      v-model="isOpen"
      :mini-variant.sync="isMini"
  >


    <v-card
        flat
        :loading="isLoading"
        tile
    >
      <v-list
          :color="(filterTypeKey) ? '#eee' : '#f5f5f5' "
          class="pt-0"
          :class="(filterTypeKey) ? 'pb-0' : 'pb-2'"
      >
        <v-list-item @click="topListItemClick">
          <v-list-item-icon>
            <v-chip
                v-if="resultsFilters.length"
                small
                color="primary"
                class="px-2"
            >
              {{ resultsFilters.length }}
            </v-chip>
            <v-icon v-else color="primary">mdi-filter-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="text-h6">
            {{ "Filter" | pluralize(resultsFilters.length) }}
          </v-list-item-title>
          <v-btn
              icon
              @click.stop="clearAllFilters"
              v-if="!filterTypeKey"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </v-list-item>

        <v-list-item v-if="!filterTypeKey">
          <v-list-item-icon>
            <v-icon>mdi-magnify</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="">
            <v-text-field
                flat
                outlined
                dense
                solo
                hide-details
                full-width
                clearable
                autofocus

                v-model="filterTypeSearch"
                placeholder="Search for filters"
            />
          </v-list-item-title>
        </v-list-item>

      </v-list>


      <v-list class="pt-0" color="#f5f5f5" v-if="filterTypeKey">
        <v-list-item>
          <v-list-item-icon>
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
          </v-list-item-icon>
          <v-list-item-content class="font-weight-bold">
            {{ myFacetConfig.displayName }}
          </v-list-item-content>
          <v-btn icon @click="filterTypeKey = null">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>

          <!--          <v-btn icon @click="filterTypeKey = null">-->
          <!--            <v-icon>mdi-close</v-icon>-->
          <!--          </v-btn>-->

        </v-list-item>

        <v-list-item>
          <v-list-item-icon>
            <v-icon>mdi-magnify</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="">
            <v-text-field
                flat
                outlined
                dense
                solo
                hide-details
                full-width
                clearable

                v-model="search"
                :placeholder="searchPlaceholder"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />




<!--      List of filter types-->
<!--      *****************************************************************-->
      <v-list
          dense
          v-if="!filterTypeKey"
          style="max-height: 82vh; overflow-y: scroll"
      >
        <template
            v-for="filterType in filterTypeSearchResults"
        >
          <filter-type-list-item
              :key="filterType.key"
              :facet-key="filterType.key"
              :bold="filterType.filters.length > 0"
              @select="filterTypeKey = filterType.key"
          />
          <facet-option
            v-for="liveFilter in filterType.filters"
            :filter="liveFilter"
            :show-checked="true"
            :key="liveFilter.asStr"
            :hide-bar="true"
            class="ml-10"
        />

          <v-divider class="my-2" v-if="filterType.filters.length"></v-divider>
        </template>
      </v-list>


<!--      List of filters-->
<!--      *****************************************************************-->
      <div
          v-if="filterTypeKey"
          style="height: 75vh; overflow-y:scroll;"
          class="pt-3"
      >
        <facet-option
            v-for="filter in filtersToShow.filter(f => f.isResultsFilter)"
            :filter="filter"
            :show-checked="true"
            :key="filter.asStr"
        />
        <v-divider class="my-1" />
        <facet-option
            v-for="filter in filtersToShow.filter(f => !f.isResultsFilter)"
            :filter="filter"
            :show-checked="false"
            :key="filter.asStr"
        />

      </div>


    </v-card>
  </v-navigation-drawer>
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
      isOpen: true,
      isMini: true,
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
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.filterTypeSearch?.toLowerCase())
          })
          .map(c => {
            const filters = this.resultsFilters.filter(f => f.key === c.key)
            return {
              ...c,
              filters
            }
          })
      ret.sort((a, b)=> {
        return b.filters.length - a.filters.length
      })
      return ret
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
    topListItemClick() {
      if (this.isMini) {

      } else {
        if (this.filterTypeKey) {
          this.filterTypeKey = null
        } else {
          this.isMini = true
        }
      }
    },
    clearAllFilters() {
      console.log("clear all filters")
      return false
    },

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