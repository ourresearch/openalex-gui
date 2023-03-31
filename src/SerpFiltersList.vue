<template>
  <div class="serp-filters-list">
    <v-btn
        small
        rounded
        color="primary"
        class="ml-2"
        @click="facetsDrawerIsOpen = true"
    >
      <v-icon left>mdi-filter-menu-outline</v-icon>
      filters
    </v-btn>

    <serp-filters-list-chip
        v-for="filter in resultsFilters"
        :key="filter.key + filter.value"
        :filter="filter"
    />


    <v-dialog
        v-model="facetsDrawerIsOpen"
        scrollable
    >
      <v-card>
        <v-toolbar>
          <v-toolbar-title>
            <v-btn icon @click="setFiltersZoom(true)">
              <v-icon>{{ (selectedFacetConfig) ? "mdi-arrow-left" : "mdi-filter-outline" }}</v-icon>
            </v-btn>
            <span v-if="selectedFacetConfig">
              <v-icon>{{ selectedFacetConfig.icon }}</v-icon>
              {{ selectedFacetConfig.displayName }}
            </span>
            <span v-else>Filters</span>

          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-text-field
              flat
              outlined
              rounded
              hide-details
              full-width
              class="mt-0"
              clearable
              prepend-inner-icon="mdi-magnify"
              autofocus
              dense

              v-model="searchString"
              placeholder="search"
          />
          <v-menu v-if="selectedFacetConfig">
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

          <v-btn icon @click="clear" :disabled="myResultsFilters.length === 0">
            <v-icon icon>mdi-filter-off-outline</v-icon>
          </v-btn>


          <v-btn icon @click="facetsDrawerIsOpen = false">
            <v-icon icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text style="height: 81vh;">
          <v-list
              v-if="filtersZoom && !selectedFacetKey"
              class="pt-0 pl-0"
              expand
              nav
          >
            <template
                v-for="facetCategory in facetsByCategory"
            >
              <template>
                <v-subheader
                    :key="'subheader' + facetCategory.name"
                    class="align-end text-capitalize pl-0"
                >
                  {{ facetCategory.name }}
                </v-subheader>
                <!--                <v-divider :key="'divider' + facetCategory.name"></v-divider>-->
              </template>
              <facet-simple
                  v-for="facet in facetCategory.facets"
                  :key="facet.entityType + facet.key"
                  :facet-key="facet.key"
                  :facet-entity-type="entityType"
              />
            </template>
          </v-list>

          <facet-zoom
              v-if="selectedFacetKey"
              :facet-key="selectedFacetKey"
              :api-url="makeApiUrl(50)"
              :search-string="searchString"
          />


        </v-card-text>
      </v-card>
    </v-dialog>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import SerpFiltersListChip from "./components/SerpFiltersListChip";
import {facetCategories, facetConfigs, getFacetConfig} from "@/facetConfigs";
import FacetSimple from "@/components/Facet/FacetSimple.vue";
import FacetZoom from "./components/Facet/FacetZoom";
import {filtersAsUrlStr, sortedFilters} from "./filterConfigs";
import {url} from "./url";

export default {
  name: "SerpFiltersList",
  components: {
    SerpFiltersListChip,
    FacetSimple,
    FacetZoom,
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
    clear(){
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