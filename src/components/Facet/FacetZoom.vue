<template>

  <v-card
      v-if="facetZoom "
      :loading="isLoading"
      dark
      color="#3b3b3b"
      v-click-outside="clickOutside"
  >
    <div class="">

      <div
          class="text-h6 ml-4 mr-2 d-flex align-center"
          style="height: 75px;"
      >
        <v-icon left>{{ myFacetConfig.icon }}</v-icon>
        <div>
          {{ myFacetConfig.displayName }}
        </div>
        <v-spacer></v-spacer>

        <v-btn icon @click.stop="setFacetZoom(null)" class="ml-1 mr-2">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <div
          class="d-flex align-start"
          style="height: 50px;"
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
            background-color="#484848"
            dense

            v-model="search"
            :placeholder="searchPlaceholder"
        />


      </div>

      <div>
      </div>
    </div>
    <v-divider></v-divider>

    <v-card-text class="pa-0" :style="cardTextStyle">

      <!--       <v-text-field-->
      <!--            flat-->
      <!--            hide-details-->
      <!--            solo-->
      <!--            full-width-->
      <!--            class="mt-0 "-->
      <!--            clearable-->
      <!--            prepend-inner-icon="mdi-magnify"-->
      <!--            autofocus-->
      <!--            background-color="#484848"-->
      <!--            dense-->

      <!--            v-model="search"-->
      <!--            :placeholder="searchPlaceholder"-->
      <!--        />-->

      <div
          class="pt-3 px-5 body-2"
          style="opacity: .7;"
          v-if="showSearch"
      >
        <template v-if="search && filtersToShow.length">
          Top {{ myFacetConfig.displayName | pluralize(2) }} matching "{{ search }}" found within current results:
        </template>
        <template v-else-if="search && !filtersToShow.length">
          No {{ myFacetConfig.displayName | pluralize(2) }} matching "{{ search }}" found within current results; try
          broadening your search.
        </template>
        <template v-else>
          Top {{ myFacetConfig.displayName | pluralize(2) }} found within current results:
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
            colorful

        />
      </v-list>
      <v-btn v-if="thereAreMoreGroupsToShow" text small class="ml-10 mt-2 mb-12" @click="fetchMore">
        <v-icon left>mdi-chevron-down</v-icon>
        show more
      </v-btn>

    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions style="height: 50px;" class="elevation-3">


      <v-btn :disabled="!myResultsFilters.length" text @click="removeInputFiltersByKey(facetZoom)">
        clear
      </v-btn>
      <v-spacer></v-spacer>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="mr-1">
            <v-icon>mdi-tray-arrow-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>
            Export as:
            <!--                {{ myFacetConfig.displayName | pluralize(2) }} as:-->
          </v-subheader>
          <v-divider></v-divider>
          <v-list-item
              target="_blank"
              :href="makeApiUrl(200, true)"
          >
            <v-list-item-icon>
              <v-icon>mdi-table</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Spreadsheet
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              target="_blank"
              :href="makeApiUrl(200)"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              JSON object
            </v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>
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
      search: "",
      filterTypeSearch: "",
      isLoading: false,
      filtersFromApi: [],
      topFilters: [],
      searchFilters: [],
      filters: [],
      filtersTotalCount: null,
      maxFiltersFromApiToShow: 20,
      range: [null, null],


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
      "inputFilters",
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
    showSearch() {
      return this.myFacetConfig.valuesToShow === 'mostCommon'
    },
    isRange(){
      return (this.myFacetConfig.valuesToShow !== "range")
    },
    cardTextStyle() {
      // height: calc(100vh - (75px + 50px + 50px + 6px)); overflow-y:scroll;

      const toolbarsBaseHeight = 75 + 50
      const toolbarsTotalHeight = toolbarsBaseHeight + (this.showSearch ? 50 : 0)
      const height = toolbarsTotalHeight + 6

      return {
        'overflow-y': 'scroll',
        height: `calc(100vh - ${height}px)`
      }
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetZoom
      })
    },
    myInputFilters() {
      return this.inputFilters.filter(f => {
        return f.key === this.facetZoom
      })
    },
    thereAreMoreGroupsToShow() {
      return this.maxFiltersFromApiToShow < 200 && this.filtersFromApi.length === this.maxFiltersFromApiToShow
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    csvUrl() {
      return this.makeApiUrl(200, true)
    },

    apiUrl() {
      return this.makeApiUrl(200)
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
      "removeInputFiltersByKey",
      "replaceInputFilter",
    ]),


    clickOutside() {
      this.setFacetZoom(null)
    },
    makeApiUrl(perPage, formatCsv) {
      if (!perPage) perPage = this.maxFiltersFromApiToShow
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `${this.entityType}`
      url.searchParams.set("filter", filtersAsUrlStr(this.$store.state.inputFilters))
      url.searchParams.set("group_by", this.myFacetConfig.key)
      url.searchParams.set("per_page", String(perPage))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      if (this.search) url.searchParams.set("q", this.search)
      if (formatCsv) url.searchParams.set("format", "csv")
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
    async fetchMore() {
      this.maxFiltersFromApiToShow = 200
      await this.fetchFilters()
    },
    fetchFilters: _.debounce(
        async function () {
          if (!this.myFacetConfig) return
          // if (!this.search) {
          //   this.filtersFromApi = []
          //   return
          // }
          this.isLoading = "#fff"

          const resp = await api.getUrl(this.apiUrl)
          // if (!this.myFacetConfig) return
          if (resp.meta.q && resp.meta.q !== this.search) return


          const groups = resp.group_by
          const worksCounts = groups.map(f => f.count)
          const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
          this.filtersTotalCount = sumOfAllWorksCounts

          this.filtersFromApi = groups.map(apiData => {
            return createDisplayFilter(
                this.myFacetConfig.key,
                apiData.key,
                false,
                apiData.key_display_name,
                apiData.count,
                this.filtersTotalCount,
            )
          })
          this.isLoading = false

        },
        500,
        {leading: true, trailing: true}
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