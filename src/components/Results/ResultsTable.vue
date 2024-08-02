<template>
  <v-row class="">
    <v-col cols="9">

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
          @click="clickRow(row.id)"
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
          <prop-value :property="cell"/>
        </td>
      </tr>
      </tbody>
    </v-simple-table>
    </v-col>
    <v-col cols="3">
      <div class="d-flex" v-if="zoomId">
        <v-spacer />
        <v-btn icon @click="zoomId=null"><v-icon>mdi-close</v-icon></v-btn>
      </div>
      <entity v-if="zoomId" :id="zoomId"/>
    </v-col>

  </v-row>
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
    results: Object
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
    },
    clickRow(rowId){
      console.log("clickRow", rowId)
      this.zoomId = rowId.replace("https://openalex.org/", "")
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