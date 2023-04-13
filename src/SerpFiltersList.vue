<template>
  <div class="serp-filters-list">

    <div
        v-shortkey="['meta', 'f']"
        @shortkey="facetsDrawerIsOpen = true"
    ></div>
    <div
        v-shortkey="['ctrl', 'f']"
        @shortkey="facetsDrawerIsOpen = true"
    ></div>


    <v-card outlined class=" pb-0" color="#fff">
      <v-toolbar flat color="transparent">

        <v-btn
            fab
            small
            dark
            color="green"
            class="mr-2"
            @click="$store.state.facetsListDialogIsOpen = true"
        >
          <v-icon class="">mdi-filter-menu-outline</v-icon>
          <!--            filters-->
          <!--            <span class="caption ml-2" style="opacity: .7;">⌘F</span>-->
        </v-btn>
        <search-box-new class="my-2 mr-2"/>
        <v-spacer/>
        <v-btn
            icon
            @click="clear()"
        >
          <v-icon>mdi-filter-off-outline</v-icon>
        </v-btn>
      </v-toolbar>
      <v-divider/>


      <div class="d-flex flex-wrap pa-3">
        <serp-filters-list-chip
            v-for="filter in resultsFilters"
            :key="filter.key + filter.value"
            :filter="filter"
        />
      </div>
      <div class="pa-3 pt-0 grey--text" v-if="resultsFilters.length === 0">
        No filters applied; showing all {{ entityType | pluralize(2) }}
      </div>

    </v-card>
    <!--    <v-btn-->
    <!--        icon-->
    <!--        large outlined-->
    <!--        class="ml-2 mr-2 mb-2"-->
    <!--        @click="clear"-->
    <!--        v-if="resultsFilters.length > 0"-->
    <!--    >-->
    <!--      <v-icon >mdi-filter-off-outline</v-icon>-->
    <!--    </v-btn>-->




  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import SerpFiltersListChip from "./components/SerpFiltersListChip";
import {facetCategories, facetConfigs, getFacetConfig} from "@/facetConfigs";
import {filtersAsUrlStr, sortedFilters} from "./filterConfigs";
import {url} from "./url";
import SearchBoxNew from "./components/SearchBoxNew.vue";

export default {
  name: "SerpFiltersList",
  components: {
    SearchBoxNew,
    SerpFiltersListChip,
  },
  props: {},
  data() {
    return {
      searchString: "",
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
      console.log("close!")
      const newFilters = (this.selectedFacetKey) ?
          this.resultsFilters.filter(f => f.key !== this.selectedFacetKey) :
          []
      url.setFilters(this.entityType, newFilters)

      const myFacetName = (this.selectedFacetConfig) ? this.selectedFacetConfig.displayName : ""
      this.snackbar(myFacetName + " filters cleared")

      this.facetsDrawerIsOpen = !!this.selectedFacetKey
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
    selectedFacetKey(to, from) {
      this.searchString = ""
    }
  }
}
</script>

<style scoped lang="scss">

</style>