<template>


  <v-navigation-drawer
      app
      :width="width"
      v-model="isOpen"
      :mini-variant.sync="isMini"
      :color="drawerColor"
      dark
      class="pa-0"

  >
    <v-progress-linear absolute v-if="isLoading" indeterminate color="white"></v-progress-linear>
    <div
        class="d-flex"
        style="flex-wrap: wrap;"
        ref="navDrawerWrapper"
    >
      <div @click="filterTypeKey ? filterTypeKey = null: null">


      <v-card
          :color="drawerColor"
          dark
          flat
          :width="filterTypesListWidth"


      >
        <v-list
            class="pb-0 pt-0 pr-0 mr-0"
            style="height: 68px;"
        >
          <v-list-item
              v-on="(isMini || filterTypeKey) ? {click: topListItemClick} : {}"
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

            <v-fade-transition>
              <template v-if="!filterTypeKey">

                <v-btn v-if="!resultsFilters.length" icon @click="toggleFiltersDrawer">
                  <v-icon>{{ ($vuetify.breakpoint.mobile) ? 'mdi-close' : 'mdi-chevron-left' }}</v-icon>
                </v-btn>
                <v-btn icon
                       v-if="resultsFilters.length"
                       @click="clearAllFilters"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>

              </template>
            </v-fade-transition>
          </v-list-item>
        </v-list>


        <div
            style="max-height: 90vh; overflow-y: scroll"
            v-if="!isMini"

        >

          <!--      List of filter types  -->
          <!--      *****************************************************************-->
          <v-list
              dense
              class="pt-0"
              nav
          >
            <template
                v-for="filterType in filterTypeSearchResults"
            >

              <filter-type-selected
                  :key="filterType.key"
                  :facet-key="filterType.key"
                  :has-focus="filterTypeKey === filterType.key"
                  @toggle-select="toggleFiltersZoom(filterType.key)"
                  v-if="filterType.filters.length"
                  :disabled="filterTypeKey && filterTypeKey !== filterType.key"
              />

              <filter-type-list-item
                  :key="filterType.key"
                  :facet-key="filterType.key"
                  :bold="filterType.filters.length > 0"
                  :has-focus="filterTypeKey === filterType.key"
                  @toggle-select="toggleFiltersZoom(filterType.key)"
                  :disabled="filterTypeKey && filterTypeKey !== filterType.key"
                  v-else
              />

            </template>
          </v-list>
        </div>


      </v-card>

        </div>
      <v-card
          :color="backgroundColors.light"
          elevation="5"
          dark
          :width="filtersListWidth - 15"
          height="96vh"
          v-if="filterTypeKey "
          style="border-radius: 5px !important; margin: 2vh 15px 2vh 0;"
      >
        <filters-list :filter-type-key="filterTypeKey" @close="setFilterTypeKey(null)"/>
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
import FilterTypeSelected from "../Facet/FilterTypeSelected";

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
    FilterTypeSelected
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
      filtersListWidth: 300,

      lightColor: "#555",
      darkColor: "#222",
      backgroundColors: {
        dark: "#303030",
        medium: "#3a3a3a",
        light: "#444",
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
      this.filterTypeKey = (this.filterTypeKey) ? null : filterTypeKey
    },
    topListItemClick() {
      if (this.isMini) return
      if (this.filterTypeKey) this.setFilterTypeKey(null)
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
  watch: {}
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