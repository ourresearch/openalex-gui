<template>
  <tr>
    <td
        key="title"
    >
      {{ entity.display_name }}
    </td>
    <td
        v-for="cell in cells"
        :key="entity.id + cell.key"
    >
      {{ cell.value }}
    </td>

  </tr>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "ResultsTableRow",
  components: {},
  props: {
    entity: Object,
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
    cells() {
      const pluck = function (string, object) {
        return string.split('.').reduce(function (a, b) {
          return a[b];
        }, object);

      }


      return this.$store.state.showColumns.map(filterKey => {
        return {
          ...getFacetConfig(this.entityType, filterKey),
          value: pluck(filterKey, this.entity)
        }
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