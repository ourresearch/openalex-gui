<template>

  <v-list-item
      color="primary"
  >
    <v-list-item-content >
      <div class="d-flex">
        <filter-key
            :readonly="keyReadonly"
            :filter-key="myFilterKey"
            @change="setMyFilterKey"
        />
        <filter-value
            :filter-key="myFilterKey"
            :value="value"
            :display-value="displayValue"
        />

      </div>
    </v-list-item-content>


  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../../url";
import {createSimpleFilter} from "@/filterConfigs";
import FilterKey from "@/components/Filters/FilterKey.vue";
import FilterValue from "@/components/Filters/FilterValue.vue";
import filterKey from "@/components/Filters/FilterKey.vue";


export default {
  name: "AppliedFiltersFilter",
  components: {
    FilterKey,
    FilterValue,
  },
  props: {
    keyReadonly: Boolean,
    filterKey: String,
    valueReadonly: Boolean,
    value: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
      "facetZoom",
    ]),
    myDisplayValue() {
      if (this.filter.valuesToShow === "boolean") {
        const booleanInt = (this.filter.value === "true") ? 1 : 0;
        console.log("this.filter.isBoolean", this.filter, booleanInt)
        return this.filter.booleanValues[booleanInt]
      }
      return this.filter.displayValue
    },
    dynamicAttribute() {
      return (this.filter.noOptions) ? null : "click"
    },
    isNegated() {
      return this.filter.isNegated
    },
    myTextColor() {
      return "green darken-3"
      return (this.filter.isNegated) ? "red darken-2" : "green darken-3"
    },
    myColor() {
      return "green lighten-5"
      return (this.filter.isNegated) ? "red lighten-5" : "green lighten-5"
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setFiltersZoom",
      "setFacetZoom",
    ]),
    ...mapActions([]),
    setMyFilterKey(newKey){
      this.myFilterKey = newKey
    },
    remove() {
      const newFilters = this.resultsFilters.filter(f => f.asStr !== this.filter.asStr)
      url.setFilters(
          this.entityType,
          newFilters
      )
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

    toggleFacetZoom() {
      this.setFacetZoom((this.facetZoom === this.filter.key) ? false : this.filter.key)
    }


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