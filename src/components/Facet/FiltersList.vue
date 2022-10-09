<template>
  <div>
    <div class="text-h6 py-1 px-1 d-flex align-center">
      <v-btn icon @click="$emit('close')">
        <v-icon class="mr-1">mdi-chevron-left</v-icon>
      </v-btn>
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



    </div>
    <div class="px-4 d-flex align-end" v-if="!myFacetConfig.isBoolean">
      <div class="d-flex align-center py-1 pr-3">
        <v-icon v-if="!isLoading">mdi-magnify</v-icon>
        <v-progress-circular
            v-if="isLoading"
            size="20"
            width="2"
            indeterminate
            style="margin: 0;"
            class="ml-1">

        </v-progress-circular>
      </div>

      <v-text-field
          flat
          dense
          hide-details
          full-width
          clearable

          v-model="search"
          :placeholder="searchPlaceholder"
      />
    </div>

    <v-divider/>

    <div
        style="height: 78vh; overflow-y:scroll;"
        class="pt-4 px-2"
    >
      <facet-option
          v-for="filter in filtersToShow.filter(f => !f.isResultsFilter)"
          :filter="filter"
          :show-checked="false"
          :key="filter.asStr"
          @click-checkbox="clickCheckbox"
      />

    </div>
    <div>

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
    ...mapActions([
      "addInputFilters",
      "removeInputFilters",
    ]),

    clickCheckbox(filter, isChecked, e) {
      console.log("click checkbox", filter, isChecked, e)
      if (isChecked) this.addInputFilters([filter])
      else this.removeInputFilters([filter])
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
        500,
        {leading: true,}
    ),

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
        this.fetchSuggestions()
        this.search = ""
      }
    },
    "filterTypeKey": {
      handler(newVal, oldVal) {
        this.filtersFromAutocomplete = []
        this.fetchSuggestions()
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