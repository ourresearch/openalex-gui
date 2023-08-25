<template>

    <v-list-item large close
                 :disabled="disabled"
                 color="primary"
    >
      <v-list-item-content>
        <div  class="d-flex align-center">
        <v-btn icon @click="remove">
        <v-icon>mdi-close</v-icon>

        </v-btn>


          <div class="">
            <span class="font-weight-bold" v-if="isNegated">NOT</span>
            {{ filter.displayName }}:
          </div>
          <div class="font-weight-bold ml-2">
            {{ myDisplayValue | truncate(200) }}
          </div>

        </div>

      </v-list-item-content>



    </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../../url";
import {createSimpleFilter} from "@/filterConfigs";

export default {
    name: "AppliedFiltersFilter",
    components: {},
    props: {
        filter: Object,
        disabled: Boolean,

    },
    data() {
        return {
            foo: 42,
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