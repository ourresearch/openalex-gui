<template>
  <v-card
      flat
      class="serp-filters-list mt-12 pt"
  >


    <!--FILTERS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->

    <div class="d-flex align-center">
      <!--      <v-icon class="px-2">mdi-filter-outline</v-icon>-->
      <!--      <span class="mr-2">Search: </span>-->
      <!--      <search-box class=""/>-->

    </div>


    <div class="d-flex align-center">
      <!--      <v-btn-->
      <!--          fab x-small-->
      <!--          class="mr-2"-->
      <!--          color="primary"-->
      <!--          :outlined="filterDrawerIsOpen"-->
      <!--          @click="$emit('toggle-filter-drawer')"-->
      <!--      >-->
      <!--        <v-icon>mdi-filter</v-icon>-->
      <!--      </v-btn>-->

      <div
          class=""
           v-if="resultsCount"
      >
        <!--        <v-icon color="grey" class="ml-4" v-if="resultsFilters.length">mdi-filter-outline</v-icon>-->
        <span class="font-weight-bold">
<!--          {{(resultsCount < 1000) ? "About" : "" }}-->
          <!--          {{ resultsCount | millify(3) }}-->
          {{ resultsCount | toPrecision }}

        </span>
        <span>
          {{ entityType | pluralize(results.length) }}

          </span>


      </div>
      <v-spacer></v-spacer>


      <v-menu>
        <template v-slot:activator="{on}">
          <v-btn text v-on="on" class="low-key-button">
            Tools
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item
              @click="toggleFiltersDrawer"
          >
            <v-list-item-icon>
              <v-icon>mdi-filter-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-if="showFiltersDrawer">
                Hide filters
              </v-list-item-title>
              <v-list-item-title v-else>
                Filter results
              </v-list-item-title>
<!--              <v-list-item-subtitle class="grey&#45;&#45;text" v-if="$vuetify.breakpoint.mobile">-->
<!--                (Desktop-only for now)-->
<!--              </v-list-item-subtitle>-->
            </v-list-item-content>
          </v-list-item>

          <v-list-item
              @click="snackbar({msg: 'This feature is still under construction.', icon: 'mdi-wrench'})"
              :disabled="true"
          >
            <v-list-item-icon>
              <v-icon>mdi-bell-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Create alert
              </v-list-item-title>
              <v-list-item-subtitle
                  v-if="resultsCount > 100000"
                  class="grey--text"
              >
                (Under construction)
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>



          <v-subheader>Sort by</v-subheader>
          <v-divider/>
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

          <v-subheader>Export as:</v-subheader>
          <v-divider/>
          <v-list-item
              target="_blank"
              :href="searchApiUrl"
          >
            <v-list-item-icon>
              <v-icon>mdi-code-json</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                API response
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
              @click="openExportToCsvDialog"
              :disabled="resultsCount > 100000"
          >
            <v-list-item-icon>
              <v-icon
              >
                mdi-table
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Spreadsheet
              </v-list-item-title>
              <v-list-item-subtitle
                  v-if="resultsCount <= 100000"
              >
                CSV format
              </v-list-item-subtitle>
              <v-list-item-subtitle
                  v-if="resultsCount > 100000"
                  class="grey--text"
              >
                Max 100k results
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          ¬


        </v-list>
      </v-menu>


    </div>


    <!--    <v-divider v-if="$store.state.resultsFilters.length" class="mt-2"></v-divider>-->


    <!-- RESULTS TOOLBAR -->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <!--DIALOGS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-dialog max-width="600" v-model="dialogs.export">
      <v-card :loading="exportIsLoading">
        <v-card-title class="d-flex">
          <div>
            <v-icon left>mdi-tray-arrow-down</v-icon>
            Export results as spreadsheet
          </div>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogs.export = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider/>

        <div class="card-content px-6">

          <template v-if="exportIsInProgress">
            <div class="mt-4">
              Your export is in progress! We'll email it to you in under fifteen minutes; don't forget to check your
              spam folder.
            </div>
          </template>
          <template v-else>
            <div class="mt-8">
              <v-text-field
                  label="Your email (We won't share this)"
                  v-model="exportEmail"
                  type="email"
                  outlined
                  hide-details
                  prepend-inner-icon="mdi-email-outline"
                  @keypress.enter="exportToCsv"
                  :disabled="exportIsLoading"
              ></v-text-field>
            </div>
            <div class="mt-4">
              We'll prepare your spreadsheet and email it to you in under fifteen minutes. Don't forget to check your
              spam folder!
            </div>


          </template>
        </div>

        <v-card-actions class="py-6">
          <v-spacer></v-spacer>
          <v-btn
              :disabled="!exportEmailIsValid || exportIsLoading"
              text
              v-if="!exportIsInProgress"
              color="primary"
              @click="exportToCsv"
          >
            Begin Export
          </v-btn>
          <v-btn
              v-if="exportIsInProgress"
              text
              color="primary"
              @click="dialogs.export = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog max-width="600" v-model="dialogs.createAlert">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-bell-outline</v-icon>
          Create email alert
        </v-card-title>

        <div class="card-content px-6">
          <template v-if="createAlert.velocityIsLoading">
            Building alert...
          </template>
          <template v-else>

            the alert she is done.

          </template>
        </div>

        <v-card-actions class="py-6">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogs.export = false">Close</v-btn>
          <!--          <v-btn-->
          <!--              :disabled="!exportEmailIsValid"-->
          <!--              text-->
          <!--              v-if="resultsCount <= 100000 && !exportIsInProgress"-->
          <!--              color="primary"-->
          <!--              @click="exportToCsv"-->
          <!--          >-->
          <!--            Create Alert-->
          <!--          </v-btn>-->
        </v-card-actions>
      </v-card>
    </v-dialog>


  </v-card>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";
import {entityConfigs} from "../entityConfigs";
import EntityIcon from "./EntityIcon";
import axios from "axios";


export default {
  name: "SerpToolbar",
  components: {
    EntityIcon,
  },
  props: {
    filtersDrawerIsOpen: Boolean,
  },
  data() {
    return {
      loading: false,
      getFacetConfig,
      filterResultsTooltip: false,
      dialogs: {
        export: false,
        createAlert: false,
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
    ...mapGetters([
      "resultsFilters",
      "searchApiUrl",
      "searchQuery",
      "textSearch",
      "entityType",
      "results",
      "resultsCount",
      "inputFiltersAsString",
      "sortObjectOptions",
      "sortObject",
        "showFiltersDrawer",
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
  },
  methods: {
    ...mapMutations([
        "toggleFiltersDrawer",
        "snackbar",
    ]),
    ...mapActions([
      "removeInputFilters",
      "setSort"
    ]),
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
    getEntityIcon(facetKey) {
      const entityId = getFacetConfig(facetKey, "entityId")
      if (!entityId) return
      return entityConfigs[entityId].icon

    },
    openExportToCsvDialog() {
      this.exportIsInProgress = false
      this.dialogs.export = true
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
table.serp-filters-list {
  td {
    //align-items: baseline;
    vertical-align: unset;
  }
}

.serp-filters-list {
  .v-toolbar__content {
    //padding: 0 !important;
  }

}

</style>