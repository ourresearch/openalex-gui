<template>

  <v-card flat>

    <div class="pt-6 px-6 pb-3 d-flex">
      <div>
        <div class="text-h6 font-weight-medium mx-0" style="font-weight: 450 !important; line-height: 1.5;">
          <span>Add filter</span>
          <span v-if="myFacetConfig"> > {{ myFacetConfig.displayName }}</span>
        </div>
        <div>{{ resultsCount | millify }} results</div>
      </div>
      <v-spacer/>
      <div class="pl-10">
        <v-btn large icon :to="currentUrlWithoutZoom" class="no-active">
          <v-icon>mdi-close</v-icon>
        </v-btn>

      </div>
    </div>
    <v-divider></v-divider>
    <v-card-text class="pa-6" style="font-size: 16px;">
      <div v-if="!myFacetConfig">
        <div v-for="facet in searchFacetConfigs" :key="facet.key">
          <router-link
              :to="'filters:' + facet.key | zoomLink"
          >
            {{ facet.displayName }}
          </router-link>
        </div>
      </div>
      <div v-else>

        <facet-option
            v-for="filter in tableItems"
            :filter="filter"
            :show-checked="filter.isResultsFilter"
            :key="filter.asStr + filter.isResultsFilter"
            :indent="facetKey === 'oa_status' && filter.value != 'closed'"
        />
      </div>

    </v-card-text>
    <v-divider/>
    <v-card-actions class="py-6 px-5">
      action
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
      foo: 42,
      potentialFilterValues: [],
      groupByQueryResultsCount: null,
    }
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "resultsCount",
      "entityZoomData",
      "searchFacetConfigs",
      "zoomId",
      "zoomTypeConfig",
      "entityZoomHistoryData",
    ]),
    facetKey() {
      return this.zoomId.split(":")[1]
    },
    tableItems() {
      let ret = [...this.resultsFiltersToShow]
      this.potentialFilterValues
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
    apiQuery() {
      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      const ret = {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(myFilters),
      }
      if (this.$store.state.textSearch) ret.search = this.$store.state.textSearch
      return ret
    },
    resultsFiltersToShow() {
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
    apiUrl() {
      // const shortId = this.entityZoomData.id.replace("https://openalex.org/", "")
      // const entityType = entityTypeFromId(shortId)
      // return `https://api.openalex.org/${entityType}/${shortId}`
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

      const resp = await api.get(
          this.$store.state.entityType,
          this.apiQuery,
      )
      this.groupByQueryResultsCount = resp.meta.count
      this.potentialFilterValues = resp.group_by.map(group => {
        return createDisplayFilter(
            this.facetKey,
            group.key,
            group.key_display_name,
            group.count
        )
      })
    },
  },
  created() {
  },
  mounted() {
    console.log("mount up")
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        console.log(`Facet "${this.facetKey}" watcher: resultsFilters changed:`, newVal)
        this.setFilterOptions()
      }
      ,
    },}
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