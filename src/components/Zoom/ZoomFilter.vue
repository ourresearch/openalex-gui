<template>


  <v-navigation-drawer
      app
      width="400"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      color="#444"
      dark
  >


    <v-card
        flat
        tile
        color="#444"
        dark
    >
      <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>
      <v-list
          class="pb-0 pt-1"
      >
        <v-list-item @click="topListItemClick">
          <v-list-item-icon>
            <!--            <v-icon v-if="filterTypeKey">mdi-arrow-left</v-icon>-->
            <v-chip
                v-if="resultsFilters.length"
                small
                color="green lighten-2"
                light
                class="px-2"
                style="cursor: pointer;"
            >
              {{ resultsFilters.length }}
            </v-chip>
            <v-icon v-else>mdi-filter</v-icon>
          </v-list-item-icon>
          <v-list-item-title
              class="text-h6"
              :class="{'font-weight-light': !!filterTypeKey}"
          >
            Filters
          </v-list-item-title>
          <v-menu
              v-if="!filterTypeKey"
          >
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="copyUrlToClipboard">
                <v-list-item-icon>
                  <v-icon>mdi-content-copy</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Copy filter URL
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                  color="red"
                  :to="{name: 'Serp', query:{...$route.query, filter: undefined}}"
                  @click="snackbar('Filters cleared')"
              >
                <v-list-item-icon>
                  <v-icon>mdi-filter-off-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Clear all filters

                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list-item>

        <!--        <v-list-item  v-if="!filterTypeKey">-->
        <!--          <v-list-item-icon>-->
        <!--            <v-icon>mdi-magnify</v-icon>-->
        <!--          </v-list-item-icon>-->
        <!--          <v-list-item-title class="">-->
        <!--            <v-text-field-->
        <!--                flat-->
        <!--                outlined-->
        <!--                dense-->
        <!--                solo-->
        <!--                hide-details-->
        <!--                full-width-->
        <!--                clearable-->
        <!--                autofocus-->

        <!--                v-model="filterTypeSearch"-->
        <!--                placeholder="Search for filters"-->
        <!--            />-->
        <!--          </v-list-item-title>-->
        <!--        </v-list-item>-->

      </v-list>


      <v-list class="pt-0 pb-0" v-if="filterTypeKey">
        <v-list-item class="">
          <v-list-item-icon>

            <v-icon class="">mdi-chevron-down</v-icon>
          </v-list-item-icon>
          <!--            <v-btn icon class="mr-2" @click="filterTypeKey = null">-->
          <!--              <v-icon class="">mdi-chevron-down</v-icon>-->
          <!--            </v-btn>-->
          <v-list-item-content class="font-weight-bold text-h6">
            <template v-if="myFacetConfig.isBoolean">
              {{ myFacetConfig.displayName }}
            </template>
            <template v-else>
              {{ myFacetConfig.displayName | pluralize(filtersFromServer.length) }}
            </template>
          </v-list-item-content>
          <v-btn icon @click="showSearch = !showSearch" v-if="!myFacetConfig.isBoolean">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
          <v-menu
          >
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="copyUrlToClipboard">
                <v-list-item-icon>
                  <v-icon>mdi-table</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Export spreadsheet
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="copyUrlToClipboard">
                <v-list-item-icon>
                  <v-icon>mdi-code-json</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                  Export API call
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list-item>

        <v-list-item v-if="showSearch">
          <v-list-item-icon>
            <v-icon>mdi-magnify</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="">
            <v-text-field
                flat
                dense
                hide-details
                full-width
                clearable
                autofocus

                v-model="search"
                :placeholder="searchPlaceholder"
            />
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider/>


      <!--      List of filter types-->
      <!--      *****************************************************************-->
      <v-list
          dense
          v-if="!filterTypeKey && !isMini"
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
              class="ml-0"
          />

          <!--          <div class="my-6" v-if="filterType.filters.length"></div>-->
          <v-divider class="mb-1 mt-1" v-if="filterType.filters.length"></v-divider>
        </template>
      </v-list>


      <!--      List of filters-->
      <!--      *****************************************************************-->
      <div
          v-if="filterTypeKey && !isMini"
          style="height: 75vh; overflow-y:scroll;"
          class="pt-3"
      >
        <facet-option
            v-for="filter in filtersToShow.filter(f => f.isResultsFilter)"
            :filter="filter"
            :show-checked="true"
            :key="filter.asStr"
        />
        <!--        <v-divider class="my-1"/>-->
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
      isOpen: !this.$vuetify.breakpoint.mobile,
      isMiniFlag: true,
      showSearch: false,
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
    isMini: {
      get() {
        if (this.$vuetify.breakpoint.mobile) return false
        return this.isMiniFlag
      },
      set(val) {
        this.isMiniFlag = val
      },
    },
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
            filters.sort((a, b) => b.count - a.count)
            return {
              ...c,
              filters
            }
          })
      ret.sort((a, b) => {
        return (b.filters.length && !a.filters.length) ? 1 : -1
      })
      return ret
    },
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.filterTypeKey)
    },
    filtersToShow() {
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
      ret.sort((a, b) => {
        return b.count - a.count
      })


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
      if (this.myFacetConfig.valuesToShow === "mostCommon") {
        url.searchParams.set("q", this.search ?? "")
      }
      url.searchParams.set("email", "team@ourresearch.org")

      return url.toString()
    },
  },

  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
    async copyUrlToClipboard() {
      const url = window.location.origin + this.$route.fullPath
      await navigator.clipboard.writeText(url);
      console.log("copied to clipboard", url)
      this.snackbar("Filters copied to clipboard.")
    },
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
        async function () {
          this.isLoading = true
          console.log("fetchSuggestions calling", this.autocompleteUrl)

          const resp = await api.getUrl(this.autocompleteUrl)
          this.filtersFromAutocomplete = resp.filters.map(apiData => {
            return createDisplayFilter(
                this.myFacetConfig.key,
                apiData.value,
                apiData.display_value,
                apiData.works_count,
            )
          })
          this.isLoading = false


          // axios.get(this.autocompleteUrl)
          //     .then(resp => {
          //       this.filtersFromAutocomplete = resp.data.filters.map(apiData => {
          //         return createDisplayFilter(
          //             this.myFacetConfig.key,
          //             apiData.value,
          //             apiData.display_value,
          //             apiData.works_count,
          //         )
          //       })
          //       this.isLoading = false
          //     })
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