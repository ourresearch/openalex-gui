<template>
  <span>
    <v-menu rounded offset-y max-width="300">
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-tray-arrow-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item v-if="isResultsExportDisabled">
          <v-list-item-icon><v-icon>mdi-alert-circle</v-icon></v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">Too many results to export</v-list-item-title>
              <v-list-item-subtitle>Max 100k at a time</v-list-item-subtitle>
            </v-list-item-content>
        </v-list-item>
        <v-divider v-if="isResultsExportDisabled"/>
        <v-subheader v-if="!isResultsExportDisabled">
          Export results as...
        </v-subheader>
        <v-list-item :disabled="isResultsExportDisabled" @click="openExportDialog('csv')">
          <v-list-item-icon><v-icon :disabled="isResultsExportDisabled">mdi-table</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Spreadsheet (.csv)</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item :disabled="isResultsExportDisabled" @click="openExportDialog('ris')">
          <v-list-item-icon><v-icon :disabled="isResultsExportDisabled">mdi-archive-arrow-down-outline</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Endnote format (.ris)</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item :disabled="isResultsExportDisabled" @click="openExportDialog('wos-plaintext')">
          <v-list-item-icon><v-icon :disabled="isResultsExportDisabled">mdi-file-outline</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>WoS format (.txt)</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog v-model="isDialogOpen.exportResults" max-width="350" :persistent="exportObj.progress !== null">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            {{ exportDialogTitle }}
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <div class="pa-5 pt-3" v-if="exportObj.progress === null">
          <span>Export these {{ resultsCount | toPrecision }} records?</span>
          <span v-if="exportEstimatedTime">
            (This will take up to {{ exportEstimatedTime }}).
          </span>
        </div>
        <div v-else-if="exportObj.progress < 1" class="pa-5">
          Export in progress...
          <span class="font-weight-bold">{{ exportObj.progress * 100 | toPrecision }}%</span> complete
        </div>
        <div v-else class="pa-5">
          Export complete!
        </div>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn text rounded @click="isDialogOpen.exportResults = false">Cancel</v-btn>
          <v-btn
              v-if="exportObj.progress < 1"
              :disabled="exportObj.progress !== null"
              color="primary"
              rounded
              @click="startExport"
          >
            Start export
          </v-btn>
          <v-btn
              v-else
              color="primary"
              rounded
              :href="exportObj.result_url"
              target="_blank"
              @click="clickDownloadButton"
          >
            <v-icon left>mdi-tray-arrow-down</v-icon>
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import QrcodeVue from "qrcode.vue";
import axios from "axios";
import {filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      foo: 42,
      isDialogOpen: {
        exportResults: false,
      },
      exportFormat: null,

      exportProgressUrl: "",
      exportObj: {
        progress: null,
      },
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    isResultsExportDisabled() {
      return this.$store.state?.resultsObject?.meta?.count > 100000
    },
    isExportFinished() {
      return !!this.exportObj.result_url
    },
    resultsCount(){
      return this.$store.state?.resultsObject?.meta?.count
    },
    exportEstimatedTime() {
      if (this.resultsCount < 200) return null
      if (this.resultsCount < 6600) return "one minute"
      if (this.resultsCount < 33000) return "five minutes"
      else if (this.resultsCount < 66000) return "ten minutes"
      return "fifteen minutes"
    },
    exportDialogTitle() {
      const formatConfig = {
        csv: "Export spreadsheet (.csv)",
        "wos-plaintext": "Export WoS format (.txt)",
        ris: "Export to Endnote (.ris)",
      }
      return formatConfig[this.exportFormat]
    },
    groupByDownloadUrl() {
      const myFilters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
      return url.makeGroupByUrl(
          this.entityType,
          url.getGroupBy(this.$route).join(","),
          {
            filters: myFilters,
            isMultipleGroups: true,
            formatCsv: true,
          }
      )
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    placeholder() {
    },
    openExportDialog(format) {
      this.isDialogOpen.exportResults = true
      this.exportFormat = format
    },
    async startExport() {
      this.exportObj.progress = 0
      const filterStr = this.$route.query.filter
      const params = [
        `filter=${filterStr}`,
        `format=${this.exportFormat}`,
      ]
      const url = `https://export.openalex.org/works?` + params.join("&")
      const resp = await axios.get(url)
      console.log("startExport resp:", resp)
      this.exportProgressUrl = resp.data.progress_url
    },
    cleanupExport() {
      this.exportObj = {progress: null}
      this.exportFormat = null
      this.exportProgressUrl = null
      this.isDialogOpen.exportResults = false
    },
    cancelExport() {
      this.cleanupExport()
      this.snackbar("Export cancelled.")
    },
    clickDownloadButton() {
      this.cleanupExport()
      this.snackbar("Export downloaded")
    },
    clickDownloadSummary() {
      setTimeout(() => [
        this.snackbar("Export downloaded")
      ], 1000)
    }


  },
  created() {
  },
  mounted() {
    setInterval(async () => {
      if (!this.exportProgressUrl) return
      const resp = await axios.get(this.exportProgressUrl)
      console.log("checking export progress; got this back:", resp.data)
      this.exportObj = resp.data
      if (this.isExportFinished) {
        this.exportProgressUrl = null
        this.exportObj.progress = 1
      }
    }, 1000)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>