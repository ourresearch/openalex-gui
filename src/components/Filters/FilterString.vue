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

    <div class="pa-6 text-h5 font-weight-regular" style="line-height: 1.7">
      Showing
      <a @click="$vuetify.goTo('#serp-toolbar', {offset: -70})" class="results-count ">
        {{ resultsCount | toPrecision}}
      </a>
      <entity-type-selector inline />
      where
      <span v-if="!filters.length">...</span>


      <template
          v-for="(filter, i) in filters"
      >


        <component
            :key="filter.key + $route.query.filter"
            class=""
            :append-separator="i < filters.length-1"
            :is="'filter-item-' + filter.type"
            :filter-key="filter.key"
            :filter-value="filter.value"
            @update="(newValue) => updateFilter(filter.key, newValue)"
            @delete="deleteFilter(filter.key)"
        />
      </template>


      <div class="d-inline-flex align-baseline">
        <div class="mr-3">and </div>

        <v-menu
            :close-on-content-click="false"
            v-model="isFilterKeySelectMenuOpen"
            max-width="350"
        >
          <template v-slot:activator="{on}">
            <v-text-field
                v-if="activeFilterConfig"
                v-on="on"
                readonly
                v-model="activeFilterConfig.displayName"
                class="text-h5"
                hide-details
                style="max-width: 300px;"
            />
            <v-text-field
                v-else
                placeholder="Select filter"
                v-on="on"
                readonly
                class="text-h5"
                hide-details
                style="max-width: 300px;"
            />

          </template>
          <v-card>
            <div class="pa-4 pb-0">
              <v-text-field
                v-model="searchString"
                prepend-inner-icon="mdi-magnify"
                autofocus

              />

            </div>
            <v-list style="max-height: 60vh; overflow-y:scroll;">
              <v-list-item-group
                  v-model="activeFilterKey"
              >
                <v-list-item
                  v-for="(filter, i) in popularFilters"
                  :key="filter.key"
                  :value="filter.key"
                >
                  <v-list-item-icon><v-icon>{{ filter.icon }}</v-icon></v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ filter.displayName }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

              </v-list-item-group>
              <v-divider />
              <v-list-item
                key="view-all-filters"
                @click="isAllFiltersDialogOpen = true"
              >
                <v-list-item-icon></v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>More filters...</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>

        <div class="px-3">is</div>

         <v-text-field
                v-if="activeFilterConfig"
                v-on="on"
                readonly
                v-model="activeFilterConfig.displayName"
                class="text-h5"
                hide-details
                style="max-width: 300px;"
            />
            <v-text-field
                v-else
                placeholder="Select filter"
                v-on="on"
                readonly
                class="text-h5"
                hide-details
                style="max-width: 300px;"
            />
      </div>


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

      isFilterKeySelectMenuOpen: false,
      isAllFiltersDialogOpen: false,


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
    popularFilters(){
      return filtersList(this.entityType).filter(f => f.categories.includes("popular"))
    },
    searchResultFilters(){
      return filtersList(this.entityType, this.searchString)

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
    },
    activeFilterKey(to, from){
      this.isFilterKeySelectMenuOpen = false
    },
    isAllFiltersDialogOpen(to, from){
      this.isFilterKeySelectMenuOpen = false
    }
  }
}
</script>

<style  lang="scss">
  .v-application .filter-string-card a {
    color: #333 !important;
    &:hover {
      color: #1976d2 !important;
    }
  }
</style>