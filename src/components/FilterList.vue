<template>

  <v-card rounded flat class="">
    <v-toolbar flat rounded>
      <v-icon class=" mr-3">mdi-filter-outline</v-icon>
      <v-toolbar-title class="font-weight-bold">
        Filters
        <span>({{ filters.length }})</span>

        <!--          <serp-results-count :results-object="resultsObject" class="mx-1"/>-->
        <!--          <template v-if="filters.length === 0">-->
        <!--            works, with no filters applied-->
        <!--          </template>-->
        <!--          <template v-else-if="filters.length === 1">-->
        <!--            works match this <span class="font-weight-bold">1</span> filter:-->
        <!--          </template>-->
        <!--          <template v-else-if="filters.length === 2">-->
        <!--            works match both these <span class="font-weight-bold">2</span> filters:-->
        <!--          </template>-->
        <!--          <template v-else>-->
        <!--            works match all <span class="font-weight-bold">{{ filters.length }}</span>-->
        <!--            of these filters:-->
        <!--          </template>-->

      </v-toolbar-title>
      <v-spacer/>


      <v-btn :disabled="filters.length === 0" icon @click="clearEverything">
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>

      <v-btn icon @click="isCollapsed = !isCollapsed">
        <v-icon>{{ isCollapsed ? "mdi-chevron-down" : "mdi-chevron-up" }}</v-icon>
      </v-btn>
    </v-toolbar>

    <div v-if="!isCollapsed">
      <!--      <v-divider/>-->
      <div v-if="filters.length === 0" class="mx-5 my-2 grey--text">
        No filters applied
      </div>
      <table style="width: 100%;">
        <tbody>
        <component
            class=""
            style="width: 100%;"
            v-for="(filter, i) in filters"
            :key="i"
            :is="'filter-phrase-' + filter.type"
            :filter-key="filter.key"
            :index="i"
            @delete="url.deleteFilter(entityType, filter.key)"
        />


        <!--     NEW filter (it's invisible; just here to use its dialog. ) -->
        <component
            v-if="$store.state.newFilterKey"
            :key="'new' + newFilterConfig.key + $route.query.filter"
            style="display: none !important;"
            :is="'filter-phrase-' + newFilterConfig.type"
            :filter-key="newFilterConfig.key"
            is-new
            @close="setNewFilterKey(undefined)"
        />

        </tbody>
      </table>

      <v-card-actions>
        <add-filter @select="setNewFilterKey" />


        <v-chip
            v-for="filter in potentialFiltersPopular"
            :key="filter.id"
            class="ml-2"
            color="white"
            @click="setNewFilterKey(filter.key)"
        >
          <v-icon left small>{{ filter.icon }}</v-icon>
          {{ filter.displayName }}
        </v-chip>

      </v-card-actions>
    </div>


  </v-card>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

import FilterPhraseSearch from "@/components/Filter/FilterSearch.vue";
import FilterPhraseSelect from "@/components/Filter/FilterSelect.vue";
import FilterPhraseRange from "@/components/Filter/FilterRange.vue";
import FilterPhraseBoolean from "@/components/Filter/FilterBoolean.vue";
import AddFilter from "@/components/AddFilter.vue";

import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import ExportButton from "@/components/ExportButtonOld.vue";
import SearchBar from "@/components/SearchBar.vue";
import Action from "@/components/Action/Action.vue";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {clear} from "core-js/internals/task";

export default {
  name: "Template",
  components: {
    Action,
    SerpResultsCount,
    SearchBar,
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,
    AddFilter,


    ExportButton,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      searchString: "",

      url,
      dialogs: {
        moreFilters: false
      },
      autocompleteResponses: [],
      isLoading: false,
      isCollapsed: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    entityConfig() {
      return getEntityConfig(this.entityType)
    },
    potentialFilters() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes("filter"))
          .map(f => {
            return {
              ...f,
              disabled: !url.isFilterKeyAvailableToCreate(this.$route, this.entityType, f.key)
            }
          })
    },
    potentialFiltersPopular() {
      return this.potentialFilters.filter(f => f.actionsPopular?.includes("filter"))
    },



    filters() {
      return url.readFilters(this.$route)
    },
    filterKeys() {
      return this.filters.map(f => f.key)
    },
    activeFilterKey: {
      get() {
        return this.$store.state.activeFilterKey
      },
      set(to) {
        this.$store.state.activeFilterKey = to
      }
    },
    activeFilter() {
      return this.activeFilterKey
    },
    newFilterKey() {
      return this.activeFilterKey && !this.filterKeys.includes(this.activeFilterKey)
    },
    creatingNewFilter() {
      const appliedFilterKeys = this.filters.map(f => f.key)
      return this.activeFilter && !appliedFilterKeys.includes(this.activeFilter)
    },
    activeFilterConfig() {
      if (!this.activeFilterKey) return
      return getFacetConfig(this.entityType, this.activeFilterKey)
    },
    newFilterConfig() {
      if (!this.$store.state.newFilterKey) return
      return getFacetConfig(this.entityType, this.$store.state.newFilterKey)
    },
    searchFilterConfig() {
      const searchKeyName = this.entityType === "works" ?
          "default.search" :
          "display_name.search"
      return getFacetConfig(this.entityType, searchKeyName)
    },
    placeholder() {
      return (this.filters.length) ?
          "+" :
          "search"
    },
    popularFilterOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes("filter"))
      // .filter(f => !this.filterKeys.includes(f.key))
    },
    allFilterOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes("filter"))
    }
  },

  methods: {
    clear,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clearEverything() {
      this.activeFilterKey = null
      if (!this.searchString) {
        url.deleteAllFilters()
      }
      this.searchString = ""

    },
    submitTextSearch() {
      if (this.searchString) {
        url.upsertFilterOption(this.entityType, 'default.search', this.searchString)
      } else {
        if (this.$route.name !== "Serp") {
          this.$router.push({
            name: "Serp",
            params: {entityType: this.entityType}
          })
        }
      }
    },
    setNewFilterKey(filterKey) {
      this.dialogs.moreFilters = false
      this.$store.state.newFilterKey = undefined
      if (!filterKey) {
        return
      }
      const newFilterConfig = getFacetConfig(this.entityType, filterKey)

      newFilterConfig.type === "boolean" ?
          url.createFilter(this.entityType, filterKey, true) :
          this.$store.state.newFilterKey = filterKey

    },


    setActiveFilter(newFilter) {

      // take a key instead of a filter
      if (typeof newFilter === "string" && getFacetConfig(this.entityType, newFilter)) {
        newFilter = getFacetConfig(this.entityType, newFilter)
      }

      console.log("select filter", newFilter)
      this.dialogs.moreFilters = false
      if (!newFilter) {
        this.activeFilterKey = null
        return
      }
      if (newFilter.type === "boolean") {
        url.upsertFilter(this.entityType, newFilter.key, true)
      } else {

        this.activeFilterKey = newFilter.key
      }
    },
    async getAutocompleteResponses() {
      if (!this.searchString) {
        this.autocompleteResponses = []
        return
      }

      const myEntityType = (this.entityType === "works") ?
          null :
          this.entityType
      const autocompleteUrl = url.makeAutocompleteUrl(myEntityType, this.searchString)
      this.isLoading = true
      const resp = await api.getUrl(autocompleteUrl)
      this.isLoading = false


      const ret = resp.results
          .filter(r => !!r.id)
          .filter(r => r.entity_type !== "filter")
          .map(result => {
            const entityConfig = getEntityConfig(result.entity_type)
            const filterConfig = getFacetConfig(this.entityType, entityConfig.filterKey)


            return {
              ...filterConfig,
              value: result.id,
              entityType: entityConfig.name,
              isShortcut: entityConfig.name === "works",
              displayName: result.display_name,
              icon: entityConfig.icon,
            }
          })
      const everySuggestionIsAWork = ret.every(f => f.entityType === "works")
      const cleaned = ret.every(r => r.isShortcut) ?
          ret.slice(0, 3) :
          ret.filter(r => !r.isShortcut).slice(0, 5)

      this.autocompleteResponses = cleaned

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    searchString() {
      this.getAutocompleteResponses()
    },
    "dialogs.moreFilters"(to) {
      if (to) this.potentialFiltersSearchString = ""
    },
    '$route': {
      immediate: true,
      handler(to, from) {
        this.activeFilterKey = null
        this.searchString = ""
      }
    },
    '$store.state.activeFilter': {
      immediate: false,
      handler(to) {
        if (!to) return
        const inputId = "input." + to
        console.log("$store.state.activeFilter changed", inputId)
        setTimeout(() => {
          // document.getElementById(inputId).focus()

        }, 0)
      }
    }
  }
}
</script>

<style lang="scss">

.internal-search-field.v-text-field--rounded > .v-input__control > .v-input__slot {
  padding-left: 0 !important;
}

.filter {
  border-radius: 25px !important;

  &:hover {
    //background: #f4f9ff;
    //box-shadow: 5px 5px #000 !important;
  }

}

.filter-list {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    //padding: 0 !important;
  }
}

table {
  border-top: 1px solid #eee;
  border-collapse: collapse !important;
}


</style>