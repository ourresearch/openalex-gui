<template>
  <v-card rounded flat outlined class="ma-3 filter-list">
    <v-toolbar flat>
      <v-toolbar-title>
        <span class="font-weight-bold">{{ url.readFiltersLength() }}</span>
        Filters
      </v-toolbar-title>
      <v-spacer/>

      <v-btn
          v-if="url.readFiltersLength()"
          icon
          @click="clearEverything"
      >
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider/>

    <div>
      <component
          v-for="(filter, i) in filters"
          :key="filter.key + $route.query.filter"
          class="d-block pa-2"
          :is="'filter-phrase-' + filter.type"
          :filter-key="filter.key"
          :is-active="filter.key === activeFilterKey"
          @submit="focusOnSearchBox"
      />
    </div>


    <v-card
        style="position: absolute; width: 100%;"
        v-if="searchString.length"
    >
      <filter-bar-suggestions
          :search-string="searchString"
          @submit="searchString = ''"
      />
    </v-card>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import FilterBarSearch from "@/components/FilterBar/FilterBarSearch.vue";
import FilterBarSuggestions from "@/components/FilterBar/FilterBarSuggestions.vue";

import FilterPhraseSearch from "@/components/Filter/FilterSearch.vue";
import FilterPhraseSelect from "@/components/Filter/FilterSelect.vue";
import FilterPhraseRange from "@/components/Filter/FilterRange.vue";
import FilterPhraseBoolean from "@/components/Filter/FilterBoolean.vue";

import NewFilter from "@/components/NewFilter/NewFilter.vue";

import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,

    FilterBarSearch,
    FilterBarSuggestions,

    NewFilter,
  },
  props: {},
  data() {
    return {
      foo: 42,
      searchString: "",
      url,
      activeFilterKey: null,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    activeFilter() {
      return this.$store.state.activeFilter
    },
    creatingNewFilter() {
      const appliedFilterKeys = this.filters.map(f => f.key)
      return this.activeFilter && !appliedFilterKeys.includes(this.activeFilter)
    },
    activeFilterConfig() {
      if (!this.$store.state.activeFilter) return
      return getFacetConfig(this.entityType, this.$store.state.activeFilter)
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
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    upsertFilter(newValue) {
      url.upsertFilter(this.entityType, this.activeFilterKey, newValue)
      if (this.activeFilterConfig.type !== "select") {
        this.setActiveFilter(null, null, null)
      }
    },
    focusOnSearchBox() {
      setTimeout(() => {
        // this.$refs.facetBarSearchBox.focus()
      }, 1)
    },
    deleteFilter(key) {
      this.isActiveFilterDialogOpen = false
      console.log("FilterList deleteFilter", key)
      this.searchString = ""
      url.deleteFilter(this.entityType, key)
      this.setActiveFilter(null, null, null)
    },
    onEnter() {
      if (!this.searchString) {
        this.$router.push({name: "Serp", params: {entityType: this.entityType}})
      } else {
        url.upsertFilter(
            this.entityType,
            "default.search",
            this.searchString
        )
      }
      this.searchString = ""
    },
    onDelete() {
      if (this.searchString) return
      // const lastFilterKey = this.filters.at(-1)?.key
      // if (!lastFilterKey) return
      //
      // console.log("delete", lastFilterKey)
      // this.setActiveFilter(lastFilterKey)
    },
    async setActiveFilter(filterKey) {
      this.$store.state.activeFilter = filterKey
    },
    clearEverything() {
      this.$store.state.activeFilter = null
      this.searchString = ""
      url.deleteAllFilters()

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
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
.filter-list {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    //padding: 0 !important;
  }

  .filter {
    font-size: 20px;

    &:hover {
      background: #fafafa;
    }

  }
}


</style>