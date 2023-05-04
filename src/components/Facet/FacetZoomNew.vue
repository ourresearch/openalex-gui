<template>



  <v-card
          flat tile
          :loading="isLoading"
  >
    <v-toolbar flat >
<!--      <v-icon left>{{ config.icon }}</v-icon>-->

      <v-toolbar-title class="ml-0 pl-0">
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
<!--      <v-btn icon @click="setFacetZoom(null)">-->
<!--        <v-icon>mdi-close</v-icon>-->
<!--      </v-btn>-->

    </v-toolbar>


    <!--          ************* -->
    <!--          RANGE values -->
    <!--          ************* -->
    <div v-if="config.isRange" class="">
      <v-card flat>
        <v-card-text v-if="config.isRange">
          <div class="d-flex">
            <v-text-field
                    flat
                    hide-details
                    solo
                    class="mt-0"
                    v-model="range[0]"
                    :placeholder="config.placeholders[0]"
                    outlined
                    @keypress.enter="applyRange"
            >
            </v-text-field>
            <v-icon class="mx-2">mdi-minus</v-icon>
            <v-text-field
                    flat
                    hide-details
                    solo
                    class="mt-0"
                    v-model="range[1]"
                    :placeholder="config.placeholders[1]"
                    outlined
                    @keypress.enter="applyRange"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
                  :disabled="rangeIsEmpty || searchIsLoading"
                  color="green"
                  :dark="!rangeIsEmpty"
                  @click="applyRange"
          >
            {{ (myResultsFilters.length) ? "Edit" : "Add" }}
            filter
          </v-btn>

        </v-card-actions>

      </v-card>
      <div class="mt-8">
        <year-range
                height="50px"
                big
                v-if="config.key==='publication_year'"
        />
      </div>
    </div>


    <!--          ************* -->
    <!--          SEARCH values -->
    <!--          ************* -->
    <div v-if="config.isSearch" class="">
      <v-card flat>
        <v-card-text>
          <v-text-field
                  autofocus
                  prepend-inner-icon="mdi-magnify"
                  flat
                  hide-details
                  v-model="searchFilterString"
                  :placeholder="config.displayName"
                  :label="config.displayName"
                  outlined
                  @keypress.enter="applySearchFilter"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn
                  color="green"
                  :disabled="!searchFilterString"
                  :dark="!!searchFilterString"
                  @click="applySearchFilter"
          >
            Add Filter
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>


    <!--          ************* -->
    <!--          LIST values -->
    <!--          ************* -->
    <v-card
            flat
            class=""
            style="font-size: unset;"
            v-if="!config.isSearch && !config.isRange"
    >
      <v-toolbar flat dense>
        <v-text-field
                flat
                outlined
                hide-details
                full-width
                clearable
                prepend-inner-icon="mdi-magnify"
                autofocus
                color="green"
                dense
                v-model="searchString"
                :placeholder="searchPlaceholder"
        />

      </v-toolbar>
      <!--      <v-progress-linear v-if="isLoading" absolute indeterminate color="green" />-->
      <v-card-text v-if="apiFiltersToShow.length === 0">
        <div class="ml-0">
          No more values to show
        </div>
      </v-card-text>


      <v-list :dense="false">
        <facet-option
                v-for="f in apiFiltersToShow"
                :filter="f"
                :key="f.asStr"
                @add-filter="addFilter"
                @add-filter-persistent="addFilterPersistent"

        />
      </v-list>

    </v-card>
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
    copySimpleFilter,
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
    name: "FacetZoomNew",
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
            "searchIsLoading",
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
            "setFiltersZoom",
            "setFacetZoom",
        ]),
        ...mapActions([]),

        clearInput() {
            this.range = ["", ""]
            this.searchFilterString
        },
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
        addFilter(filter){
          console.log("addFilter", filter)
          url.setFilters(
              "works",
              [...this.resultsFilters, filter]
          )
                this.setFacetZoom(false)
        },

        addFilterPersistent(filter){
          console.log("addFilter persistent", filter)
          url.setFilters(
              "works",
              [...this.resultsFilters, filter]
          )
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
        clearMyFilters() {
            url.setFiltersByKey(this.facetZoom, [])
        },

        async fetchFilters() {
            if (this.config.isSearch) {
                return
            }


            this.isLoading = "green"
            this.resetRange()
            // const resp = await api.getUrl(this.apiUrl)

            try {
                const resp = await axios.get(
                    this.apiUrl,
                )
                if (resp.data.meta.q && resp.data.meta.q !== this.searchString) {
                    throw new Error(`response with q="${resp.data.meta.q}" no longer matches current searchString "${this.searchString}"`)
                }

                const groups = resp.data.group_by.slice(0, 20)
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
            } catch (e) {
                console.log("fetchFilters() error:", e.message)
            } finally {
                this.isLoading = false

            }


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
            // const currentYear = new Date().getFullYear()
            // const maxValue = String(currentYear)
            // if (this.range[0] > maxValue) this.range[0] = maxValue
            // if (this.range[1] > maxValue) this.range[1] = maxValue

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
            this.resetRange()
        },

        applySearchFilter() {
            console.log("apply search filter", this.searchFilterString)
            const filter = createSimpleFilter(
                this.entityType,
                this.facetZoom,
                this.searchFilterString,
            )
            const newFilters = [...this.resultsFilters, filter]
            this.isLoading = "green"
            this.searchFilterString = ""
            url.setFilters(
                this.entityType,
                newFilters
            )
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
        searchString: async function (newVal, oldVal) {
            this.fetchFilters()
        },
        facetZoom: function () {
            this.fetchFilters()

        }
    }
}
</script>

<style lang="scss">

</style>