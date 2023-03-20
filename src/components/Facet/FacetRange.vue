<template>

  <v-menu
      :close-on-content-click="false"
      :value="showMenu"
      :dark="dark"
      @input="checkInput"
      content-class="facet-range-menu"
  >
    <template v-slot:activator="{on}">
      <v-list-item
          v-on="on"
          style="min-height: 34px; flex:unset"
          :color="myResultsFilter ? 'green ' : ''"
          class="pl-2"
      >
          <div class="pa-0 pr-2">
            <v-icon :disabled="isDisabled" class="mr-2" style="opacity: .7;">{{ config.icon }}</v-icon>
            {{ myButtonText }}
          </div>
        <v-spacer v-if="!narrow"></v-spacer>
          <div class="pa-0 d-flex  justify-end">
            <div class="green--text font-weight-bold">
              {{ rangeValuesToShow }}
            </div>
            <div v-if="!rangeValuesToShow && showPlaceholderValueWhenUnset">anytime</div>
            <v-btn style="margin: 2px 0 0 5px;" color="green 2" :disabled="isDisabled"
                   v-if="rangeValuesToShow" x-small icon @click.stop="removeInputFiltersByKey(facetKey)">
              <v-icon small>mdi-close</v-icon>
            </v-btn>

          </div>

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
              :background-color="textFieldBackgroundColor"
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
              :background-color="textFieldBackgroundColor"
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
              :color="(preset.range.join() === range.join()) ? 'green ' : ''"
          >
            {{ preset.displayName }}
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
            color="green"
            @click="applyRange"
            :disabled="range.join() == inputFiltersRange.join()"
        >
          Apply
        </v-btn>
        <v-btn :disabled="!myResultsFilter" text @click="clear">
          clear
        </v-btn>
        <v-spacer></v-spacer>
        <v-menu>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="mr-1">
            <v-icon>mdi-tray-arrow-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-subheader>
            Export as:
            <!--                {{ config.displayName | pluralize(2) }} as:-->
          </v-subheader>
          <v-divider></v-divider>
          <v-list-item
              target="_blank"
              :href="makeApiUrl(200, true)"
          >
            <v-list-item-icon>
              <v-icon>mdi-table</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Spreadsheet
            </v-list-item-title>
          </v-list-item>
          <v-list-item
              target="_blank"
              :href="makeApiUrl(200)"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              JSON object
            </v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>
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
    facetEntityType: String,

    dark: Boolean,
    showDetailsButton: Boolean,
    buttonText: String,
    showPlaceholderValueWhenUnset: Boolean,
    narrow: Boolean,

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
    myButtonText(){
      return (this.buttonText) ? this.buttonText : this.config.displayName
    },
    config() {
      return getFacetConfig(this.facetEntityType, this.facetKey)
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
    textFieldBackgroundColor(){
      return (this.dark) ? "#484848" : ""
    },
    rangeValuesToShow() {
      return displayYearRange(this.inputFiltersRange)
    },
    apiUrl() {
      const url = new URL(`https://api.openalex.org`);
      url.pathname = `${this.entityType}`

      const filtersWithoutMe = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      url.searchParams.set("filter", filtersAsUrlStr(filtersWithoutMe, this.entityType))

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
            this.entityType,
            this.facetKey,
            this.range.join("-")
        )
        this.replaceInputFilter(filter)
      }
      this.closeMenu()
    },

    makeApiUrl(perPage, formatCsv) {
      if (!perPage) perPage = this.maxApiFiltersToShow
      const url = new URL(`https://api.openalex.org`)
      url.pathname = `${this.entityType}`

      const filters = this.$store.state.inputFilters.filter(f => f.key !== this.config.key)
      url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))

      url.searchParams.set("group_by", this.config.key)
      url.searchParams.set("per_page", String(perPage))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      if (formatCsv) url.searchParams.set("format", "csv")
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
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