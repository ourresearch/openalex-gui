<template>
  <v-card
      class="mb-8"
      rounded
  >
    <v-toolbar
        class="align-center"
        dark
        flat
        color="#444"
    >

      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-title>
        Filters
<!--        ({{ filters.length }})-->
      </v-toolbar-title>


<!--      <v-text-field-->
<!--          v-model="searchString"-->
<!--          hide-details-->
<!--          prepend-icon="mdi-magnify"-->
<!--          clearable-->
<!--          rounded-->
<!--          dark-->
<!--          dense-->
<!--          placeholder="Search filters"-->
<!--      />-->

    </v-toolbar>

    <v-list nav expand class="pt-2">
      <template v-if="appliedFiltersMatchingSearchString.length">
        <v-subheader class="pt-3">
          Applied
          ({{ appliedFiltersMatchingSearchString.length }})
        </v-subheader>
      </template>
      <template
          v-for="(filter, i) in appliedFiltersMatchingSearchString"
      >


        <component
            :key="filter.key + $route.query.filter"
            class=""
            :is="'filter-item-' + filter.type"
            :filter-key="filter.key"
            :filter-value="filter.value"
            @edit="setActiveFilter(filter.key, filter.value, false)"
            @delete="deleteFilter(filter.key)"
        />
      </template>
      <v-divider
          v-if="appliedFiltersMatchingSearchString.length"
          class="mb-6 mt-6"
      />


      <template v-if="facetsByCategoryCount && !searchString && filters.length">
        <v-subheader class="">
          Available
          ({{ facetsByCategoryCount }})
        </v-subheader>
        <!--        <v-divider/>-->
      </template>
      <v-list-group
          v-for="category in facetsByCategory"
          :key="category.displayName"
          :value="!!searchString"
      >
        <template v-slot:activator>
          <v-list-item-icon>
            <v-icon>{{ category.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ category.displayName }}</v-list-item-title>
          </v-list-item-content>
        </template>
        <v-list-item
            v-for="filterConfig in category.filterConfigs"
            :key="category.displayName + filterConfig.key"
            class="pl-12"
            @click="setActiveFilter(filterConfig.key, null, true)"
        >
<!--          <v-list-item-icon>-->
<!--            <v-icon>{{ filterConfig.icon }}</v-icon>-->
<!--          </v-list-item-icon>-->
          <v-list-item-content>
            <v-list-item-title>
              {{ filterConfig.displayName }}
            </v-list-item-title>
            <!--            <v-list-item-subtitle :class="{'grey&#45;&#45;text': disabledKeys.includes(filterConfig.key)}">-->
            <!--              {{ filterConfig.type }}-->
            <!--            </v-list-item-subtitle>-->
          </v-list-item-content>
        </v-list-item>
      </v-list-group>


    </v-list>

    <v-dialog
        v-model="isActiveFilterDialogOpen"
        max-width="400"
    >
      <component
          class=""
          v-if="activeFilterConfig"
          :is="'filter-edit-' + activeFilterConfig.type"
          :filter-key="activeFilterKey"
          :filter-value="activeFilterValue"
          :create-mode="activeFilterCreateMode"
          @upsert="(newValue) => createOrUpdateFilter(activeFilterKey, newValue)"
          @close="setActiveFilter(null, null, null)"
      />
    </v-dialog>


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


import AddFilterDialog from "../AddFilterDialog.vue";
import {facetsByCategory, filtersList, getFacetConfig} from "@/facetConfigs";
import {api} from "@/api";


export default {
  name: "FilterList",
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

<style scoped lang="scss">

</style>