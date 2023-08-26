<template>

  <v-list-item
          color="primary"
  >

    <v-list-item-content>
      <div class="d-flex">
        <filter-key
                :readonly="keyReadonly"
                :filter-key="myFilterKey"
                @change="setMyFilterKey"
        />
        <component
                :is="filterValueComponentName"
                :filter-key="myFilterKey"
                :value="value"
                :display-value="displayValue"
                @change="setMyFilterValue"
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
        isNegated() {
            return this.filter.isNegated
        },
        myFilterConfig(){
            return facetConfigs().find(c => c.key === this.myFilterKey)
        },
        filterValueComponentName(){
          return "filter-value-" + this.myFilterConfig.type
        },
    },

    methods: {
        ...mapMutations([
            "snackbar",
            "setFiltersZoom",
            "setFacetZoom",
        ]),
        ...mapActions([]),
        setMyFilterKey(newKey) {
            this.myFilterKey = newKey
        },
        setMyFilterValue(newValue) {
            console.log("setMyFilterValue", newValue)
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