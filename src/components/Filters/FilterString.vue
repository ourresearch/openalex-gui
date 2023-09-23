<template>
  <v-card
      rounded
      class="filter-string-card mb-8"
  >
    <v-toolbar
        class="align-center d-none"
        dark
        flat
        color="#444"
    >

      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-title>
        Filters
        <!--        ({{ filters.length }})-->
      </v-toolbar-title>

    </v-toolbar>

    <div class="pa-6 text-h6 font-weight-regular">
      <span class="results-count font-weight-bold">
        {{ resultsCount | toPrecision}}
      </span>
      <entity-type-selector inline />
      <span v-if="filters.length">where</span>


      <template
          v-for="(filter, i) in filters"
      >
        <span
            :key="filter.key + $route.query.filter"
        >
          {{ filter.key }}: {{ filter.value}}
        <span
            :key="`semicolon-${i}`"
            style="margin-left:-5px;"
            v-if="i < filters.length-1"
        >; </span>
        </span>



<!--        <component-->
<!--            :key="filter.key + $route.query.filter"-->
<!--            class=""-->
<!--            :is="'filter-item-' + filter.type"-->
<!--            :filter-key="filter.key"-->
<!--            :filter-value="filter.value"-->
<!--            @edit="setActiveFilter(filter.key, filter.value, false)"-->
<!--            @delete="deleteFilter(filter.key)"-->
<!--        />-->
      </template>



    </div>

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createSimpleFilter} from "../../filterConfigs";
import {getEntityConfig} from "@/entityConfigs";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";

import FilterItemBoolean from "../FilterItem/FilterItemBoolean.vue";
import FilterItemRange from "../FilterItem/FilterItemRange.vue";
import FilterItemSelect from "../FilterItem/FilterItemSelect.vue";
import FilterItemSearch from "../FilterItem/FilterItemSearch.vue";

import FilterEditRange from "../FilterEdit/FilterEditRange.vue";
import FilterEditSearch from "../FilterEdit/FilterEditSearch.vue";
import FilterEditBoolean from "../FilterEdit/FilterEditBoolean.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";


import EntityTypeSelector from "@/components/EntityTypeSelector.vue";
import AddFilterDialog from "../AddFilterDialog.vue";
import {facetsByCategory, filtersList, getFacetConfig} from "@/facetConfigs";
import {api} from "@/api";


export default {
  name: "FilterString",
  components: {
    FilterKeySelector,
    FilterItemBoolean,
    FilterItemRange,
    FilterItemSelect,
    FilterItemSearch,
    AddFilterDialog,

    FilterEditRange,
    FilterEditSearch,
    FilterEditBoolean,
    FilterEditSelect,

    EntityTypeSelector,
  },
  props: {
    filters: Array,
  },
  data() {
    return {
      foo: 42,
      activeFilterKey: null,
      activeFilterValue: null,
      activeFilterCreateMode: false,
      isActiveFilterDialogOpen: false,


      searchString: "",
      getEntityConfig,

    }
  },
  computed: {
    ...mapGetters([
      "entityType",
        "resultsCount",
    ]),
    activeFilterConfig() {
      if (!this.activeFilterKey) return
      return getFacetConfig(this.entityType, this.activeFilterKey)
    },
    facetsByCategory() {
      return facetsByCategory(
          this.entityType,
          this.searchString,
          this.includeOnlyTypes,
          this.filters.map(f => f.key),
      )
    },
    facetsByCategoryCount() {
      let sum = 0
      this.facetsByCategory.forEach(category => {
        sum += category.filterConfigs.length
      })
      return sum
    },

    appliedFiltersMatchingSearchString() {
      return this.filters.filter(f => {
        if (!this.searchString) return true
        return f.displayName.toLowerCase().match(this.searchString.toLowerCase())
      })
    },
  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setActiveFilter(key, value, createMode) {
      this.activeFilterKey = key
      this.activeFilterValue = value
      this.activeFilterCreateMode = createMode
      this.isActiveFilterDialogOpen = !!key
    },
    createFilter(key, value) {
      this.searchString = ""
      console.log("FilterList createFilter existing filter", key, value);
      url.createFilter(this.entityType, key, value)
    },
    createOrUpdateFilter(key, value) {
      this.searchString = ""
      const existingFilter = url.readFilter(this.entityType, key);
      console.log("FilterList createOrUpdateFilter", key, value, existingFilter);
      (existingFilter) ?
          this.updateFilter(key, value) :
          this.createFilter(key, value)
      this.setActiveFilter(null, null, null)
    },
    deleteFilter(key) {
      console.log("FilterList deleteFilter", key)
      this.searchString = ""
      url.deleteFilter(this.entityType, key)
    },
    updateFilter(filterKey, newValue) {
      console.log("updateFilter", filterKey, newValue)
      this.searchString = ""
      if (newValue === "" || newValue === "-") {
        url.deleteFilter(this.entityType, filterKey)
      } else {
        url.updateFilter(this.entityType, filterKey, newValue)
      }
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.activeFilterKey = null
      }
    }
  }
}
</script>

<style  lang="scss">
  .v-application .filter-string-card a {
    color: #333 !important;
    font-weight: bold;
    &:hover {
      color: #1976d2 !important;
    }
  }
</style>