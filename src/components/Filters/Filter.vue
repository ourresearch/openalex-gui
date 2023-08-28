<template>

  <v-list-item
      color="primary"
  >

    <v-list-item-content>
      <div class="d-flex">
        <filter-key
            :key-readonly="keyReadonly"
            :filter-key="myFilterKey"
            @input="setMyFilterKey"

        />
        <component
            :is="filterValueComponentName"
            :filter-key="myFilterKey"
            :filter-value="filterValue"
            :display-value="displayValue"
            @input="setMyFilterValue"
            @submit="apply"
        />

      </div>
    </v-list-item-content>
    <div>
        <v-btn icon @click="remove">
          <v-icon>mdi-delete-outline</v-icon>
        </v-btn>
    </div>


  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../../url";
import {createSimpleFilter} from "@/filterConfigs";
import {facetConfigs} from "../../facetConfigs";
import FilterKey from "@/components/Filters/FilterKey.vue";
import FilterValue from "@/components/Filters/FilterValue.vue";

import FilterValueBoolean from "./FilterValueBoolean.vue";
import FilterValueRange from "./FilterValueRange.vue";
import FilterValueSelect from "./FilterValueSelect.vue";
import FilterValueSearch from "./FilterValueSearch.vue";


import filterKey from "@/components/Filters/FilterKey.vue";


export default {
  name: "AppliedFiltersFilter",
  components: {
    FilterKey,
    FilterValue,
    FilterValueBoolean,
    FilterValueRange,
    FilterValueSelect,
    FilterValueSearch,
  },
  props: {
    keyReadonly: Boolean,
    filterKey: String,
    isNegated: Boolean,
    valueReadonly: Boolean,
    filterValue: String,
    displayValue: String,
    isEditing: Boolean,
  },
  data() {
    return {
      foo: 42,
      myFilterKey: this.filterKey,
      myFilterValue: this.filterValue,
      myIsNegated: this.isNegated,
      myIsEditing: this.isEditing
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "facetZoom",
    ]),
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.myFilterKey)
    },
    filterValueComponentName() {
      return "filter-value-" + this.myFilterConfig.type
    },
    originalFilter() {
      return createSimpleFilter(
          this.entityType,
          this.filterKey,
          this.filterValue,
          this.isNegated
      )
    },
    newFilter() {
      return createSimpleFilter(
          this.entityType,
          this.myFilterKey,
          this.myFilterValue,
          this.myIsNegated
      )
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setFiltersZoom",
      "setFacetZoom",
    ]),
    ...mapActions([]),
    async apply() {
      await url.replaceFilter(this.originalFilter, this.newFilter)
    },
    async remove() {
      await url.replaceFilter(this.originalFilter, null)
    },

    setMyFilterKey(newKey) {
      this.myFilterKey = newKey
    },
    setMyFilterValue(newValue) {
      console.log("setMyFilterValue", newValue)
      this.myFilterValue = newValue
    },
    toggleNegation() {
      const newFilter = createSimpleFilter(
          this.filter.entityType,
          this.filter.key,
          this.filter.value,
          !this.isNegated
      )

      const newFiltersList = this.resultsFilters.filter(f => f.kv !== this.filter.kv)
      newFiltersList.push(newFilter)
      url.setFilters(
          this.entityType,
          newFiltersList
      )
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">
.filter-value.isNegated {
  text-decoration: line-through;
}
</style>