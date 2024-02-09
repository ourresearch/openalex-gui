<template>
  <span>
    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn v-on="on" text rounded>
          Export
        </v-btn>
      </template>
      <v-list>
        <v-menu offset-x open-on-hover>
          <template v-slot:activator="{on}">
            <v-list-item
                :disabled="isResultsExportDisabled"
                v-on="on"
                 @click="placeholder"
            >
              <v-list-item-icon>
                <v-icon :disabled="isResultsExportDisabled">mdi-table-arrow-down</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  Export results
                </v-list-item-title>
                <v-list-item-subtitle class="" v-if="isResultsExportDisabled">
                  Max 100k
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action class="pt-2">
                <v-icon :disabled="isResultsExportDisabled">mdi-menu-right</v-icon>
              </v-list-item-action>

            </v-list-item>

          </template>
          <v-list>
            <v-list-item @click="openExportDialog('csv')">
              <v-list-item-content>
                <v-list-item-title>Spreadsheet</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action-text>csv</v-list-item-action-text>
            </v-list-item>
            <v-list-item @click="openExportDialog('wos-plaintext')">
              <v-list-item-content>
                <v-list-item-title>WoS format</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action-text>txt</v-list-item-action-text>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-list-item :href="groupByDownloadUrl" @click="clickDownloadSummary">
          <v-list-item-icon>
            <v-icon>mdi-clipboard-arrow-down-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Export report
            </v-list-item-title>
          </v-list-item-content>
          <!--          <v-list-item-action-text class="ml-6">csv</v-list-item-action-text>-->
        </v-list-item>
      </v-list>
    </v-menu>
    <v-dialog v-model="isDialogOpen.exportResults" max-width="500" :persistent="exportObj.progress !== null">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            {{ exportDialogTitle }}
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <div class="pa-5" v-if="exportObj.progress === null">
          The export will take around {{ exportEstimatedTime }}. Continue?
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
    exportEstimatedTime(){
      const count = this.$store.state?.resultsObject?.meta?.count
      if (count < 33000) return "five minutes"
      else if (count < 66000) return "ten minutes"
      return "fifteen minutes"
    },
    exportDialogTitle(){
      const formatConfig = {
        "csv": "Export as spreadsheet (csv)",
        "wos-plaintext": "Export in WoS format (txt)",
      }
      return formatConfig[this.exportFormat]
    },
    groupByDownloadUrl(){
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
    openExportDialog(format){
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
    cancelExport(){
      this.cleanupExport()
      this.snackbar("Export cancelled.")
    },
    clickDownloadButton(){
      this.cleanupExport()
      this.snackbar("Export downloaded")
    },
    clickDownloadSummary(){
      setTimeout(()=>[
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