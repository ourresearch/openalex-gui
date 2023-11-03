<template>
  <td>
    results table cell
  </td>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "ResultsTableCell",
  components: {},
  props: {},
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