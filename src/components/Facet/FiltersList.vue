<template>
  <v-card
      color="#fff"
      light
      elevation="3"
      :width="width"
      v-if="filterTypeKey "
      class="mt-2"
      style="min-height: 97vh;"
      :loading="isLoading"
  >
    <div v-if="0" class=" pt-3 pb-0 px-1 pl-2 d-flex align-center" style="background-color: rgba(0,0,0,.05)">
      <!--      <v-btn icon @click="$emit('close')">-->
      <v-btn icon @click="$emit('close')" class="mr-2">
        <v-icon class="">mdi-chevron-left</v-icon>
      </v-btn>
      <!--      </v-btn>-->
      <div>
        <div>
          <div class="">Add filters</div>
        </div>
<!--          {{ myFacetConfig.displayName }}-->

      </div>
      <v-spacer/>

<!--      <v-btn icon @click="$emit('close')">-->
<!--        <v-icon class="mr-1">mdi-close</v-icon>-->
<!--      </v-btn>-->

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
        {{ myFacetConfig.isBoolean ? 'Options' : 'Top' }}
      </v-tab>
      <v-tab key="1" v-if="!myFacetConfig.isBoolean && !myFacetConfig.isRangeable">
        Search
      </v-tab>
      <v-tab key="2" v-if="myFacetConfig.isRangeable">
        Range
      </v-tab>
    </v-tabs>
    <v-tabs-items
        v-model="tab"
        class="pt-0"

    >
      <v-tab-item key="0" class="pt-4 ">
        <v-list dense>
          <facet-option
              v-for="f in filtersToShow"
              :filter="f"
              :key="f.asStr"
              :disable-on-selection="true"
              @click-checkbox="clickCheckbox"
          />
        </v-list>
      </v-tab-item>

      <v-tab-item key="1" v-if="!myFacetConfig.isBoolean && !myFacetConfig.isRangeable">
        <div
            style="background-color: rgba(0,0,0,.05);"
            class=" py-2"
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
              autofocus

              v-model="search"
              :placeholder="searchPlaceholder"
          />
        </div>
        <facet-option
            class=""
            v-for="f in filtersToShow"
            :filter="f"
            :key="f.asStr"
            :disable-on-selection="true"
            @click-checkbox="clickCheckbox"
        />
        <div v-if="!search" class="pa-3 grey--text">Search within the filtered results set.</div>

      </v-tab-item>
      <v-tab-item key="2" v-if="myFacetConfig.isRangeable">
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
import {makeFilterList} from "../../filterConfigs";


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
    apiUrl() {
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
      return makeFilterList(this.filtersFromApi, this.myResultsFilters)
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
    fetchFilters: _.debounce(
        async function () {
          if (!this.myFacetConfig) return
          if (this.tab===1 && !this.search) {
            this.filtersFromApi = []
            return
          }
          this.isLoading = "primary"

          const resp = await api.getUrl(this.apiUrl)
          const filters = resp.filters.slice(0,10)
          const worksCounts = filters.map(f => f.works_count)
          const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a+ b)
          console.log("work counts" , worksCounts, sumOfAllWorksCounts)
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
        this.search = ""
      }
    },
    "filterTypeKey": {
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