<template>

  <v-card
      :outlined="big"
      flat
      class="ma-0 year-range-card"
      :class="{big}"
  >
    <v-card-actions v-if="big" class="graph-toolbar">
      <v-btn
          icon
          @click="$store.state.showYearRange = false"
      >
        <v-icon>mdi-chevron-up</v-icon>
      </v-btn>
      <div class="font-weight-bold green--text">

      {{ displayYearRange }}
      </div>

      <v-spacer></v-spacer>
      <v-menu
      >
        <template v-slot:activator="{on}">
          <v-btn
              v-on="on"
              icon
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>Show range:</v-subheader>
          <v-list-item
              v-for="option in rangeOptions"
              :key="option"
              @click="rangeSelected = option"
          >
            <v-list-item-icon>
              <v-icon v-if="option === rangeSelected">mdi-check</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Last {{ option }} years
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

    </v-card-actions>


    <div
        :style="{height, width}"
        class="d-flex range-bar-graph"
    >
      <template
          v-for="filter in filters"
      >
        <div
            class="range-bar-container"
            @click.exact="clickYear(filter.value)"
            @click.shift="shiftClickYear(filter.value)"
            @mouseenter="mouseEnterYear(filter)"
            @mouseleave="mouseLeaveYear(filter)"
            :key="filter.kv"
        >
          <div
              v-ripple
              class="range-bar-bar lighten-2 caption"
              :class="{green: isWithinRange(filter.value)}"
              :style="{height: filter.scaledCount * 100 + '%'}"
          >
          </div>
        </div>

      </template>


    </div>
    <v-card-actions v-if="big">
      <div class="body-2 grey--text d-flex">
        <v-icon left small>mdi-information-outline</v-icon>
        <template v-if="numYearsSelected === 0">
          Click bar to select year
        </template>
        <template v-else-if="numYearsSelected === 1">
          Shift-click to select year range
        </template>
        <template v-else>
          Click within range to clear selection
        </template>
      </div>

      <v-spacer></v-spacer>
      <div v-if="hoverYearFilter" class="body-2 mr-2">
        <span class="font-weight-bold">
          {{ hoverYearFilter.value }}:
        </span>
        <span class="">
          {{ hoverYearFilter.count | toPrecision }}
        </span>
      </div>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn small icon v-on="on" class="mr-1">
            <v-icon>mdi-tray-arrow-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>
            Export annual counts as:
            <!--                {{ myFacetConfig.displayName | pluralize(2) }} as:-->
          </v-subheader>
          <v-divider></v-divider>
          <v-list-item
              target="_blank"
              :href="csvUrl"
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
              :href="apiUrl"
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

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";
import {
  createDisplayFilter,
  createSimpleFilter,
  filtersAsUrlStr,
  filtersFromUrlStr,
    displayYearRange,
} from "../filterConfigs";
import {api} from "../api";


export default {
  name: "Facet",
  components: {},
  props: {
    // startYear: Number,
    // endYear: Number,
    big: Boolean,
    height: {
      type: String,
      default: "100px"
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
      rangeSelected: 50,
      rangeOptions: [
        50, 100
      ],
      rangeSelection: [null, null],
      hoverYearFilter: null,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "resultsFilters",
      "entityType",
      "facetZoom",
      "textSearch",
      "inputFilters",
    ]),
    yearInputFilter() {
      const yearFilter = this.inputFilters.find(f => {
        return f.key === "publication_year"
      })
      if (!yearFilter) return [null, Infinity]
      const yearRange = yearFilter.value.split("-")
      const yearStart = (yearRange[0] === "") ? null : yearRange[0]
      const yearEnd = (yearRange[1] === "") ? Infinity : yearRange[1]
      return [yearStart, yearEnd]
    },
    numYearsSelected() {
      if (!this.yearFilterIsSet) return 0
      return (this.yearInputFilter[1] - this.yearInputFilter[0]) + 1
    },
    yearFilterIsSet() {
      return this.inputFilters.find(f => {
        return f.key === "publication_year"
      })
    },
    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    isDirty() {
      return this.range.join() !== [0, 101].join()
    },
    config() {
      return getFacetConfig("publication_year")
    },
    apiUrl() {
      return this.makeApiUrl()
    },
    csvUrl() {
      return this.makeApiUrl(true)
    },
    displayYearRange(){
      return displayYearRange(this.yearInputFilter)
    }
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
      return this.yearFilterIsSet && value >= this.yearInputFilter[0] && value <= this.yearInputFilter[1]
    },

    clickYear(year) {
      if (!this.big) return
      if (this.yearFilterIsSet && this.isWithinRange(year)) {
        console.log("remove things")
        this.removeInputFiltersByKey("publication_year")
        return
      }

      const filter = createSimpleFilter(
          "publication_year",
          [year, year].join("-")
      )
      this.replaceInputFilter(filter)
    },
    shiftClickYear(year) {
      if (!this.big) return
      if (this.isWithinRange(year)) return
      if (!this.yearFilterIsSet) {
        return this.clickYear(year)
      }
      let range = [...this.yearInputFilter]
      if (year < range[0]) {
        range[0] = year
      } else if (year > range[1]) {
        range[1] = year
      } else {
        // it is within the range, do nothing
      }
      const filter = createSimpleFilter(
          "publication_year",
          range.join("-")
      )
      this.replaceInputFilter(filter)
    },
    mouseEnterYear(filter) {
      this.hoverYearFilter = filter
    },
    mouseLeaveYear(filter) {
      this.hoverYearFilter = null
    },
    makeApiUrl(formatCsv) {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = "works"

      const filtersWithoutMe = this.$store.state.inputFilters.filter(f => f.key !== "publication_year")
      url.searchParams.set("filter", filtersAsUrlStr(filtersWithoutMe))

      url.searchParams.set("group_by", "publication_year")
      url.searchParams.set("per_page", "200")
      if (formatCsv) url.searchParams.set("format", "csv")
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()

    },
    clear() {
      this.removeInputFiltersByKey("publication_year")
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
      if (filters.length >= this.rangeSelected) {
        filters.length = this.rangeSelected + 1
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
    rangeSelected: {
      immediate: false,
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

.year-range-card {
  .graph-toolbar {
  }

  &.big {
    .range-bar-bar {
      width: calc(100% - 1px);
    }
  }
}

.range-bar-graph {
  //margin: 0 10px;
  flex-direction: row-reverse;

  &.big {

  }


}

.range-bar-container {
  height: 100%;
  //background-color: rgba(255, 255, 255, 0.05);
  flex: 1;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
}

.range-bar-bar {
  //background-color: rgba(255, 255, 255, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  width: 100%;


  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}

</style>