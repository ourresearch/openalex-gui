<template>
  <thead>
  <tr>
    <th
        v-for="header in headerConfigs"
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
    headerKeys() {
      return this.$route.query.column?.split(",") ?? []
    },
    headerConfigs() {
      return this.headerKeys
          .map(key => {
            return getFacetConfig(this.entityType, key)
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
  watch: {}
}
</script>

<style scoped lang="scss">

</style>