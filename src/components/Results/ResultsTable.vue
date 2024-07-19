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
        v-for="(row, i) in rows"
        :key="'row-'+i"
    >
      <td
          v-for="(cell, i) in row"
          :key="'cell-'+i"
      >
        <template v-if="cell.value === null">
          -
        </template>
        <template v-else-if="cell.type==='string'">
          <template v-if="cell.config.id === 'abstract'">
            {{ unravel(cell.value) | truncate(50)}}
          </template>
          <template v-else>
            {{ cell.value }}
          </template>
        </template>
        <template v-else-if="cell.type==='number'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='boolean'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='entity'">
          <template v-if="Array.isArray(cell.value)">
            list of entities
          </template>
          <template v-else-if="cell.value.id">
<!--            {{ cell.value  }}-->

            <router-link :to="{name: 'EntityPage', params: {entityType: cell.config.objectEntity, entityId: cell.value.id}}">
              {{ cell.value.display_name }}
            </router-link>
          </template>
          <template v-else>
            MISSING ID
          </template>
        </template>
      </td>
    </tr>
    </tbody>
  </v-simple-table>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {unravel} from "../../util";

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
    rows(){
      return this.results.body.map((row) => {
        return row.map((cell, i) => {
          return {
            ...cell,
            config: this.results.header[i],
          }
        })
      })
    }
  },

  methods: {
    unravel,
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