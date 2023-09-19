<template>
  <v-card
      class="mb-8"
      flat
  >
    <v-toolbar
        class="align-center"
        flat
        color="transparent"
        extended

    >
      <!--      <v-icon left>mdi-filter-multiple-outline</v-icon>-->

      <v-toolbar-title>
        <v-icon left>mdi-filter-outline</v-icon>
        Filters
        <!--        <span class="grey&#45;&#45;text">-->
        <!--        ({{ filters.length }})-->
        <!--        </span>-->
      </v-toolbar-title>
      <v-spacer/>
      <template v-slot:extension>
        <v-text-field
            v-model="searchString"
            outlined
            hide-details
            dense
            prepend-inner-icon="mdi-magnify"
            clearable
        />
      </template>
    </v-toolbar>
    <v-list expand dense class="pt-1">
      <template v-if="filters.length">
        <v-subheader>
          Applied filters
          ({{ appliedFiltersMatchingSearchString.length }})
        </v-subheader>
        <v-divider/>
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
            @update="(newValue) => updateFilter(filter.key, newValue)"
            @delete="deleteFilter(filter.key)"
        />
      </template>


      <template v-if="filterOptionsCount">
        <v-subheader>
          Filter options
          ({{ filterOptionsCount }})
        </v-subheader>
        <v-divider/>
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
        <v-menu
            v-for="filterConfig in category.filterConfigs"
            :key="category.displayName + filterConfig.key"
            offset-x
            :close-on-content-click="false"
        >
          <template v-slot:activator="{on}">
            <v-list-item
                class="pl-12"
                v-on="on"
            >
              <v-list-item-icon>
                <v-icon>{{ filterConfig.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ filterConfig.displayName }}
                </v-list-item-title>
                <!--            <v-list-item-subtitle :class="{'grey&#45;&#45;text': disabledKeys.includes(filterConfig.key)}">-->
                <!--              {{ filterConfig.type }}-->
                <!--            </v-list-item-subtitle>-->
              </v-list-item-content>
            </v-list-item>
          </template>
          <div>
            <component
                :key="filterConfig.key + $route.query.filter"
                class=""
                :is="'filter-edit-' + filterConfig.type"
                :filter-key="filterConfig.key"
                @update="(newValue) => createFilter(filterConfig.key, newValue)"
            />
          </div>
        </v-menu>
      </v-list-group>

      <template v-if="filterShortcuts.length">
        <v-subheader>
          Filter options + values
          ({{ filterShortcuts.length }})
        </v-subheader>
        <v-divider/>
      </template>
      <v-list-item
          v-for="shortcut in filterShortcuts"
          :key="shortcut.id + 'shortcut'"
          @click="createFilter(getShortCutFilterKey(shortcut), shortcut.id)"
      >
        <v-list-item-icon>
          <v-icon>
            {{ getEntityConfig(shortcut.entity_type).icon }}
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ shortcut.display_name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-capitalize">
            {{ shortcut.entity_type }} -
            <span class="font-weight-regular">{{ shortcut.works_count | toPrecision }} works</span>
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon>mdi-filter-plus-outline</v-icon>
        </v-list-item-action>
      </v-list-item>


    </v-list>

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
  name: "Template",
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
      filterToCreate: null,
      stagedFilterKey: null,
      fabIsVisible: false,
      isFilterKeySelectorVisible: false,
      isAddFilterDialogVisible: false,

      searchString: "",
      getEntityConfig,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    stagedFilterConfig() {
      if (!this.stagedFilterKey) return
      return getFacetConfig(this.entityType, this.stagedFilterKey)
    },
    filterOptionsCount() {
      return filtersList(this.entityType).length - this.filters.length
    },
    facetsByCategory() {
      return facetsByCategory(this.entityType, this.searchString, this.includeOnlyTypes)
    },
    appliedFiltersMatchingSearchString() {
      return this.filters.filter(f => {
        if (!this.searchString) return true
        return f.displayName.toLowerCase().match(this.searchString.toLowerCase())
      })
    },
  },
  asyncComputed: {
    async filterShortcuts() {
      if (!this.searchString) return []
      const autocompleteUrl = url.makeAutocompleteUrl(null, this.searchString)
      const resp = await api.getUrl(autocompleteUrl)
      return resp.results.filter(f => !!f.entity_type)

    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setFilterToCreate(filterKey) {
      const filterToCreate = createSimpleFilter(this.entityType, filterKey)
      if (filterToCreate.type === "boolean") {
        this.$emit("create", filterKey, filterToCreate.value)
      } else {
        this.filterToCreate = filterToCreate
      }
    },
    // hack because shortcut objects (from autocomplete) that are entities
    // have Null filter_key
    getShortCutFilterKey(shortcut){
      if (shortcut.filter_key) return shortcut.filter_key
      return getEntityConfig(shortcut.entity_type)?.filterKey


    },
    setStagedFilter(key) {
      this.stagedFilterKey = key
    },
    createFilter(key, value) {
      this.isAddFilterDialogVisible = false
      url.createFilter(this.entityType, key, value)
      // this.filterToCreate = null
    },
    createOrUpdateFilter(key, value) {
      const existingFilter = url.readFilter(this.entityType, key);
      console.log("createOrUpdateFilter existing filter", existingFilter);
      (existingFilter) ?
          this.updateFilter(key, value) :
          this.createFilter(key, value)
    },
    deleteFilter(key) {
      console.log("FilterList deleteFilter", key)
      url.deleteFilter(this.entityType, key)
      // this.filterToCreate = null
    },
    updateFilter(filterKey, newValue) {
      console.log("updateFilter", filterKey, newValue)
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
    this.fabIsVisible = true
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.stagedFilterKey = null
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>