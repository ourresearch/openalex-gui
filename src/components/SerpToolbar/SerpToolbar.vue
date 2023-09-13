<template>
  <v-toolbar
      dark
  >
    <v-toolbar-title>
      Results
      <!--      <span class="body-2">{{resultsCount | toPrecision }}</span>-->
    </v-toolbar-title>

    <v-spacer/>


    <!--DIALOGS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-dialog persistent max-width="400" v-model="dialogs.export">
      <v-card :loading="exportIsLoading">
        <v-card-title class="d-flex">
          <div>
            <v-icon left>mdi-tray-arrow-down</v-icon>
            Export spreadsheet ({{ dialogs.exportType }})
          </div>
          <v-spacer></v-spacer>
        </v-card-title>

        <div class="card-content pa-6">

          <template v-if="exportIsInProgress">
            <div class="mt-4">
              Your export is in progress! We'll email it to you in under fifteen minutes; don't forget to check your
              spam folder.
            </div>
          </template>
          <template v-else>
            <div>
              Your export will take about 10 minutes to process. Continue?
            </div>


          </template>
        </div>

        <v-card-actions class="">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogs.export = false">
            Cancel
          </v-btn>
          <v-btn
              :loading="exportIsInProgress"
              text
              color="primary"
              @click="exportToCsv"
          >
            Continue
          </v-btn>
<!--          <v-btn-->
<!--              v-if="exportIsInProgress"-->
<!--              text-->
<!--              color="primary"-->
<!--              @click="dialogs.export = false"-->
<!--          >-->
<!--            Close-->
<!--          </v-btn>-->
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog max-width="600" v-model="dialogs.createEmailAlert">
      <serp-toolbar-email-alert v-if="userId" @close="dialogs.createEmailAlert = false"/>
      <v-card v-else>
        <v-card-title>
          Login required
        </v-card-title>
        <v-card-text>
          You can only create alerts if you're logged to your account.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="dialogs.createEmailAlert = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog max-width="600" v-model="dialogs.error.exportCsvTooManyRecords">
      <v-card>
        <v-card-title>
          Too many records to export
        </v-card-title>
        <v-card-text>
          You can only export 100,000 records to CSV at one time. Try adding some more filters to narrow your search.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="dialogs.error.exportCsvTooManyRecords = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <!-- MENU ITEMS-->
    <!-- these have to be at the end to line up right -->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-menu>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on" class="" :disabled="disabled">
          <v-icon class="">mdi-sort-ascending</v-icon>
        </v-btn>
      </template>
      <v-list dense>
        <v-subheader>Sort by</v-subheader>
        <v-divider></v-divider>
        <v-list-item
            v-for="mySortOption in $store.getters.sortObjectOptions"
            :key="mySortOption.key"
            @click="setSort(mySortOption.key)"
        >
          <v-list-item-icon>
            <v-icon>
              {{ (sortObject.key === mySortOption.key) ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ mySortOption.displayName }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>


    <v-menu>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on" class="" :disabled="disabled">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-menu offset-x open-on-hover>
          <template v-slot:activator="{on}">
            <v-list-item
                v-on="on"
            >
              <v-list-item-icon>
                <v-icon>
                  mdi-tray-arrow-down
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  Download results
                </v-list-item-title>
                <v-list-item-subtitle>
                  Max 100k
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
          <v-list>
            <v-list-item @click="openExportToCsvDialog('csv')">
              <v-list-item-title>
                Spreadsheet (.csv)
              </v-list-item-title>
            </v-list-item>
            <v-list-item  @click="openExportToCsvDialog('wos')">
              <v-list-item-title>
                Web of Science (.txt)
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-list-item
            @click="setApiDialogUrl(searchApiUrlForDisplay)"
        >
          <v-list-item-icon>
            <v-icon>
              mdi-api
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              View in API
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>


        <!--          <v-divider></v-divider>-->
        <!--          <v-list-item-->
        <!--              @click="saveSearch"-->
        <!--          >-->
        <!--            <v-list-item-icon>-->
        <!--              <v-icon>mdi-content-save-plus-outline</v-icon>-->
        <!--            </v-list-item-icon>-->
        <!--            <v-list-item-title>-->
        <!--              Save search-->
        <!--            </v-list-item-title>-->
        <!--          </v-list-item>-->

        <!--          <v-list-item-->
        <!--              @click="dialogs.createEmailAlert = true"-->
        <!--          >-->
        <!--            <v-list-item-icon>-->
        <!--              <v-icon>mdi-email-plus-outline</v-icon>-->
        <!--            </v-list-item-icon>-->
        <!--            <v-list-item-title>-->
        <!--              Create alert for search-->
        <!--            </v-list-item-title>-->
        <!--          </v-list-item>-->


      </v-list>
    </v-menu>


  </v-toolbar>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import YearRange from "../YearRange.vue"
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {entityConfigs} from "../../entityConfigs";
import EntityIcon from "../Entity/EntityIcon.vue";
import axios from "axios";
import SerpToolbarEmailAlert from "@/components/SerpToolbar/SerpToolbarEmailAlert.vue";

export default {
  name: "SerpToolbar",
  components: {
    EntityIcon,
    YearRange,
    SerpToolbarEmailAlert,
  },
  props: {
    filtersDrawerIsOpen: Boolean,
    disabled: Boolean,
  },
  data() {
    return {
      loading: false,
      getFacetConfig,
      filterResultsTooltip: false,
      dialogs: {
        export: false,
        exportType: false,
        createEmailAlert: false,
        error: {
          savedSearchRequiresLogin: false,
          createAlertRequiresLogin: false,
          exportCsvTooManyRecords: false,
        }
      },
      exportEmail: "",
      exportIsLoading: false,
      exportIsInProgress: false,
      createAlert: {
        velocityIsLoading: false
      }
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters([
      "resultsFilters",
      "searchApiUrlForDisplay",
      "searchQuery",
      "textSearch",
      "entityType",
      "results",
      "resultsCount",
      "inputFiltersAsString",
      "sortObjectOptions",
      "sortObject",
      "showFiltersDrawer",
      "entityConfigs",
    ]),

    sort: {
      get() {
        return this.$store.getters.sortObject
      },
      set(val) {
        this.$store.dispatch("setSort", val)
      }
    },
    exportEmailIsValid() {
      return /.+@.+/.test(this.exportEmail)
    },

    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
    },
  },
  methods: {
    ...mapMutations([
      "toggleFiltersDrawer",
      "snackbar",
      "setApiDialogUrl",
      "setGlobalIsLoading",
    ]),
    ...mapActions([
      "setSort",
    ]),
    async saveSearch() {
      this.setGlobalIsLoading(true)
      const args = {
        search_url: 'https://alpha.openalex.org' + this.$route.fullPath
      }
      await this.$store.dispatch("user/createSavedSearch", args)
      this.snackbar("Search saved")
      this.setGlobalIsLoading(false)
    },
    removeTextSearch() {
      this.$router.push({
        name: "Serp",
        query: {filter: this.$route.query.filter}
      })
    },
    removeFiltersAndSearch() {
      this.$router.push({
        name: "Serp",
      })
    },
    openExportToCsvDialog(type) {
      if (this.resultsCount > 100000) {
        this.dialogs.error.exportCsvTooManyRecords = true
        return
      }
      this.exportIsInProgress = false
      this.dialogs.export = true
      this.dialogs.exportType = type
    },
    async openCreateAlertDialog() {
      this.dialogs.createAlert = true
      this.createAlert.velocityIsLoading = true

      // check the velocity endpoint
      const url = `https://api.openalex.org/alert/work/${this.inputFiltersAsString}/velocity`
      const resp = await axios.get(url)
      console.log("openCreateAlertDialog velocity:", resp.data)

    },
    async exportToCsv() {
      const params = [
        `filter=${this.inputFiltersAsString}`,
        `email=${this.exportEmail}`,
        "format=csv",
      ]
      const url = `https://api.openalex.org/works?` + params.join("&")
      this.exportIsLoading = true
      try {
        const resp = await axios.get(url)
        console.log("exportToCsv submitted", resp.data)
        // this.snackbar("Export job submitted.")
      } catch (e) {
        console.log("exportToCsv error", e)
      } finally {
        this.exportIsInProgress = true
        this.exportIsLoading = false
        // this.dialogs.export = false
        // this.exportEmail = ""
      }
    },
  },

  created() {
  },
  async mounted() {
  },
  watch: {
    "$route": function (to, from) {
      // hack.
      // otherwise the tooltip on the "filter results" button returns when you close the zoom, for some reason.
      if (!to.query.zoom) {
        const that = this
        setTimeout(function () {
          that.filterResultsTooltip = false
        }, 10)
      }
    }
  }
}
</script>

<style lang="scss">


</style>