<template>

  <v-list-item
      color="primary"
  >
    <v-list-item-icon>
      <v-icon>mdi-filter-outline</v-icon>
    </v-list-item-icon>

    <v-list-item-content>
      <div class="d-flex">
        <v-menu>
        <template v-slot:activator="{on}">
          <v-btn
              text
              rounded
              v-on="on"
          >
            {{ (myIsNegated) ? "Not" : "And" }}
            <v-icon right>mdi-menu-down</v-icon>
          </v-btn>
        </template>
          <v-list>
            <v-list-item @click="setIsNegated(false)">
              <v-list-item-icon>
                <v-icon>mdi-plus</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                And
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="setIsNegated(true)">
              <v-list-item-icon>
                <v-icon>mdi-close</v-icon>
              </v-list-item-icon>
              <v-list-item-title>
                Not
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

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
    async apply(newValue) {
      this.myFilterValue = newValue
      await url.replaceFilter(this.originalFilter, this.newFilter)
    },
    async remove() {
      await url.replaceFilter(this.originalFilter, null)
    },
    async setIsNegated(newValue){
      this.myIsNegated = !!newValue
      await url.replaceFilter(this.originalFilter, this.newFilter)


      // await url.negateFilter(this.myFilterKey, this.myFilterValue)
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