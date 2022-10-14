<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      color="#fafafa"
      class="pa-0 ma-0"
      id="facets-drawer"


  >
    <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>


        <v-card
            flat
            color="transparent"
            :width="filterTypesListWidth"
            tile
        >
            <div class="d-flex align-center py-2 pl-1 pr-3 mt-2 mb-5">
              <v-btn
                  icon
                  large
                  class="ml-1"
                  @click="topListItemClick"
                  :disabled="!!filterTypeKey"
                  :color="isMini ? 'primary' : null"
              >
                <v-icon medium class="">mdi-filter-outline</v-icon>
                  <span
                      v-if="resultsFilters.length"
                      style="font-size: 10px; margin: 20px 0 0 -5px;"
                  >
                  {{ resultsFilters.length }}
                </span>
              </v-btn>
              <span
                  class="text-h6 font-weight-bold pl-1"

              >
                Filters
              </span>

              <v-spacer />
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



          <div
              v-if="!isMini"

          >

            <!--      List of filter types  -->
            <!--      *****************************************************************-->
            <v-list
                class="pt-0"
                nav
                expand

            >
                <facet
                    v-for="filterType in filterTypeSearchResults"
                    :key="filterType.key"
                    :facet-key="filterType.key"
                    :has-focus="filterTypeKey === filterType.key"
                    @toggle-select="toggleFiltersZoom(filterType.key)"
                    :disabled="filterTypeKey && filterTypeKey !== filterType.key"
                />
            </v-list>
          </div>


        </v-card>

        <facet-zoom
            :filter-type-key="filterTypeKey"
            @close="setFilterTypeKey(null)"
            :width="filtersListWidth"
        />


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


      filterTypesListWidth: 300,
      filtersListWidth: 350,

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
    drawerColor() {
      if (this.isMini) return "transparent"
      return (this.filterTypeKey) ? this.backgroundColors.dark : this.backgroundColors.medium
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
    toggleFiltersZoom(filterTypeKey) {
      if (this.filterTypeKey === filterTypeKey) {
        this.filterTypeKey = null
      }
      else {
        this.filterTypeKey = filterTypeKey
        this.$vuetify.goTo(0)
      }

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
    filterTypeKey(to, from){
      this.$emit("filter-type-key", to)
    }
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