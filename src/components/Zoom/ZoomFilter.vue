<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      color="#333"
      dark
  >
    <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>
    <div class="d-flex">

      <v-card
          tile
          color="#333"
          dark
          flat
          :width="filterTypesListWidth"
      >
        <v-list
            class="pb-0 pt-0 pr-0 mr-0"
        >
          <v-list-item
              v-on="(isMini || filterTypeKey) ? {click: topListItemClick} : {}"
              style="min-height: 68px;"
              class="pr-3"
          >
            <v-list-item-icon>
              <v-icon class="">mdi-filter</v-icon>
              <span
                  v-if="true"
                  style="font-size: 10px; margin: 20px 0 0 -4px;"
              >
                {{ resultsFilters.length }}
              </span>
            </v-list-item-icon>
            <v-list-item-title
                class="text-h6 font-weight-bold"
            >
              Filters
            </v-list-item-title>

            <template v-if="!filterTypeKey">

              <v-btn v-if="!resultsFilters.length" icon @click="toggleFiltersDrawer">
                <v-icon>{{ ($vuetify.breakpoint.mobile) ? 'mdi-close' : 'mdi-chevron-left' }}</v-icon>
              </v-btn>
              <v-btn icon
                     v-if="resultsFilters.length"
                     @click="clearAllFilters"
              >
                <v-icon small>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>


        <v-divider/>


        <!--      List of filter types-->
        <!--      *****************************************************************-->
        <v-list
            dense
            class="pt-0"
            v-if="!isMini"
            style="max-height: 90vh; overflow-y: scroll"
        >
          <template
              v-for="filterType in filterTypeSearchResults"
          >
            <filter-type-list-item
                :key="filterType.key"
                :facet-key="filterType.key"
                :bold="filterType.filters.length > 0"
                :has-focus="filterTypeKey === filterType.key"
                @select="filterTypeKey = filterType.key"
            />

            <v-divider class="" v-if="filterType.filters.length"></v-divider>
          </template>
        </v-list>



      </v-card>
      <v-card
          flat
          tile
          color="#3d3d3d"
          dark
          :width="filtersListWidth"
          v-if="filterTypeKey"
          style="border-radius: 20px !important;"
      >
        <filters-list :filter-type-key="filterTypeKey" @close="filterTypeKey = null"/>
      </v-card>


    </div>
  </v-navigation-drawer>
</template>


<script>
import {createDisplayFilter, createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import FacetOption from "../Facet/FacetOption";
import {api} from "../../api";
import {url} from "../../url";
import FilterTypeListItem from "../Facet/FilterTypeListItem";
import _ from "lodash"
import FiltersList from "../Facet/FiltersList";

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
    FiltersList,
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

      filterTypesListWidth: 300,
      filtersListWidth: 300,

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
    width() {
      if (this.filterTypeKey) return this.filterTypesListWidth + this.filtersListWidth
      else return this.filterTypesListWidth
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

    topListItemClick() {
      if (this.isMini) return
      if (this.filterTypeKey) this.filterTypeKey = null
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
    // search(newVal, oldVal) {
    //   console.log("search changed", newVal)
    //   if (!this.filterTypeKey) {
    //     this.search = ""
    //   } else {
    //     this.fetchSuggestions()
    //
    //   }
    // },
    // "$route.query": {
    //   immediate: true,
    //   handler(newVal, oldVal) {
    //     this.setFilterOptions()
    //     this.search = ""
    //   }
    // },
    // "filterTypeKey": {
    //   handler(newVal, oldVal) {
    //     this.filtersFromAutocomplete = []
    //     this.setFilterOptions()
    //     this.search = ""
    //   }
    // },
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