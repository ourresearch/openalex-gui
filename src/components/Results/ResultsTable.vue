<template>
  <v-simple-table v-if="results">
    <thead>

    <th key="selector" class="selector">
      <v-btn icon @click="clickSelectAllButton">
        <v-icon>{{ selectAllIcon }}</v-icon>
      </v-btn>
    </th>
    <th
        v-for="(header, i) in results.header"
        :key="'header-'+i"
    >
      {{ header.displayName }}
    </th>
    </thead>
    <tbody>
    <tr
        v-for="(row, i) in rows"
        :key="'row-'+i"
    >
      <td key="selector" class="selector">
        <v-btn icon @click="toggleSelectedId(row.id)">
          <v-icon v-if="selectedIds.includes(row.id)" >mdi-checkbox-marked</v-icon>
          <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
        </v-btn>
      </td>
      <td
          v-for="(cell, i) in row.cellsWithConfigs"
          :key="'cell-'+i"
      >
        <template v-if="cell.value === null">
          -
        </template>
        <template v-else-if="cell.type==='string'">
          <template v-if="Array.isArray(cell.value)">
            Array of strings...
          </template>
          <template v-else>
            {{ cell.value | truncate(100) }}
          </template>

        </template>
        <template v-else-if="cell.type==='number'">
          <template v-if="cell.config.isCurrency">
            ${{ cell.value | toPrecision }}
          </template>
          <template v-else-if="cell.config.isYear">
            {{ cell.value }}
          </template>
          <template v-else>
            {{ cell.value | toPrecision }}
          </template>
        </template>
        <template v-else-if="cell.type==='boolean'">
          {{ cell.value }}
        </template>
        <template v-else-if="cell.type==='entity'">
          <template v-if="Array.isArray(cell.value)">
            <router-link
                v-for="(entity, i) in cell.value"
                :key="'entity-'+i"
                :to="{name: 'EntityPage', params: {entityType: cell.config.objectEntity, entityId: entity?.id}}"
            >
              {{ entity?.display_name }}{{ i < cell.value.length - 1 ? ', ' : '' }}
            </router-link>
          </template>
          <template v-else-if="cell.value.id">
            <router-link
                :to="{name: 'EntityPage', params: {entityType: cell.config.objectEntity, entityId: cell.value.id}}">
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
      selectedIds: [],
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    rows() {
      return this.results.body.map((row) => {
        return {
          ...row,
          cellsWithConfigs: row.cells.map((cell, i) => {
            return {
              ...cell,
              config: this.results.header[i],
            }
          })
        }
      })
    },
    selectAllIcon() {
      if (this.selectedIds.length === this.results.body.length) {
        return "mdi-checkbox-marked"
      }
      else if (this.selectedIds.length === 0) {
        return "mdi-checkbox-blank-outline"
      }
      else {
        return "mdi-minus-box-outline"
      }
    }
  },

  methods: {
    unravel,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    addSelectedId(id) {
      this.selectedIds.push(id)
    },
    removeSelectedId(id) {
      this.selectedIds = this.selectedIds.filter((i) => i !== id)
    },
    toggleSelectedId(id) {
      if (this.selectedIds.includes(id)) {
        this.removeSelectedId(id)
      } else {
        this.addSelectedId(id)
      }
    },
    clickSelectAllButton(){
      if (this.selectedIds.length === 0) {
        this.selectedIds = this.results.body.map((row) => row.id)
      }
      else {
        this.selectedIds = []
      }

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">
a {
  text-decoration: none;
}

</style>