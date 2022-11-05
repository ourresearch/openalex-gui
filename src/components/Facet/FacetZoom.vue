<template>

  <v-card
      :loading="isLoading"
      flat
      color="#fff"
      style="min-width: 350px;"
  >
    <div class="card-header pa-2" style="position: relative;" :class="{'elevation-3': isScrolled}">

      <div
          class="text-h6 px-2 d-flex align-center"
          :style="`height: ${height.toolbar}px;`"
      >
        <v-icon left>{{ config.icon }}</v-icon>
        <div id="facet-zoom-header">
          {{ config.displayName }}
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
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
            full-width
            class="mt-0 mx-2"
            clearable
            prepend-inner-icon="mdi-magnify"
            :append-outer-icon="searchString ? 'mdi-arrow-right-circle-outline' : ''"
            :placeholder="searchPlaceholder"
            :disabled="!!isLoading"
            autofocus
            dense

            v-model="searchString"
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


      <v-list>
        <template v-if="!appliedSearchString">
          <facet-option
              v-for="f in resultsFiltersNotInApiFilters"
              :filter="f"
              :key="f.asStr"
              :is-negated="negatedFilters.includes(f.kv)"
              :is-selected="selectedFilters.includes(f.kv)"
              @set-value="setSelectedFilters"
              :disabled="!!isLoading"
              :is-boolean="config.isBoolean"
          />
        </template>
        <facet-option
            v-for="f in apiFiltersToShow"
            :filter="f"
            :key="f.asStr"
            :is-negated="negatedFilters.includes(f.kv)"
            :is-selected="selectedFilters.includes(f.kv)"
            @set-value="setSelectedFilters"
            :disabled="!!isLoading"
            :is-boolean="config.isBoolean"

        />
      </v-list>
      <!--      <v-btn v-if="thereAreMoreGroupsToShow" text small class="ml-10 mt-2 mb-12" @click="fetchMore">-->
      <!--        <v-icon left>mdi-chevron-down</v-icon>-->
      <!--        show more-->
      <!--      </v-btn>-->

    </v-card-text>
    <v-card-actions :style="`height: ${height.footer}px;`" class="" :class="{'elevation-3': isScrolled}">


      <v-btn :disabled="!isDirty" :loading="applyIsLoading" depressed color="primary" @click="saveSelectedFilters">
        Apply
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
    isVisible: Boolean,
  },
  data() {
    return {
      isLoading: false,
      applyIsLoading: false,
      maxApiFiltersToShow: 20,

      // this all needs to be cleared when we close the menu
      apiFilters: [],
      filtersTotalCount: null,
      selectedFilters: [],
      negatedFilters: [],
      searchString: "",
      appliedSearchString: "",


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
      "resultsFiltersNegated",
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
    isDirty() {
      const negatedIsDirty = !_.isEmpty(_.xor(
          this.negatedFilters,
          this.myResultsFilters.filter(f => f.isNegated).map(f => f.kv)
      ))
      const selectedIsDirty = !_.isEmpty(_.xor(
          this.selectedFilters,
          this.myResultsFilters.map(f => f.kv)
      ));
      return (negatedIsDirty || selectedIsDirty)

    },
    cardTextStyle() {
      const marginsHeight = this.height.margins[0] + this.height.margins[1]
      const toolbarsTotalHeight = this.height.toolbar + (this.showSearch ? this.height.searchbar : 0) + this.height.footer
      // const height = toolbarsTotalHeight + marginsHeight + 2 // dividers

      const height = (this.config.isBoolean) ? "150px" : "50vh"

      return {
        'overflow-y': "scroll",
        height,
        // height: `calc(50vh - ${height}px)`,
      }
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    allFilters() {
      return [...this.myResultsFilters, ...this.apiFilters]
    },
    thereAreMoreGroupsToShow() {
      return this.maxApiFiltersToShow < 200 && this.apiFilters.length === this.maxApiFiltersToShow
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
    searchStringIsBlank() {
      return !this.searchString
    },
    myResultsFilterIds() {
      return this.myResultsFilters.map(f => f.kv)
    },
    apiFilterIds() {
      return this.apiFilters.map(f => f.kv)
    },

    resultsFiltersNotInApiFilters() {
      const ret = this.myResultsFilters.filter(f => !this.apiFilterIds.includes(f.kv))
      return sortedFilters(ret, this.config.sortByValue)
    },
    apiFiltersToShow() {
      const ret = this.apiFilters
          .filter(f => f.value !== "unknown")
      const sorted = sortedFilters(ret, this.config.sortByValue)
      sorted.sort((a,b)=>{
        console.log("sortfunction", this.selectedFilters, a.kv)
        return (this.myResultsFilterIds.includes(a.kv)) ? -1 : 1
      })
      return sorted
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
      "replaceInputFacet",
    ]),
    setSelectedFilters(arg) {
      console.log("FacetZoom setSelectedFilters", arg)
      this.selectedFilters = this.selectedFilters.filter(kv => {
        return kv !== arg.kv
      });
      if (arg.isSelected) this.selectedFilters.push(arg.kv)

      this.negatedFilters = this.negatedFilters.filter(kv => {
        return kv !== arg.kv
      });
      if (arg.isNegated) this.negatedFilters.push(arg.kv)
    },
    saveSelectedFilters() {
      this.$emit("close")
      const filtersToSave = this.allFilters.filter(f => {
        return this.selectedFilters.includes(f.kv)
      }).map(f => {
        return createSimpleFilter(
            f.key,
            f.value,
            this.negatedFilters.includes(f.kv)
        )
      })
      this.replaceInputFacet({
        facetKey: this.facetKey,
        filters: filtersToSave,
      })


    },
    makeApiUrl(perPage, formatCsv) {
      if (!perPage) perPage = this.maxApiFiltersToShow
      const url = new URL(`https://api.openalex.org`)
      url.pathname = `${this.entityType}`

      const filters = this.$store.state.inputFilters.filter(f => f.key !== this.config.key)
      url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))

      url.searchParams.set("group_by", this.config.key)
      url.searchParams.set("per_page", String(perPage))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      if (this.searchString) url.searchParams.set("q", this.searchString)
      if (formatCsv) url.searchParams.set("format", "csv")
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
    async fetchMore() {
      this.maxApiFiltersToShow = 200
      await this.fetchFilters()
    },
    async clearSearch() {
      this.searchString = ""
      await this.fetchFilters()
    },
    async fetchFilters() {
      if (!this.config) return
      this.isLoading = "primary"

      const resp = await api.getUrl(this.apiUrl)
      this.appliedSearchString = resp.meta.q

      const groups = resp.group_by.slice(0, 20)
      const worksCounts = groups.map(f => f.count)
      const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
      this.filtersTotalCount = sumOfAllWorksCounts

      this.apiFilters = groups.map(apiData => {
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
    onCardTextScroll(e) {
      this.isScrolled = e.target.scrollTop > 0
    },
    clear() {
      this.apiFilters = []
      this.filtersTotalCount = null
      this.selectedFilters = []
      this.negatedFilters = []
      this.searchString = ""
      this.appliedSearchString = ""
    }

  },
  created() {
  },
  mounted() {
  },
  destroyed() {
  },
  watch: {
    // search(newVal, oldVal) {
    //   console.log("search changed", newVal)
    //   this.fetchFilters()
    // },
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        // this.clear()
        this.fetchFilters()
      }
    },
    isVisible: {
      immediate: true,
      handler(newVal) {
        this.clear()
        this.selectedFilters = this.myResultsFilters.map(f => f.kv)
        this.negatedFilters = this.myResultsFilters.filter(f => f.isNegated).map(f => f.kv)
        this.fetchFilters()
        // if (!newVal) {
        //   this.clear()
        //   this.fetchFilters()
        // }
      }
    },
    "myResultsFilters": {
      immediate: true,
      handler(newVal, oldVal) {
        this.selectedFilters = newVal.map(f => f.kv)
        this.negatedFilters = newVal.filter(f => f.isNegated).map(f => f.kv)
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
    //     this.apiFilters = []
    //     this.fetchFilters()
    //   }
    // },
    tab(to, from) {
      console.log("change tab", to)
      this.searchString = ""
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