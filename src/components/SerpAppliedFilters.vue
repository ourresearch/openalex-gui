<template>
  <v-card
          flat
          class="mb-8"
  >
    <v-toolbar flat dense class="elevation-0">
      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-title>
        Filters
        <span class="body-2">
          ({{ resultsFilters.length }})
        </span>
      </v-toolbar-title>
      <v-spacer/>
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
    <v-list class="pt-0">
      <o-filter
              v-for="(filter, i) in filtersToShow"
              :key="filter.key + filter.value"
              :filter-key="filter.key"
              :filter-value="filter.value"
              :is-negated="filter.isNegated"
              @delete="removeFilter(filter)"
      />
    </v-list>
    <v-card-actions>
      <v-menu max-height="90vh">
        <template v-slot:activator="{on}">
          <v-btn
                  fab
                  color="primary"
                  v-on="on"
                  style="margin-bottom: -33px"
          >
            <v-icon left class="">mdi-filter-plus-outline</v-icon>
          </v-btn>
        </template>
        <filter-key-selector
                @select="addFilter"
        />
      </v-menu>

    </v-card-actions>
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
import {filtersAreEqual} from "../filterConfigs";
import {filtersFromUrlStr} from "../filterConfigs";

export default {
    name: "AppliedFilters",
    components: {
        OFilter,
        EntityTypeSelector,
        FilterKeySelector,
    },
    props: {
        filters: Array,
    },
    data() {
        return {
            addWidgetSearchString: "",
            showAddFilterButton: false,
            filtersToShow: [],
            dialogs: {
                facetsDrawer: false,
            },
        }
    },
    computed: {
        ...mapGetters([
            "entityType",
            "searchFacetConfigs",
            "filtersZoom",

        ]),
        resultsFilters(){
            return filtersFromUrlStr(
                this.entityType,
                this.$router.currentRoute.query?.filter
            )
        }
    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "openFacetsDialog",
        ]),
        ...mapActions([]),
        addFilter(filterKey){
          console.log("addFilter", filterKey)
            this.filtersToShow.push(
                createSimpleFilter(
                    this.entityType,
                    filterKey,
                    undefined,
                    false
                )
            )
        },
        async removeFilter(filterToRemove){
            this.filtersToShow = this.filtersToShow.filter(f => {
                return !filtersAreEqual(f, filterToRemove)
            })
              await url.replaceFilter(filterToRemove, null)
        },
        clear() {
            url.setFilters(this.entityType, [])
            this.snackbar("All filters cleared")
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
            }
        },
        'resultsFilters': {
            immediate: true,
            handler: function (to, from) {
                this.filtersToShow = to
            }
        }
    }
}
</script>

<style scoped lang="scss">

</style>