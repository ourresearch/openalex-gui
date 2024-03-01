<template>
  <v-card
      :rounded="!$vuetify.breakpoint.mobile"
      :loading="isLoading"
  >
    <v-toolbar flat class="color-2" extension-height="60">
      <v-toolbar-title class="pl-0">
        Add {{ filterConfig.displayName }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <!--      <filter-select-menu :filter-key="filterKey"/>-->
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>


      <template v-slot:extension v-if="hasAutocomplete">
        <v-text-field
            v-model="searchString"
            filled
            rounded
            background-color="white"
            class="mx-2 mb-3"
            hide-details
            autofocus
            clearable
        />
      </template>
    </v-toolbar>
    <v-card-text class="body-1 pa-0">
      <!--      <v-card> {{ autocompleteResponses }}</v-card>-->
      <v-list>
        <template v-if="searchString">
          <v-subheader v-if="isLoading">
            Searching...
          </v-subheader>
          <v-subheader v-else-if="autocompleteResponses.length">
            Top search results ({{ autocompleteResponses.length }})
          </v-subheader>
          <v-subheader v-else>
            No results found
          </v-subheader>
          <filter-select-edit-row
              v-for="row in autocompleteResponses"
              :key="row.value"

              :filter-key="filterKey"
              :value="row.value"
              :display-value="row.displayValue"
              :hint="row.hint"
              is-from-autocomplete
          />
        </template>
        <template v-else>
          <v-subheader>
            {{ hasAutocomplete ? "Top" : "All" }}
            {{ entityConfig?.name | pluralize(2) }}
            ({{ groups.length }})
          </v-subheader>
          <filter-select-edit-row
              v-for="row in groups"
              :key="row.value + row.count"

              :filter-key="filterKey"
              :value="row.value"
              :display-value="row.displayValue"
              :count="row.count"
          />

        </template>
        <!--            @add="(id) => {$emit('add', id)}"-->


      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {filtersFromUrlStr} from "@/filterConfigs";
import {api} from "@/api";
import GroupByTableRow from "@/components/GroupBy/GroupByTableRow.vue";
import FilterSelectMenu from "@/components/Filter/FilterSelectMenu.vue";
import {url} from "@/url";
import filterMatchMode from "@/components/Filter/FilterMatchMode.vue";
import FilterSelectEditRow from "@/components/Filter/FilterSelectEditRow.vue";
import {entityConfigs, getEntityConfig} from "@/entityConfigs";

import _ from "lodash"


export default {
  name: "Template",
  components: {
    filterMatchMode,
    GroupByTableRow,
    FilterSelectMenu,
    FilterSelectEditRow,
  },
  props: {
    filterKey: String,
    filterIndex: Number,
    isOpen: Boolean,
  },
  data() {
    return {
      foo: 42,
      groups: [],
      autocompleteResponses: [],
      isLoading: false,
      searchString: "",
    }

  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    isNewFilter() {
      return this.filterIndex === undefined
      // const filtersCount = url.readFilters(this.$route)?.length ?? 0
      // return this.filterIndex + 1 > filtersCount
    },
    autocompleteResponsesInGroupFormat() {
      return this.autocompleteResponses.map(r => {
        return {
          key: r.filter_key,
          displayValue: r.display_name,
          value: r.id,
          count: null,
          hint: r.hint,
        }
      })
    },
    filteredGroups() {
      const lowerCaseSearchString = this.searchString?.toLowerCase() ?? ""
      return this.groups
          .filter(group => group.displayValue)
          .filter(group => {
            return group.displayValue?.toLowerCase()?.includes(lowerCaseSearchString)
          })
    },

    selectedGroups() {
      return url.readFilterOptions(this.$route, this.entityType, this.filterKey)
    },
    negatedGroupIds() {
      return this.selectedGroups.filter(val => {
        return val.indexOf("!") === 0
      })
    },
    hasAutocomplete() {
      return this.entityConfig?.hasAutocomplete
    },
    entityConfig() {
      return getEntityConfig(this.filterConfig.entityId)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickRow(value) {
      this.$emit("close")
      url.upsertFilterOption(this.entityType, this.filterKey, value)

    },
    async getGroups() {
      console.log("FilterSelectAddOption getGroups()")
      if (!this.filterKey) return []
      this.isLoading = true
      const filters = this.isNewFilter ?
          url.readFilters(this.$route) :
          [];

      const ret = await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            hideUnknown: true,
            filters,
            searchString: this.searchString
          }
      )
      if (this.filterKey === "publication_year") {
        console.log("group by year")
        ret.sort((a, b) => {
          return (a.value > b.value) ? -1 : 1
        })
      }
      this.groups = ret
      this.isLoading = false

    },
    getAutocompleteResponses: _.debounce(async function () {
      this.isLoading = true
      const autocompleteResponses = await api.getAutocompleteResponses(
          this.entityType,
          this.filterKey,
          this.searchString,
      )
      this.autocompleteResponses = autocompleteResponses
          .map(r => {
            return {
              key: r.filter_key,
              displayValue: r.display_name,
              value: r.id,
              count: null,
              hint: r.hint,
            }
          })
          .slice(0, 5)

      this.isLoading = false
    }, 300),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.searchString = ""
        this.getGroups()
      }
    },
    searchString(to, from) {
      this.autocompleteResponses = []
      this.isLoading = true
      this.hasAutocomplete && this.getAutocompleteResponses()
    },
    isOpen: {
      immediate: true,
      handler(to, from) {
        this.searchString = ""
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>