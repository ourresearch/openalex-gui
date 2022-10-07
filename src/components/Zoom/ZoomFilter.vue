<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      color="#333"
      dark
  >


    <v-card
        flat
        tile
        color="#333"
        dark
    >
      <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>
      <v-list
          class="pb-0 pt-1"
      >
        <v-list-item
            v-on="(isMini) ? {click: topListItemClick} : {}"
            style=""
        >
          <v-list-item-icon>
            <v-btn icon v-if="filterTypeKey" @click="filterTypeKey = null" style="margin-left: -5px;">
              <v-icon>mdi-arrow-left</v-icon>

            </v-btn>
            <!--            <v-chip-->
            <!--                v-if="resultsFilters.length"-->
            <!--                small-->
            <!--                color="white"-->
            <!--                light-->
            <!--                class="px-2"-->
            <!--                style="cursor: pointer;"-->
            <!--            >-->
            <!--              {{ resultsFilters.length }}-->
            <!--            </v-chip>-->
            <template v-else>
              <v-icon class="my-2">mdi-filter</v-icon>
              <span
                  v-if="resultsFilters.length"
                  style="font-size: 10px; margin: 20px 0 0 -4px;"
              >
                {{ resultsFilters.length }}
              </span>

            </template>
          </v-list-item-icon>
          <v-list-item-title
              class="text-h6 font-weight-bold"
          >
            <template v-if="!filterTypeKey">
              Filters
            </template>
            <template v-else>
              <template v-if="myFacetConfig.isBoolean">
                {{ myFacetConfig.displayName }}
              </template>
              <template v-else>
                {{ myFacetConfig.displayName | pluralize(2) }}
              </template>
            </template>
          </v-list-item-title>

          <template v-if="!filterTypeKey">

            <v-btn icon @click="toggleFiltersDrawer">
              <v-icon>{{ ($vuetify.breakpoint.mobile) ? 'mdi-close' : 'mdi-chevron-left' }}</v-icon>
            </v-btn>
            <v-btn icon
                   :disabled="!resultsFilters.length"
                   @click="clearAllFilters"
            >
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </template>


          <template v-else>
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
          </template>


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
          style="max-height: 87vh; overflow-y: scroll"
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
              @click-checkbox="clickCheckbox"
          />

          <!--          <div class="my-6" v-if="filterType.filters.length"></div>-->
          <v-divider class="mb-1 mt-1" v-if="filterType.filters.length"></v-divider>
        </template>
      </v-list>


      <!--      List of filters-->
      <!--      *****************************************************************-->
      <div
          v-if="filterTypeKey && !isMini"
          style="height: 87vh; overflow-y:scroll;"
          class="pt-3"
      >
        <facet-option
            v-for="filter in filtersToShow.filter(f => f.isResultsFilter)"
            :filter="filter"
            :show-checked="true"
            :key="filter.asStr"
            @click-checkbox="clickCheckbox"
        />
        <!--        <v-divider class="my-1"/>-->
        <facet-option
            v-for="filter in filtersToShow.filter(f => !f.isResultsFilter)"
            :filter="filter"
            :show-checked="false"
            :key="filter.asStr"
            @click-checkbox="clickCheckbox"
        />

      </div>


    </v-card>
  </v-navigation-drawer>
</template>


<script>
import {entityConfigs} from "../../entityConfigs";

import {entityTypeFromId} from "../../util";
import {createDisplayFilter, createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr} from "../../filterConfigs";

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
      showSearch: false,
      search: "",
      filterTypeSearch: "",
      filterTypeKey: null,
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,

      width: 300,
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
      "showFiltersDrawer",
    ]),
    isMini: {
      get() {
        if (this.$vuetify.breakpoint.mobile) return false
        return !this.$store.state.showFiltersDrawer
      },
      set(val) {
        this.$store.state.showFiltersDrawer = !val
      },
    },
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
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
          .filter(c => {
            return !(c.noOptions && !c.filters.length)
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
      } else {
        fromAutocomplete.sort((a, b) => {
          return b.count - a.count
        })
      }
      const ret = [...this.filtersFromServer, ...fromAutocomplete]
      // ret.sort((a, b) => {
      //   return b.count - a.count
      // })


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

      if (this.myFacetConfig.valuesToShow === "mostCommon") {
        url.searchParams.set("q", this.search ?? "")
      }
      url.searchParams.set("email", "team@ourresearch.org")

      return url.toString()
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "toggleFiltersDrawer",
    ]),
    ...mapActions([]),
    async copyUrlToClipboard() {
      const url = window.location.origin + this.$route.fullPath
      await navigator.clipboard.writeText(url);
      console.log("copied to clipboard", url)
      this.snackbar("Filters copied to clipboard.")
    },
    clickCheckbox(e){
      console.log("zoomFilter: clickCheckbox", e)
      if (e.metaKey || e.ctrlKey){
        // do nothing
      }
      else {
        this.filterTypeKey = null
      }
    },
    topListItemClick() {
    },
    async clearAllFilters() {
      console.log("clear all filters")
      await this.$router.push({
        name: 'Serp',
        query: {
          ...this.$route.query,
          filter: undefined
        }
      })
      this.snackbar('Filters cleared')
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

        },
        500
    )


  },
  created() {
  },
  mounted() {
  },
  watch: {
    search(newVal, oldVal) {
      console.log("search changed", newVal)
      if (!this.filterTypeKey) {
        this.search = ""
      } else {
        this.fetchSuggestions()

      }
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