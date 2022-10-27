<template>
    <v-list
        class="filter-type-list-item  mt-1 py-0 mb-1"
    >
      <facet-option
          v-for="liveFilter in filtersToShow"
          :filter="liveFilter"
          :key="liveFilter.asStr"
          class="ml-7"
          :disabled="isDisabled"
          :colorful="!isDisabled"
      />
      <v-list-item class="ml-2 mb-0" v-if="thereAreMoreResults" key="more-button">
        <v-btn
            x-small
            class="ml-12"
            text
            @click.stop="(facetZoom) ? setFacetZoom(null) : setFacetZoom(facetKey)"
            :disabled="isDisabled"
        >
          More
          <v-icon right>mdi-chevron-right</v-icon>
        </v-btn>
      </v-list-item>
    </v-list>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {createDisplayFilter, filtersAsUrlStr, filtersFromUrlStr, makeFilterList} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";


export default {
  name: "FacetOptionsList",
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      filtersFromApi: [],
      maxOptionsToShow: 5,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
      "entityType",
      "facetZoom",
      "textSearch",
    ]),
    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `${this.entityType}`
      url.searchParams.set("filter", filtersAsUrlStr(this.$store.state.inputFilters))
      url.searchParams.set("group_by", this.facetKey)
      url.searchParams.set("per_page", "7")
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
    thereAreMoreResults() {
      return this.apiFiltersToShow.length > this.slicedApiFiltersToShow.length
    },

    apiFiltersToShow() {
      const resultsFilterStrings = this.myResultsFilters.map(f => f.kv)
      return this.filtersFromApi
          .filter(f => {
            return !resultsFilterStrings.includes(f.kv)
          })
          .filter(f => f.value !== "unknown")
    },
    slicedApiFiltersToShow() {
      const maxFiltersFromApiToShow = Math.max(
          0,
          (this.maxOptionsToShow) - this.myResultsFilters.length
      )
      return this.apiFiltersToShow.slice(0, maxFiltersFromApiToShow)
    },

    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    filtersToShow() {
      const ret = [...this.slicedApiFiltersToShow]
      ret.push(...this.myResultsFilters)
      const worksCounts = ret.map(f => f.count)
      const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
      ret.map(f => {
        f.countPercent = (f.count / sumOfAllWorksCounts) * 100
      })
      ret.sort(compareByCount)
      return ret
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
      "setFacetZoom",
    ]),
    ...mapActions([
      "removeInputFilters",
      "addInputFilters",
    ]),
    clickHandler() {
      console.log("click")
      this.setFacetZoom(null)
    },

    async fetchFilters() {
      this.isLoading = true
      const resp = await api.getUrl(this.apiUrl)
      this.filtersFromApi = resp.group_by.map(apiData => {
        return createDisplayFilter(
            this.config.key,
            apiData.key,
            false,
            apiData.key_display_name,
            apiData.count,
        )
      })
      this.isLoading = false
    },
  },

  created() {
  },
  async mounted() {

  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.fetchFilters()
      }
    },
  }
}
</script>

<style scoped lang="scss">
</style>