<template>

  <v-card flat :loading="isLoading">
    <v-toolbar
        class="px-0"
        flat
        extended
    >
      <v-icon class="mr-2">mdi-filter-outline</v-icon>
      <v-toolbar-title class="mr-6">
        Filter by
        <span class="font-weight-bold">{{ myFacetConfig.displayName }}</span>
      </v-toolbar-title>
      <v-spacer/>
      <v-btn icon :to="currentUrlWithoutZoom" class="no-active">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <template v-slot:extension>
        <v-text-field
            flat
            outlined
            dense
            solo
            hide-details
            prepend-inner-icon="mdi-magnify"
            full-width
            clearable
            class="pb-2"

            v-model="search"
            :placeholder="searchPlaceholder"
        />
      </template>
    </v-toolbar>

    <div v-if="0" class=" pt-3 px-6 pb-2 d-flex align-center">
      <div>
        <div class="text-h6 font-weight-medium mx-0" style="font-weight: 450 !important; line-height: 1.5;">

          <v-icon>mdi-filter-outline</v-icon>
          <template v-if="myFacetConfig">
            <router-link :to="'filters' | zoomLink" class="text-decoration-none">Filters</router-link>
            <v-icon>mdi-chevron-right</v-icon>
            <span>{{ myFacetConfig.displayName }}</span>
          </template>
          <span v-else>Filters</span>
        </div>
      </div>
      <div class="flex-fill pl-6 pr-2">
        <v-text-field
            flat
            outlined
            dense
            solo
            hide-details
            prepend-inner-icon="mdi-magnify"
            full-width
            clearable

            v-model="search"
            :placeholder="searchPlaceholder"
        />
      </div>
      <div>
        <div class="">
          <v-btn large icon :to="currentUrlWithoutZoom" class="no-active">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

    </div>
    <v-divider></v-divider>
    <v-card-text class="pa-6" style="font-size: 16px; min-height: 70vh;">


      <facet-option
          v-for="filter in filtersToShow"
          :filter="filter"
          :show-checked="filter.isResultsFilter"
          :key="filter.asStr + filter.isResultsFilter"
          :indent="facetKey === 'oa_status' && filter.value != 'closed'"
      />


    </v-card-text>
    <v-divider/>
    <v-card-actions class="py-6 px-5">
      <v-btn
          color="primary"
      >
        View {{ resultsCount | millify }} results
      </v-btn>
    </v-card-actions>


  </v-card>

</template>


<script>
import {entityConfigs} from "../entityConfigs";

import {entityTypeFromId} from "../util";
import {createDisplayFilter, createSimpleFilter, filtersAsUrlStr} from "../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../facetConfigs";
import FacetOption from "./Facet/FacetOption";
import {api} from "../api";
import axios from "axios";

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
  },
  props: {
    data: Object,
    append: String,
  },
  data() {
    return {
      search: "",
      isLoading: false,
      filtersFromAutocomplete: [],
      filtersFromGroupBy: [],
      groupByQueryResultsCount: null,
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
    ]),
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.myFacetConfig.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    facetKey() {
      return this.zoomId.split(":")[1]
    },
    filtersToShowWhenNotSearching() {
      let ret = [...this.filtersFromServer]
      this.filtersFromGroupBy
          .filter(f => f.value !== "unknown")
          .slice(0, this.maxPotentialFiltersToShow).forEach(f => {

        // only push potential filter values if they're not already loaded as
        // in a resultsFilter
        if (!ret.map(f => f.asStr).includes(f.asStr)) {
          ret.push(f)
        }
      })
      ret.sort(compareByCount)

      return ret
    },
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.facetKey)
    },

    // this is old and unused
    groupByQueryObj() {
      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      const ret = {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(myFilters),
      }
      if (this.$store.state.textSearch) ret.search = this.$store.state.textSearch
      return ret
    },
    filtersToShow() {
      let ret = [...this.filtersFromServer]
      this.filtersFromAutocomplete
          .filter(f => f.value !== "unknown")
          .forEach(f => {

            // only push potential filter values if they're not already loaded as
            // in a resultsFilter
            if (!ret.map(f => f.asStr).includes(f.asStr)) {
            ret.push(f)
        }
      })
      return ret
    },


    filtersFromServer() {
      // these ones are already selected by the user. we got them from the store,
      // which refreshes them from the server every time we search.
      // (which may have gotten from either user action or the URL)
      return this.$store.state.resultsFilters
          .filter(f => {
            return f.key === this.facetKey
          })
          .map(f => {
            return {...f, isResultsFilter: true}
          })
    },
    currentUrlWithoutZoom() {
      const newQuery = {...this.$route.query}
      newQuery.zoom = undefined
      return {
        name: this.$route.name,
        params: this.$route.params,
        query: newQuery,
      }
    },
    autocompleteUrl() {

      const url = new URL(`https://api.openalex.org`);
      url.pathname = `autocomplete/${this.entityType}/filters/${this.myFacetConfig.key}`

      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      url.searchParams.set("filter", filtersAsUrlStr(myFilters))

      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("q", this.search)
      url.searchParams.set("email", "team@ourresearch.org")

      return url.toString()
    },
  },

  methods: {
    ...mapMutations([
      "snackbar"
    ]),
    ...mapActions([]),
    getEntityIconFromId(id) {
      const type = entityTypeFromId(id)
      return entityConfigs[type]?.icon
    },
    async setFilterOptions() {
      console.log("setFilterOptions", this.myFacetConfig)
      if (!this.myFacetConfig || this.myFacetConfig.noOptions) return
      console.log("setFilterOptions")
      await this.fetchSuggestions()


      // const resp = await api.get(
      //     this.$store.state.entityType,
      //     this.groupByQueryObj,
      // )
      // this.groupByQueryResultsCount = resp.meta.count
      // this.filtersFromGroupBy = resp.group_by.map(group => {
      //   return createDisplayFilter(
      //       this.facetKey,
      //       group.key,
      //       group.key_display_name,
      //       group.count
      //   )
      // })
    },
    fetchSuggestions() {
      this.isLoading =true
      axios.get(this.autocompleteUrl)
          .then(resp => {
            this.filtersFromAutocomplete = resp.data.filters.map(apiData => {
              return createDisplayFilter(
                  this.myFacetConfig.key,
                  apiData.value,
                  apiData.display_value,
                  apiData.works_count,
              )
            })
            this.isLoading = false
          })
    }
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
        console.log(`Facet "${this.facetKey}" watcher: resultsFilters changed:`, newVal)
        this.setFilterOptions()
        this.search = ""
      }
      ,
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