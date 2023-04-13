<template>
  <v-chip large close
          :text-color="'white'"

          color="green"
          @click:close="remove"
          @click="clickHandler"
          class="mr-1 mb-2 inline-flex py-1"
          style="height: unset;  border: 1px solid !important;"
          close-icon="mdi-close"
  >
<!--          style="height: unset; border-radius: 3px; border: 1px solid !important;"-->

<!--    <v-icon>{{ filter.icon }}</v-icon>-->
<!--    <span class="ml-1 mr-1 font-weight-bold">{{ filter.displayName }}: </span>-->
<!--    <span>{{ myDisplayValue | truncate(50) }}</span>-->


    <v-icon class="" style="font-size: 24px;">{{ filter.icon }}</v-icon>
    <div class="mx-3" style="line-height: .8;">
      <div class="caption">
        <span class="font-weight-bold" v-if="isNegated">NOT</span>
        {{ filter.displayName }}
      </div>
      <div class="filter-value" :class="{isNegated}">
        <span v-if="filter.valuesToShow==='search'" class="font-weight-bold">
          "{{ myDisplayValue | truncate(50) }}"
        </span>
        <span v-else>
        {{ myDisplayValue | truncate(50) }}

        </span>
      </div>
    </div>



  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "../url";

export default {
  name: "Template",
  components: {},
  props: {
    filter: Object,

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
    ]),
    myDisplayValue() {
      if (this.filter.isBoolean) {
        const booleanInt = (this.filter.value) ? 1 : 0;
        return this.filter.booleanValues[booleanInt]
      }
      return this.filter.displayValue
    },
    dynamicAttribute(){
      return (this.filter.noOptions) ? null : "click"
    },
    isNegated(){
      return this.filter.isNegated
    },
    myColor(){
      return (this.filter.isNegated) ? "red" : "green"

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
      clickHandler(){
        this.setFacetZoom(this.filter.key)
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
    //text-decoration: line-through;
  }
</style>