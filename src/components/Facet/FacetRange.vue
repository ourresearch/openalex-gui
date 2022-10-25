<template>

  <div>
      <div class="body-2 ml-10">Select range:</div>
    <div class="ml-9 mr-4 mt-3 d-flex">
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
        }
        else {
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
        }
        else {
          await this.replaceInputFilter(newFilter)
        }
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
        "removeInputFilters",
        "removeInputFiltersByKey",
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