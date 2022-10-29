<template>
  <div
      :style="{height, width}"
      class="d-flex range-bar-graph"
  >
    <div
        v-for="filter in filters"
        :key="filter.kv"
        class="range-bar-container"
    >
      <div
          class="range-bar-bar lighten-2 caption"
          :class="{green: isWithinRange(filter.value) && isDirty}"
          :style="{height: filter.scaledCount * 100 + '%'}"

      >
        <!--              {{filter.value.substring(2, 4)}}-->

      </div>
    </div>

  </div>


</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";
import {
  createDisplayFilter,
  createSimpleFilter,
  filtersAsUrlStr,
  filtersFromUrlStr,
} from "../filterConfigs";
import {api} from "../api";


export default {
  name: "Facet",
  components: {},
  props: {
    // startYear: Number,
    // endYear: Number,
    height: {
      type: String,
      default: "70px"
    },
    width: {
      type: String,
      default: "unset"
    }
  },
  data() {
    return {
      loading: false,
      isBooted: false,
      perPage: 200,
      filters: [],
      defaultRangeEnds: [
          1922,
          new Date().getFullYear()
      ]
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
    rangeSpan(){
      return this.rangeEnds[1] - this.rangeEnds[0]
    },
    rangeEnds(){
      return this.defaultRangeEnds
    },
    isDirty() {
      return this.range.join() !== [0, 101].join()
    },
    config() {
      return getFacetConfig("publication_year")
    },
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = "works"

      const filtersWithoutMe = this.$store.state.inputFilters.filter(f => f.key !== "publication_year")
      url.searchParams.set("filter", filtersAsUrlStr(filtersWithoutMe))

      url.searchParams.set("group_by", "publication_year")
      url.searchParams.set("per_page", String(this.perPage))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
      "setFacetZoom",
    ]),
    ...mapActions([
      "replaceInputFilter",
      "removeInputFilters",
      "removeInputFiltersByKey",
    ]),
    isWithinRange(value) {
      return value >= this.startYear && value <= this.endYear
    },
    async fetchFilters() {
      const maxValue = new Date().getFullYear()

      const resp = await api.getUrl(this.apiUrl)
      const filters = resp.group_by
          .filter(g => g.key <= maxValue)
          .map(apiData => {
            return createDisplayFilter(
                this.config.key,
                apiData.key,
                false,
                apiData.key_display_name,
                apiData.count,
            )
          })


      filters.sort((a, b) => {
        return b.value - a.value
      })
      if (filters.length >= this.rangeSpan) {
        filters.length = this.rangeSpan + 1
      }
      const maxCount = Math.max(...filters.map(f => f.count))
      const scaledFilters = filters.map(f => {
        return {
          ...f,
          scaledCount: f.count / maxCount,
        }
      })
      this.filters = scaledFilters
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
    // "myResultsFilter.value": {
    //   immediate: true,
    //   handler(newVal) {
    //     console.log("myResultsFilter.value changed", newVal)
    //     if (!newVal || this.isBooted) return
    //     const range = yearFilterValueToRangePoints(this.myResultsFilter.value)
    //     this.range = range
    //     this.isBooted = true
    //
    //   }
    // }
  }
}
</script>
<style scoped lang="scss">

.range-bar-graph {
  margin: 0 10px;
  flex-direction: row-reverse;
}

.range-bar-container {
  height: 100%;
  //background-color: rgba(255, 255, 255, 0.05);
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.range-bar-bar {
  //background-color: rgba(255, 255, 255, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  //width: calc(100% - 1px);
  width: 100%;


  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}

</style>