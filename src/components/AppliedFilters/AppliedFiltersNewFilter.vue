<template>

  <v-list-item large close
               :disabled="disabled"
               color="primary"
  >
    <v-list-item-content>
      <div class="d-flex">
        <v-autocomplete
                :items="filters"
                item-text="displayName"
                item-value="key"
                class="mr-3"
                v-model="selectedFilterKey"
        />
        <span class="font-weight-bold" v-if="isNegated">NOT</span>
        <v-autocomplete
                :disabled="!selectedFilterKey"
                :items="filterValueOptions"
                item-text="displayValue"
                :search-input.sync="filterValueOptionsSearchString"
        />
      </div>


    </v-list-item-content>
    <div>
      <v-btn
              color="primary"

      >
        Apply
      </v-btn>
    </div>


  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../../url";
import {createSimpleFilter,} from "@/filterConfigs";
import {facetConfigs, filtersList} from "../../facetConfigs";
import {createDisplayFilter, filtersAsUrlStr} from "../../filterConfigs";
import axios from "axios";

export default {
    name: "AppliedFiltersNewFilter",
    components: {},
    props: {
        filter: Object,
        disabled: Boolean,

    },
    data() {
        return {
            foo: 42,
            isNegated: false,
            selectedFilterKey: "",
            isEditing: false,

            // search for options. this is async.
            filterValueOptions: [],
            filterValueOptionsSearchString: "",

            maxApiFiltersToShow: 200,
            apiFilters: []

        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
            "facetZoom",
        ]),
        filters() {
            return filtersList(this.entityType, [], "")
        },
        selectedFilterConfig() {
            return facetConfigs().find(c => c.key === this.selectedFilterKey)
        },
        apiUrl() {
            return this.makeApiUrl()
        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "setFacetZoom",
        ]),
        ...mapActions([]),

        async fetchFilters() {
            if (!this.selectedFilterConfig) return
            if (this.selectedFilterConfig.valuesToShow === 'search') {
                return
            }


            this.isLoading = true
            // this.resetRange()

            try {
                const resp = await axios.get(
                    this.apiUrl,
                )
                if (resp.data.meta.q && resp.data.meta.q !== this.filterValueOptionsSearchString) {
                    throw new Error(`response with q="${resp.data.meta.q}" no longer matches current searchString "${this.filterValueOptionsSearchString}"`)
                }

                const groups = resp.data.group_by
                console.log("groups", groups)

                const worksCounts = groups.map(f => f.count)
                const sumOfAllWorksCounts = worksCounts.reduce((a, b) => a + b, 0)
                this.filtersTotalCount = sumOfAllWorksCounts

                this.filterValueOptions = groups.map(apiData => {

                    return createDisplayFilter(
                        this.entityType,
                        this.selectedFilterKey,
                        apiData.key,
                        false,
                        apiData.key_display_name,
                        apiData.count,
                        this.filtersTotalCount,
                    )
                })
            } catch (e) {
                console.log("fetchFilters() ERROR:", e.message)
            } finally {
                this.isLoading = false

            }


        },
        makeApiUrl(formatCsv = false, includeEmail = true) {
            const url = new URL(`https://api.openalex.org`)
            url.pathname = `${this.entityType}`

            const filters = this.$store.state.inputFilters
            url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))
            url.searchParams.set("group_by", this.selectedFilterKey)
            if (this.filterValueOptionsSearchString) url.searchParams.set("q", this.filterValueOptionsSearchString)


            if (formatCsv) url.searchParams.set("format", "csv");
            (includeEmail) && url.searchParams.set("mailto", "team@ourresearch.org")
            return url.toString()
        },


        remove() {
            const newFilters = this.resultsFilters.filter(f => f.asStr !== this.filter.asStr)
            url.setFilters(
                this.entityType,
                newFilters
            )
        },
        toggleNegation() {
            const newFilter = createSimpleFilter(
                this.filter.entityType,
                this.filter.key,
                this.filter.value,
                !this.isNegated
            )

            const newFiltersList = this.resultsFilters.filter(f => f.kv !== this.filter.kv)
            newFiltersList.push(newFilter)
            url.setFilters(
                this.entityType,
                newFiltersList
            )
        },

        toggleFacetZoom() {
            this.setFacetZoom((this.facetZoom === this.filter.key) ? false : this.filter.key)
        }


    },
    created() {
    },
    mounted() {
    },
    watch: {
        filterValueOptionsSearchString(to, from) {
            console.log("filterValueOptionsSearchString changed", to)
            this.fetchFilters()
        }
    }
}
</script>

<style scoped lang="scss">
.filter-value.isNegated {
  text-decoration: line-through;
}
</style>