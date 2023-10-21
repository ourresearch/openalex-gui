<template>
  <div>
    <template>

      <!--    There's an export in progress -->
      <v-menu rounded offset-y v-if="isExportStarted">
        <template v-slot:activator="{on}">
          <v-btn
              :icon="icon"
              :text="!icon"
              rounded
              class="elevation-0 "
              color="primary"
              dark
              v-on="on"
              style="position: relative;"
          >
<!--            <v-icon small v-if="!isExportFinished">mdi-arrow-down</v-icon>-->
<!--            <v-icon v-if="isExportFinished">mdi-tray-arrow-down</v-icon>-->
            <v-progress-circular
                style="position: absolute;"
                :color="(isExportStarted && !exportObj.progress) ? 'grey' : 'primary'"
                rotate="-90"
                :value="exportObj.progress * 100"
                :indeterminate="isExportStarted && !exportObj.progress"
                size="25"
                v-if="!isExportFinished"
            />
            {{ icon ? "" : "Exporting"}}
            <!--                  {{ Math.round(exportObj.progress * 100) }}%-->
            <!--                  <v-icon right>mdi-menu-down</v-icon>-->
          </v-btn>
        </template>
        <v-card>
          <v-card-title>Export in progress</v-card-title>
          <v-card-text>
            Your requested export is <strong>{{ exportObj.progress * 100 | toPrecision }}%</strong> complete.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="cancelExport">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>


      <!--    There's no export in progress right now -->
      <v-menu rounded offset-y v-else min-width="200" max-width="300">
        <template v-slot:activator="{on}">
          <v-btn
              :icon="icon"
              :text="!icon"
              rounded
              v-on="on"
              class=""
          >
            <v-icon v-if="icon">mdi-tray-arrow-down</v-icon>
            {{ icon ? "" : "Export" }}
          </v-btn>
        </template>
        <v-card v-if="isTooManyResultsToExport" class="">
          <div class=" pa-4 pb-0 font-weight-bold">
            Too many results to export.
          </div>
          <v-card-text>
            You can export a maximum of 100,000 results at a time.
          </v-card-text>
        </v-card>

        <v-list v-else>
          <v-subheader>Export results as:</v-subheader>
          <v-divider/>
          <v-list-item @click="setExport('csv')">
            <v-list-item-title>
              Spreadsheet (.csv)
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="setExport('wos-plaintext')">
            <v-list-item-title>
              WoS format (.txt)
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

    <v-dialog v-model="isDownloadDialogVisible" max-width="300">
      <v-card rounded>
        <v-toolbar flat>
          <v-toolbar-title>Export complete</v-toolbar-title>
        </v-toolbar>
        <v-card-actions>
          <v-spacer/>
          <v-btn
              rounded
              text
              @click="cancelExport"
          >
            Cancel
          </v-btn>
          <v-btn
              color="primary"
              rounded
              :href="exportObj.result_url"
              target="_blank"
          >
            <!--            <v-icon left>mdi-tray-arrow-down</v-icon>-->
            Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import router from "../router";
import {url} from "../url";
import axios from "axios";

export default {
  name: "Template",
  components: {},
  props: {
    disabled: Boolean,
    icon: Boolean,
  },
  data() {
    return {
      foo: 42,
      exportProgressUrl: "",
      isExportStarted: false,
      exportObj: {
        progress: 0,
      },
      isDownloadDialogVisible: false,
      url,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "resultsCount",
    ]),
    isExportFinished() {
      return this.exportObj.result_url
    },
    isTooManyResultsToExport() {
      return this.resultsCount > 100000
    }

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async setExport(format) {
      this.isExportStarted = true
      const filterStr = this.$route.query.filter
      const params = [
        `filter=${filterStr}`,
        `format=${format}`,
      ]
      const url = `https://export.openalex.org/works?` + params.join("&")
      const resp = await axios.get(url)
      console.log("startExport resp:", resp)
      this.exportProgressUrl = resp.data.progress_url
    },
    cancelExport() {
      this.exportObj = {progress: 0}
      this.exportProgressUrl = null
      this.isDownloadDialogVisible = false
      this.isExportStarted = false
      this.snackbar("Export cancelled.")
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
        this.isDownloadDialogVisible = true
        this.exportProgressUrl = null
        this.isExportStarted = false
      }
    }, 1000)
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>