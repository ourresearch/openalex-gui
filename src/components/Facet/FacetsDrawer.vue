<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      class="pa-0 ma-0"
      id="facets-drawer"
      dark
      disable-route-watcher


  >
    <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>


    <v-card
        flat
        color="#363636"
        :width="facetsWidth"
        tile
        dark
        style="z-index: 5;"
    >
      <div
          class="d-flex align-center pl-1 pr-3"
          style="height: 75px; "
          :class="{'elevation-3': !isMini}"
      >
        <v-btn
            icon
            large
            class="ml-1"
            @click="topListItemClick"
            :disabled="!!filterTypeKey"
        >
          <v-icon medium color="">mdi-filter-outline</v-icon>
          <span
              v-if="resultsFilters.length"
              class=""
              style="font-size: 12px; margin: 20px 0 0 -5px;"
          >
                  {{ resultsFilters.length }}
                </span>
        </v-btn>
        <span
            class="text-h6  pl-1"

        >
                Filters
              </span>

        <v-spacer/>
        <v-fade-transition>
          <template v-if="!filterTypeKey">

            <v-menu
            >
              <template v-slot:activator="{on}">
                <v-btn icon v-on="on">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list dense>
                <v-list-item
                    @click="clearAllFilters"
                    :disabled="!resultsFilters.length"
                    :color="resultsFilters.length ? 'error' : null"
                    :input-value="!!resultsFilters.length"
                >
                  <v-list-item-icon>
                    <v-icon>mdi-delete</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                    Clear all filters
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>


          </template>
        </v-fade-transition>
      </div>


      <!--      List of filter types  -->
      <!--      *****************************************************************-->
      <v-card-text class="pa-0">

      <v-list
          class="pt-0"
          nav
          expand
          style="height: calc(100vh - 75px); overflow-y: scroll; padding-bottom: 100px;"
          v-if="!isMini"
      >
        <facet
            v-for="filterType in filterTypeSearchResults"
            :key="filterType.key"
            :facet-key="filterType.key"
            :has-focus="filterTypeKey === filterType.key"
            :disabled="filterTypeKey && filterTypeKey !== filterType.key"
        />
      </v-list>
      </v-card-text>


    </v-card>

    <div
        v-if="!!facetZoom && !$vuetify.breakpoint.mobile"
        id="facet-zoom-drawer"
        :style="{width: facetZoomWidth+'px'}"
        style="border-left: 1px solid rgba(255,255,255, .25);"
    >
      <facet-zoom/>

    </div>


  </v-navigation-drawer>
</template>


<script>
import {createDisplayFilter, createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import FacetOption from "./FacetOption";
import {api} from "../../api";
import {url} from "../../url";
import _ from "lodash"
import FacetZoom from "./FacetZoom";
import Facet from "./Facet";

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
    FacetZoom,
    Facet
  },
  props: {},
  data() {
    return {
      showSearch: false,
      search: "",
      filterTypeSearch: "",
      filterTypeKey: null,
      showFiltersList: false,
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,


      facetZoomWidth: 350,
      facetsWidth: 250,

      lightColor: "#555",
      darkColor: "#222",
      backgroundColors: {
        dark: "#3a3a3a",
        medium: "#3a3a3a",
        // light: "#4f4f4f",
        light: "#555",
      }

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
      "facetZoom"
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
        console.log("facetsDrawer.isOpen.set()", val)
        this.$store.state.showFiltersDrawer = val
      },
    },
    showFacetZoomPanel() {
      return !this.$vuetify.breakpoint.mobile && this.filterTypeKey
    },
    width() {
      return this.facetsWidth + ((this.facetZoom) ? this.facetZoomWidth : 0)
      // if (this.showFacetZoomPanel) {
      //   return this.filterTypesListWidth + this.facetsWidth
      // }
      // else return this.filterTypesListWidth
    },
    filterTypeSearchResults() {
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.filterTypeSearch?.toLowerCase())
          })
          .filter(c => {
            const filters = this.resultsFilters.filter(f => f.key === c.key)
            // hide the noOptions facets unless they have selected filters
            return !c.noOptions || filters.length
          })


      // const ret = this.searchFacetConfigs
      //     .filter(c => {
      //       return c.displayName.toLowerCase().match(this.filterTypeSearch?.toLowerCase())
      //     })
      //     .map(c => {
      //       const filters = this.resultsFilters.filter(f => f.key === c.key)
      //       filters.sort((a, b) => b.count - a.count)
      //       filters
      //
      //       return {
      //         ...c,
      //         filters
      //       }
      //     })
      //     .filter(c => {
      //       return !(c.noOptions && !c.filters.length)
      //     })

      ret.sort((a, b) => {
        return (a.displayName > b.displayName) ? 1 : -1
      })


      return ret
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "toggleFiltersDrawer",
      "setFacetZoom",
    ]),
    ...mapActions([]),
    async copyUrlToClipboard() {
      const url = window.location.origin + this.$route.fullPath
      await navigator.clipboard.writeText(url);
      console.log("copied to clipboard", url)
      this.snackbar("Filters copied to clipboard.")
    },

    setFilterTypeKey(filterTypeKey) {
      this.filterTypeKey = filterTypeKey
    },
    topListItemClick() {
      if (this.isMini) return
      if (this.filterTypeKey) this.setFilterTypeKey(null)
      this.isMini = true
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


  },
  created() {
  },
  mounted() {
  },
  watch: {
    filterTypeKey(to, from) {
      this.$emit("filter-type-key", to)
    }
  }
}
</script>

<style lang="scss">

#facet-zoom-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 3;
}
</style>