<template>

  <v-menu
      :close-on-content-click="false"
      :value="showMenu"
      dark
      @input="checkInput"
      content-class="facet-range-menu"
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
            <div class="green--text text--lighten-2 font-weight-bold">
              {{ rangeValuesToShow }}
            </div>
            <v-btn style="margin: 2px 0 0 5px;" color="green lighten-2" :disabled="isDisabled"
                   v-if="rangeValuesToShow" x-small icon @click.stop="removeInputFiltersByKey(facetKey)">
              <v-icon small>mdi-close</v-icon>
            </v-btn>

          </v-col>
        </v-row>

      </v-list-item>
    </template>
    <v-card class="">
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
        <div class="d-flex">
          <v-text-field
              flat
              hide-details
              solo
              class="mt-0"
              background-color="#484848"
              dense
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
              background-color="#484848"
              dense
              v-model="range[1]"
              placeholder="End"
              outlined
              @keypress.enter="applyRange"
          />


        </div>
        <div class="mt-4 mb-4">
          <v-btn
              v-for="preset in presets"
              :key="preset.displayName"
              @click="setRange(preset.range)"
              small
              outlined
              rounded
              class="mr-2 low-key-button"
              :color="(preset.range.join() === range.join()) ? 'green lighten-2' : ''"
          >
            {{ preset.displayName }}
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
            color="green lighten-2"
            @click="applyRange"
            :disabled="range.join() == inputFiltersRange.join()"
        >
          Apply
        </v-btn>
        <v-btn :disabled="!myResultsFilter" text @click="clear">
          clear
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="showDetails" :disabled="$store.state.showYearRange">
          <v-icon left>mdi-open-in-app</v-icon>
          Details
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
    displayYearRange,
  filtersFromUrlStr,
} from "../../filterConfigs";
import FacetOption from "./FacetOption";
import {compareByCount} from "../../util";
import {api} from "../../api";


const currentYear = new Date().getFullYear()
export default {
  name: "Facet",
  components: {},
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      showMenu: false,
      perPage: 200,
      range: ["", ""],
      presets: [
        {
          displayName: "This year",
          range: [currentYear, ""]
        },
        {
          displayName: "Last 3yrs",
          range: [currentYear - 2, ""]
        },
        {
          displayName: "Last 5yrs",
          range: [currentYear - 4, ""]
        },
      ]
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

    isDisabled() {
      return !!this.facetZoom // && this.facetZoom !== this.facetKey
    },
    isDirty() {
      // return this.range.join() !== [0, 101].join()
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    myResultsFilter() {
      return this.resultsFilters.find(f => {
        return f.key === this.facetKey
      })
    },
    myInputFilters() {
      return this.inputFilters.filter(f => {
        return f.key === this.facetKey
      })
    },
    inputFiltersRange() {
      if (!this.myInputFilters.length) return ["", ""]
      return this.myInputFilters[0].value.split("-")
    },
    rangeValuesToShow() {
      return displayYearRange(this.inputFiltersRange)
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
    rangeIsEmpty() {
      return !this.range[0] && !this.range[1]
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
    async clear() {
      this.range = ["", ""]
      // await this.removeInputFiltersByKey(this.facetKey)
      // this.closeMenu()
    },
    closeMenu() {
      this.showMenu = false
    },
    checkInput(input) {
      this.setRangeFromInputFilters()
      this.showMenu = input
    },
    showDetails() {
      this.$store.state.showYearRange = true
      this.closeMenu()
    },
    setRangeFromInputFilters() {
      console.log("setting range from input filters")
      this.range[0] = this.inputFiltersRange[0]
      this.range[1] = this.inputFiltersRange[1]
    },
    setRange(range) {
      this.range = range
      // this.applyRange()
    },
    applyRange() {
      console.log("applyRange", this.range)
      const maxValue = String(currentYear)
      if (this.range[0] > maxValue) this.range[0] = maxValue
      if (this.range[1] > maxValue) this.range[1] = maxValue

      if (Number(this.range[0]) < 0) this.range[0] = "0"
      if (Number(this.range[1]) < 0) this.range[1] = "0"


      // general validation
      if (this.range[1] && Number(this.range[0]) > Number(this.range[1])) {
        this.range[0] = this.range[1]
      }


      console.log("applyRange", this.range)
      if (this.rangeIsEmpty) {
        this.removeInputFiltersByKey(this.facetKey)
      } else {
        const filter = createSimpleFilter(
            this.facetKey,
            this.range.join("-")
        )
        this.replaceInputFilter(filter)
      }
      this.closeMenu()
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
      }
    },
    "myResultsFilter.value": {
      immediate: true,
      handler(newVal) {
        console.log("myResultsFilter.value changed", newVal)

      }
    }
  }
}
</script>
<style lang="scss">

.facet-range-menu {
  input {
    color: #7CC07F !important;
    font-weight: bold;
  }
}


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
  //width: calc(100% - 1px);
  width: 100%;


  &.selected {
    //background-color: rgba(255, 255, 255, 1);
  }
}

</style>