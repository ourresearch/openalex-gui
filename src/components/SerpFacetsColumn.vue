<template>
  <v-card flat>
    <v-toolbar flat>
      <v-toolbar-title>
        Filters
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="openFacetsDialog">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

    </v-toolbar>
    <v-list dense nav>
      <template
              v-for="facetCategory in facetsByCategory"
      >
        <v-subheader :key="'subheader'+facetCategory.name">
          {{ facetCategory.name }}
        </v-subheader>
        <v-divider :key="'subheader-divider'+facetCategory.name" />
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

export default {
    name: "SerpFacetsColumn",
    components: {
        FacetSimple,
    },
    props: {},
    data() {
        return {
            foo: 42,
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
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
            return facetsByCategory(this.entityType, "")
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

<style scoped lang="scss">

</style>