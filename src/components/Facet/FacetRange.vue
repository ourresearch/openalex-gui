<template>

  <div>
    <div class="ml-7 mr-4  d-flex">
      <v-menu
          offset-y
          :close-on-content-click="false"
          :value="showMenu"
          dark
          @input="checkInput"

      >
        <template v-slot:activator="{on}">
          <v-btn
              text
              v-on="on"
              class="low-key-button font-weight-bold"
              style="font-size: 15px;"
              :color="myResultsFilter ? 'green lighten-2' : ''"
          >
            {{ rangeValuesToShow }}
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-card width="400" class="">
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
              :color="isDirty ? '' : 'green'"
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


    </div>


    <v-list-item v-if="0" class="ml-1 mb-2">
      <v-btn
          x-small
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

  const yearExp = Math.round(currentYear - (Math.pow(10, 2 - rangePoint  / 50) -1))

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
    isDirty(){
      return this.range.join() === [0,101].join()
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
    async clear(){
      await this.removeInputFiltersByKey(this.facetKey)
      this.range = [0, 101]
    },
    closeMenu(){
      this.showMenu = false
    },
    checkInput(input){
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
      handler(newVal){
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