<template>
  <div>
    <div>
    </div>
    <div class="table-meta d-flex align-center pa-2">

      <v-btn
          icon
          @click="clickSelectAllButton"
      >
        <v-icon>{{ selectAllIcon }}</v-icon>
      </v-btn>
      <template v-if="userId">

        <v-btn icon :disabled="!selectedIds.length" @click="exportSelectedAsCsv">
          <v-icon>mdi-tray-arrow-down</v-icon>
        </v-btn>
        <v-menu>
          <template v-slot:activator="{ on }">
            <v-btn icon v-on="on" :disabled="!selectedIds.length">
              <v-icon>mdi-tag-outline</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-subheader>Apply label:</v-subheader>
            <v-list-item
                v-for="label in userCollections"
                :key="label.id"
            >
              <v-list-item-icon>
                <v-icon>mdi-tag-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ label.name }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-divider/>
            <v-list-item
                key="create-label"
                @click="isCreateLabelDialogOpen = true"
            >
              <v-list-item-icon>
                <v-icon>mdi-tag-plus-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Create new label</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
                key="manage-labels"
                to="/me/labels"
            >
              <v-list-item-icon>
                <v-icon>mdi-tag-edit-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Manage labels</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn v-if="subjectEntity === 'works'" icon :disabled="!selectedIds.length"
               @click="isCorrectionDialogOpen = true">
          <v-icon>mdi-pencil-outline</v-icon>
        </v-btn>
      </template>
      <!--      <v-btn-->
      <!--          icon-->
      <!--          :disabled="!selectedIds.length"-->
      <!--          @click="createCollection({ids: selectedIds, name: 'test'})"-->
      <!--          v-if="userId"-->
      <!--      >-->
      <!--        <v-icon>mdi-tag-outline</v-icon>-->
      <!--      </v-btn>-->
      <v-spacer/>
      <div v-if="!$store.state.isLoading" class="body-2 grey--text px-4">
        1-{{ resultsBody.length }} of {{
          resultsMeta?.count > 10000 ? "about " : ""
        }}{{ resultsMeta?.count | toPrecision }}
        results
      </div>

      <v-menu rounded>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-table-plus</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
              @click="addColumn(prop.id)"
              v-for="prop in columnsToAdd"
              :key="prop.id"
              :disabled="resultsHeader.map(h => h.id).includes(prop.id)"
          >
            <v-list-item-icon>
              <v-icon>{{ prop.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{ prop.displayName }}</v-list-item-title>
          </v-list-item>
          <v-divider/>
          <v-list-item key="more" @click="isPropSelectorDialogOpen = true">
            <v-list-item-icon></v-list-item-icon>
            <v-list-item-title>More</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-menu rounded>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item :href="apiUrl" icon target="_blank">
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>View in API</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
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
          <column-value :property="cell"/>
        </td>
      </tr>
      </tbody>
    </v-simple-table>

    <v-dialog v-model="isCreateLabelDialogOpen" width="500">
      <label-create :ids="selectedIds" @close="isCreateLabelDialogOpen = false"/>
    </v-dialog>

    <v-dialog v-model="isCorrectionDialogOpen" width="500">
      <correction-create :ids="selectedIds" @close="isCorrectionDialogOpen = false"/>
    </v-dialog>

    <v-dialog scrollable v-model="isPropSelectorDialogOpen">
      <prop-selector
          :subject-entity="subjectEntity"
          :action="'column'"
          :ids-to-disable="resultsHeader.map(h => h.id)"
          @close="isPropSelectorDialogOpen = false"
          @select="addColumn"
      />
    </v-dialog>


  </div>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {unravel} from "../../util";
import ColumnValue from "@/components/ColumnValue.vue";
import {oaxConfigs} from "@/oaxConfigs";
import * as oaxSearch from "@/oaxSearch";
import PropSelector from "@/components/PropSelector.vue";
import LabelCreate from "@/components/Label/LabelCreate.vue";
import CorrectionCreate from "@/components/CorrectionCreate.vue";

export default {
  name: "Template",
  components: {
    ColumnValue,
    PropSelector,
    LabelCreate,
    CorrectionCreate,
  },
  props: {
    apiUrl: String,
  },
  data() {
    return {
      foo: 42,
      selectedIds: [],
      zoomId: null,
      isPropSelectorDialogOpen: false,
      isCreateLabelDialogOpen: false,
      isCorrectionDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userCollections",
    ]),
    ...mapGetters("search", [
      "resultsMeta",
      "resultsHeader",
      "resultsBody",
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
    },
    columnsToAdd() {

      const config = oaxConfigs[this.subjectEntity]
      const columnsToShow = config.showOnTablePage
      return Object.values(config.columns)
          .filter(p => columnsToShow.includes(p.id))
    },
    subjectEntity() {
      const getGetKey = str => (str.match(/get\s+(\w+)/) || [])[1];
      return getGetKey(this.resultsMeta.oql)
    }
  },

  methods: {
    unravel,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "createCollection"
    ]),
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
    },
    addColumn(id) {
      this.$emit("setColumns", this.resultsHeader.map(h => h.id).concat([id]))
      this.isPropSelectorDialogOpen = false
    },
    exportSelectedAsCsv() {
      const selectedRows = this.resultsBody.filter(row => this.selectedIds.includes(row.id))
      const csv = oaxSearch.jsonToCsv(this.resultsHeader, selectedRows)

      const blob = new Blob([csv], {type: "text/csv"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "selected.csv"
      a.click()
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