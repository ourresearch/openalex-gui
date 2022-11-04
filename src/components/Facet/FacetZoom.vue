<template>

  <v-card
      :loading="isLoading"
      flat
      color="#fff"
      style="min-width: 350px;"
  >
    <div class="card-header" :class="{'elevation-3': isScrolled}">

      <div
          class="text-h6 ml-2 mr-2 d-flex align-center"
          :style="`height: ${height.toolbar}px;`"
      >
        <v-icon left>{{ config.icon }}</v-icon>
        <div id="facet-zoom-header">
          {{ config.displayName }}
        </div>
        <v-spacer></v-spacer>

      </div>
      <div
          class="d-flex align-start"
          :style="`height: ${height.searchbar}px;`"
          v-if="showSearch"
      >
        <!--        <div class="">-->
        <!--          {{ config.displayName }}-->
        <!--        </div>-->

        <v-text-field
            flat
            hide-details
            solo
            full-width
            class="mt-0 mx-2"
            clearable
            prepend-inner-icon="mdi-magnify"
            :append-outer-icon="search ? 'mdi-arrow-right' : ''"
            :placeholder="searchPlaceholder"
            :disabled="!!isLoading"
            autofocus
            dense

            v-model="search"
            @click:append-outer="fetchFilters"
            @click:clear="clearSearch"
            @keypress.enter="fetchFilters"
        />


      </div>

      <div>
      </div>
    </div>

    <v-card-text
        id="facet-zoom-card-text"
        class="pa-0"
        :style="cardTextStyle"
        v-scroll.self="onCardTextScroll"
    >

      <div
          class="pt-3 px-5 body-2"
          style="opacity: .7;"
          v-if="0 && showSearch"
      >
        <template v-if="search && searchResultFilters.length">
          Top {{ config.displayName | pluralize(2) }} matching "{{ search }}" found within current results:
        </template>
        <template v-else-if="search && !searchResultFilters.length">
          No {{ config.displayName | pluralize(2) }} matching "{{ search }}" found within current results; try
          broadening your search.
        </template>
        <template v-else>
          Top {{ config.displayName | pluralize(2) }} found within current results:
        </template>
      </div>


      <v-list>
        <facet-option
            class=""
            v-for="f in selectedFilters"
            :filter="f"
            :key="f.asStr"
            colorful
        />
        <facet-option
            class=""
            v-for="f in unselectedFilters"
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
    <v-card-actions :style="`height: ${height.footer}px;`" class="" :class="{'elevation-3': isScrolled}">


      <v-btn :disabled="!myResultsFilters.length" text @click="removeInputFiltersByKey(facetKey)">
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
            <!--                {{ config.displayName | pluralize(2) }} as:-->
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
import {makeFilterList, sortedFilters} from "../../filterConfigs";


export default {
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
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
      isScrolled: false,


      // width: 300,
      height: {
        toolbar: 60,
        searchbar: 50,
        margins: [10, 10],
        footer: 50,
      },
      WidthMargins: [10, 0]

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
      "inputFilters",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.facetKey)
    },
    showSearch() {
      return this.config.valuesToShow === 'mostCommon'
    },
    isRange() {
      return (this.config.valuesToShow !== "range")
    },
    cardTextStyle() {
      const marginsHeight = this.height.margins[0] + this.height.margins[1]
      const toolbarsTotalHeight = this.height.toolbar + (this.showSearch ? this.height.searchbar : 0) + this.height.footer
      const height = toolbarsTotalHeight + marginsHeight + 2 // dividers

      return {
        'overflow-y': "scroll",
        'height': "50vh",
        // height: `calc(50vh - ${height}px)`,
      }
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    myInputFilters() {
      return this.inputFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    thereAreMoreGroupsToShow() {
      return this.maxFiltersFromApiToShow < 200 && this.filtersFromApi.length === this.maxFiltersFromApiToShow
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.config.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    csvUrl() {
      return this.makeApiUrl(200, true)
    },

    apiUrl() {
      return this.makeApiUrl(200)
    },
    searchResultFilters(){
      const ret = this.filtersFromApi
          .filter(f => f.value !== "unknown")
      return sortedFilters(ret, this.config.sortByValue)
    },

    selectedFilters(){
      return sortedFilters(this.myResultsFilters).slice(0,30)
    },
    unselectedFilters() {
      const unselectedFilters = this.filtersFromApi
          .filter(f => f.value !== "unknown")
          .filter(f => {
            const myResultsFilter = this.resultsFilters.find(rf => rf.kv === f.kv)
            return !myResultsFilter
          })
      return sortedFilters(unselectedFilters, this.config.sortByValue).slice(0,30)
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
      "removeInputFiltersByKey",
      "replaceInputFilter",
    ]),


    makeApiUrl(perPage, formatCsv) {
      if (!perPage) perPage = this.maxFiltersFromApiToShow
      const url = new URL(`https://api.openalex.org`)
      url.pathname = `${this.entityType}`

      const filters = this.$store.state.inputFilters.filter(f => f.key !== this.config.key)
      url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))

      url.searchParams.set("group_by", this.config.key)
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
    async clearSearch() {
      this.search = ""
      await this.fetchFilters()
    },
    fetchFilters: _.debounce(
        async function () {
          if (!this.config) return
          // if (!this.search) {
          //   this.filtersFromApi = []
          //   return
          // }
          this.isLoading = "primary"

          const resp = await api.getUrl(this.apiUrl)
          // if (!this.config) return
          if (resp.meta.q && resp.meta.q !== this.search) return


          const groups = resp.group_by
          const worksCounts = groups.map(f => f.count)
          const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
          this.filtersTotalCount = sumOfAllWorksCounts

          this.filtersFromApi = groups.map(apiData => {
            return createDisplayFilter(
                this.config.key,
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
    onCardTextScroll(e) {
      this.isScrolled = e.target.scrollTop > 0
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
    // search(newVal, oldVal) {
    //   console.log("search changed", newVal)
    //   this.fetchFilters()
    // },
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.fetchFilters()
        this.search = ""
      }
    },
    // "facetZoom": {
    //   handler(newVal, oldVal) {
    //     // hacky thing for tabs
    //     this.isExpanded = false
    //     setTimeout(() => {
    //       this.isExpanded = true
    //     }, 100)
    //
    //     this.tab = 0
    //     this.search = ""
    //     this.filtersFromApi = []
    //     this.fetchFilters()
    //   }
    // },
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