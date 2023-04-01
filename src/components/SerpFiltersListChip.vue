<template>
  <v-chip large close color="#fff"
          @[(enableClick)&&`click`]="setFiltersZoom(filter.key)"
          @click:close="remove"
          class="mr-1 mb-2 inline-flex py-1"
          style="height: unset; border-radius: 3px; border: 1px solid #ddd"
  >

<!--    <v-icon>{{ filter.icon }}</v-icon>-->
<!--    <span class="ml-1 mr-1 font-weight-bold">{{ filter.displayName }}: </span>-->
<!--    <span>{{ myDisplayValue | truncate(50) }}</span>-->


    <v-icon class="" style="font-size: 24px;">{{ filter.icon }}</v-icon>
    <div class="mx-3">
      <div class="caption">{{ filter.displayName }}</div>
      <div>{{ myDisplayValue | truncate(50) }}</div>
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
        const booleanInt = (this.filter.value) ? 1 : 0
        return this.filter.booleanValues[booleanInt]
      }
      return this.filter.displayValue
    },
    enableClick() {
      return (!this.filter.isBoolean && !this.filter.noOptions)
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
      "setFiltersZoom",
    ]),
    ...mapActions([]),
    remove() {
      const newFilters = this.resultsFilters.filter(f => f.asStr !== this.filter.asStr)
      console.log("remove! new filters: ", newFilters)
      url.setFilters(
          this.entityType,
          newFilters
      )

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

</style>