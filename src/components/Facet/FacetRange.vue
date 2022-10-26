<template>

  <div>
    <div class="body-2 ml-10">Select range:</div>
    <div v-if="1" class="ml-9 mr-4 mt-3 d-flex">
      <v-menu
          offset-y
          :close-on-content-click="false"
      >
        <template v-slot:activator="{on}">
          <v-btn text v-on="on">
            {{ rangeValuesToShow }}
          </v-btn>
        </template>
        <v-card width="400" class="pa-3">
          <div>
            {{ rangeValuesToShow }}
          </div>
          <div>
            filter string: {{ rangeValuesToFilterString }}
          </div>
          <v-range-slider
              @change="saveRange"
              v-model="range"
              max="102"
          >

          </v-range-slider>

        </v-card>
      </v-menu>


    </div>


    <div v-if="1" class="ml-9 mr-4 mt-3 d-flex">
      <v-select
          v-model="rangeStart"
          :items="rangeStartOptions"
          outlined
          dense
          label="Starting"
          hide-details
          :menu-props="{dark: true, color: 'green'}"
          append-icon=""
          clearable

      >
        <template v-slot:selection="{item, index}">
          <span class="font-weight-bold green--text">
            {{ item }}
          </span>
        </template>
      </v-select>

      <v-icon>mdi-minus</v-icon>

      <v-select
          v-model="rangeEnd"
          :items="rangeEndOptions"
          outlined
          dense
          label="Ending"
          hide-details
          :menu-props="{dark: true, color: 'green'}"
          append-icon=""
          clearable
          class=""
      >
        <template v-slot:selection="{item, index}">
          <span class="font-weight-bold green--text">
            {{ item }}
          </span>
        </template>
      </v-select>

    </div>

    <v-list-item class="ml-6 mb-2">
      <v-btn
          small
          class="ml-6"
          text
          @click.stop="(facetZoom) ? setFacetZoom(null) : setFacetZoom(facetKey)"
          :disabled="isDisabled"
      >
        More
        <v-icon right>mdi-chevron-right</v-icon>
      </v-btn>
    </v-list-item>


  </div>
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
  makeFilterList
} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";


// single points
const rangePointToYear = function (rangePoint, yearSpan = 20) {
  if (rangePoint === 0 || rangePoint === 102) return null
  const rangePointScaled = 1 - (rangePoint / 100)

  const currentYear = new Date().getFullYear()
  const year = currentYear - Math.ceil(rangePointScaled * yearSpan)
  return year
}

const yearToRangePoint = function (year, isStart, rangeSpan = 20) {
  if (year === null) {
    return (isStart) ? 0 : 102
  }
  const currentYear = new Date().getFullYear()
  const yearScaled = 1 - ((currentYear - year) / rangeSpan)
  return (yearScaled * 100) + 1
}


// display
const rangeYearsToShow = function (rangeYears) {
  if (rangeYears.every(v => v === null)) return "Anytime"
  else if (rangeYears[0] === null) return "Through " + rangeYears[1]
  else if (rangeYears[1] === null) return "Since " + rangeYears[0]
  else return rangeYears[0] + " - " + rangeYears[1]
}
const rangePointsToYearDisplayValue = function (rangePoints) {
  const rangeYears = rangePoints.map(p => rangePointToYear(p))
  if (rangeYears.every(v => v === null)) return "Anytime"
  else if (rangeYears[0] === null) return "Through " + rangeYears[1]
  else if (rangeYears[1] === null) return "Since " + rangeYears[0]
  else return rangeYears[0] + " - " + rangeYears[1]
}

// to and from filter values
const rangePointsToYearFilterValue = function (rangePoints) {
  const rangeYears = rangePoints.map(p => rangePointToYear(p))
  if (rangeYears.every(y => y === null)) return
  return rangeYears.join("-")
}
const yearFilterStringToRangePoints = function (yearFilterString) {

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
      range: [0, 102],
      rangeEnds: [0, 22],
      // rangeStart: null,
      // rangeEnd: null,
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

    rangeStart: {
      get() {
        if (!this.myResultsFilter) return
        const ret = this.myResultsFilter.value.split("-")[0]
        return (ret) ? Number(ret) : null
      },
      async set(rangeStartValue) {
        const newFilter = createSimpleFilter(
            this.facetKey,
            [rangeStartValue, this.rangeEnd].join("-")
        )

        if (newFilter.value === "-") {
          await this.removeInputFiltersByKey(this.facetKey)
        } else {
          await this.replaceInputFilter(newFilter)
        }
      },
    },
    rangeEnd: {
      get() {
        if (!this.myResultsFilter) return

        const ret = this.myResultsFilter.value.split("-")[1]
        return (ret) ? Number(ret) : null
      },
      async set(rangeEndValue) {
        const newFilter = createSimpleFilter(
            this.facetKey,
            [this.rangeStart, rangeEndValue].join("-")
        )
        if (newFilter.value === "-") {
          await this.removeInputFiltersByKey(this.facetKey)
        } else {
          await this.replaceInputFilter(newFilter)
        }
      },
    },
    rangeValuesToShow() {
      return rangePointsToYearDisplayValue(this.range)
    },
    rangeValuesToFilterString() {
      return rangePointsToYearFilterValue(this.range)
    },
    rangePointTest() {

    },

    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    rangeStartOptions() {
      const biggestPossibleOption = (this.rangeEnd) ? this.rangeEnd : 2022
      const ret = _.range(1972, biggestPossibleOption + 1)
      ret.reverse()
      return ret
    },
    rangeEndOptions() {
      const smallestPossibleOption = (this.rangeStart) ? this.rangeStart : 1972
      const ret = _.range(smallestPossibleOption, 2022 + 1)
      ret.reverse()
      return ret
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    myResultsFilter() {
      return this.resultsFilters.find(f => {
        return f.key === this.facetKey
      })
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
    }
  },

  created() {
  },
  async mounted() {
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        // this.fetchFilters()
      }
    },
  }
}
</script>
<style scoped lang="scss">


</style>