<template>
  <v-chip>
    {{ filterKey }}:
    {{ filterValue }}
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "FilterValueChip",
  components: {
  },
  props: {
      filterValue: String,
      filterKey: String,
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