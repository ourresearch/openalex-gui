<template>

  <v-card
      :loading="isLoading"
      flat
      class="mt-1"
  >
    <v-card-text v-if="config.isRange" class="pa-4">
      {{ range }}
      <div class="d-flex">
        <v-text-field
            flat
            hide-details
            solo
            class="mt-0"
            v-model="range[0]"
            placeholder="Start"
            outlined
            @keypress.enter="applyRange"
        >
          <template v-slot:default>frustrating</template>
        </v-text-field>
        <v-icon class="mx-2">mdi-minus</v-icon>
        <v-text-field
            flat
            hide-details
            solo
            class="mt-0"
            v-model="range[1]"
            placeholder="End"
            outlined
            @keypress.enter="applyRange"
        />
        <v-btn x-large class="ml-5" color="primary" @click="applyRange">
          Save
        </v-btn>

      </div>

    </v-card-text>

    <v-card-text
        id="facet-zoom-card-text"
        class="pa-0"
        style="font-size: unset;"
        v-else
    >


      <v-list :dense="false">
        <template v-if="!searchString">
          <facet-option
              v-for="f in resultsFiltersNotInApiFilters"
              :filter="f"
              :key="f.asStr"
              :is-negated="negatedFilters.includes(f.kv)"
              :is-selected="selectedFilters.includes(f.kv)"
              @set-value="setSelectedFilters"
              :disabled="!!isLoading"
              :is-boolean="config.isBoolean"
          />
        </template>
        <facet-option
            v-for="f in apiFiltersToShow"
            :filter="f"
            :key="f.asStr"
            :is-negated="negatedFilters.includes(f.kv)"
            :is-selected="selectedFilters.includes(f.kv)"
            @set-value="setSelectedFilters"
            :disabled="!!isLoading"
            :is-boolean="config.isBoolean"

        />
      </v-list>

    </v-card-text>


  </v-card>


</template>


<script>
import {entityConfigs} from "../../entityConfigs";

import {entityTypeFromId} from "../../util";
import {createDisplayFilter, createSimpleFilter, filtersAsUrlStr, sortedFilters} from "../../filterConfigs";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import FacetOption from "../Facet/FacetOption";
import {api} from "../../api";
import axios from "axios";
import {url} from "../../url";
import _ from "lodash"


export default {
  components: {
    FacetOption,
  },
  props: {
    facetKey: String,
    apiUrl: String,
    searchString: String,
  },
  data() {
    return {
      url,
      isLoading: false,
      applyIsLoading: false,
      maxApiFiltersToShow: 20,

      // this all needs to be cleared when we close the menu
      apiFilters: [],
      filtersTotalCount: null,
      selectedFilters: [],
      negatedFilters: [],

      range: ["", ""],


      groupByQueryResultsCount: null,
      tab: 0,
      isExpanded: false,
      isScrolled: false,


      // width: 300,
      height: {
        toolbar: 60,
        searchbar: 50,
        margins: [10, 10],
        footer: 50,
      },
      WidthMargins: [10, 0]

    }
  },
  computed: {
    ...mapGetters([
      "zoomType",
      "resultsCount",
      "entityZoomData",
      "searchFacetConfigs",
      "resultsFilters",
      "resultsFiltersNegated",
      "zoomId",
      "textSearch",
      "entityType",
      "zoomTypeConfig",
      "entityZoomHistoryData",
      "showFiltersDrawer",
      "inputFilters",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.facetKey)
    },
    showSearch() {
      return this.config.valuesToShow === 'mostCommon'
    },
    isDirty() {
      const negatedIsDirty = !_.isEmpty(_.xor(
          this.negatedFilters,
          this.myResultsFilters.filter(f => f.isNegated).map(f => f.kv)
      ))
      const selectedIsDirty = !_.isEmpty(_.xor(
          this.selectedFilters,
          this.myResultsFilters.map(f => f.kv)
      ));
      return (negatedIsDirty || selectedIsDirty)

    },
    cardTextStyle() {
      const marginsHeight = this.height.margins[0] + this.height.margins[1]
      const toolbarsTotalHeight = this.height.toolbar + (this.showSearch ? this.height.searchbar : 0) + this.height.footer
      // const height = toolbarsTotalHeight + marginsHeight + 2 // dividers

      const height = (this.config.isBoolean) ? "150px" : "50vh"

      return {
        'overflow-y': "scroll",
        height,
        // height: `calc(50vh - ${height}px)`,
      }
    },
    myResultsFilters() {
      return this.resultsFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    allFilters() {
      // combine and dedupe: https://stackoverflow.com/a/36744732
      return [...this.myResultsFilters, ...this.apiFilters].filter((value, index, self) => {
        return index === self.findIndex(t => {
          return t.asStr === value.asStr
        })
      })
    },
    thereAreMoreGroupsToShow() {
      return this.maxApiFiltersToShow < 200 && this.apiFilters.length === this.maxApiFiltersToShow
    },
    searchPlaceholder() {
      const displayName = this
          .$pluralize(this.config.displayName, 2)
          .toLowerCase()
      return `search ${displayName}`
    },
    csvUrl() {
      return this.makeApiUrl(200, true)
    },

    searchStringIsBlank() {
      return !this.searchString
    },
    myResultsFilterIds() {
      return this.myResultsFilters.map(f => f.kv)
    },
    apiFilterIds() {
      return this.apiFilters.map(f => f.kv)
    },

    resultsFiltersNotInApiFilters() {
      const ret = this.myResultsFilters.filter(f => !this.apiFilterIds.includes(f.kv))
      return sortedFilters(ret, this.config.sortByValue)
    },
    apiFiltersToShow() {
      const ret = this.apiFilters
      // .filter(f => f.value !== "unknown")
      const sorted = sortedFilters(ret, this.config.sortByValue)
      sorted.sort((a, b) => {
        return (this.myResultsFilterIds.includes(a.kv)) ? -1 : 1
      })
      return sorted
    },


    // range stuff

    rangeIsEmpty() {
      return !this.range[0] && !this.range[1]
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
      "toggleFiltersDrawer",
      "setFiltersZoom"
    ]),
    ...mapActions([]),
    setSelectedFilters(arg) {
      const filterCountStart = this.selectedFilters.length
      console.log("FacetZoom setSelectedFilters", arg)
      this.selectedFilters = this.selectedFilters.filter(kv => {
        return kv !== arg.kv
      });
      if (arg.isSelected) this.selectedFilters.push(arg.kv)

      this.negatedFilters = this.negatedFilters.filter(kv => {
        return kv !== arg.kv
      });
      if (arg.isNegated) this.negatedFilters.push(arg.kv)
      this.saveSelectedFilters()
      const filterCountEnd = this.selectedFilters.length
      if (filterCountStart < filterCountEnd) {
        // we added a filter
        this.setFiltersZoom(false)

      }


    },
    saveSelectedFilters() {
      this.$emit("close")
      const filtersToSave = this.allFilters.filter(f => {
        return this.selectedFilters.includes(f.kv)
      }).map(f => {
        return createSimpleFilter(
            this.entityType,
            f.key,
            f.value,
            this.negatedFilters.includes(f.kv)
        )
      })
      url.setFiltersByKey(this.facetKey, filtersToSave)
    },
    async fetchFilters() {
      if (!this.config) return
      this.isLoading = "primary"

      if (this.config.isRange) {
        if (!this.myResultsFilters.length) {
          this.resetRange()
        }
        else {
          const myRangeValues = this.myResultsFilters[0].value.split("-")
          console.log("we've got a range here", myRangeValues)
          this.range = myRangeValues

        }

      }


      const resp = await api.getUrl(this.apiUrl)

      const groups = resp.group_by.slice(0, 20)
      const worksCounts = groups.map(f => f.count)
      const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
      this.filtersTotalCount = sumOfAllWorksCounts

      this.apiFilters = groups.map(apiData => {
        return createDisplayFilter(
            this.entityType,
            this.config.key,
            apiData.key,
            false,
            apiData.key_display_name,
            apiData.count,
            this.filtersTotalCount,
        )
      })
      this.isLoading = false

    },
    onCardTextScroll(e) {
      this.isScrolled = e.target.scrollTop > 0
    },


    // range stuff


    resetRange(){
      this.range = ["", ""]
    },
    applyRange() {
      console.log("applyRange", this.range)
      const currentYear = new Date().getFullYear()
      const maxValue = String(currentYear)
      if (this.range[0] > maxValue) this.range[0] = maxValue
      if (this.range[1] > maxValue) this.range[1] = maxValue

      if (Number(this.range[0]) < 0) this.range[0] = "0"
      if (Number(this.range[1]) < 0) this.range[1] = "0"

      // general validation
      if (this.range[1] && Number(this.range[0]) > Number(this.range[1])) {
        this.range[0] = this.range[1]
      }

      if (this.rangeIsEmpty) {
        console.log("range is empty, saving null")
        url.setFiltersByKey(this.facetKey, [])
      } else {
        const filter = createSimpleFilter(
            this.entityType,
            this.facetKey,
            this.range.join("-")
        )
        console.log("range is full, saving filter", filter)
        url.setFiltersByKey(this.facetKey, [filter])
      }
      this.setFiltersZoom(false)
    },

  },
  created() {
  },
  mounted() {
  },
  destroyed() {
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(newVal, oldVal) {
        this.fetchFilters()
      }
    },
    "myResultsFilters": {
      immediate: true,
      handler(newVal, oldVal) {
        this.selectedFilters = newVal.map(f => f.kv)
        this.negatedFilters = newVal.filter(f => f.isNegated).map(f => f.kv)
      }
    },
    searchString(newVal, oldVal) {
      this.fetchFilters()
    }
  }
}
</script>

<style lang="scss">
.entity-zoom-container {
  //position: absolute;
  //top: 0;
  //right: 0;
  //left: 0;
  //bottom: 0;
}

.v-tab {
  min-width: 1px !important;
  //width: 66px !important;

}

.v-tabs {
  border-bottom: 1px solid #ccc;
}

.v-tabs-items {
  background-color: transparent !important;
}

</style>