<template>

  <v-card
      v-if="facetZoom "
      :loading="isLoading"
      tile
      dark
      color="#363636"
      flat
  >
    <div class="elevation-3">

      <div
          class="text-h6 d-flex align-center"
          style="height: 75px;"
      >
        <!--        <div class="">-->
        <!--          {{ myFacetConfig.displayName }}-->
        <!--        </div>-->
        <v-text-field
            flat
            hide-details
            solo
            full-width
            class="mt-0 mx-3 "
            clearable
            prepend-inner-icon="mdi-magnify"
            autofocus

            v-model="search"
            :placeholder="searchPlaceholder"
        />


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

      <div>

      </div>
    </div>

    <v-card-text class="pa-0" style="height: calc(100vh - 150px); overflow-y:scroll;">
      <div class="pt-3 px-5 body-2" style="opacity: .7;">
        <template v-if="search && filtersToShow.length">
          Top {{ myFacetConfig.displayName | pluralize(2) }} matching "{{ search }}" within current results:
        </template>
        <template v-else-if="search && !filtersToShow.length">
          No {{ myFacetConfig.displayName | pluralize(2) }} matching "{{ search }}" found with current results; try
          broadening your search.
        </template>
        <template v-else>
          Top {{ myFacetConfig.displayName | pluralize(2) }} within current results:
        </template>
      </div>
      <v-list
          color="transparent"
          dark

      >
        <facet-option
            class=""
            v-for="f in filtersToShow"
            :filter="f"
            :key="f.asStr"
            hide-checkbox

        />
      </v-list>

    </v-card-text>
    <v-divider/>
    <v-card-actions style="height: 75px;">
      <v-btn text @click="setFacetZoom(null)" class="mr-2">
        Close
      </v-btn>
      <v-spacer/>
      <v-btn icon class="mr-1">
        <v-icon left>mdi-tray-arrow-down</v-icon>
      </v-btn>
    </v-card-actions>


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
import _ from "lodash"
import {makeFilterList} from "../../filterConfigs";


export default {
  components: {
    FacetOption,
  },
  props: {
    width: Number,
  },
  data() {
    return {
      showSearch: false,
      search: "",
      filterTypeSearch: "",
      isLoading: false,
      filtersFromApi: [],
      topFilters: [],
      searchFilters: [],
      filters: [],
      filtersTotalCount: null,


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
      "facetZoom",
    ]),
    // isOpen: {
    //   get(){
    //     return !!this.facetZoom
    //   },
    //   set(newVal){
    //     if (!newVal) this.$emit("close")
    //   }
    // },
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.facetZoom)
    },
    handleClickOutside(){
      this.setFacetZoom(null)
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetZoom
      })
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `autocomplete/${this.entityType}/filters/${this.myFacetConfig.key}`
      // const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetZoom)
      url.searchParams.set("filter", filtersAsUrlStr(this.$store.state.inputFilters))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      if (this.myFacetConfig.valuesToShow === "mostCommon") {
        url.searchParams.set("q", this.search ?? "")
      }
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },

    filtersToShow() {
      return makeFilterList(this.filtersFromApi, this.myResultsFilters, !this.search)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "toggleFiltersDrawer",
      "setFacetZoom"
    ]),
    ...mapActions([
      "addInputFilters",
      "removeInputFilters",
    ]),

    clickCheckbox(filter, isChecked, e) {
    },
    fetchFilters: _.debounce(
        async function () {
          if (!this.myFacetConfig) return
          // if (!this.search) {
          //   this.filtersFromApi = []
          //   return
          // }
          this.isLoading = "primary"

          const resp = await api.getUrl(this.apiUrl)
          // if (!this.myFacetConfig) return


          const filters = resp.filters.slice(0, 10)
          const worksCounts = filters.map(f => f.works_count)
          const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
          console.log("work counts", worksCounts, sumOfAllWorksCounts)
          this.filtersTotalCount = sumOfAllWorksCounts

          this.filtersFromApi = filters.map(apiData => {
            return createDisplayFilter(
                this.myFacetConfig.key,
                apiData.value,
                apiData.display_value,
                apiData.works_count,
                this.filtersTotalCount,
            )
          })
          this.isLoading = false

        },
        250,
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
      this.fetchFilters()
    },
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.fetchFilters()
        // this.search = ""
      }
    },
    "facetZoom": {
      handler(newVal, oldVal) {
        // hacky thing for tabs
        this.isExpanded = false
        setTimeout(() => {
          this.isExpanded = true
        }, 100)

        this.tab = 0
        this.search = ""
        this.filtersFromApi = []
        this.fetchFilters()
      }
    },
    tab(to, from) {
      console.log("change tab", to)
      this.search = ""
      this.fetchFilters()
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

.v-tab {
  min-width: 1px !important;
  //width: 66px !important;

}

.v-tabs {
  border-bottom: 1px solid #ccc;
}

.v-tabs-items {
  background-color: transparent !important;
}

</style>