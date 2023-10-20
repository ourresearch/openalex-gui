<template>
  <thead>
    <tr>
      <th
        key="title"
      >
        Title
      </th>
      <th
        v-for="header in headers"
        :key="header.key"
      >
        {{ header.displayName }}
      </th>

    </tr>
  </thead>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "ResultsTableHeaders",
  components: {
  },
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
    headers(){
      return this.$store.state.showColumns.map(filterKey => {
        return getFacetConfig(this.entityType, filterKey)
      })
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
  }
}
</script>

<style scoped lang="scss">

</style>