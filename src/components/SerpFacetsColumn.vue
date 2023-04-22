<template>
  <v-card flat class="facets-column">
    <v-toolbar flat dense>
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

      <v-toolbar-title>
        <v-icon>mdi-filter-outline</v-icon>
        Filters
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-slot:extension class="pa-0 ">
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
            placeholder=""
        />
      </template>
    </v-toolbar>
    <v-list dense nav>
      <template
          v-for="facetCategory in facetsByCategory(this.searchString)"
      >
        <v-subheader :key="'subheader'+facetCategory.name" class="mt-6">
          <v-icon small left>{{ facetCategory.icon }}</v-icon>
          {{ facetCategory.name }}
        </v-subheader>
        <v-divider :key="'subheader-divider'+facetCategory.name"/>

        <facet-simple
            v-for="facet in facetCategory.facets"
            :key="facet.entityType + facet.key"
            :facet-key="facet.key"
            :facet-entity-type="entityType"
        />

      </template>

    </v-list>
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
    }
  },
  computed: {
      facet() {
          return facet
      },
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "facetsByCategory",
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
    }
  }
}
</script>

<style  lang="scss">
.facets-column .v-toolbar__extension {
    padding-left: 7px !important;
    padding-right: 7px !important;
  }

</style>