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
        <entity-type-selector style="margin-top: 2px;"/>
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
        <div class="px-4 pb-0">
          <v-text-field
              autofocus
              full-width
              rounded
              v-model="searchString"
              :placeholder="`Filter ${entityType}`"
              hide-details
              prepend-icon="mdi-magnify"
              append-outer-icon="mdi-close"
              @click:append-outer="isDialogOpen = false"
          />
        </div>
        <v-divider/>
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item
                v-for="suggestion in shortcutSuggestions"
                :key="suggestion.key + suggestion.value"
                :to="{name: 'EntityPage', params: {entityType, entityId: suggestion.value}}"
            >
              <v-list-item-icon>
                <v-icon>{{myEntityIcon}}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ suggestion.displayValue }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span class="">
                   {{ suggestion.hint }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-divider v-if="shortcutSuggestions && shortcutSuggestions.length"/>


            <v-list-item
                v-for="suggestion in filterSuggestions"
                :key="suggestion.key + suggestion.value"
                @click="createOrUpdateFilter(suggestion.key, suggestion.value)"
            >
              <v-list-item-icon>
                <v-icon>mdi-filter-plus-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ suggestion.displayValue }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  <span class="">
                    {{ suggestion.displayKey }}
                  </span>
                  filter - {{ suggestion.works_count | toPrecision }} works
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <template v-if="searchString.length >= 3">
              <v-divider/>
              <v-list-item
                  key="fulltext-search-filter"
                  @click="createOrUpdateFilter(searchFilterConfig.key, searchString)"
              >
                <v-list-item-icon>
                  <v-icon>mdi-magnify</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    <q>{{ searchString }}</q>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <span class="">
                      {{ searchFilterConfig.displayName }}
                    </span>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

            </template>


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
import {shortenOpenAlexId} from "../util";

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
    myEntityIcon(){
      return getEntityConfig(this.entityType)?.icon
    },
    topFilterSlot() {
      return this.pidFilterSuggestion ?? this.searchFilter
    },
    searchFilterConfig(){
      const searchKeyName = this.entityType === "works" ?
          "default.search" :
          "display_name.search"
        return getFacetConfig(this.entityType, searchKeyName)
    }
  },
  asyncComputed: {
    async autocompleteSuggestions() {
      if (!this.searchString) return []
      const myEntityType = (this.entityType === "works") ?
          null :
          this.entityType
      const autocompleteUrl = url.makeAutocompleteUrl(myEntityType, this.searchString)
      const resp = await api.getUrl(autocompleteUrl)

      // there are a bunch of hacks in this part...casey will fix some of this soon
      return resp.results.map(result => {
        let filterKey
        if (this.entityType === "works") {
          filterKey = (result.filter_key) ?
              result.filter_key :
              getEntityConfig(result.entity_type)?.filterKey

          if (filterKey === "authorships.institutions.country_code") {
            filterKey = "institutions.country_code"
          }
        }
        else {
          filterKey = "ids.openalex"
        }

        return {
          ...result,
          displayValue: result.display_name,
          displayKey: getFacetConfig(this.entityType, filterKey)?.displayName,
          key: filterKey,
          value: shortenOpenAlexId(result.id),
          isShortcut: result.entity_type && this.$pluralize(result.entity_type, 1) === this.$pluralize(this.entityType, 1)
        }
      })
    },
    async shortcutSuggestions() {
      return  this.autocompleteSuggestions.filter(f => f.isShortcut).slice(0, 3)
    },
    async filterSuggestions() {
      return  this.autocompleteSuggestions.filter(f => !f.isShortcut).slice(0,5)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "openFacetsDialog",
    ]),
    ...mapActions([]),
    createOrUpdateFilter(key, value) {
      this.searchString = ""
      const existingFilter = url.readFilter(this.entityType, key);
      console.log("SearchBoxNew createOrUpdateFilter()", key, value, existingFilter);
      this.isDialogOpen = false

      return (existingFilter) ?
          url.updateFilter(this.entityType, key, value) :
          url.createFilter(this.entityType, key, value)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isDialogOpen(to, from) {
      this.searchString = ""
    }
  }
}
</script>

<style lang="scss">
.search-box-new-menu {
  left: calc(50vw - 300px) !important;
  top: 0 !important;

}

</style>