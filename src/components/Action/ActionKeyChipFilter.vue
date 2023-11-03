<template>
  <!--          <v-subheader>Selected</v-subheader>-->
  <v-list-item
      :value="config.key"
      :disabled="isDisabled"
      @click="click"
  >
    <v-list-item-icon>
      <v-icon>{{ config.icon }}</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title
          v-if="isSelected"
          class="font-weight-bold primary--text"
      >
        <template v-if="config.type === 'boolean'">
          {{ config.displayName }}:
          {{ filterValue }}
        </template>

        <template v-else-if="config.type === 'select'">
          {{ config.displayName }}
          <filter-select-value-as-string
              :filter-value="filterValue"
              :filter-key="filterKey"
              count
          />
        </template>

        <template v-else-if="config.type === 'search'">
          {{ config.displayName }}: "{{ filterValue }}"
        </template>
        <template v-else-if="config.type === 'range'">
          {{ config.displayName }}: {{ filterValue }}
        </template>
        <template v-else>
          {{ config.displayName }}: {{ filterValue }}
        </template>

        <!--                  <span-->
        <!--                      class="body-2 font-weight-bold"-->
        <!--                    v-if="appliedFilters.map(f => f.key).includes(config.key)"-->
        <!--                  >(applied)</span>-->
      </v-list-item-title>
      <v-list-item-title v-else>
        {{ config.displayName }}

      </v-list-item-title>
    </v-list-item-content>
    <v-list-item-action v-if="isSelected">
      <v-btn icon @click.stop="url.deleteFilter(entityType, filterKey)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-list-item-action>
    <v-dialog
        v-model="isActiveFilterDialogOpen"
        max-width="400"
        :fullscreen="$vuetify.breakpoint.mobile"
        scrollable
    >
      <component
          class=""
          :key="filterKey + $route.query.filter"
          :is="'filter-edit-' + config.type"
          :filter-key="filterKey"
          :filter-value="filterValue"
          @close="isActiveFilterDialogOpen = false"
          @upsert="(newValue) => url.upsertFilter(entityType, filterKey, newValue)"
          @delete="deleteFilter(filterKey)"
      />
    </v-dialog>
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import FilterSelectValueAsString from "@/components/Filters/FilterSelectValueAsString.vue";
import {filtersFromUrlStr} from "@/filterConfigs";
import FilterList from "@/components/Filters/FilterList.vue";


import FilterEditRange from "../FilterEdit/FilterEditRange.vue";
import FilterEditSearch from "../FilterEdit/FilterEditSearch.vue";
import FilterEditBoolean from "../FilterEdit/FilterEditBoolean.vue";
import FilterEditSelect from "../FilterEdit/FilterEditSelect.vue";

export default {
  name: "Template",
  components: {
    FilterList,
    FilterSelectValueAsString,

    FilterEditRange,
    FilterEditSearch,
    FilterEditBoolean,
    FilterEditSelect,
  },
  props: {
    action: String,
    actionKey: String,
    isDisabled: Boolean,
  },
  data() {
    return {
      foo: 42,
      url,
      isActiveFilterDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersFromUrlStr(this.entityType, this.$route.query.filter)
    },
    config() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    filterKey() {
      return this.actionKey
    },
    filterValue() {
      const myFilterObj = filtersFromUrlStr(this.entityType, this.$route.query.filter).find(f => {
        return f.key === this.filterKey
      })
      return myFilterObj?.value
    },
    isSelected() {
      return this.filterValue !== undefined
    }

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    getAppliedFilter(filterKey) {
      return this.filters.find(f => f.key === filterKey)
    },
    click() {
      console.log("click");
      (this.config.type === "boolean") ?
          url.upsertFilter(this.entityType, this.filterKey, true) :
          this.isActiveFilterDialogOpen = true
    },
    deleteFilter(key) {
      this.isActiveFilterDialogOpen = false
      console.log("ActionKeyListItemFilter deleteFilter", key)
      this.searchString = ""
      url.deleteFilter(this.entityType, key)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>