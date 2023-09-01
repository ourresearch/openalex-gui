<template>

  <v-card
      flat
      class="ma-0 year-range-card"
      :class="{big}"
      :disabled="disabled"
  >
    <v-toolbar dense flat v-if="big" class="graph-toolbar pr-0">
      <!--      height="80" -->
      <v-toolbar-title>
        <div style="line-height: 1">
          <v-icon>mdi-pin-outline</v-icon>
          Works by year
          <!--          <span class="caption grey&#45;&#45;text">Since {{ minYear }}</span>-->
        </div>
      </v-toolbar-title>
      <v-spacer></v-spacer>


      <v-menu offset-y>
        <template v-slot:activator="{on}">
          <v-btn  icon v-on="on" class="">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
              @click="url.setGroupBy('publication_year')"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Filter years
            </v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item
              target="_blank"
              :href="csvUrl"
          >
            <v-list-item-icon>
              <v-icon>mdi-tray-arrow-down</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Export spreadsheet
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              @click="setApiDialogUrl(apiUrlForDisplay)"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              View in API
            </v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>


      <!--      <v-menu-->
      <!--              -->
      <!--      >-->
      <!--        <template v-slot:activator="{on}">-->
      <!--          <v-btn-->
      <!--              v-on="on"-->
      <!--              icon-->
      <!--          >-->
      <!--            <v-icon>mdi-dots-vertical</v-icon>-->
      <!--          </v-btn>-->
      <!--        </template>-->
      <!--        <v-list dense>-->
      <!--          <v-subheader>Show range:</v-subheader>-->
      <!--          <v-list-item-->
      <!--              v-for="option in rangeOptions"-->
      <!--              :key="option"-->
      <!--              @click="rangeSelected = option"-->
      <!--          >-->
      <!--            <v-list-item-icon>-->
      <!--              <v-icon v-if="option === rangeSelected">mdi-check</v-icon>-->
      <!--            </v-list-item-icon>-->
      <!--            <v-list-item-title>-->
      <!--              Last {{ option }} years-->
      <!--            </v-list-item-title>-->
      <!--          </v-list-item>-->
      <!--        </v-list>-->
      <!--      </v-menu>-->

    </v-toolbar>


    <div
        :style="{height, width}"
        class="d-flex range-bar-graph"
    >
      <v-tooltip
          v-for="filter in filters"
          :key="filter.kv"
          bottom
          transition="none"
      >
        <template v-slot:activator="{on}">
          <div
              v-on="on"
              class="range-bar-container"
              @mouseenter="mouseEnterYear(filter)"
              @mouseleave="mouseLeaveYear(filter)"
          >
            <!--            @click.exact="clickYear(filter.value)"-->
            <!--            @click.shift="shiftClickYear(filter.value)"-->
            <div
                class="range-bar-bar caption"
                :style="{height: filter.scaledCount * 100 + '%'}"
            >
              <!--                    :class="{green: isWithinRange(filter.value)}"-->
              <!--              v-ripple-->
            </div>
          </div>
        </template>
        <div>
          <span class="font-weight-bold">
          {{ filter.value }}:
        </span>
          <span class="">
          {{ filter.count | toPrecision }}
        </span>
        </div>

      </v-tooltip>


    </div>
    <!--    <v-card-actions v-if="big">-->
    <!--      <div class="body-2 grey&#45;&#45;text d-flex">-->
    <!--        <v-icon left small>mdi-information-outline</v-icon>-->
    <!--        <template v-if="numYearsSelected === 0">-->
    <!--          Hover over bar to see year-->
    <!--        </template>-->
    <!--        <template v-else-if="numYearsSelected === 1">-->
    <!--          Shift-click to select year range-->
    <!--        </template>-->
    <!--        <template v-else>-->
    <!--          Click within range to clear selection-->
    <!--        </template>-->
    <!--      </div>-->

    <!--      <v-spacer></v-spacer>-->
    <!--      <div v-if="hoverYearFilter" class="body-2 mr-2">-->
    <!--        <span class="font-weight-bold">-->
    <!--          {{ hoverYearFilter.value }}:-->
    <!--        </span>-->
    <!--        <span class="">-->
    <!--          {{ hoverYearFilter.count | toPrecision }}-->
    <!--        </span>-->
    <!--      </div>-->
    <!--    </v-card-actions>-->

  </v-card>


</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {getFacetConfig} from "../facetConfigs";
import FacetRange from "./Facet/FacetRange";
import {
  createDisplayFilter,
  createSimpleFilter,
  filtersAsUrlStr,
  displayYearRange,
} from "../filterConfigs";
import {api} from "../api";
import {url} from "../url";


export default {
  name: "Facet",
  components: {
    FacetRange,
  },
  props: {
    // startYear: Number,
    // endYear: Number,
    big: Boolean,
    showFilterLink: Boolean,
    height: {
      type: String,
      default: "150px"
    },
    width: {
      type: String,
      default: "unset"
    },
    disabled: Boolean,
  },
  data() {
    return {
      url,
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
      return getFacetConfig("works", "publication_year")
    },
    apiUrl() {
      return this.makeApiUrl()
    },
    apiUrlForDisplay() {
      return this.makeApiUrl(false, false)
    },
    csvUrl() {
      return this.makeApiUrl(true)
    },
    displayYearRange() {
      return displayYearRange(this.yearInputFilter)
    },

    minYear() {
      return Math.min(...this.filters.map(f => Number(f.value)))
    },
    minYearFilter() {
      const yearResultsFilter = this.resultsFilters.find(f => f.key === "publication_year")
      if (!yearResultsFilter) return
      return Number(yearResultsFilter.value.split("-")[0])
    },
    maxYearFilter() {
      const yearResultsFilter = this.resultsFilters.find(f => f.key === "publication_year")
      if (!yearResultsFilter) return
      const maxRange = yearResultsFilter.value.split("-")[1]
      if (!maxRange) return
      return Number(maxRange)
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
        "setApiDialogUrl",
    ]),
    ...mapActions([
      "replaceInputFilter",
    ]),
    isWithinRange(value) {
      return this.yearFilterIsSet && value >= this.yearInputFilter[0] && value <= this.yearInputFilter[1]
    },

    clickYear(year) {
      if (!this.big) return
      if (this.yearFilterIsSet && this.isWithinRange(year)) {
        console.log("remove things")
        url.setFiltersByKey("publication_year", [])
        return
      }

      const filter = createSimpleFilter(
          "works",
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
          "works",
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
    makeApiUrl(formatCsv = false, includeEmail = true) {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = "works"

      // const filtersWithoutMe = this.$store.state.inputFilters.filter(f => f.key !== "publication_year")
      url.searchParams.set("filter", filtersAsUrlStr(this.$store.state.inputFilters, this.entityType))

      url.searchParams.set("group_by", "publication_year")
      url.searchParams.set("per_page", "200")
      if (formatCsv) url.searchParams.set("format", "csv")
      if (this.textSearch) url.searchParams.set("search", this.textSearch);
      (includeEmail) && url.searchParams.set("mailto", "team@ourresearch.org")
      return url.toString()

    },
    clear() {
      url.setFiltersByKey("publication_year", [])
    },
    async fetchFilters() {
      const minYearToShow = new Date().getFullYear() - 50

      const resp = await api.getUrl(this.apiUrl)

      const yearCountFromApiResp = function (resp, year) {
        const ret = resp.group_by.find(group => {
          return group.key == year
        })?.count ?? 0
        return ret
      }

      const yearsToShow = resp.group_by
          .map(g => Number(g.key))
          .filter(year => year > minYearToShow)


      const minYear = Math.max(
          this.minYearFilter ?? 0,
          minYearToShow
      )
      const maxYear = this.maxYearFilter ?? new Date().getFullYear()

      if (!yearsToShow.length) {
        return []
      }
      const filters = _.range(minYear, maxYear + 1).map(year => {
        return createDisplayFilter(
            "works",
            "publication_year",
            year,
            false,
            year,
            yearCountFromApiResp(resp, year),
        )
      });

      filters.reverse()

      // filters.sort((a, b) => {
      //   return b.value - a.value
      // })

      // if (filters.length >= this.rangeSelected) {
      //   filters.length = this.rangeSelected + 1
      // }
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
    minYearFilter: {
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
    padding-bottom: 6px;

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
  //cursor: pointer;
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