<template>
  <v-card
      flat
      class=""
  >
    <v-toolbar flat>
      <entity-type-selector/>
      <div class="grey--text">
        {{ resultsFilters.length }} {{ 'filters' | pluralize(resultsFilters.length) }} applied
        <span>(clear all)</span>
      </div>
      <v-spacer/>
      <!--      <v-btn icon><v-icon>mdi-delete-circle-outline</v-icon></v-btn>-->

      <v-menu
          max-height="90vh"
      >
        <template v-slot:activator="{on}">
          <v-btn
              text
              rounded
              v-on="on"
          >
            <v-icon>mdi-pin-outline</v-icon>
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-card max-height="90vh">
          <v-text-field
              v-model="addWidgetSearchString"
              autofocus
              clearable
              hide-details
          />
          <div style="overflow-y: scroll; max-height: calc(90vh - 120px)">
            <v-list>
              <v-list-item
                  v-for="filter in filterOptions"
                  :key="filter.key"
                  @click="$emit('add-widget', filter.key)"
              >
                {{ filter.displayName }}
              </v-list-item>
            </v-list>

          </div>

        </v-card>

      </v-menu>
      <v-btn
          icon
          target="_blank"
          @click="copyToClipboard('https://alpha.openalex.org' + $route.fullPath)"
      >
        <v-icon>mdi-share-variant-outline</v-icon>
      </v-btn>


    </v-toolbar>
    <v-list dense class="">
      <o-filter
          v-for="(filter, i) in resultsFilters"
          :key="filter.key + filter.value"

          :key-readonly="true"
          :filter-key="filter.key"
          :filter-value="filter.value"
          :display-value="filter.displayValue"
          :is-negated="filter.isNegated"
      />
      <o-filter
          v-if="!resultsFilters.length"
          :key="'new-filter' + $route.fullPath"
          :filter-key="defaultFilterKey"
          is-editing
      />
    </v-list>
    <v-btn
        rounded
        color="primary"
    >
      <v-icon>mdi-filter-plus-outline</v-icon>
    </v-btn>
  </v-card>


</template>

<script>
import {sleep} from "../util";
import {mapActions, mapGetters, mapMutations} from "vuex";

// change name to "o-filter" because "filter" is a native HTML element name.
import OFilter from "./Filters/Filter.vue";
import {url} from "../url";
import {createSimpleFilter} from "@/filterConfigs";
import {facetConfigs, filtersList} from "../facetConfigs";
import EntityTypeSelector from "./EntityTypeSelector.vue";

export default {
  name: "AppliedFilters",
  components: {
    OFilter,
    EntityTypeSelector,
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
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("URL copied to clipboard.")
    },
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