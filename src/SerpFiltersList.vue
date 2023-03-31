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
            <v-icon>mdi-filter-outline</v-icon>
            <span v-if="!selectedFacetKey">Filters</span>
            <span v-else>{{ selectedFacetConfig.displayName }}</span>
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

              v-model="searchQuery"
              placeholder="search"
          />
          <v-spacer/>
          <v-btn icon @click="facetsDrawerIsOpen = false">
            <v-icon icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text>
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

export default {
  name: "SerpFiltersList",
  components: {
    SerpFiltersListChip,
    FacetSimple,
  },
  props: {},
  data() {
    return {
      searchQuery: "",
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
          facets: this.searchQueryResults.filter(f => {
            return f.category === categoryName
          })
        }
      })
          .filter(categoryObj => {
            return categoryObj.facets.length > 0
          })
    },


    searchQueryResults() {
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.searchQuery?.toLowerCase())
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


  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setFiltersZoom",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>