<template>

  <v-list-item
      color="primary"
      class="pl-3"
  >
    <div class="">
      <v-btn v-if="!isKeyEditable" icon @click="remove">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-list-item-content>
      <div class="d-flex align-center">

        <div v-if="!isKeyEditable" class="mr-4 ml-1">
          {{ keyButtonText }}
        </div>

        <v-menu v-if="isKeyEditable" max-height="90vh">
          <template v-slot:activator="{on}">
            <v-btn
                text
                rounded
                v-on="on"
            >
                    <v-icon left class="">mdi-plus</v-icon>

              <template v-if="isKeyEditable">Add</template>
              {{ keyButtonText }}
              <v-icon right>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <filter-key-selector
              @select="setMyFilterKey"
          />
        </v-menu>
        <component
            v-if="myFilterKey"
            :is="filterValueComponentName"
            :filter-key="myFilterKey"
            :filter-value="myFilterValue"
            @submit="apply"
        />

      </div>
    </v-list-item-content>


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
    isKeyEditable(){
      console.log("isKeyEditabel", this.myFilterKey)
      return this.filterKey === undefined
    },
    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.myFilterKey)
    },
    keyButtonText(){
      return (this.myFilterKey) ?
          this.myFilterConfig.displayName :
          "Filter"
    },
    filterValueComponentName() {
      return "filter-value-" + this.myFilterConfig.type
    },
    originalFilter() {
      if (!this.filterKey) return
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