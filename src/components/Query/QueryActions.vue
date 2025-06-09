<template>
  <span class="query-actions">    
   
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props }">
        <span v-bind="props"> 
          <v-btn size="small" icon variant="plain" :disabled="!selectedIds.length" @click="exportResults">
            <v-icon size="small" >mdi-tray-arrow-down</v-icon>
          </v-btn>
        </span>
      </template>
      <span>Export</span>
    </v-tooltip>
   
    <v-tooltip location="bottom">
      <template v-slot:activator="{ props }">
        <span v-bind="props">
          <label-menu :icon="true" :selectedIds="fullSelectedIds" />
        </span>
      </template>
      <span>Labels</span>
    </v-tooltip>

    <!-- DownloadDialogs -->
    <v-dialog v-model="isDownloadDialogOpen" width="500">
      <download-dialog 
        :resultsCount="resultsMeta?.count" 
        :isOpen="isDownloadDialogOpen"
        @close="isDownloadDialogOpen = false"
         />
    </v-dialog>

  </span>
</template>


<script>
import { mapGetters, mapMutations } from "vuex";
import { entity } from "@/entity";
import * as oaxSearch from "@/oaxSearch";
import LabelMenu from "@/components/Label/LabelMenu.vue";
import DownloadDialog from "@/components/Download/DownloadDialog.vue";

export default {
  name: "QueryActions",
  components: {
    LabelMenu,
    DownloadDialog,
  },
  props: {},
  data() {
    return {
      isDownloadDialogOpen: false
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
    ...mapGetters("search", [
      "resultsMeta",
      "resultsHeader",
      "resultsBody",
      "querySubjectEntity",
      "selectedIds",
      "isEntireSearchSelected",
    ]),
    fullSelectedIds() {
      // Returns selected IDs in full format e.g. "topics/T123" instead of "123"
      return this.selectedIds.map(id => 
        entity.fullId(id, this.querySubjectEntity)
      );
    }
  },
  methods: {
    ...mapMutations(["snackbar"]),
    exportResults() {
      if (this.isEntireSearchSelected) {
        this.isDownloadDialogOpen = true;
      } else {
        this.exportSelectedAsCsv();
      }
    },
    exportSelectedAsCsv() {
      const selectedRows = this.resultsBody.filter(row => 
        this.selectedIds.includes(row.id)
      );
      const csv = oaxSearch.jsonToCsv(this.resultsHeader, selectedRows);
      const blob = new Blob([csv], {type: "text/csv"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "selected.csv";
      a.click();
    }
  }
};
</script>

<style scoped>
.query-actions {
  text-align: right;
}
.query-actions > * {
  position: relative;
  top: -8px;
  margin-right: -12px;
}
</style>