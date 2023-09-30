<template>
  <v-chip
      @click="$emit('edit')"
      close
      color="primary"
      close-icon="mdi-close"
      @click:close="$emit('delete')"
  >

            {{ filterValue }}
  </v-chip>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "@/facetConfigs";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";

export default {
  name: "FilterValueRange",
  components: {
    FilterEditRange,
  },
  props: {
    filterKey: String,
    filterValue: String,
  },
  data() {
    // const splitValue = (this.filterValue) ? this.filterValue.split("-") : ["", ""]
    return {
      foo: 42,
      // start: String(splitValue[0]),
      // end: String(splitValue[1]),

      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    asStr() {
      return this.start + "-" + this.end
    },
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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