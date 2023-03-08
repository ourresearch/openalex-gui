<template>
  <v-chip outlined class="mr-1">
    <v-icon left>{{ filter.icon }}</v-icon>
    <span>{{ myDisplayValue | truncate(50) }}</span>
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {
  },
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
    ]),
    myDisplayValue(){
      if (this.filter.isBoolean){
        const booleanInt = (this.filter.value) ? 1 : 0
        return this.filter.booleanValues[booleanInt]
      }
      return this.filter.displayValue
    }
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
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>