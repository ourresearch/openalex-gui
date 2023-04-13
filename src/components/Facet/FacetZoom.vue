<template>

  <v-card
          :loading="isLoading"
          flat
          tile
  >
    <v-toolbar
            flat
            class="facet-zoom-toolbar"
            tile
            dark
            color="green"
    >


      <v-toolbar-title>
        <v-icon left>{{ config.icon }}</v-icon>
        {{ config.displayName }}

      </v-toolbar-title>
      <v-spacer/>
      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="">
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

      <v-progress-linear
              v-if="isLoading"
              absolute
              indeterminate
              color="green"
              style="bottom: -4px;"
      />


    </v-toolbar>


    <div class="facet-zoom-content">
      <v-row class="px-3">
        <v-col cols="12" sm="6">
          <v-card flat outlined>
            <v-toolbar flat>
                <v-icon left>mdi-filter-check-outline</v-icon>
              <v-toolbar-title>
                Applied filters
                <span class="caption">
                ({{ myResultsFilters.length }})

                </span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon @click="clearMyFilters" :disabled="myResultsFilters.length === 0">
                <v-icon>mdi-filter-off-outline</v-icon>
              </v-btn>
            </v-toolbar>
            <v-divider />
            <v-card-text>
              <serp-filters-list-chip
                      v-for="f in myResultsFilters"
                      :filter="f"
                      :key="f.asStr"
              />
              <div class="ml-8" v-if="myResultsFilters.length === 0">
                No filters applied.
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">


          <!--          ************* -->
          <!--          RANGE values -->
          <!--          ************* -->
          <div v-if="config.isRange" class="">
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
              <v-btn x-large class="ml-5" color="green" dark @click="applyRange">
                Apply
              </v-btn>
            </div>
            <div class="mt-8">
              <year-range
                      big
              />
            </div>
          </div>


          <!--          ************* -->
          <!--          SEARCH values -->
          <!--          ************* -->
          <div v-if="config.isSearch" class="">
            <v-text-field
                    autofocus
                    flat
                    v-model="searchFilterString"
                    :placeholder="config.displayName"
                    :label="config.displayName"
                    outlined
                    @keypress.enter="applySearchFilter"
            />
            <v-btn
                    x-large
                    class="ml-5"
                    color="green"
                    dark
                    @click="applySearchFilter"
            >
              Apply
            </v-btn>
          </div>


          <!--          ************* -->
          <!--          LIST values -->
          <!--          ************* -->
          <v-card
                  flat
                  outlined
                  class=""
                  style="font-size: unset;"
                  v-if="!config.isSearch && !config.isRange"
          >
            <v-toolbar flat :extended="showSearch">
                <v-icon left>mdi-filter-plus-outline</v-icon>
              <v-toolbar-title>
                Available filters
                <span class="caption">({{ apiFiltersToShow.length }}{{ (apiFiltersToShow.length > 19) ? "+" : "" }})</span>
              </v-toolbar-title>
              <template
                      v-slot:extension
                      v-if="showSearch"
              >
                <v-text-field
                        flat
                        outlined
                        rounded
                        hide-details
                        full-width
                        clearable
                        prepend-inner-icon="mdi-magnify"
                        autofocus
                        dense
                        light
                        background-color="white"

                        v-model="searchString"
                        :placeholder="searchPlaceholder"
                />
                <v-progress-linear
                        v-if="isLoading"
                        absolute
                        indeterminate
                        color="green"
                        style="bottom: -4px;"
                />
              </template>
            </v-toolbar>
            <v-divider />
            <v-card-text>
              <div class="ml-0" v-if="apiFiltersToShow.length === 0">
                No filters available for this search set.
              </div>
            </v-card-text>


            <v-list :dense="false">
              <facet-option
                      v-for="f in apiFiltersToShow"
                      :filter="f"
                      :key="f.asStr"
                      @set-value="setSelectedFilters"

              />
            </v-list>

          </v-card>


        </v-col>

      </v-row>
    </div>


  </v-card>


</template>


<script>
import {entityConfigs} from "../../entityConfigs";
import SerpFiltersListChip from "../SerpFiltersListChip.vue";

import {entityTypeFromId} from "../../util";
import YearRange from "../YearRange";
import {
    createDisplayFilter,
    createSimpleFilter,
    filtersAsUrlStr,
    filtersFromUrlStr,
    sortedFilters
} from "../../filterConfigs";

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
        YearRange,
        SerpFiltersListChip,
    },
    props: {},
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
            searchFilterString: "",
            searchString: "",


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
            "facetZoom",
        ]),
        config() {
            return facetConfigs().find(c => c.key === this.facetZoom)
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
        myResultsFilters() {
            return this.resultsFilters.filter(f => {
                return f.key === this.facetZoom
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
        apiUrl() {
            return this.makeApiUrl(this.maxApiFiltersToShow)

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


            return sorted.filter(f => {
                return !this.myResultsFilters.map(f => f.asStr).includes(f.asStr)
            })
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

        makeApiUrl(perPage, formatCsv) {
            if (!perPage) perPage = this.maxApiFiltersToShow
            const url = new URL(`https://api.openalex.org`)
            url.pathname = `${this.entityType}`

            const filters = this.$store.state.inputFilters
            url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))


            url.searchParams.set("group_by", this.config.key)
            url.searchParams.set("per_page", String(perPage))
            if (this.textSearch) url.searchParams.set("search", this.textSearch)
            if (this.searchString) url.searchParams.set("q", this.searchString)
            if (formatCsv) url.searchParams.set("format", "csv")
            url.searchParams.set("email", "team@ourresearch.org")
            return url.toString()
        },

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
            url.setFiltersByKey(this.facetZoom, filtersToSave)
        },
        clearMyFilters(){
            url.setFiltersByKey(this.facetZoom, [])
        },
        async fetchSearchFilter() {
            console.log("fetchSearchFilter")
            const urlFilters = filtersFromUrlStr("works", this.$route.query.filter)


            const myUrlFilter = urlFilters.find(f => {
                return f.key === this.facetZoom
            })
            console.log("urlFilters", urlFilters)

            if (!this.config) return
            if (this.config.isSearch) {
                this.searchFilterString = this.myResultsFilters[0]?.value
                return // no need to fetch anything.
            }
        },

        async fetchFilters() {
            if (this.config.isSearch) {
                return await this.fetchSearchFilter()
            }


            this.isLoading = "green"

            if (this.config.isRange) {
                if (!this.myResultsFilters.length) {
                    this.resetRange()
                } else {
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


        resetRange() {
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
                url.setFiltersByKey(this.facetZoom, [])
            } else {
                const filter = createSimpleFilter(
                    this.entityType,
                    this.facetZoom,
                    this.range.join("-")
                )
                console.log("range is full, saving filter", filter)
                url.setFiltersByKey(this.facetZoom, [filter])
            }
            this.setFiltersZoom(false)
        },

        applySearchFilter() {
            console.log("apply search filter", this.searchFilterString)
            const filter = createSimpleFilter(
                this.entityType,
                this.facetZoom,
                this.searchFilterString,
            )
            url.setFiltersByKey(this.facetZoom, [filter])
        },

    },
    created() {
    },
    mounted() {
        this.searchString = ""
    },
    destroyed() {
    },
    watch: {
        "$route.query": {
            immediate: true,
            handler(newVal, oldVal) {
                this.fetchFilters()
                this.searchString = ""
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
            console.log("searchString changed", newVal)
            this.fetchFilters()
        },
    }
}
</script>

<style lang="scss">
.facet-zoom-toolbar {
  position: fixed;
  z-index: 99;
  width: 100%;
  max-width: 1100px; // width of the FacetsListDialog
}

.facet-zoom-content {
  padding: 120px 0 0 0;
}

</style>