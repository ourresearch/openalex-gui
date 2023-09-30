<template>
  <v-card
      class="mb-8"
      rounded
  >
    <v-toolbar
        class="align-center"
        flat

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

    <v-list  expand class="pt-2">
<!--      <template v-if="appliedFiltersMatchingSearchString.length">-->
<!--        <v-subheader class="pt-3">-->
<!--          Applied-->
<!--          ({{ appliedFiltersMatchingSearchString.length }})-->
<!--        </v-subheader>-->
<!--      </template>-->
<!--      <template-->
<!--          v-for="(filter, i) in appliedFiltersMatchingSearchString"-->
<!--      >-->


<!--        <component-->
<!--            :key="filter.key + $route.query.filter"-->
<!--            class=""-->
<!--            :is="'filter-item-' + filter.type"-->
<!--            :filter-key="filter.key"-->
<!--            :filter-value="filter.value"-->
<!--            @edit="setActiveFilter(filter.key, filter.value, false)"-->
<!--            @delete="deleteFilter(filter.key)"-->
<!--        />-->
<!--      </template>-->
<!--      <v-divider-->
<!--          v-if="appliedFiltersMatchingSearchString.length"-->
<!--          class="mb-6 mt-6"-->
<!--      />-->


<!--      <template v-if="facetsByCategoryCount && !searchString && filters.length">-->
<!--        <v-subheader class="">-->
<!--          Available-->
<!--          ({{ facetsByCategoryCount }})-->
<!--        </v-subheader>-->
<!--        &lt;!&ndash;        <v-divider/>&ndash;&gt;-->
<!--      </template>-->
      <template
          v-for="category in facetsByCategory"
      >
        <v-subheader :key="category.displayName + 'subheader'">{{ category.displayName }}</v-subheader>

        <v-list-item
            v-for="filterConfig in category.filterConfigs"
            :key="category.displayName + filterConfig.key"
            @click="setActiveFilter(filterConfig.key, null, true)"
        >
          <v-list-item-icon>
            <v-icon>{{ filterConfig.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
                v-if="getAppliedFilter(filterConfig.key)"
                class="font-weight-bold primary--text"
            >
              <template v-if="filterConfig.type === 'boolean'">
                {{ filterConfig.displayName }}: true
              </template>

              <template v-else-if="filterConfig.type === 'select'">
                {{ filterConfig.displayName }}:
                <filter-select-value-as-string
                    :filter-value="getAppliedFilter(filterConfig.key).value"
                    :filter-key="filterConfig.key"
                />
              </template>

              <template v-else-if="filterConfig.type === 'search'">
                {{ filterConfig.displayName }}: "{{ getAppliedFilter(filterConfig.key).value }}"
              </template>
              <template v-else-if="filterConfig.type === 'range'">
                {{ filterConfig.displayName }}: {{ getAppliedFilter(filterConfig.key).value }}
              </template>
              <template v-else >
                {{ filterConfig.displayName }}: {{ getAppliedFilter(filterConfig.key).value }}
              </template>

              <!--                  <span-->
              <!--                      class="body-2 font-weight-bold"-->
              <!--                    v-if="appliedFilters.map(f => f.key).includes(filterConfig.key)"-->
              <!--                  >(applied)</span>-->
            </v-list-item-title>
            <v-list-item-title v-else>
              {{ filterConfig.displayName }}

            </v-list-item-title>
            <!--            <v-list-item-subtitle :class="{'grey&#45;&#45;text': disabledKeys.includes(filterConfig.key)}">-->
            <!--              {{ filterConfig.type }}-->
            <!--            </v-list-item-subtitle>-->
          </v-list-item-content>
        </v-list-item>
      </template>


    </v-list>

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
          @create="(newValue) => createFilter(activeFilterKey, newValue)"
          @update="(newValue) => updateFilter(activeFilterKey, newValue)"
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


import AddFilterDialog from "../AddFilterDialog.vue";
import {facetsByCategory, filtersList, getFacetConfig} from "@/facetConfigs";
import {api} from "@/api";
import FilterValueChip from "../FilterEdit/FilterValueChip.vue";
import {filter} from "core-js/internals/array-iteration";

import FilterSelectValueAsString from "./FilterSelectValueAsString.vue";

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

    FilterValueChip,
    FilterSelectValueAsString,
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
          // this.includeOnlyTypes,
          // this.filters.map(f => f.key),
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
    filter,
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
    getAppliedFilter(filterKey) {
      return this.filters.find(f => f.key === filterKey)
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
    isActiveFilterDialogOpen(to, from){
      if (!to) this.setActiveFilter(null, null, null)
    }
  }
}
</script>

<style scoped lang="scss">

</style>