<template>
  <v-card flat class="">
    <!--    <v-chip-->
    <!--        @click="isFilterSelectorOpen = true"-->
    <!--        class="mr-2 mb-2"-->
    <!--        color="primary"-->
    <!--        label-->
    <!--    >-->
    <!--      <v-icon left>mdi-filter</v-icon>-->
    <!--      <span v-if="appliedFilters.length > 0">{{ appliedFilters.length }}</span>-->
    <!--      <span v-else>Create filter</span>-->
    <!--    </v-chip>-->
<!--    <v-icon class="pr-3">mdi-filter-outline</v-icon>-->

    <component
        v-for="(filter, i) in filters"
        :key="filter.key + $route.query.filter"
        class="mr-2 mb-2"
        :is="'filter-chip-' + filter.type"
        :filter-key="filter.key"
        :filter-value="filter.value"
        @edit="setActiveFilter(filter.key, filter.value, false)"
        @delete="deleteFilter(filter.key)"
    />

    <v-chip
      v-for="filter in unselectedChips"
      :key="`unselected-chip-${filter.key}`"
      outlined
      color="primary"
      text-color="primary"
      class="mr-2 mb-2"
      @click="selectChip(filter.key)"
    >
      {{filter.displayName}}
    </v-chip>

    <v-btn
      text
      rounded
      color="primary"
      class="mr-2 mb-2"
      @click="isAllFiltersDialogOpen = true"
    >
      More&hellip;
    </v-btn>



    <v-dialog
        v-model="isActiveFilterDialogOpen"
        max-width="400"
        :fullscreen="$vuetify.breakpoint.mobile"
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
          @upsert="(newValue) => url.upsertFilter(entityType, activeFilterKey, newValue)"
          @delete="deleteFilter(activeFilterKey)"
          @close="isActiveFilterDialogOpen = false"
      />
    </v-dialog>

    <v-dialog
      v-model="isAllFiltersDialogOpen"
      max-width="400"
        :fullscreen="$vuetify.breakpoint.mobile"
        scrollable
    >
      <filter-list
        @select="setActiveFilter"
      />
    </v-dialog>


  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createSimpleFilter, filtersFromUrlStr} from "../../filterConfigs";
import {getEntityConfig} from "@/entityConfigs";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";
import FilterList from "./FilterList.vue";

import FilterEditRange from "../FilterEdit/FilterEditRange.vue";
import FilterEditSearch from "../FilterEdit/FilterEditSearch.vue";
import FilterEditBoolean from "../FilterEdit/FilterEditBoolean.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";

import FilterChipBoolean from "../FilterChip/FilterChipBoolean.vue";
import FilterChipRange from "../FilterChip/FilterChipRange.vue";
import FilterChipSearch from "../FilterChip/FilterChipSearch.vue";
import FilterChipSelect from "../FilterChip/FilterChipSelect.vue";


import {facetsByCategory, filtersList, getFacetConfig} from "@/facetConfigs";
import {api} from "@/api";
import {facetConfigs} from "../../facetConfigs";


export default {
  name: "FilterChipsList",
  components: {
    FilterList,

    FilterKeySelector,
    FilterChipBoolean,
    FilterChipRange,
    FilterChipSearch,
    FilterChipSelect,


    FilterEditRange,
    FilterEditSearch,
    FilterEditBoolean,
    FilterEditSelect,

  },
  props: {},
  data() {
    return {
      foo: 42,
      activeFilterKey: null,
      activeFilterValue: null,
      activeFilterCreateMode: false,
      isActiveFilterDialogOpen: false,

      isAllFiltersDialogOpen: false,

      getEntityConfig,
      url,



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
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    unselectedChips() {
      return facetConfigs(this.entityType)
          .filter(config => {
            return true
            return config.categories.includes("popular")
          })
          .filter(config => {
            const appliedKeys = this.filters.map(f => f.key)
            return !appliedKeys.includes(config.key)
          })
    }

  },


  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setActiveFilter(key, value, createMode) {
      this.isAllFiltersDialogOpen = false
      this.activeFilterKey = key
      this.activeFilterValue = value
      this.activeFilterCreateMode = createMode
      this.isActiveFilterDialogOpen = !!key
    },
    deleteFilter(key) {
      this.isActiveFilterDialogOpen = false
      console.log("FilterList deleteFilter", key)
      this.searchString = ""
      url.deleteFilter(this.entityType, key)
      this.setActiveFilter(null, null, null)
    },
    selectChip(filterKey){
      const config = getFacetConfig(this.entityType, filterKey)
      if (config.type === "boolean") {
        console.log("do boolean things", filterKey)
        url.upsertFilter(this.entityType, filterKey, true)
      }
      else {
        this.setActiveFilter(filterKey)
      }
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {

        // this.isActiveFilterDialogOpen = true
        // this.activeFilterKey = null
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