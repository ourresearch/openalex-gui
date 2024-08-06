<template>
  <div>
    <div class="table-meta d-flex align-center">

      <v-btn
          icon
          @click="clickSelectAllButton"
      >
        <v-icon>{{ selectAllIcon }}</v-icon>
      </v-btn>
      <v-spacer/>
      <div v-if="!$store.state.isLoading">
        showing 1-{{ resultsBody.length }} of {{
          resultsMeta?.count > 10000 ? "about " : ""
        }}{{ resultsMeta?.count | toPrecision }}
        results
      </div>
      <v-btn :href="apiUrl" small icon target="_blank">
        <v-icon small>mdi-api</v-icon>
      </v-btn>
    </div>
    <v-simple-table v-if="resultsBody.length">
      <thead>
      <th key="checkbox-placeholder"></th>
      <th
          v-for="(header, i) in resultsHeader"
          :key="'header-'+i"
          style="text-align: left;"
          class=""
      >
        <div class="d-flex">
          <v-menu>
            <template v-slot:activator="{ on }">
              <v-btn text v-on="on" style="white-space: nowrap;">
                {{ header.displayName }}
                <v-icon small>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list dense>
              <v-list-item class="pb-2 py-1">
                <v-list-item-title style="font-family: monospace">{{ header.id }}</v-list-item-title>
              </v-list-item>
              <v-divider/>
              <v-list-item @click="removeColumn(header.id)">
                <v-list-item-icon>
                  <v-icon>mdi-table-column-remove</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Remove column</v-list-item-title>
              </v-list-item>
              <template v-if="header.actions?.includes('sort')">
                <v-list-item @click="$emit('setSort', {id: header.id, direction: 'desc'})">
                  <v-list-item-icon>
                    <v-icon>mdi-sort-descending</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>Sort descending</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('setSort', {id: header.id, direction: 'asc'})">
                  <v-list-item-icon>
                    <v-icon>mdi-sort-ascending</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>Sort ascending</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
          <v-spacer></v-spacer>

        </div>
      </th>
      </thead>
      <tbody>
      <tr
          v-for="(row, i) in rows"
          :key="'row-'+i"
          @click.exact="clickRow(row.id)"
          @click.meta.stop="metaClickRow(row.id)"
      >
        <td key="selector" class="selector px-0" style="width: 1px; white-space: nowrap;">
          <v-btn icon @click.stop="toggleSelectedId(row.id)">
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
    resultsHeader: Array,
    resultsBody: Array,
    resultsMeta: Object,
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
      return this.resultsBody.map((row) => {
        return {
          ...row,
          cellsWithConfigs: row.cells.map((cell, i) => {
            return {
              ...cell,
              config: this.resultsHeader[i],
            }
          })
        }
      })
    },
    selectAllIcon() {
      if (this.selectedIds.length === this.resultsBody.length) {
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
        this.selectedIds = this.resultsBody.map((row) => row.id)
      } else {
        this.selectedIds = []
      }
    },
    clickRow(rowId) {
      console.log("clickRow", rowId)
      this.$store.state.zoomId = rowId
    },
    metaClickRow(rowId) {
      console.log("metaClickRow", rowId)
      const newTab = window.open(this.apiUrl)
      setTimeout(() => {
        newTab.focus()
      }, 1000)
      return false
    },
    removeColumn(id) {
      this.$emit("setColumns", this.resultsHeader.map(h => h.id).filter(h => h !== id))
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