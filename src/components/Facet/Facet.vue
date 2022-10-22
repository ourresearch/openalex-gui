<template>

  <v-list-group
      color="#fff"
      multiple
      :disabled="isDisabled"
      :id="htmlId"
      append-icon=""
  >
    <template v-slot:activator>
      <v-list-item-title
          @click="clickHandler"
      >
                <v-icon class="expand-indicator" style="opacity: .5;">mdi-chevron-down</v-icon>
<!--        <span v-else style="padding-left: 33px;"></span>-->
        {{ config.displayName }}


      </v-list-item-title>
            <v-list-item-action style="min-width: unset;">
              <v-chip
                  outlined
                  small
                  class="mr-1 px-2 count-chip my-0"
                  v-if="myResultsFilters.length > 0"
                  color="green lighten-2"
              >
                {{ myResultsFilters.length }}
              </v-chip>
            </v-list-item-action>

    </template>


    <div v-if="config.isRange" class="ml-8 mr-4">
      <v-select
          v-model="range[0]"
          outlined
          dense
          :items="rangeStartOptions"
          label="After or on"
          hide-details
          placeholder="anytime"
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
          outlined
          v-model="range[1]"
          :items="rangeFinishOptions"
          hide-details
          placeholder="now"
          label="Before or on"
          dense
          dark
          append-icon=""
          class="mt-3"
      >
        <template v-slot:selection="{item, index}">
          <span class="font-weight-bold green--text">
            {{ item }}
          </span>
        </template>
      </v-select>

    </div>

    <v-list
        v-else
        class="filter-type-list-item  my-0 py-0"
    >
      <!--      <v-slide-y-transition group>-->
      <facet-option
          v-for="liveFilter in filtersToShow"
          :filter="liveFilter"
          :key="liveFilter.asStr"
          class="ml-6"
          :disabled="isDisabled"
          :colorful="!isDisabled"
          @click-checkbox="clickCheckbox"


      />
      <!--      </v-slide-y-transition>-->
      <v-list-item class="ml-6 mb-2" v-if="thereAreMoreResults" key="more-button">
        <v-btn
            small
            class="ml-6"
            text
            @click.stop="(facetZoom) ? setFacetZoom(null) : setFacetZoom(facetKey)"
            :disabled="isDisabled"
        >
          <!--            <v-icon left>mdi-plus</v-icon>-->
          More
          <v-icon right>mdi-chevron-right</v-icon>
        </v-btn>
        <!--          <v-list-item-icon>-->
        <!--            <v-icon>mdi-plus</v-icon>-->
        <!--          </v-list-item-icon>-->
        <!--          <v-list-item-content>-->
        <!--            More-->
        <!--          </v-list-item-content>-->
      </v-list-item>


    </v-list>

  </v-list-group>
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

const percentToYear = function (percent) {
  if (!percent) return "anytime"

  const howFarBackToGo = 100 - percent
  const exp = Math.pow(howFarBackToGo, 3)
  const scaled = exp / 40000


  const year = Math.floor(2022 - scaled)
  if (year === 2022) return "now"
  return year

}

export default {
  name: "Facet",
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
    bold: Boolean,
    hasFocus: Boolean,
    disabled: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
      showCollapsed: false,
      filtersFromApi: [],
      maxOptionsToShow: 5,
      range: [0, 100],
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
    rangeStartOptions() {
      const biggestNumber = Math.min((this.range[1]), 2022)
      const ret = _.range(1972, biggestNumber + 1)
      ret.reverse()
      return ret
    },
    rangeFinishOptions() {
      const smallestNumber = Math.max((this.range[1]), 1972)
      const ret = _.range(1972, smallestNumber + 1)
      ret.reverse()
      return ret
    },
    appliedFiltersCount() {
      const allFilters = filtersFromUrlStr(this.$route.query.filter)
      const myFilters = allFilters.filter(f => {
        return f.key === this.facetKey
      })
      return myFilters.length
    },
    myColor() {
      return "transparent"
      if (this.disabled) return "transparent"
      else if (this.hasFocus) return "rgba(0,0,0,.05)"
      else return "rgba(0,0,0,.00)"
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
      const resultsFilterStrings = this.myResultsFilters.map(f => f.asStr)
      return this.filtersFromApi
          .filter(f => {
            return !resultsFilterStrings.includes(f.asStr)
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
    htmlId() {
      const noPeriods = this.facetKey.replace(/\./g, "_")
      return "facet-" + noPeriods
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
    changeRange() {
      console.log("change range!")
    },

    clickCheckbox(filter, isChecked, e) {
    },
    async clearAllFilters() {
      const filters = filtersFromUrlStr(this.$route.query.filter)
      const filtersToKeep = filters.filter(f => f.key !== this.facetKey)
      const filterString = filtersAsUrlStr(filtersToKeep)
      const query = {...this.$route.query}
      query.filter = filterString || undefined

      await this.$router.push({
        name: "Serp",
        query
      })
      this.snackbar("Filters removed")
    },

    async fetchFilters() {

      if (!this.config) return
      if (this.config.noOptions) return
      this.isLoading = true

      const resp = await api.getUrl(this.apiUrl)


      this.filtersFromApi = resp.group_by.map(apiData => {
        return createDisplayFilter(
            this.config.key,
            apiData.key,
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
    isDisabled(isDisabled) {
      // const elem = document.getElementById(this.htmlId)
      const elem = document.querySelector(`#${this.htmlId} .v-list-group__header`)
      if (isDisabled) {
        elem.classList.add("v-list-item--disabled")
      } else {
        elem.classList.remove("v-list-item--disabled")
      }
    },
  }
}
</script>

<style lang="scss">

.v-list-group--active > .v-list-group__header > .v-list-group__header__prepend-icon .v-icon {
}

.theme--dark.v-list-item--disabled.v-list-item--active {
  color: rgba(255, 255, 255, 0.5);
}

.v-list-group__header.v-list-item--active  .count-chip {
  opacity: 0;
}

.v-list-group--active {
  .expand-indicator {
    transform: rotate(-180deg);

  }
}

.v-list-group--active > .v-list-group__header {
  font-weight: bold;
}

//.filter-type-list-item {
//  border-radius: 5px;
//
//  .v-chip {
//    padding: 0 8px !important;
//  }
//
//  &.has-focus {
//    //background-color: #eee !important;
//  }
//
//  &.disabled {
//    .card-header-name {
//      opacity: .5;
//    }
//
//    .count-chip {
//      opacity: .7;
//      filter: grayscale(100%);
//    }
//  }
//}
</style>