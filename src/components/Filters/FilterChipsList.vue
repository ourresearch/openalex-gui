<template>
  <v-card
      class="mb-2"
      flat
      color="transparent"

  >

    <v-chip
        color="primary"
        label
        class="mr-2 mb-2"
        dark
    >
      <v-icon left>mdi-filter</v-icon>
      {{ appliedFiltersMatchingSearchString.length }}
    </v-chip>

    <component
        v-for="(filter, i) in appliedFiltersMatchingSearchString"
        :key="filter.key + $route.query.filter"
        class="mr-2 mb-2"
        :is="'filter-chip-' + filter.type"
        :filter-key="filter.key"
        :filter-value="filter.value"
        @edit="setActiveFilter(filter.key, filter.value, false)"
        @delete="deleteFilter(filter.key)"
    />

    <!--      <v-list-group-->
    <!--          v-for="category in facetsByCategory"-->
    <!--          :key="category.displayName"-->
    <!--          :value="!!searchString"-->
    <!--      >-->
    <!--        <template v-slot:activator>-->
    <!--          <v-list-item-icon>-->
    <!--            <v-icon>{{ category.icon }}</v-icon>-->
    <!--          </v-list-item-icon>-->
    <!--          <v-list-item-content>-->
    <!--            <v-list-item-title>{{ category.displayName }}</v-list-item-title>-->
    <!--          </v-list-item-content>-->
    <!--        </template>-->
    <!--        <v-list-item-->
    <!--            v-for="filterConfig in category.filterConfigs"-->
    <!--            :key="category.displayName + filterConfig.key"-->
    <!--            class="pl-12"-->
    <!--            @click="setActiveFilter(filterConfig.key, null, true)"-->
    <!--        >-->
    <!--          <v-list-item-content>-->
    <!--            <v-list-item-title>-->
    <!--              {{ filterConfig.displayName }}-->
    <!--            </v-list-item-title>-->
    <!--          </v-list-item-content>-->
    <!--        </v-list-item>-->
    <!--      </v-list-group>-->


    <v-dialog
        v-model="isActiveFilterDialogOpen"
        max-width="400"
        scrollable
    >
      <component
          class=""
          v-if="activeFilterConfig"
          :key="activeFilterKey + $route.query.filter"
          :is="'filter-edit-' + activeFilterConfig.type"
          :filter-key="activeFilterKey"
          :filter-value="activeFilterValue"
          :create-mode="activeFilterCreateMode"
          @upsert="(newValue) => createOrUpdateFilter(activeFilterKey, newValue)"
          @delete="deleteFilter(activeFilterKey)"
          @close="isActiveFilterDialogOpen = false"
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

import FilterChipBoolean from "../FilterChip/FilterChipBoolean.vue";
import FilterChipEntity from "../FilterChip/FilterChipEntity.vue";
import FilterChipRange from "../FilterChip/FilterChipRange.vue";
import FilterChipSearch from "../FilterChip/FilterChipSearch.vue";
import FilterChipSelect from "../FilterChip/FilterChipSelect.vue";


import AddFilterDialog from "../AddFilterDialog.vue";
import {facetsByCategory, filtersList, getFacetConfig} from "@/facetConfigs";
import {api} from "@/api";


export default {
  name: "FilterList",
  components: {
    FilterKeySelector,
    FilterChipBoolean,
    FilterChipEntity,
    FilterChipRange,
    FilterChipSearch,
    FilterChipSelect,


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
      this.setActiveFilter(null, null, null)
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
    isActiveFilterDialogOpen(to, from) {
      if (!to) this.setActiveFilter(null, null, null)
    }
  }
}
</script>

<style scoped lang="scss">

</style>