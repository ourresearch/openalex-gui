<template>
    <div>
      <div class="table-meta d-flex align-center">

        <v-btn icon @click="clickSelectAllButton">
          <v-icon>{{ selectAllIcon }}</v-icon>
        </v-btn>
        <v-spacer/>
        <div v-if="!$store.state.isLoading">
          showing 1-{{ results.body.length }} of {{ meta?.count > 10000 ? "about " : "" }}{{ meta?.count | toPrecision }} results
        </div>
        <v-btn :href="apiUrl" small icon target="_blank">
          <v-icon small>mdi-api</v-icon>
        </v-btn>
      </div>
      <v-simple-table v-if="results">
        <thead>
        <th key="checkbox-placeholder"></th>
        <th
            v-for="(header, i) in results.header"
            :key="'header-'+i"
            style="text-align: left;"
            class="px-1"
        >
          <div class="d-flex">
            <div>
              {{ header.displayName }}
            </div>
            <v-btn icon small>
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
            <v-spacer></v-spacer>

          </div>
        </th>
        </thead>
        <tbody>
        <tr
            v-for="(row, i) in rows"
            :key="'row-'+i"
            @click="clickRow(row.id)"
        >
          <td key="selector" class="selector px-0" style="width: 1px; white-space: nowrap;">
            <v-btn icon @click="toggleSelectedId(row.id)">
              <v-icon v-if="selectedIds.includes(row.id)">mdi-checkbox-marked</v-icon>
              <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
            </v-btn>
          </td>
          <td
              v-for="(cell, i) in row.cellsWithConfigs"
              :key="'cell-'+i"
              class="px-1"
          >
            <prop-value :property="cell"/>
          </td>
        </tr>
        </tbody>
      </v-simple-table>
    </div>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {unravel} from "../../util";
import Entity from "@/components/Entity/Entity.vue";
import PropValue from "@/components/PropValue.vue";


export default {
  name: "Template",
  components: {
    Entity,
    PropValue,
  },
  props: {
    results: Object,
    meta: Object,
    apiUrl: String,
  },
  data() {
    return {
      foo: 42,
      selectedIds: [],
      zoomId: null,
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
      } else if (this.selectedIds.length === 0) {
        return "mdi-checkbox-blank-outline"
      } else {
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
    clickSelectAllButton() {
      if (this.selectedIds.length === 0) {
        this.selectedIds = this.results.body.map((row) => row.id)
      } else {
        this.selectedIds = []
      }
    },
    clickRow(rowId) {
      console.log("clickRow", rowId)
      this.$store.state.zoomId = rowId
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