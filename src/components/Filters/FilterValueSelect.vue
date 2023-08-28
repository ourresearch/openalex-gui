<template>
  <div>
    <v-autocomplete
                :items="filterValueOptions"
                item-text="displayValue"
                :search-input.sync="filterValueOptionsSearchString"
        />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "FilterValueSelect",
  components: {
  },
  props: {
    readonly: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      value: this.filterValue,
      options: [],
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
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
  }
}
</script>

<style scoped lang="scss">

</style>