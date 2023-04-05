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
    <v-btn
        color="green"
        dark
        rounded
        v-if="resultsFilters.length === 0"
        class="ml-2 mr-2 mb-2"
        @click="facetsDrawerIsOpen = true"
    >
      <v-icon class="mr-1">mdi-filter-plus-outline</v-icon>
      Add filter
      <span class="caption ml-2" style="opacity: .7;">⌘F</span>
    </v-btn>
    <v-card v-if="resultsFilters.length > 0" outlined class="pa-2 pb-0" style="border: 1px solid #fff" color="#fafafa">
      <div class="text-h5 pl-3 pb-2 d-flex align-baseline">
        <v-icon>mdi-filter-outline</v-icon>
        Filters
        <span class="body-2 ml-1" v-if="resultsFilters.length">({{ resultsFilters.length }})</span>
        <v-spacer></v-spacer>
        <v-btn @click="clear" text class="low-key-button">
          <v-icon small>mdi-filter-off-outline</v-icon>
          Clear
        </v-btn>
      </div>
      <div class="d-flex">
        <div>
          <serp-filters-list-chip
              v-for="filter in resultsFilters"
              :key="filter.key + filter.value"
              :filter="filter"
          />

        </div>

      </div>
      <div style="margin-bottom: -25px;">
        <v-btn
            color="green"
            dark
            rounded

            class="ml-2 mt-2 mr-2 mb-2"
            @click="facetsDrawerIsOpen = true"
        >
          <v-icon left>mdi-filter-plus-outline</v-icon>
          add
          <span class="caption ml-2" style="opacity: .7;">⌘F</span>
        </v-btn>
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


    <v-dialog
        v-model="facetsDrawerIsOpen"
        scrollable
    >
      <v-card>
        <v-toolbar flat class="" extended color="green" dark>
          <v-toolbar-title>
            <v-btn text @click="setFiltersZoom(true)" class="text-capitalize text-h5 px-1">
              <v-icon class="pr-1">mdi-filter-outline</v-icon>
              <v-icon v-if="selectedFacetConfig">mdi-chevron-right</v-icon>
              <span v-else>Filters</span>
            </v-btn>
            <span v-if="selectedFacetConfig" class="text-h5  font-weight-bold">
              <v-icon>{{ selectedFacetConfig.icon }}</v-icon>
              {{ selectedFacetConfig.displayName }}
            </span>

          </v-toolbar-title>
          <v-spacer />
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


          <v-btn icon @click="facetsDrawerIsOpen = false">
            <v-icon icon>mdi-close</v-icon>
          </v-btn>

          <template v-slot:extension>
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
              :disabled="!searchPlaceholderText"
              :placeholder="searchPlaceholderText"
          />

          </template>


        </v-toolbar>
        <v-divider class=""/>
        <v-card-text style="height: 70vh;" class="pa-0">
          <v-row
              v-if="filtersZoom && !selectedFacetKey"
              class="pt-0 mt-3 px-4"
              expand
              nav
          >
            <v-col
                cols="3"
                v-for="facetCategory in facetsByCategory"
                :key="'card' + facetCategory.name"
            >
              <v-card outlined>
                <v-card-title class="text-capitalize pb-0">
                  {{ facetCategory.name }}

                </v-card-title>
                <v-list>
                  <facet-simple
                      v-for="facet in facetCategory.facets"
                      :key="facet.entityType + facet.key"
                      :facet-key="facet.key"
                      :facet-entity-type="entityType"
                  />
                </v-list>

              </v-card>

              <!--              <template>-->
              <!--                <v-subheader-->
              <!--                    :key="'subheader' + facetCategory.name"-->
              <!--                    class="align-end text-capitalize pl-0"-->
              <!--                >-->
              <!--                  {{ facetCategory.name }}-->
              <!--                </v-subheader>-->
              <!--                &lt;!&ndash;                <v-divider :key="'divider' + facetCategory.name"></v-divider>&ndash;&gt;-->
              <!--              </template>-->

            </v-col>
          </v-row>

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
    searchPlaceholderText(){
      if (this.selectedFacetConfig){
        if (this.selectedFacetConfig.valuesToShow !== "mostCommon") return ""

        const thingToSearch = this.$pluralize(this.selectedFacetConfig.displayName, 2);
        return `Search ${thingToSearch}`
      }
      else {
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