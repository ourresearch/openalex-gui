<template>

  <v-card-text class="pa-0" style="flex-grow: 99999; overflow-y: auto">
    <v-list expand style="">
      <template
          v-for="category in facetsByCategory"
          color="#444"
      >
        <v-subheader :key="'subheader' + category.displayName">
          {{ category.displayName }}
        </v-subheader>
        <v-list-item
            class=""
            v-for="filterConfig in category.filterConfigs"
            :key="category.displayName + filterConfig.key"
            @click="setActiveFilterKey(filterConfig.key)"
        >
          <v-list-item-icon>
            <v-icon>{{ filterConfig.icon }}</v-icon>

          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
                v-if="getAppliedFilter(filterConfig.key)"
                class="font-weight-bold primary--text"
            >
              {{ filterConfig.displayName }}: {{ getAppliedFilter(filterConfig.key).value }}
              <!--                  <span-->
              <!--                      class="body-2 font-weight-bold"-->
              <!--                    v-if="appliedFilters.map(f => f.key).includes(filterConfig.key)"-->
              <!--                  >(applied)</span>-->
            </v-list-item-title>
            <v-list-item-title v-else>
              {{ filterConfig.displayName }}

            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

      </template>
    </v-list>
    <v-dialog
        v-model="isFilterDialogOpen"
        :fullscreen="$vuetify.breakpoint.mobile"
        max-width="500"
    >
      <component
          class=""
          v-if="activeFilterConfig"
          :key="'first-card'"
          :is="'filter-edit-' + activeFilterConfig.type"
          :filter-key="activeFilterKey"
          :filter-value="activeFilterValue"
          :createMode="activeFilterValue === undefined"
          @create="(newValue) => createFilter(activeFilterKey, newValue)"
          @update="(newValue) => updateFilter(activeFilterKey, newValue)"
          @delete="deleteFilter(activeFilterKey)"

          @close="setActiveFilterKey(null)"
      />

    </v-dialog>
  </v-card-text>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import FilterKeySelector from "./FilterKeySelector.vue";
import {facetsByCategory, getFacetConfig} from "../../facetConfigs";

import FilterEditRange from "../FilterEdit/FilterEditRange.vue";
import FilterEditSearch from "../FilterEdit/FilterEditSearch.vue";
import FilterEditBoolean from "../FilterEdit/FilterEditBoolean.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";
import {url} from "../../url";

export default {
  name: "Template",
  components: {
    FilterEditRange,
    FilterEditSearch,
    FilterEditBoolean,
    FilterEditSelect,
  },
  props: {
    appliedFilters: Array,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      selectedKey: "",
      activeFilterKey: "",
      tab: 0,
      isFilterDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),

    facetsByCategory() {
      return facetsByCategory(this.entityType, "")
    },
    activeFilterConfig() {
      if (!this.activeFilterKey) return
      return getFacetConfig(this.entityType, this.activeFilterKey)
    },
    activeFilterValue() {
      return this.appliedFilters.find(f => f.key === this.activeFilterKey)?.value
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clickBackButton() {
      if (this.activeFilterKey) {
        this.activeFilterKey = null
      } else {
        this.$emit("close")
      }
    },
    setActiveFilterKey(filterKey) {
      this.activeFilterKey = filterKey
      this.tab = filterKey ? 1 : 0
    },
    getAppliedFilter(filterKey) {
      return this.appliedFilters.find(f => f.key === filterKey)
    },


    createFilter(key, value) {
      url.createFilter(this.entityType, key, value)
      this.$emit("close")
    },
    updateFilter(filterKey, newValue) {
      url.updateFilter(this.entityType, filterKey, newValue)
      this.$emit("close")
    },
    deleteFilter(key) {
      url.deleteFilter(this.entityType, key)
      this.$emit("close")
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    activeFilterKey(to,from){
      this.isFilterDialogOpen = !!to
    },
  }
}
</script>

<style scoped lang="scss">

</style>