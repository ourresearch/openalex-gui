<template>
  <v-card :disabled="disabled" flat tile class="facets-column">
    <v-toolbar v-if="0" tile flat>
      <v-icon class="mr-3">mdi-filter-outline</v-icon>
      <v-toolbar-title class="pl-0">Filters</v-toolbar-title>
      <v-spacer/>
      <v-btn icon disabled v-if="disabled">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
      <v-menu offset-y v-if="!disabled">

        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
                  @click="clearAll"
                  :disabled="resultsFilters.length === 0"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-off-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Clear all
            </v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>
    </v-toolbar>
    <v-toolbar  flat tile dense class="pa-0">
            <v-text-field
                  flat
                  hide-details
                  full-width
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  dense

                  v-model="searchString"
                  placeholder="Find filter"
              />

      <!--      <v-toolbar-title>-->
      <!--        <v-icon>mdi-filter-outline</v-icon>-->
      <!--        Filters-->
      <!--      </v-toolbar-title>-->
      <!--      <v-spacer></v-spacer>-->
      <!--      {{ openPanels }}-->

<!--      <v-text-field-->
<!--              flat-->
<!--              outlined-->
<!--              hide-details-->
<!--              full-width-->
<!--              clearable-->
<!--              prepend-inner-icon="mdi-magnify"-->
<!--              dense-->
<!--              color="green"-->

<!--              v-model="searchString"-->
<!--              placeholder="Search filter types"-->
<!--      />-->
    </v-toolbar>
    <v-list>
      <facet-simple
              v-for="filter in myFiltersList"
              :key="filter.entityType + filter.key"
              :facet-key="filter.key"
              :facet-entity-type="entityType"
      />
    </v-list>

    <v-expansion-panels
            v-if="0"
            :multiple="allowMultipleOpenPanels"
            flat
            accordion
            v-model="openPanels"
    >

      <v-expansion-panel
              v-for="(facetCategory, i) in myFacetsByCategory"
              :key="i"
      >
        <v-divider/>
        <v-expansion-panel-header
                :class="{'font-weight-bold': facetCategory.resultsFiltersCount > 0, 'green--text': facetCategory.resultsFiltersCount > 0}"
                class="d-flex pl-4"
        >
          <div class="capitalize-first-letter d-flex align-center">

            <v-icon small left :color="(facetCategory.resultsFiltersCount > 0) ? 'green' : undefined">
              {{ facetCategory.icon }}
            </v-icon>
            <span class="d-block capitalize-first-letter">
                {{ facetCategory.name }}
            </span>
            <span v-if="facetCategory.resultsFiltersCount > 0" class=" ml-1">
            ({{ facetCategory.resultsFiltersCount }})
          </span>

          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-list>
            <facet-simple
                    v-for="facet in facetCategory.facets"
                    :key="facet.entityType + facet.key"
                    :facet-key="facet.key"
                    :facet-entity-type="entityType"
            />

          </v-list>

        </v-expansion-panel-content>


      </v-expansion-panel>
    </v-expansion-panels>

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetsByCategory, filtersList} from "../../facetConfigs";
import FacetSimple from "../Facet/FacetSimple.vue";
import facet from "../Facet/Facet.vue";
import {url} from "@/url";

export default {
    name: "SerpFacetsColumn",
    components: {
        FacetSimple,
    },
    props: {
        disabled: Boolean,
    },
    data() {
        return {
            searchString: "",
            openPanels: [0],
            allowMultipleOpenPanels: true,
        }
    },
    computed: {
        facet() {
            return facet
        },
        ...mapGetters([
            "resultsFilters",
            "entityType",
        ]),
        myFiltersList() {
            return filtersList(
                this.$route.params.entityType,
                this.resultsFilters,
                this.searchString,
            )
        },
        myFacetsByCategory() {
            return facetsByCategory(
                "works",
                this.resultsFilters,
                this.searchString,
            )
        },
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
    },


    methods: {
        ...mapMutations([
            "snackbar",
            "openFacetsDialog",
        ]),
        ...mapActions([]),
        clearAll() {
            url.setFilters(this.entityType, [])
            this.snackbar("All filters cleared")
        },


    },
    created() {
    },
    mounted() {
    },
    watch: {
        isOpen(to, from) {
        },
        "$route.query": {
            immediate: true,
            handler(newVal, oldVal) {
                this.searchString = ""
            }
        },
        searchString: {
            immediate: true,
            handler(newVal, oldVal) {
                const allPanelIndexes = _.range(0, this.myFacetsByCategory.length)
                if (newVal) {
                    console.log("open expansion panels: ", allPanelIndexes)
                    this.allowMultipleOpenPanels = true
                    this.openPanels = allPanelIndexes
                    console.log("this.openPanels: ", this.openPanels)
                } else {
                    this.allowMultipleOpenPanels = false
                    this.openPanels = 0
                }
            }
        },
    }
}
</script>

<style lang="scss">
.facets-column .v-toolbar__extension {
  padding-left: 7px !important;
  padding-right: 7px !important;
}

.facets-column .v-sheet {
  padding: 0 !important;
}

.facets-column .v-expansion-panel--active > .v-expansion-panel-header {
  min-height: 0 !important;
  font-weight: bold !important;
}

</style>