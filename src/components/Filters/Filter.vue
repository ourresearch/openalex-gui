<template>

  <v-list-item
      color="primary"
  >
    <div class="pa-2">
      <v-icon>mdi-filter-outline</v-icon>
    </div>

    <v-list-item-content>
      <div class="d-flex align-center">


        <v-menu max-height="90vh">
          <template v-slot:activator="{on}">
            <v-btn
                text
                rounded
                v-on="on"
            >
              {{ myFilterConfig.displayName }}
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <filter-key-selector
              @select="setMyFilterKey"
          />
        </v-menu>
        <component
            :is="filterValueComponentName"
            :filter-key="myFilterKey"
            :filter-value="filterValue"
            :display-value="displayValue"
            @submit="apply"
        />

      </div>
    </v-list-item-content>
    <div>
      <v-btn v-if="keyReadonly" icon @click="remove">
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
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";


export default {
  name: "AppliedFiltersFilter",
  components: {
    FilterKey,
    FilterKeySelector,
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
      return facetConfigs(this.entityType).find(c => c.key === this.myFilterKey)
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
    async apply(newValue, isNegated) {
      this.myFilterValue = newValue
      this.myIsNegated = isNegated
      await url.replaceFilter(this.originalFilter, this.newFilter)
    },
    async remove() {
      await url.replaceFilter(this.originalFilter, null)
    },

    setMyFilterKey(newKey) {
      this.myFilterKey = newKey
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