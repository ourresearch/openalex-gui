<template>
  <v-card
      :rounded="!$vuetify.breakpoint.mobile"
      :loading="isLoading"
  >
    <v-toolbar flat class="color-2" extension-height="60">
      <v-btn icon @click="$emit('close')">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="pl-0">
        {{ filterConfig.displayName }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <filter-match-mode
          :filter-key="filterKey"
          v-if="selectedGroups?.length > 1"
          icon
      />
      <filter-select-menu :filter-key="filterKey"/>


      <template v-slot:extension>
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
      <v-simple-table
      >
        <tbody>
        <group-by-table-row
                v-for="id in negatedGroupIds"
                :key="'negated-id-' + id"

                :filter-key="filterKey"
                :value="id"
            />
        <group-by-table-row
            v-for="row in rows"
            :key="row.value"

            :filter-key="filterKey"
            :value="row.value"
            :display-value="row.displayValue"
            :count="row.count"

            @click="clickRow"
        />
        </tbody>

      </v-simple-table>
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

export default {
  name: "Template",
  components: {
    filterMatchMode,
    GroupByTableRow,
    FilterSelectMenu,
  },
  props: {
    filterKey: String,
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
    autocompleteResponsesInGroupFormat() {
      return this.autocompleteResponses.map(r => {
        return {
          key: r.filter_key,
          displayValue: r.display_name,
          value: r.id,
          count: null,
        }
      })
    },
    filteredGroups() {
      return this.groups.filter(group => {
        return group.displayValue.toLowerCase().includes(this.searchString.toLowerCase())
      })
    },
    isMoreRows() {
      return this.groups?.length >= 195
    },
    rows() {
      return (this.autocompleteResponses.length) ?
          this.autocompleteResponsesInGroupFormat :
          this.filteredGroups
    },

    selectedGroups(){
      return url.readFilterOptions(this.$route, this.entityType, this.filterKey)
    },
    negatedGroupIds(){
      return this.selectedGroups.filter(val => {
           return val.indexOf("!") === 0
         })
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickRow() {
      this.$emit("close")

    },
    async getGroups() {
      if (!this.filterKey) return []
      this.isLoading = true
      const filters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
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
    async getAutocompleteResponses() {
      this.isLoading = true
      const autocompleteResponses = await api.getAutocompleteResponses(
          this.entityType,
          this.filterKey,
          this.searchString,
      )
      this.autocompleteResponses = autocompleteResponses
      this.isLoading = false
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.getGroups()
      }
    },
    searchString(to, from) {
      this.isMoreRows && this.getAutocompleteResponses()
    }
  }
}
</script>

<style scoped lang="scss">

</style>