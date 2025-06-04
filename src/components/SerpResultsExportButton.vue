<template>
  <span>
    <v-tooltip location="top">
      <template v-slot:activator="{props}">
          <v-btn v-bind="props" icon @click="openExportDialog('csv')">
            <v-icon>mdi-tray-arrow-down</v-icon>
          </v-btn>
      </template>
      <div v-if="isResultsExportDisabled">
        Too many items to download (max 100k)
      </div>
      <div v-else>Export results</div>
    </v-tooltip>
    <v-dialog v-model="isDialogOpen.exportResults" max-width="350" :persistent="exportObj.progress !== null">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            Export results
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <div v-if="exportObj.progress === null" class="pa-4 py-0">
          <v-radio-group v-model="exportFormat">
            <v-radio
                label="Spreadsheet (.csv)"
                value="csv"
            />
            <div class="pl-7 pb-4"  v-if="exportFormat==='csv'">
              <v-checkbox
                  style="margin-top: 0px;"
                  hide-details
                  v-model="areColumnsTruncated"
                  label="Shorten column values for Excel compatibility?"
              />
            </div>
            <v-radio
                label="Endnote format (.ris)"
                value="ris"
            />
            <v-radio
                label="Text format (.txt)"
                value="wos-plaintext"
            />
          </v-radio-group>
            <v-alert v-if="exportEstimatedTime" type="warning" text>
              Since there are many records, the export will take up to {{ exportEstimatedTime }}.
            </v-alert>
        </div>
        <div v-else-if="exportObj.progress < 1" class="pa-5">
          Export in progress...
          <span class="font-weight-bold">{{ filters.toPrecision(exportObj.progress * 100) }}%</span> complete
        </div>
        <div v-else class="pa-5">
          Export complete!
        </div>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn variant="text" rounded @click="isDialogOpen.exportResults = false">Cancel</v-btn>
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
            <v-icon start>mdi-tray-arrow-down</v-icon>
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>

import {mapGetters, mapMutations} from "vuex";
import axios from "axios";

import {url} from "@/url";
import filters from "@/filters";
import {filtersFromUrlStr} from "@/filterConfigs";

export default {
  name: "SerpResultsExportButton",
  components: {},
  props: {},
  data() {
    return {
      isDialogOpen: {
        exportResults: false,
      },
      exportFormat: null,
      areColumnsTruncated: false,
      exportProgressUrl: "",
      exportObj: {
        progress: null,
      },
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    isResultsExportDisabled() {
      return this.$store.state?.resultsObject?.meta?.count > 100000
    },
    isExportFinished() {
      return !!this.exportObj.result_url
    },
    resultsCount() {
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
        "wos-plaintext": "Export text format (.txt)",
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
        `truncate=${this.areColumnsTruncated}`,
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
  watch: {
    exportFormat() {
      this.areColumnsTruncated = false
    }
  }
}
</script>

<style scoped lang="scss">

</style>