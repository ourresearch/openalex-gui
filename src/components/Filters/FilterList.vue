<template>
  <v-card
      class="mb-8"
      flat
  >
    <v-toolbar
        class="align-center"
        flat
        color="transparent"

    >
      <!--      <v-icon left>mdi-filter-multiple-outline</v-icon>-->

      <v-toolbar-title>
        <v-icon left>mdi-filter-outline</v-icon>
        Filters
        <span class="body-2">
                  ({{ filters.length }})
                </span>
      </v-toolbar-title>
      <v-spacer/>
      <v-btn
          icon
          @click="isAddFilterDialogVisible = true"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </v-toolbar>
    <v-list expand dense class="pt-1">
      <template
          v-for="(filter, i) in filters"
      >


        <component
            :key="filter.key + $route.query.filter"
            class=""
            :is="'filter-value-' + filter.type"
            :filter-key="filter.key"
            :filter-value="filter.value"
            @update="(newValue) => updateFilter(filter.key, newValue)"
            @delete="deleteFilter(filter.key)"
        />
      </template>


      <v-list-group
          v-for="category in facetsByCategory"
          :key="category.displayName"
      >
        <template v-slot:activator>
          <v-list-item-icon>
            <v-icon>{{ category.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ category.displayName }}</v-list-item-title>
          </v-list-item-content>
        </template>
        <v-menu>
          <template v-slot:activator="{on}">
            <v-list-item
                class="pl-12"
                v-for="filterConfig in category.filterConfigs"
                :key="category.displayName + filterConfig.key"
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
            dude
          </div>
        </v-menu>

      </v-list-group>


      <add-filter-dialog
          v-model="isAddFilterDialogVisible"
          :filters="filters"
          @close="isAddFilterDialogVisible = false"
          @select-key-value="createOrUpdateFilter"
          @create="createFilter"
          @update="updateFilter"
      />


    </v-list>
    <!--    <v-subheader>Filter options</v-subheader>-->
    <!--    <filter-key-selector-->
    <!--        dense-->
    <!--        @select="setStagedFilter"-->
    <!--    />-->

  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createSimpleFilter} from "../../filterConfigs";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";
import FilterValueBoolean from "./FilterValueBoolean.vue";
import FilterValueRange from "./FilterValueRange.vue";
import FilterValueSelect from "./FilterValueSelect.vue";
import FilterValueSearch from "./FilterValueSearch.vue";

import AddFilterDialog from "../AddFilterDialog.vue";
import {facetsByCategory, getFacetConfig} from "@/facetConfigs";


export default {
  name: "Template",
  components: {
    FilterKeySelector,
    FilterValueBoolean,
    FilterValueRange,
    FilterValueSelect,
    FilterValueSearch,
    AddFilterDialog,
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

    facetsByCategory() {
      return facetsByCategory(this.entityType, this.searchString, this.includeOnlyTypes)
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