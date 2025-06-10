<template>
  <v-card
      min-height="100"
      :min-width="minWidth"
      class="group-by rounded-o flex-grow-1"
      flat
      :loading="isLoading"
      style="width: 100%;"
  >
    <v-toolbar flat color="transparent">
      <v-icon color="grey-darken-2 mr-1">{{ filterConfig.icon }}</v-icon>
      <v-toolbar-title class="group-by-title flex-grow-1">
        <span>{{ filters.titleCase(filterConfig.displayName) }}</span>
      </v-toolbar-title>
      
      <v-spacer/>

      <v-menu location="bottom">
        <template v-slot:activator="{props}">
          <v-btn
              icon
              v-bind="props"
          >
            <v-icon color="grey-darken-2">mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item :href="csvUrl">
            <template #prepend>
              <v-icon color="grey-darken-2">mdi-tray-arrow-down</v-icon>
            </template>
            <v-list-item-title class="mr-2">Export</v-list-item-title>
            <template #append>
              <v-list-item-subtitle>.csv</v-list-item-subtitle>
            </template>
          </v-list-item>

          <v-list-item :href="apiUrl" target="_blank">
            <template #prepend>
              <v-icon color="grey-darken-2">mdi-api</v-icon>
            </template>
            <v-list-item-title class="mr-2">View in API</v-list-item-title>
            <template #append>
              <v-list-item-subtitle>.json</v-list-item-subtitle>
            </template>
          </v-list-item>

        </v-list>
      </v-menu>
      <v-btn v-if="!isEntityPage" icon @click="url.toggleGroupBy(filterKey)">
        <v-icon color="grey-darken-2">mdi-close</v-icon>
      </v-btn>

    </v-toolbar>
    <div v-if="groupsTruncated.length || selectedGroupIds.length" class="card-body">

      <div v-if="filterKey==='publication_year'" style="min-width: 200px">
        <bar-graph
            v-if="groupsTruncated.length > 1"
            :bars="groupsTruncated?.map(g => { return {key: g.value, count: g.count}})"
            style="height: 100px;"
            class="pa-2"
            @click="selectGroup"
        />
        <div v-else class="text-h4 pa-3 hover-color-1" style="cursor: pointer;" @click="isSelected = false">
          <v-icon class="mr-2 ml-1">mdi-checkbox-marked</v-icon>
          {{ groupsTruncated[0].value }}
        </div>
      </div>
      <div v-else-if="myFilterConfig.type === 'boolean'" class="">
        <v-card
            v-if="groupsTruncated.find(g => g.count > 0)"
            flat
            class="pa-2 pl-3 pb-5 d-flex align-center color-3 hover-color-2"
            @click="isSelected = !isSelected"
        >
          <v-progress-circular
              size="60"
              width="20"
              rotate="270"
              :model-value="groupsTruncated?.find(g => g.value != 0).countScaled * 100"
          />
          <div class="ml-3">
            <div class="text-h4">
              {{ filters.toPrecision(groupsTruncated?.find(g => g.value != 0).countScaled * 100, 3) }}%
            </div>
            <div class="text-body-2">
              {{ filters.toPrecision(groupsTruncated?.find(g => g.value != 0).count) }}
            </div>
          </div>
        </v-card>
      </div>

      <v-table dense class="bg-transparent" v-else style="width: 100%;">
        <tbody>
        <group-by-table-row
            v-for="row in groupsTruncated"
            :key="row.value + row.count"
            :filter-key="filterKey"
            :value="row.value"
            :display-value="row.displayValue"
            :count="row.count"
            :hide-checkbox="$route.name !== 'Serp'"
        />
        </tbody>
      </v-table>
    </div>

    <v-card-actions >
      <v-spacer/>
      <v-btn v-if="isMoreToShow" size="small" rounded variant="text" @click="isDialogOpen = true">
        More...
      </v-btn>

    </v-card-actions>

    <v-dialog
      v-model="isDialogOpen"
      :width="600"
      scrollable
    >
      <v-card rounded class="group-by-dialog">
        <v-text-field
          v-model="searchString"
          variant="default"
          density="compact"
          bg-color="white"
          prepend-inner-icon="mdi-magnify"
          hide-details
          autofocus
          :placeholder="searchStringPlaceholder"
          style=""
          class="add-filter-text-field mr-4 py-3 text-h5 font-weight-regular"
          append-icon="mdi-close"
          @click:append="clickCloseSearch"
          />
        <v-divider />
        <v-card-text class="pa-0" style="height: 80vh;">
          <filter-select-add-option
              :filter-key="filterKey"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="url.readFilters($route)"
              @close="closeDialog"
              @add="addFilter"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>


<script>

import {mapGetters, mapMutations} from "vuex";

import {api} from "@/api";
import {url} from "../../url";
import filters from "@/filters";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {filtersFromUrlStr} from "../../filterConfigs";

import BarGraph from "@/components/BarGraph.vue";
import GroupByTableRow from "@/components/GroupBy/GroupByTableRow.vue";
import FilterSelectAddOption from "@/components/Filter/FilterSelectAddOption.vue";

export default {
  name: "GroupBy",
  components: {
    BarGraph,
    GroupByTableRow,
    FilterSelectAddOption,
  },
  props: {
    filterKey: String,
    entityType: String,
    filterBy: Array,
    isEntityPage: Boolean,
  },
  data() {
    return {
      url,
      isLoading: false,
      selectedValue: this.filterValue,
      searchString: "",
      isDialogOpen: false,
      groups: [],
      maxResults: 5,
      maxResultsRange: 25,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "resultsCount",
    ]),
    isSelected: {
      get() {
        return url.isFilterApplied(this.$route, this.entityType, this.filterKey)
      },
      set(to) {
        if (to) {
          url.upsertFilter(this.entityType, this.filterKey, true)
        } else {
          url.deleteFilter(this.entityType, this.filterKey)
        }
      }
    },
    searchStringPlaceholder(){
      const pluralDisplayName = filters.pluralize(this.filterConfig.displayName, 2)
      return "Search " + pluralDisplayName
    },
    isMoreToShow() {
      return this.groups.length > this.groupsTruncated.length
    },
    minWidth() {
      return (this.myFilterConfig.type === "select") ?
          300 :
          150
    },
    filterConfig() {
      if (!this.filterKey) return
      return getFacetConfig(this.entityType, this.filterKey)
    },
    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.filterKey)
    },
    apiRequestFilters(){
      return this.filterBy?.length ?
          this.filterBy :
          filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    apiUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
            filters: this.apiRequestFilters,
          }
      )
    },
    csvUrl() {
      return url.makeGroupByUrl(
          this.entityType,
          this.filterKey,
          {
            includeEmail: false,
            formatCsv: true,
            filters: this.apiRequestFilters,
          }
      )
    },
    selectedGroups() {
      return url.readFilterOptions(this.$route, this.entityType, this.filterKey)
    },
    negatedGroupIds() {
      return url.readFilterOptionsByKey(
          this.$route,
          this.entityType,
          this.filterKey,
          true,
      )
    },
    selectedGroupIds() {
      return url.readFilterOptionsByKey(
          this.$route,
          this.entityType,
          this.filterKey,
      )
    },
    unselectedGroups() {
      return this.groups.filter(g => !this.selectedGroupIds.includes(g.value))
    },
    groupsTruncated(){
      const maxResults = (this.myFilterConfig.type === "range") ?
          this.maxResultsRange :
          this.maxResults
      return this.groups.slice(0, maxResults)
    },
  },
  methods: {
    ...mapMutations([
      "setApiDialogUrl",
    ]),
    addFilter(id){
      url.createFilter(this.entityType, this.filterKey, id)
      this.isDialogOpen = false
    },
    clickCloseSearch(){
      this.searchString ?
          this.searchString = "" :
          this.closeDialog()
    },
    closeDialog(){
      this.searchString = ""
      this.isDialogOpen = false
    },
    async getGroups() {
      if (!this.filterKey) return []
      this.isLoading = true
      const ret = await api.getGroups(
          this.entityType,
          this.filterKey,
          {
            hideUnknown: true,
            filters: this.apiRequestFilters,
          }
      )
      if (this.filterKey === "publication_year") {
        ret.sort((a, b) => {
          return (parseInt(a.value) > parseInt(b.value)) ? -1 : 1
        })
      }
      this.groups = ret
      this.isLoading = false
    },
    selectGroup(val) {
      if (this.myFilterConfig.type === "boolean") {
        url.upsertFilter(this.entityType, this.filterKey, val != 0)
      } else if (this.myFilterConfig.type === "range") {
        url.upsertFilter(this.entityType, this.filterKey, val)
      } else {
        if (url.isFilterApplied(this.$route, this.entityType, this.filterKey)) {
          url.addFilterOption(this.entityType, this.filterKey, val)
        } else {
          url.upsertFilter(this.entityType, this.filterKey, val)
        }
      }
    },
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler() {
        this.getGroups()
      },
    },
    isDialogOpen(to){
      !to && this.closeDialog()
    }
  }
}
</script>


<style scoped lang="scss">
.group-by .v-toolbar-title {
  margin-inline-start: 6px !important;
}
.group-by-title {
  flex-grow: 1;
  min-width: 120px
}
.group-by-title * {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}
</style>