<template>
  <tr>
    <template
        v-for="cell in cells"
    >
      <td
          v-if="cell.type==='range'"
          :key="entity.id + cell.key"
          class="range"
      >
        <template v-if="cell.isDate">{{ cell.value}}</template>
        <template v-else>{{ cell.value | toPrecision }}</template>

      </td>
      <td
          v-else-if="cell.type==='boolean'"
          :key="entity.id + cell.key"
          class="boolean"
      >
        <v-icon v-if="cell.value" color="success">mdi-check</v-icon>
<!--        <v-icon v-else color="error lighten-2">mdi-close</v-icon>-->
<!--        {{ cell.value }}-->
      </td>
      <td
          v-else
          :key="entity.id + cell.key"
          class=""
      >
        {{ cell.value }}
      </td>

    </template>

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
    keysToShow() {
      return this.$route.query.column?.split(",") ?? []
    },
    cells() {
      const pluck = function (string, object) {
        return string.split('.').reduce(function (a, b) {
          return a[b];
        }, object);

      }


      return this.keysToShow.map(filterKey => {
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