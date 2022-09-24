<template>

  <!--  <v-list-item>-->
  <v-list
      class="pa-0 facets-panel"
      style="border-bottom: 1px solid #ddd;"
  >
    <v-list-group
        :value="resultsFiltersToShow.length"
        style="padding: 0; min-height: 0; margin-left: 0;"
    >
      <template v-slot:activator>

        <v-list-item-title class="facet-heading ma-0 pa-0">
          <div class="facet-count-container">
            <v-chip
                x-small
                class="mb-1 mr-1 px-1"
                color="primary"
                v-if="resultsFiltersToShow.length > 0"
            >
              {{ resultsFiltersToShow.length }}
            </v-chip>
          </div>
          <strong>
            {{ myFacetConfig.displayName }}
          </strong>
        </v-list-item-title>
      </template>
      <div>
        <!--        <facet-option-is-oa-->
        <!--            v-if="facetKey === 'oa_status'"-->
        <!--            key="oa_status"-->
        <!--        />-->

        <facet-option
            v-for="filter in tableItems"
            :filter="filter"
            :show-checked="filter.isResultsFilter"
            :key="filter.asStr + filter.isResultsFilter"
            :indent="facetKey === 'oa_status' && filter.value != 'closed'"
        />
        <div
            class="more-link ml-5 mt-1"
            v-if="myFacetConfig.valuesToShow === 'select'"
            @click="comboboxDialogIsOpen = true"
        >
          <v-btn small plain>select</v-btn>
        </div>
        <div
            class="more-link ml-5 mt-1"
            v-if="showMoreOptionsButton"
            @click="comboboxDialogIsOpen = true"
        >
          <v-btn small plain>more</v-btn>
        </div>
        <div></div>
      </div>


    </v-list-group>

    <v-dialog
        max-width="600"
        v-model="comboboxDialogIsOpen"
    >
      <v-card :loading="comboboxAddFiltersIsLoading">
        <v-card-title>
          Add filter
        </v-card-title>
        <div class="pa-4">
          <form class="main-search">
            <v-combobox
                v-model="comboboxSelect"
                :items="comboboxItems"
                :search-input.sync="comboboxSearchString"
                class="mr-12"
                flat
                outlined
                dense
                solo
                hide-details
                item-text="display_name"
                item-value="id"
                :loading="loading"
                @input="comboboxAddFilter"
                autofocus
                clearable
            >
              <template v-slot:item="data">
                <v-list-item-content>
                  <div>
                    <div>
                      {{ data.item.display_name }}
                    </div>
                  </div>
                </v-list-item-content>
              </template>
            </v-combobox>

          </form>
        </div>
      </v-card>
    </v-dialog>

  </v-list>

</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {facetConfigs} from "../../facetConfigs";
import {filtersAsUrlStr, createDisplayFilter, createSimpleFilter} from "../../filterConfigs";

import {api} from "../../api";

import FacetOption from "./FacetOption";
import FacetOptionIsOa from "./FacetOptionIsOa";
import axios from "axios";


const compareByCount = function (a, b) {
  if (a.count > b.count) {
    return -1;
  }
  if (a.count < b.count) {
    return 1;
  }
  return 0;
}

export default {
  name: "Facet",
  components: {
    FacetOption,
    FacetOptionIsOa,
  },
  props: {
    facetKey: String,
  },
  data() {
    return {
      loading: false,
      comboboxDialogIsOpen: false,
      facet: null,
      potentialFilterValues: [],
      groupByQueryResultsCount: null,

      comboboxSelect: "",
      comboboxItems: [],
      comboboxSearchString: "",
      comboboxFetchMatchesIsLoading: false,
      comboboxAddFiltersIsLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
      "appliedFilters",
      "inputFiltersAsString",
    ]),
    myFacetConfig() {
      return facetConfigs().find(c => c.key === this.facetKey)
    },
    showMoreOptionsButton() {
      if (this.myFacetConfig.valuesToShow === "select") return false
      return this.groupByQueryResultsCount > this.maxPotentialFiltersToShow
    },
    maxPotentialFiltersToShow() {
      return 5
      return this.myFacetConfig.maxPotentialFiltersToShow ?? 5
    },
    tableItems() {
      let ret = [...this.resultsFiltersToShow]


      this.potentialFilterValues
          .filter(f => f.value !== "unknown")
          .slice(0, this.maxPotentialFiltersToShow).forEach(f => {

        // only push potential filter values if they're not already loaded as
        // in a resultsFilter
        if (!ret.map(f => f.asStr).includes(f.asStr)) {
          ret.push(f)
        }
      })
      ret.sort(compareByCount)

      return ret
    },
    apiQuery() {
      const myFilters = this.$store.state.inputFilters.filter(f => f.key !== this.facetKey)
      const ret = {
        group_by: this.facetKey,
        filter: filtersAsUrlStr(myFilters),
      }
      if (this.$store.state.textSearch) ret.search = this.$store.state.textSearch
      return ret
    },
    resultsFiltersToShow() {
      // these ones are already selected by the user. we got them from the store,
      // which refreshes them from the server every time we search.
      // (which may have gotten from either user action or the URL)
      return this.$store.state.resultsFilters
          .filter(f => {
            return f.key === this.facetKey
          })
          .map(f => {
            return {...f, isResultsFilter: true}
          })
    },
  },


  methods: {
    ...mapMutations([]),
    ...mapActions([
      "addInputFilters",
    ]),
    async setFilterOptions() {
      if (this.myFacetConfig.noOptions) return

      const resp = await api.get(
          this.$store.state.entityType,
          this.apiQuery,
      )
      this.groupByQueryResultsCount = resp.meta.count
      this.potentialFilterValues = resp.group_by.map(group => {
        return createDisplayFilter(
            this.facetKey,
            group.key,
            group.key_display_name,
            group.count
        )
      })
    },
    comboboxReset() {
      this.comboboxSelect = ""
      this.comboboxItems = []
      this.comboboxSearchString = ""
      this.comboboxFetchMatchesIsLoading = false
      this.comboboxAddFiltersIsLoading = false
    },
    comboboxOpen() {
      this.comboboxReset()
      this.comboboxDialogIsOpen = true
    },
    comboboxClose() {
      this.comboboxReset()
      this.comboboxDialogIsOpen = false
    },
    async comboboxAddFilter() {
      this.comboboxAddFiltersIsLoading = true
      const myFilter = createSimpleFilter(this.facetKey, this.comboboxSelect.id)
      await this.addInputFilters([myFilter])
      this.comboboxClose()
    },
    async comboboxFetchMatches() {
      this.comboboxFetchMatchesIsLoading = true

      const urlObj = new URL("https://api.openalex.org/" + this.myFacetConfig.autocompleteEndpoint);
      urlObj.searchParams.set("email", "team@ourresearch.org")
      urlObj.searchParams.set("q", this.comboboxSearchString)
      const url = urlObj.toString()

      axios.get(url)
          .then(resp => {
            if (!this.comboboxSearchString) {
              console.log("no search string, clearing items")
              this.comboboxItems = []
            } else {
              this.comboboxItems = resp.data.results.slice(0, 5)
            }
            this.comboboxFetchMatchesIsLoading = false
          })
    },
  },
  watch: {
    "$store.getters.searchParamsAsStringToWatch": {
      immediate: true,
      handler(newVal, oldVal) {
        // console.log(`Facet "${this.facetKey}" watcher: resultsFilters changed:`, newVal)
        this.setFilterOptions()
      }
      ,
    },
    comboboxSearchString(val) {
      if (!val) {
        this.items = []
        return
      }
      this.comboboxFetchMatches(val)
    }
  }
}
</script>

<style lang="scss">
.facets-panel {
  .v-list-item {
    padding: 0 !important;
  }

  .facet-heading {
    display: flex;
    margin-left: 0;
    padding-left: 0;

    .facet-count-container {
      //width: 30px;
      text-align: right;
      //padding-right: 6px;
    }
  }

}


</style>