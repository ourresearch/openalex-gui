<template>
  <v-card
      tile
      flat
      :loading="isLoading"
  >
    <v-list class="mt-0 pt-0">
      <v-subheader>
        <template v-if="isLoading">
          Searching...
        </template>
        <template v-else-if="searchString && suggestions.length">
          Top search results ({{ suggestions.length }})
        </template>
        <template v-else-if="searchString && !suggestions.length">
          No results found
        </template>
        <template v-else>
          {{ hasAutocomplete ? "Top" : "All" }}
          {{ entityConfig?.name  }}
          ({{ suggestions.length }})
        </template>
      </v-subheader>

      <filter-select-edit-row
          v-for="row in suggestions"
          :key="row.value + row.count"

          :filter-key="filterKey"
          :filter-index="filterIndex"
          :value="row.value"
          :display-value="row.displayValue"
          :count="row.count"
          :hint="row.hint"
          :is-from-autocomplete="row.isFromAutocomplete"
      />
    </v-list>
  </v-card>
</template>

<script>

import _ from "lodash"
import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {url} from "@/url";
import {getFacetConfig} from "@/facetConfigs";
import {getEntityConfig} from "@/entityConfigs";
import FilterSelectEditRow from "@/components/Filter/FilterSelectEditRow.vue";


export default {
  name: "FilterSelectAddOption",
  components: {
    FilterSelectEditRow,
  },
  props: {
    filterKey: String,
    filterIndex: Number,
    isOpen: Boolean,
    searchString: String,
    filters: Array,
  },
  data() {
    return {
      suggestions: [],
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    filterConfig() {
      const ret = getFacetConfig(this.entityType, this.filterKey)
      // console.log("FilterSelectAddOption filterConfig()", this.entityType, this.filterKey, ret)
      return ret
    },
    searchPlaceholder() {
      const pluralValue = this.$pluralize(this.filterConfig.displayName, 2)
      return "Search " + pluralValue
    },
    hasAutocomplete() {
      return this.entityConfig?.hasAutocomplete
    },
    entityConfig() {
      return getEntityConfig(this.filterConfig.entityId)
    }
  },

  methods: {
    clickRow(value) {
      this.$emit("close")
      url.upsertFilterOption(this.entityType, this.filterKey, value)

    },
    getSuggestions: _.debounce(async function () {
      this.isLoading = true
      this.suggestions = await api.getSuggestions(
          this.entityType,
          this.filterKey,
          this.searchString,
          this.filters ?? []
      )
      this.isLoading = false
    }, 300, {leading: true})
  },
  watch: {
    "$route": {
      handler(to, from) {
        this.$emit("close")
      }
    },
    searchString(to, from) {
      this.suggestions = []
      this.isLoading = true
      this.getSuggestions()
    },
    isOpen: {
      immediate: true,
      handler(to, from) {
        this.getSuggestions()
      }
    }
  }
}
</script>


<style scoped lang="scss">

</style>