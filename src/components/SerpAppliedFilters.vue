<template>
  <v-card
          flat
          class=""
  >
    <v-toolbar flat>
      <v-toolbar-title>
        {{ resultsFilters.length }} filters applied
      </v-toolbar-title>
      <v-spacer/>
      <!--      <v-btn icon><v-icon>mdi-delete-circle-outline</v-icon></v-btn>-->
    </v-toolbar>
    <v-list dense class="" >
      <o-filter
              v-for="(filter, i) in resultsFilters"
              :key="filter.key + filter.value"

              :key-readonly="true"
              :filter-key="filter.key"
              :filter-value="filter.value"
              :display-value="filter.displayValue"
      />
      <o-filter
              :key="'new-filter' + $route.fullPath"
              :filter-key="defaultFilterKey"
              is-editing
      />
    </v-list>
  </v-card>


</template>

<script>
import {sleep} from "../util";
import {mapActions, mapGetters, mapMutations} from "vuex";

// change name to "o-filter" because "filter" is a native HTML element name.
import OFilter from "./Filters/Filter.vue";
import {url} from "../url";
import {createSimpleFilter} from "@/filterConfigs";
import {facetConfigs} from "../facetConfigs";

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
            },
        }
    },
    computed: {
        ...mapGetters([
            "resultsFilters",
            "entityType",
            "searchFacetConfigs",
            "filtersZoom",

        ]),
        defaultFilterKey() {
          return facetConfigs(this.entityType).find(f => f.isDefault).key
        }

    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "openFacetsDialog",
        ]),
        ...mapActions([]),
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
        '$route': {
            immediate: true,
            handler: function (to, from) {
                console.log("SerpAppliedFilters $route change", to)
            }
        }
    }
}
</script>

<style scoped lang="scss">

</style>