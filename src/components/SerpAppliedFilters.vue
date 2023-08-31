<template>
  <v-card
      flat
      class=""
  >
    <v-toolbar flat  dense class="elevation-0">
      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-title>
        Filters
        <span class="body-2">
          ({{ resultsFilters.length }})
        </span>
      </v-toolbar-title>
      <v-spacer />
      <v-tooltip bottom>
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon>
            <v-icon>mdi-filter-off-outline</v-icon>
          </v-btn>
        </template>
        <div>Clear all filters</div>
      </v-tooltip>
    </v-toolbar>
<!--    <v-divider />-->
    <v-list  class="">
      <o-filter
          v-for="(filter, i) in resultsFilters"
          :key="filter.key + filter.value"

          :filter-key="filter.key"
          :filter-value="filter.value"
          :is-negated="filter.isNegated"
      />
      <o-filter
          :key="'new-filter' + $route.fullPath"
      />
    </v-list>
  </v-card>


</template>

<script>
import {sleep} from "../util";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../url";
import {createSimpleFilter} from "@/filterConfigs";
import {facetConfigs, filtersList} from "../facetConfigs";
import EntityTypeSelector from "./EntityTypeSelector.vue";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";

// change name to "o-filter" because "filter" is a native HTML element name.
import OFilter from "./Filters/Filter.vue";

export default {
  name: "AppliedFilters",
  components: {
    OFilter,
    EntityTypeSelector,
    FilterKeySelector,
  },
  props: {
    singleWork: Boolean,
  },
  data() {
    return {
      addWidgetSearchString: "",
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
    },
    filterOptions() {
      return filtersList(this.entityType, [], this.addWidgetSearchString)
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