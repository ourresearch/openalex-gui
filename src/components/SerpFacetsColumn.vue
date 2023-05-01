<template>
  <v-card flat tile class="facets-column">
    <v-toolbar flat tile class="pa-0">
      <!--      <v-text-field-->
      <!--            flat-->
      <!--            hide-details-->
      <!--            full-width-->
      <!--            clearable-->
      <!--            prepend-inner-icon="mdi-magnify"-->
      <!--            dense-->

      <!--            v-model="searchString"-->
      <!--            placeholder="Filters"-->
      <!--        />-->

<!--      <v-toolbar-title>-->
<!--        <v-icon>mdi-filter-outline</v-icon>-->
<!--        Filters-->
<!--      </v-toolbar-title>-->
<!--      <v-spacer></v-spacer>-->
      <!--      {{ openPanels }}-->

        <v-text-field
            flat
            outlined
            hide-details
            full-width
            clearable
            prepend-inner-icon="mdi-magnify"
            dense
            color="green"

            v-model="searchString"
            placeholder="Search filter types"
        />
    </v-toolbar>
    <v-expansion-panels
        :multiple="allowMultipleOpenPanels"
        flat
        accordion
        v-model="openPanels"
    >

      <v-expansion-panel
          v-for="(facetCategory, i) in myFacetsByCategory"
          :key="i"
      >
        <!--        <v-divider />-->
        <v-expansion-panel-header
            :class="{'font-weight-bold': facetCategory.resultsFiltersCount > 0, 'green--text': facetCategory.resultsFiltersCount > 0}"
            class="d-flex pl-4"
        >
          <div class="capitalize-first-letter d-flex align-center">

            <v-icon small left :color="(facetCategory.resultsFiltersCount > 0) ? 'green' : undefined">{{ facetCategory.icon }}</v-icon>
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
import {facetsByCategory} from "../facetConfigs";
import FacetSimple from "./Facet/FacetSimple.vue";
import facet from "./Facet/Facet.vue";

export default {
  name: "SerpFacetsColumn",
  components: {
    FacetSimple,
  },
  props: {},
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

</style>