<template>


  <div
      class=" ma-0"
      id="facets-drawer"

  >

    <div @click="setFacetZoom(null)">
      <v-card
          :ripple="false"
          :disabled="!!facetZoom"
          flat
          class="pa-0 ma-0"
      >
        <div
            class="card-header"
            :class="{'elevation-3': isScrolled}"
        >

          <div
              class="d-flex align-center "
          >


            <v-text-field
                flat
                hide-details
                solo
                full-width
                class="mt-0"
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
        >


          <v-list
              class="pt-0 pl-0"
              expand
              nav
          >
            <template
                v-for="facetCategory in facetsByCategory"
            >
              <template v-if="showAdvancedFilters && facetCategory.name !== 'solo'">
                <v-subheader
                    :key="'subheader' + facetCategory.name"
                    class="align-end text-capitalize pl-0"
                >
                  {{ facetCategory.name }}
                </v-subheader>
                <!--                <v-divider :key="'divider' + facetCategory.name"></v-divider>-->
              </template>
              <template v-for="facet in facetCategory.facets">
                <facet-range
                    v-if="facet.valuesToShow === 'range'"
                    :key="facet.entityType + facet.key"
                    :facet-key="facet.key"
                    :facet-entity-type="entityType"
                    show-details-button
                >
                </facet-range>
                <facet
                    v-else
                    :key="facet.entityType + facet.key"
                    :facet-key="facet.key"
                    :facet-entity-type="entityType"
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


  </div>
</template>


<script>
import {createSimpleFilter, filtersAsUrlStr} from "../../filterConfigs";

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
      return ""
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

</style>