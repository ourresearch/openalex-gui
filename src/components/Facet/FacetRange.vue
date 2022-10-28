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
          {{ config.displayName }}
        </div>
        <v-spacer></v-spacer>
        <v-btn icon @click="closeMenu">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div>
          {{ rangeValuesToShow }}
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
  createSimpleFilter,
  filtersAsUrlStr,
  filtersFromUrlStr,
} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";


// single points
const rangePointToYear = function (rangePoint, yearSpan = 20) {
  if (rangePoint === 0 || rangePoint === 101) return null
  const rangePointScaled = 1 - (rangePoint / 100)

  const currentYear = new Date().getFullYear()
  const year = currentYear - Math.ceil(rangePointScaled * yearSpan)

  const yearExp = Math.round(currentYear - (Math.pow(10, 2 - rangePoint / 50) - 1))

  return year
}

const yearToRangePoint = function (year, index, rangeSpan = 20) {
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
      rangeEnds: [0, 22],
      isBooted: false,
      showMenu: false,
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


</style>