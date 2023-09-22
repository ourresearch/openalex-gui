<template>
  <div>
    <v-text-field

        prepend-inner-icon="mdi-magnify"
        hide-details
        readonly
        rounded
        outlined
        :placeholder="`Filter ${entityType}`"
        append-icon="mdi-magnify"
        full-width
        id="search-box-new-text-field"
    >
      <template v-slot:prepend-inner>
        <entity-type-selector style="margin-top: 2px;" />
      </template>
    </v-text-field>

    <component
        :is="$vuetify.breakpoint.mobile ? 'v-dialog' : 'v-menu'"
        v-model="isDialogOpen"
        fullscreen
        scrollable
        activator="#search-box-new-text-field"
        rounded
        :content-class="$vuetify.breakpoint.mobile ? 'search-box-new-dialog' : 'search-box-new-menu' "
    >
      <v-card rounded width="600">
        <v-toolbar max-height="60">
          <v-text-field
              autofocus
              rounded
              v-model="searchString"
              :placeholder="`Filter ${entityType}`"
              hide-details
              prepend-icon="mdi-magnify"
              append-outer-icon="mdi-close"
              @click:append-outer="isDialogOpen = false"
          />
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-list two-line>
            <v-list-item
              v-for="suggestion in filterSuggestions"
              :key="suggestion.id"
            >
              <v-list-item-icon>
                <v-icon>mdi-filter-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ suggestion.displayValue }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ suggestion.displayKey }} - {{ suggestion.filterKey }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>

      </v-card>

    </component>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import axios from "axios";
import {
  createSimpleFilter,
  createDisplayFilter,
  createSimpleFilterFromPid,
  createDisplayFilterFromPid
} from "@/filterConfigs";
import {entityConfigs, getEntityConfig} from "@/entityConfigs";
import {url} from "@/url";
import {getFacetConfig} from "../facetConfigs";
import EntityTypeSelector from "@/components/EntityTypeSelector.vue";

import {VMenu} from "vuetify/lib";
import {VDialog} from "vuetify/lib";

export default {
  name: "SearchBoxNew",
  components: {
    EntityTypeSelector,
    VDialog,
    VMenu,
  },
  props: {},
  data() {
    return {
      foo: 42,
      isLoading: false,
      searchString: "",
      isDialogOpen: false,

    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),

    searchFilter() {
      return createSimpleFilter(
          "works",
          "default.search",
          this.searchString,
      )
    },
    topFilterSlot() {
      return this.pidFilterSuggestion ?? this.searchFilter
    }
  },
  asyncComputed: {
    async filterSuggestions() {
      if (!this.searchString) return []
      const autocompleteUrl = url.makeAutocompleteUrl(null, this.searchString)
      const resp = await api.getUrl(autocompleteUrl)
      return resp.results.map(result => {
        let filter_key = (result.filter_key) ?
            result.filter_key :
            getEntityConfig(result.entity_type)?.filterKey

        if (filter_key === "authorships.institutions.country_code") {
          filter_key = "institutions.country_code"
        }

        return {
          ...result,
          displayValue: result.display_name,
          displayKey: getFacetConfig(this.entityType, filter_key)?.displayName,
          filterKey: filter_key,
          filterValue: result.id,
        }
      }).slice(0, 5)

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
  }
}
</script>

<style lang="scss">
  .search-box-new-menu {
    left: calc(50vw - 300px) !important;
    top: 1px !important;

  }

</style>