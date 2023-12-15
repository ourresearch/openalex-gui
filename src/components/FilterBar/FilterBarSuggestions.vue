<template>
  <div class="filter-bar-suggestions">
    <div
        v-for="suggestion in suggestionsToShow"
        :key="suggestion.key + suggestion.value"
        @click="createOrUpdateFilter(suggestion.key, suggestion.value)"
        class="pa-2 suggestion"
    >
      <v-icon left>{{ suggestion.icon }}</v-icon>
      <span class="">
        <template v-if="suggestion.type === 'boolean'">
          the work is
        </template>
        <template v-else>
          {{ suggestion.displayKey }} is
        </template>

      </span>
      <span class="font-weight-bold">
              {{ suggestion.displayValue }}
          </span>
    </div>


    <template v-if="searchString.length >= 3">
      <v-divider class=""/>
      <div
          class="pa-2 pt-3 suggestion d-flex"
          key="fulltext-search-filter"
          @click="createOrUpdateFilter(searchFilterConfig.key, searchString)"
      >
        <v-icon left>mdi-magnify</v-icon>
        <span class="mr-1">
          {{ searchFilterConfig.displayName }}
        </span>
        <q>{{ searchString }}</q>
        <v-spacer/>
        <v-chip small label outlined class="grey--text body-2" style="">
          ⏎ enter
        </v-chip>
      </div>

    </template>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";
import {shortenOpenAlexId} from "@/util";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    searchString: String,
  },
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

    searchFilterConfig() {
      const searchKeyName = this.entityType === "works" ?
          "default.search" :
          "display_name.search"
      return getFacetConfig(this.entityType, searchKeyName)
    },

    searchFilter() {
      return createSimpleFilter(
          "works",
          "default.search",
          this.searchString,
      )
    },

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
          if (filterKey === "locations.source.id") {
            filterKey = "primary_location.source.id"
          }
          if (filterKey === "locations.source.host_organization") {
            filterKey = "primary_location.source.publisher_lineage"
          }
        } else {
          filterKey = "ids.openalex"
        }

        const myConfig = getFacetConfig(this.entityType, filterKey)
        let displayValue
        if (myConfig.type === "boolean") {
          const prepend = result.id ? "" : "NOT "
          displayValue = prepend + myConfig.displayName
        } else if (myConfig.type === "range") {
          displayValue = result.id
        } else {
          displayValue = result.display_name
        }

        return {
          ...result,
          displayValue,
          displayKey: myConfig?.displayName,
          type: myConfig.type,
          key: filterKey,
          icon: myConfig.icon,
          value: shortenOpenAlexId(result.id),
          isShortcut: result.entity_type && this.$pluralize(result.entity_type, 1) === this.$pluralize(this.entityType, 1)
        }
      })
    },
    async suggestionsToShow() {
      if (!this.autocompleteSuggestions) return []

      if (this.isEverySugggestionShortcut) {
        return this.autocompleteSuggestions.slice(0, 3)
      } else {
        return this.autocompleteSuggestions.filter(f => {
          return !f.isShortcut
        }).slice(0, 5)
      }

    },
    async isEverySugggestionShortcut() {
      if (!this.autocompleteSuggestions) return []
      return this.autocompleteSuggestions.every(f => f.isShortcut)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    createOrUpdateFilter(key, value) {
      const existingFilter = url.readFilter(this.entityType, key);
      console.log("SearchBoxNew createOrUpdateFilter()", this.entityType, key, value, existingFilter);
      this.$emit("submit")

      return (existingFilter) ?
          url.updateFilter(this.entityType, key, value) :
          url.createFilter(this.entityType, key, value)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">
.filter-bar-suggestions {
  .suggestion {
    cursor: default;

    &:hover {
      background: #fafafa;
    }
  }
}

</style>