<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      class="pa-0 ma-0"
      id="facets-drawer"
      disable-route-watcher
      color="transparent"


  >
    <div @click="setFacetZoom(null)">
    <v-card
        flat
        color="#eee"
        :width="facetsWidth"
        tile
        style="z-index: 5;"
        :ripple="false"
        :disabled="facetZoom"
    >
      <div
          class="d-flex align-center pl-1 pr-3"
          style="height: 75px; "
      >

        <!--        <v-btn-->
        <!--            icon-->
        <!--            large-->
        <!--            class="ml-1"-->
        <!--            :disabled="!!filterTypeKey"-->
        <!--        >-->

        <!--          <v-icon medium color="">mdi-filter-outline</v-icon>-->
        <!--        </v-btn>-->
        <span
            class="text-h6  pl-4"

        >
          Filters
              </span>

        <v-spacer/>
        <v-chip
            v-if="resultsFiltersNegated.length"
            color="red"
            dark
            small
            :disabled="facetZoom"
        >
          {{ resultsFiltersNegated.length }}
        </v-chip>
        <v-chip
            v-if="resultsFiltersAny.length"
            color="green"
            dark
            small
            class="ml-1"
            :disabled="facetZoom"
        >
          {{ resultsFiltersAny.length }}
        </v-chip>


        <v-menu
            offset-y
        >
          <template v-slot:activator="{on}">
            <v-btn class="ml-1" icon v-on="on" :disabled="facetZoom">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item
                @click="clearAllFilters"
                :disabled="!resultsFilters.length"
            >
              <v-list-item-icon>
                <v-icon>mdi-close</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                Clear all filters
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>
      <div
          class="d-flex align-start"
          style="height: 50px;"

      >
        <!--        <div class="">-->
        <!--          {{ myFacetConfig.displayName }}-->
        <!--        </div>-->

        <v-text-field
            flat
            hide-details
            solo
            full-width
            class="mt-0 mx-2"
            clearable
            prepend-inner-icon="mdi-magnify"
            autofocus
            dense

            v-model="facetSearch"
            placeholder="search filters"
        />


      </div>
      <v-divider></v-divider>


      <!--      List of facets  -->
      <!--      *****************************************************************-->
      <v-card-text
          class="pa-0"
          style="height: calc(100vh - (75px + 50px)); overflow-y: scroll; padding-bottom: 100px;"
      >


        <v-list
            class="pt-0"
            expand
            nav
        >
          <template
              v-for="facetCategory in facetsByCategory"
          >
            <template v-if="showAdvancedFilters && facetCategory.name !== 'solo'">
              <v-subheader
                  :key="'subheader' + facetCategory.name"
                  class="pl-2 align-end text-capitalize"
              >
                {{ facetCategory.name }}
              </v-subheader>
              <v-divider :key="'divider' + facetCategory.name"></v-divider>
            </template>
            <template v-for="facet in facetCategory.facets">
              <facet-range
                  v-if="facet.isRange"
                  :key="'facet' + facet.key"
                  :facet-key="facet.key"
                  show-details-button
              >
              </facet-range>
              <facet
                  v-else
                  :key="'facet' + facet.key"
                  :facet-key="facet.key"
                  :has-focus="facetZoom === facet.key"
                  :disabled="facetZoom && facetZoom !== facet.key"
                  :value="expandAll"
              />

            </template>
          </template>


        </v-list>
      </v-card-text>


    </v-card>
    </div>

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
import {createSimpleFilter, filtersFromUrlStr, filtersAsUrlStr} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories} from "../../facetConfigs";
import FacetOption from "./FacetOption";
import {api} from "../../api";
import {url} from "../../url";
import _ from "lodash"
import FacetZoom from "./FacetZoom";
import Facet from "./Facet";
import FacetRange from "./FacetRange";

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
    Facet,
    FacetRange,
  },
  props: {},
  data() {
    return {
      showSearch: false,
      search: "",
      facetSearch: "",
      filterTypeKey: null,
      showFiltersList: false,
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,
      expandAll: false,
      showAdvancedFilters: true,


      facetZoomWidth: 350,
      facetsWidth: 350,

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
      "resultsFiltersAny",
      "resultsFiltersNegated",
      "zoomId",
      "textSearch",
      "entityType",
      "zoomTypeConfig",
      "entityZoomHistoryData",
      "showFiltersDrawer",
      "facetZoom"
    ]),
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
      return this.facetsWidth + ((this.facetZoom) ? this.facetZoomWidth + 2 : 0)
      // if (this.showFacetZoomPanel) {
      //   return this.filterTypesListWidth + this.facetsWidth
      // }
      // else return this.filterTypesListWidth
    },
    facetsByCategory() {
      return facetCategories[this.entityType].map(categoryName => {
        return {
          name: categoryName,
          facets: this.facetSearchResults.filter(f => {
            return f.category === categoryName
          })
        }
      })
          .filter(categoryObj => {
            return categoryObj.facets.length > 0
          })
    },

    facetSearchResults() {
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.facetSearch?.toLowerCase())
          })
          .filter(c => {
            const filters = this.resultsFilters.filter(f => f.key === c.key)
            return (c.isCore || this.showAdvancedFilters || filters.length)
          })
          .filter(c => {
            const filters = this.resultsFilters.filter(f => f.key === c.key)
            // hide the noOptions facets unless they have selected filters
            return !c.noOptions || filters.length
          })


      // const ret = this.searchFacetConfigs
      //     .filter(c => {
      //       return c.displayName.toLowerCase().match(this.facetSearch?.toLowerCase())
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
        if (a.sortToTop) return -1
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

.v-list--nav .v-list-item:not(:last-child):not(:only-child) {
  margin-bottom: 0;
}

#facet-zoom-drawer {
  position: fixed;
  top: 2px;
  bottom: 2px;
  right: 0;
  z-index: 3;
}
</style>