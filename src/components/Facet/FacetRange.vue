<template>

  <v-menu
      offset-y
      :close-on-content-click="false"
      :value="showMenu"
      dark
      @input="checkInput"

  >
    <template v-slot:activator="{on}">
      <v-list-item
          v-on="on"
          style="font-size: 16px; min-height: 34px;"
          :color="myResultsFilter ? 'green lighten-2' : ''"
      >
        <v-row class="pa-0 ma-0">
          <v-col cols="5" class="pa-0">
            <v-icon :disabled="isDisabled" class="mr-4" style="opacity: .7;">{{ config.icon }}</v-icon>
            {{ config.displayName }}
          </v-col>
          <v-col cols="7" class="pa-0 d-flex  justify-end">
            <div
                v-if="!isDirty"
                class=" text--lighten-2"
            >
              Anytime
            </div>
            <div v-else class="green--text text--lighten-2 font-weight-bold">
              {{ rangeValuesToShow }}
            </div>

          </v-col>
        </v-row>


      </v-list-item>
    </template>
    <v-card width="600" class="">
      <v-card-title>
        <div>
          {{ rangeValuesToShow }}
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeMenu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="d-flex range-bar-graph">
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
        <v-range-slider
            @change="saveRange"
            v-model="range"
            max="101"
            hide-details
            :color="isDirty ? 'green' : ''"
        >
        </v-range-slider>

      </v-card-text>
      <v-card-actions>
        <v-btn :disabled="!myResultsFilter" small text @click="clear">
          clear
        </v-btn>
      </v-card-actions>


    </v-card>
  </v-menu>
  <!--      <v-btn small color="green lighten-2" icon @click="clear" v-if="myResultsFilter">-->
  <!--        <v-icon small>mdi-close</v-icon>-->
  <!--      </v-btn>-->


</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {
  createDisplayFilter,
  createSimpleFilter,
  filtersAsUrlStr,
  filtersFromUrlStr,
} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";

const yearRangeSpan = 25

// single points
const rangePointToYear = function (rangePoint, yearSpan = yearRangeSpan) {
  if (rangePoint === 0) return null
  if (rangePoint === 101) return Infinity
  const rangePointScaled = 1 - (rangePoint / 100)

  const currentYear = new Date().getFullYear()
  const year = currentYear - Math.ceil(rangePointScaled * yearSpan)
  // const yearExp = Math.round(currentYear - (Math.pow(10, 2 - rangePoint / 50) - 1))

  return year
}

const yearToRangePoint = function (year, index, rangeSpan = yearRangeSpan) {
  if (year === null) {
    return (index === 0) ? 0 : 101
  }
  const currentYear = new Date().getFullYear()
  const yearScaled = 1 - ((currentYear - year) / rangeSpan)
  return (yearScaled * 100) + 1
}


// display
const rangePointsToYearDisplayValue = function (rangePoints) {
  const rangeYears = rangePoints.map(p => rangePointToYear(p))
  if (rangeYears[0] === null && rangeYears[1] === Infinity) return "Anytime"
  else if (rangeYears[0] === null) return "Through " + rangeYears[1]
  else if (rangeYears[1] === Infinity) return "Since " + rangeYears[0]
  else return rangeYears[0] + " - " + rangeYears[1]
}

// to and from filter values
const rangePointsToYearFilterValue = function (rangePoints) {
  const rangeYears = rangePoints.map(p => rangePointToYear(p))

  // you can't handle my infinite nature
  if (rangeYears[1] === Infinity) rangeYears[1] = null

  if (rangeYears.every(y => y === null)) return
  return rangeYears.join("-")
}
const yearFilterValueToRangePoints = function (yearFilterValue) {
  const rangePoints = yearFilterValue.split("-")
      .map(y => {
        return (y === '') ? null : y
      })
      .map((year, index) => {
        return yearToRangePoint(year, index)
      })
  return rangePoints

}

export default {
  name: "Facet",
  components: {},
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      range: [0, 101],
      isBooted: false,
      showMenu: false,
      perPage: 200,
      filters: []
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

    rangeValuesToShow() {
      return rangePointsToYearDisplayValue(this.range)
    },
    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    isDirty() {
      return this.range.join() !== [0, 101].join()
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    myResultsFilter() {
      return this.resultsFilters.find(f => {
        return f.key === this.facetKey
      })
    },
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `${this.entityType}`

      const filtersWithoutMe = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      url.searchParams.set("filter", filtersAsUrlStr(filtersWithoutMe))

      url.searchParams.set("group_by", this.facetKey)
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
    async saveRange(changeInfo) {
      console.log("range change event fired:", changeInfo)
      const newFilter = createSimpleFilter(
          this.facetKey,
          rangePointsToYearFilterValue(this.range)
      )
      if (newFilter.value === null) {
        await this.removeInputFiltersByKey(this.facetKey)
      } else {
        await this.replaceInputFilter(newFilter)
      }
    },
    async clear() {
      await this.removeInputFiltersByKey(this.facetKey)
      this.range = [0, 101]
    },
    closeMenu() {
      this.showMenu = false
    },
    checkInput(input) {
      this.showMenu = input
    },
    isWithinRange(value){
      const yearRange = this.range.map(x => rangePointToYear(x))
      return value >= yearRange[0] && value <= yearRange[1]
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
      if (filters.length >= yearRangeSpan) {
        filters.length = yearRangeSpan + 1
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
    "myResultsFilter.value": {
      immediate: true,
      handler(newVal) {
        console.log("myResultsFilter.value changed", newVal)
        if (!newVal || this.isBooted) return
        const range = yearFilterValueToRangePoints(this.myResultsFilter.value)
        this.range = range
        this.isBooted = true

      }
    }
  }
}
</script>
<style scoped lang="scss">

.range-bar-graph {
  height: 50px;
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
  background-color: rgba(255, 255, 255, 0.5);
  width: calc(100% - 1px);


  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}

</style>