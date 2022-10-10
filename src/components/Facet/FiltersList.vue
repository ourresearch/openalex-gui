<template>
  <v-card
      color="#fff"
      light
      elevation="3"
      :width="width"
      v-if="filterTypeKey "
      class="mt-2"
      style="min-height: 95vh;"
      :loading="isLoading"
  >
    <div class="text-h6 pt-3 px-1 pl-4 d-flex align-center" style="background-color: rgba(0,0,0,.05)">
<!--      <v-btn icon @click="$emit('close')">-->
        <v-icon class="mr-2">mdi-plus</v-icon>
<!--      </v-btn>-->
      <template v-if="myFacetConfig.isBoolean">
        {{ myFacetConfig.displayName }}
      </template>
      <template v-else>
        {{ myFacetConfig.displayName | pluralize(2) }}
      </template>
      <v-spacer/>

      <v-btn icon @click="$emit('close')">
        <v-icon class="mr-1">mdi-close</v-icon>
      </v-btn>

<!--      <v-menu-->
<!--      >-->
<!--        <template v-slot:activator="{on}">-->
<!--          <v-btn icon v-on="on">-->
<!--            <v-icon>mdi-dots-vertical</v-icon>-->
<!--          </v-btn>-->
<!--        </template>-->
<!--        <v-list dark dense color="#555">-->
<!--          <v-list-item @click="">-->
<!--            <v-list-item-icon>-->
<!--              <v-icon>mdi-table</v-icon>-->
<!--            </v-list-item-icon>-->
<!--            <v-list-item-title>-->
<!--              Export spreadsheet-->
<!--            </v-list-item-title>-->
<!--          </v-list-item>-->
<!--          <v-list-item @click="">-->
<!--            <v-list-item-icon>-->
<!--              <v-icon>mdi-code-json</v-icon>-->
<!--            </v-list-item-icon>-->
<!--            <v-list-item-title>-->
<!--              Export API call-->
<!--            </v-list-item-title>-->
<!--          </v-list-item>-->
<!--        </v-list>-->
<!--      </v-menu>-->


    </div>


    <v-tabs
        background-color="rgba(0,0,0,.05)"
        v-model="tab"
        :show-arrows="false"
        v-if="isExpanded"
    >
      <v-tab key="0">
        Top
      </v-tab>
      <v-tab key="1">
        Search
      </v-tab>
      <v-tab key="2">
        Range
      </v-tab>
    </v-tabs>
    <v-tabs-items
        v-model="tab"
        class="pt-0"

    >
      <v-tab-item key="0" class="pt-4 px-4">
        <facet-option
            v-for="f in filtersToShow"
            :filter="f"
            :key="f.asStr"
            @click-checkbox="clickCheckbox"
        />
      </v-tab-item>

      <v-tab-item key="1">
        <div
            style="background-color: rgba(0,0,0,.05);"
            class="px-2 py-2"
        >
          <v-text-field
              flat
              dense
              hide-details
              solo
              full-width
              class="mt-0"
              clearable
              prepend-inner-icon="mdi-magnify"

              v-model="search"
              :placeholder="searchPlaceholder"
          />
        </div>
        <facet-option
            class="px-4"
            v-for="f in filtersToShow"
            :filter="f"
            :key="f.asStr"
            @click-checkbox="clickCheckbox"
        />

      </v-tab-item>
      <v-tab-item key="2">
        <v-card flat>tab 3</v-card>
      </v-tab-item>
    </v-tabs-items>


  </v-card>


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
    width: Number,
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
      tab: 0,
      isExpanded: false,

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
      let ret = [...this.filtersFromAutocomplete]
          .filter(f => f.value !== "unknown")
          .map(f => {
            return {
              ...f,
              isResultsFilter: this.myResultsFilters.map(f => f.asStr).includes(f.asStr),
            }
          })
      // .filter(f => {
      //
      //   // only push potential filter values if they're not already loaded as
      //   // in a resultsFilter
      //   return !this.myResultsFilters.map(f => f.asStr).includes(f.asStr)
      // })

      ret = ret.slice(0, 20)

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
    },
    fetchSuggestions: _.debounce(
        async function () {
          if (!this.myFacetConfig) return
          this.isLoading = "primary"

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
      this.fetchSuggestions()
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
        this.isExpanded = false
        setTimeout(() => {
          this.isExpanded = true
        }, 100)
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

.v-tab {
  min-width: 1px !important;
  width: 66px !important;

}

.v-tabs {
  border-bottom: 1px solid #ccc;
}

.v-tabs-items {
  background-color: transparent !important;
}

</style>