<template>
  <div class="serp-filters-list">
    <v-btn
        small
        rounded
        color="primary"
        class="ml-2"
        @click="dialogs.facetsDrawer = true"
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
        v-model="dialogs.facetsDrawer"
        scrollable
    >
      <v-card>
        <v-toolbars>
          <v-toolbar-title>
            <v-icon>mdi-filter-outline</v-icon>
            Filters
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

              v-model="facetSearch"
              placeholder="search filters"
          />
          <v-spacer/>
          <v-btn icon @click="dialogs.facetsDrawer = false">
            <v-icon icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbars>
        <v-card-text>
          <!--          <facets-drawer/>-->
          <v-list
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
              <template v-for="facet in facetCategory.facets">
                <facet-range
                    v-if="facet.isRange"
                    :key="facet.entityType + facet.key"
                    :facet-key="facet.key"
                    :facet-entity-type="entityType"
                    show-details-button
                >
                </facet-range>
                <facet
                    v-else
                    :key="facet.entityType + facet.key"
                    :facet-key="facet.key"
                    :facet-entity-type="entityType"
                />

              </template>
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
import FacetsDrawer from "@/components/Facet/FacetsDrawer.vue";
import {facetCategories} from "@/facetConfigs";
import Facet from "@/components/Facet/Facet.vue";
import FacetRange from "@/components/Facet/FacetRange.vue";

export default {
  name: "SerpFiltersList",
  components: {
    SerpFiltersListChip,
    Facet,
    FacetRange,
  },
  props: {},
  data() {
    return {
      facetSearch: "",
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
    ]),
    isOpen: {
      get() {
        if (!this.$vuetify.breakpoint.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.breakpoint.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },

    facetsByCategory() {
      return facetCategories[this.entityType].map(categoryName => {
        return {
          name: categoryName,
          facets: this.facetSearchResults.filter(f => {
            return f.category === categoryName
          })
        }
      })
          .filter(categoryObj => {
            return categoryObj.facets.length > 0
          })
    },


    facetSearchResults() {
      const ret = this.searchFacetConfigs
          .filter(c => {
            return c.displayName.toLowerCase().match(this.facetSearch?.toLowerCase())
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

  },

  methods: {
    ...mapMutations([
      "snackbar",
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