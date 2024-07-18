<template>
  <v-simple-table v-if="results">
    <thead>

    <th
        v-for="(header, i) in results.header"
        :key="'header-'+i"
    >
      {{ header.displayName}}
    </th>
    </thead>
    <tbody>
    <tr
        v-for="(row, i) in results.body"
        :key="'row-'+i"
    >
      <td
          v-for="(cell, i) in row"
          :key="'cell-'+i"
      >
        <template v-if="cell.type==='string'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='number'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='boolean'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='entity'">
          <template v-if="cell.isList">
            list of entities
          </template>
          <template v-else>
            <router-link :to="{name: 'EntityPageShortcut', params: {entityId: cell.value.id}}">
              {{ cell.value.display_name }}
            </router-link>
          </template>
        </template>
      </td>
    </tr>
    </tbody>
  </v-simple-table>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {
    results: Object
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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