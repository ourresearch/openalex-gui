<template>
  <div>
    <div class="text-h6 py-4 px-4 d-flex align-center">
      <template v-if="myFacetConfig.isBoolean">
        {{ myFacetConfig.displayName }}
      </template>
      <template v-else>
        {{ myFacetConfig.displayName | pluralize(2) }}
      </template>
      <v-spacer/>
      <v-menu
      >
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="">
            <v-list-item-icon>
              <v-icon>mdi-table</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Export spreadsheet
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="">
            <v-list-item-icon>
              <v-icon>mdi-code-json</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Export API call
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>


    </div>
    <div class="px-4" v-if="!myFacetConfig.isBoolean">
      <v-text-field
          flat
          dense
          hide-details
          full-width
          clearable
          autofocus
          prepend-inner-icon="mdi-magnify"

          v-model="search"
          :placeholder="searchPlaceholder"
      />
    </div>

    <v-divider/>

    <div
        style=" overflow-y:scroll;"
    >
      <facet-option
          v-for="filter in filtersToShow.filter(f => !f.isResultsFilter)"
          :filter="filter"
          :show-checked="false"
          :key="filter.asStr"
          @click-checkbox="clickCheckbox"
      />

    </div>
    <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

</div>


  </div>


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


export default {
  components: {
    FacetOption,
    FilterTypeListItem,
  },
  props: {
    filterTypeKey: String,
  },
  data() {
    return {
      showSearch: false,
      search: "",
      filterTypeSearch: "",
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,

      width: 250,
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

    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.filterTypeKey)
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.filterTypeKey
      })
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    filtersToShow() {
      if (!this.filtersFromAutocomplete.length) return []
      const ret = [...this.filtersFromAutocomplete]
          .filter(f => f.value !== "unknown")
          .filter(f => {

            // only push potential filter values if they're not already loaded as
            // in a resultsFilter
            return !this.myResultsFilters.map(f => f.asStr).includes(f.asStr)
          })
      if (this.myFacetConfig.sortByValue) {
        ret.sort((a, b) => {
          return (a.value > b.value) ? -1 : 1
        })
      } else {
        ret.sort((a, b) => {
          return b.count - a.count
        })
      }

      const maxCountSelected = Math.max(...this.myResultsFilters.map(r => r.count))
      const maxCountUnselected = Math.max(...ret.map(r => r.count))

      ret.forEach(f => {
        f.countNormalized = f.count / maxCountUnselected
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

    clickCheckbox(e) {
      console.log("click checkbox", e)
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
    search(newVal, oldVal) {
      console.log("search changed", newVal)
      return
      if (!this.filterTypeKey) {
        this.search = ""
      } else {
        this.fetchSuggestions()

      }
    },
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        return
        this.setFilterOptions()
        this.search = ""
      }
    },
    "filterTypeKey": {
      handler(newVal, oldVal) {
        return
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