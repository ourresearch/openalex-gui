<template>
  <span class="query-actions mb-1">    
    <v-btn small icon :disabled="!selectedIds.length" @click="exportResults">
      <v-icon small>mdi-tray-arrow-down</v-icon>
    </v-btn>

    <label-menu :icon="true" :selectedIds="fullSelectedIds" />

    <!--
    <v-btn v-if="querySubjectEntity === 'works'" small :disabled="!selectedIds.length"
    @click="snackbar('Submitting data corrections will be coming soon.')">
    <v-icon>mdi-pencil-outline</v-icon>
    </v-btn>
    -->

  </span>
</template>


<script>
import { mapGetters, mapMutations } from "vuex";
import { entity } from "@/entity";
import * as oaxSearch from "@/oaxSearch";
import NewQueryButton from "@/components/Misc/NewQueryButton.vue";
import LabelMenu from "@/components/Label/LabelMenu.vue";

export default {
  name: "QueryActions",
  components: {
    LabelMenu,
    NewQueryButton
  },
  props: {
    isEntireSearchSelected: {
      type: Boolean,
      default: false
    }
  },
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
        this.$emit('open-download-dialog');
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
.query-actions * {
  margin-left: 4px;
}
</style>