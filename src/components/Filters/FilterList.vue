<template>
  <v-card
      class="mb-8"
      flat
  >
    <v-toolbar
        class="align-center"
        flat
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
      <v-tooltip bottom>
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon>
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
        <div>Clear all filters</div>
      </v-tooltip>
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
        <v-divider/>
      </template>
      <component
          v-if="!!filterToCreate"
          key="filter-to-create"
          class="flex-grow-1 pb-2 pt-1"
          :is="'filter-value-' + filterToCreate.type"
          :filter-key="filterToCreate.key"
          :filter-value="filterToCreate.value"
          @update="createFilter"
      />


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
      fabIsVisible: false,
      isFilterKeySelectorVisible: false,
      isAddFilterDialogVisible: false,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
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
        url.deleteFilter(filterKey)
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
  watch: {}
}
</script>

<style scoped lang="scss">

</style>