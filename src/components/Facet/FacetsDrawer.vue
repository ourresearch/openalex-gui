<template>


  <v-navigation-drawer
      app
      :width="totalWidth"
      v-model="isOpen"
      class="pa-0 ma-0"
      id="facets-drawer"
      disable-route-watcher
      color="transparent"
      floating


  >
    <div @click="setFacetZoom(null)">
      <v-card
          color="#fff"
          :width="facetsWidth"
          :style="`margin: ${height.margins[0]}px ${width.margins[0]}px ${height.margins[1]}px ${width.margins[1]}px;`"
          style="border: 1px solid rgba(0, 0, 0, .2);"
          outlined
          :ripple="false"
          :disabled="!!facetZoom"
      >
        <div
            class="card-header"
            :class="{'elevation-3': isScrolled}"
        >

          <div
              class="d-flex align-center pl-1 pr-3"
              :style="`height: ${height.toolbar}px;`"
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
              <v-icon>mdi-filter-outline</v-icon>
          Filters
              </span>

            <v-spacer/>
            <v-btn icon class="mr-1" @click="showSearch = !showSearch">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-chip
                v-if="resultsFiltersNegated.length"
                color="red"
                dark
                small
                :disabled="!!facetZoom"
            >
              {{ resultsFiltersNegated.length }}
            </v-chip>
            <v-chip
                v-if="resultsFiltersAny.length"
                color="green"
                dark
                small
                class="ml-1"
                :disabled="!!facetZoom"
            >
              {{ resultsFiltersAny.length }}
            </v-chip>



            <v-menu
                offset-y
            >
              <template v-slot:activator="{on}">
                <v-btn class="ml-0" icon v-on="on" :disabled="!!facetZoom">
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
              :style="`height: ${height.searchbar}px;`"
              v-if="showSearch"

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
        </div>


        <!--      List of facets  -->
        <!--      *****************************************************************-->
        <v-card-text
            class="pa-0"
            :style="cardTextStyle"
            v-scroll.self="onCardTextScroll"
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
                    class="align-end text-capitalize pl-11"
                >
                  {{ facetCategory.name }}
                </v-subheader>
                <!--                <v-divider :key="'divider' + facetCategory.name"></v-divider>-->
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

<!--    <div-->
<!--        v-if="!!facetZoom && !$vuetify.breakpoint.mobile"-->
<!--        id="facet-zoom-drawer"-->
<!--        :style="{width: facetZoomWidth+'px'}"-->
<!--        style="border-left: 1px solid rgba(255,255,255, .25);"-->
<!--    >-->
<!--      <facet-zoom/>-->

<!--    </div>-->


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
      isScrolled: false,
      height: {
        toolbar: 60,
        searchbar: 50,
        margins: [10, 10]
      },
      width: {
        margins: [10, 10]
      },


      facetZoomWidth: 350,
      facetsWidth: 300,

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
    totalWidth() {
      const widthMargins = this.width.margins[0] + this.width.margins[1]
      return this.facetsWidth + widthMargins
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
    cardTextStyle() {
      const marginsHeight = this.height.margins[0] + this.height.margins[1]
      const toolbarsTotalHeight = this.height.toolbar + (this.showSearch ? this.height.searchbar : 0)
      const height = toolbarsTotalHeight + marginsHeight

      return {
        'overflow-y': this.facetZoom ? 'hidden' : 'scroll',
        height: `calc(100vh - ${height}px)`
      }
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
    onCardTextScroll(e) {
      this.isScrolled = e.target.scrollTop > 0
    }


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