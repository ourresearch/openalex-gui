<template>

  <div>
    <div class="ml-8 mr-4">
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
          class="mt-3"
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
import FacetOptionRange from "./FacetRangeOption";
import {compareByCount} from "../../util";
import {api} from "../../api";


export default {
  name: "Facet",
  components: {
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      range: [0, 100],
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
        if (!this.myResultsFilter) return 1972
        const ret = this.myResultsFilter.value.split("-")[0]
        return (ret) ? Number(ret) : 1972
      },
      async set(rangeStartValue) {
        const newFilter = createSimpleFilter(
            this.facetKey,
            [rangeStartValue, this.rangeEnd].join("-")
        )
        await this.replaceInputFilter(newFilter)
      },
    },
    rangeEnd: {
      get() {
        if (!this.myResultsFilter) return 2022
        console.log("getting value from rangeEnd", this.facetKey, this.myResultsFilter.value.split("-")[1])

        const ret = this.myResultsFilter.value.split("-")[1]
        return (ret) ? Number(ret) : 2022
      },
      async set(rangeEndValue) {
        console.log("set new value for rangeStart: ", rangeEndValue)
        const newFilter = createSimpleFilter(
            this.facetKey,
            [this.rangeStart, rangeEndValue].join("-")
        )
        await this.replaceInputFilter(newFilter)
      },
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
    ]),

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