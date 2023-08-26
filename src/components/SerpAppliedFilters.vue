<template>
  <v-card
      flat
      class=""
  >
    <v-list dense class="">
      <o-filter
          v-for="filter in resultsFilters"
          :key="filter.key + filter.value"

          key-readonly
          :filter-key="filter.key"
          :value="filter.value"
          :display-value="filter.displayValue"
      />
      <o-filter
          key="new-filter"
          key-readonly
          filter-key="title.search"
      />
    </v-list>
  </v-card>


</template>

<script>
import {sleep} from "../util";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetCategories, facetConfigs, getFacetConfig} from "@/facetConfigs";
import {filtersAsUrlStr, sortedFilters} from "../filterConfigs";

// change name to "o-filter" because "filter" is a native HTML element name.
import OFilter from "./Filters/Filter.vue";
import {url} from "../url";

export default {
  name: "AppliedFilters",
  components: {
    OFilter,
  },
  props: {
    singleWork: Boolean,
  },
  data() {
    return {
      searchString: "",
      showAddFilterButton: false,
      selectedFilters: [],
      dialogs: {
        facetsDrawer: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "searchFacetConfigs",
      "filtersZoom",

    ]),
    facetsDrawerIsOpen: {
      get() {
        return !!this.filtersZoom
      },
      set(val) {
        this.setFiltersZoom(val)
      },
    },
    searchPlaceholderText() {
      if (this.selectedFacetConfig) {
        if (this.selectedFacetConfig.valuesToShow !== "mostCommon") return ""

        const thingToSearch = this.$pluralize(this.selectedFacetConfig.displayName, 2);
        return `Search ${thingToSearch}`
      } else {
        return "Search filter types"
      }
    },

    facetsByCategory() {
      return facetCategories[this.entityType].map(categoryName => {
        return {
          name: categoryName,
          facets: this.searchStringResults.filter(f => {
            return f.category === categoryName
          })
        }
      })
          .filter(categoryObj => {
            return categoryObj.facets.length > 0
          })
    },


    searchStringResults() {
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.searchString?.toLowerCase())
          })
          .filter(c => {
            const filters = this.resultsFilters.filter(f => f.key === c.key)
            // hide the noOptions facets unless they have selected filters
            return !c.noOptions || filters.length
          })

      ret.sort((a, b) => {
        if (a.sortToTop) return -1
        return (a.displayName > b.displayName) ? 1 : -1
      })


      return ret
    },
    selectedFacetKey() {
      const filterKeys = facetConfigs().map(f => f.key)
      if (filterKeys.includes(this.filtersZoom)) {
        return this.filtersZoom
      }
    },
    selectedFacetConfig() {
      if (!this.selectedFacetKey) return
      return getFacetConfig(this.entityType, this.selectedFacetKey)
    },
    myResultsFilters() {
      if (!this.selectedFacetKey) return this.resultsFilters
      return this.resultsFilters.filter(f => f.key === this.selectedFacetKey);
    }


  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setFiltersZoom",
      "openFacetsDialog",
    ]),
    ...mapActions([]),
    makeApiUrl(perPage, formatCsv) {
      if (!perPage) perPage = this.maxApiFiltersToShow
      const url = new URL(`https://api.openalex.org`)
      url.pathname = `${this.entityType}`

      const filters = this.$store.state.inputFilters
      url.searchParams.set("filter", filtersAsUrlStr(filters, this.entityType))

      url.searchParams.set("group_by", this.selectedFacetConfig.key)
      url.searchParams.set("per_page", String(perPage))
      if (this.textSearch) url.searchParams.set("search", this.textSearch)
      if (this.searchString) url.searchParams.set("q", this.searchString)
      if (formatCsv) url.searchParams.set("format", "csv")
      url.searchParams.set("email", "team@ourresearch.org")
      return url.toString()
    },
    clear() {
      url.setFilters(this.entityType, [])
      this.snackbar("All filters cleared")

      // const newFilters = (this.selectedFacetKey) ?
      //     this.resultsFilters.filter(f => f.key !== this.selectedFacetKey) :
      //     []
      // url.setFilters(this.entityType, newFilters)
      //
      // const myFacetName = (this.selectedFacetConfig) ? this.selectedFacetConfig.displayName : ""
      // this.snackbar(myFacetName + " filters cleared")
      //
      // this.facetsDrawerIsOpen = !!this.selectedFacetKey
    }

  },
  created() {
  },
  async mounted() {
    await sleep(500)
    // we want a cool animation when folks show up.
    this.showAddFilterButton = true
  },
  watch: {
    selectedFacetKey(to, from) {
      this.searchString = ""
    },
  }
}
</script>

<style scoped lang="scss">

</style>