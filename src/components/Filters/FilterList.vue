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
        <!--        <span class="body-2">-->
        <!--          ({{ filters.length }})-->
        <!--        </span>-->
      </v-toolbar-title>
      <v-spacer/>
      <v-btn
          fab
          color="primary lighten-1"
          small
          @click="isAddFilterDialogVisible = true"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-toolbar>
    <!--    <div v-if="!filters.length && !filterToCreate" class="grey&#45;&#45;text ml-4 pt-8">-->
    <!--      There are no filters applied.-->
    <!--    </div>-->
    <div class="pt-1">
      <!--            <v-divider />-->
      <v-subheader>Active filters</v-subheader>
      <component
          v-if="stagedFilterKey"
          key="filter-to-create"
          class="flex-grow-1 pb-2 pt-1"
          :is="'filter-value-' + stagedFilterConfig.type"
          :filter-key="stagedFilterKey"
          @update="(newValue) => createOrUpdateFilter(stagedFilterKey, newValue)"
      />
      <template
          v-for="(filter, i) in filters"
      >
        <component
            :key="filter.key + $route.query.filter"
            class="flex-grow-1 pb-2 pt-1"
            :is="'filter-value-' + filter.type"
            :filter-key="filter.key"
            :filter-value="filter.value"
            @update="(newValue) => updateFilter(filter.key, newValue)"
            @delete="deleteFilter(filter.key)"
        />
        <v-divider :key="filter.key + 'divider'" />
      </template>



      <add-filter-dialog
          v-model="isAddFilterDialogVisible"
          :filters="filters"
          @close="isAddFilterDialogVisible = false"
          @select-key-value="createOrUpdateFilter"
          @create="createFilter"
          @update="updateFilter"
      />

      <!--      <v-divider v-if="!!filterToCreate"></v-divider>-->
    </div>
    <v-subheader>Filter options</v-subheader>
    <filter-key-selector
        dense
        @select="setStagedFilter"
    />

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
import {getFacetConfig} from "@/facetConfigs";



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
    stagedFilterConfig(){
      if (!this.stagedFilterKey) return
      return getFacetConfig(this.entityType, this.stagedFilterKey)
    }
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
    setStagedFilter(key){
      this.stagedFilterKey = key
    },
    createFilter(key, value) {
      this.isAddFilterDialogVisible = false
      url.createFilter(this.entityType, key, value)
      // this.filterToCreate = null
    },
    createOrUpdateFilter(key, value){
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
      handler(to,from){
        this.stagedFilterKey = null
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>