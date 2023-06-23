<template>
  <v-toolbar
          class=""
          flat
          extended
  >
    <!--    <v-icon left>-->
    <!--      mdi-file-document-outline-->
    <!--    </v-icon>-->
    <v-toolbar-title>
      <v-icon left>{{ selectedEntityTypeConfig.icon }}</v-icon>
      <span class="ml-1 text-capitalize">{{ selectedEntityTypeConfig.displayName | pluralize(resultsCount) }}</span>
    </v-toolbar-title>
    <v-spacer/>


    <!--      <v-btn-->
    <!--          fab x-small-->
    <!--          class="mr-2"-->
    <!--          color="primary"-->
    <!--          :outlined="filterDrawerIsOpen"-->
    <!--          @click="$emit('toggle-filter-drawer')"-->
    <!--      >-->
    <!--        <v-icon>mdi-filter</v-icon>-->
    <!--      </v-btn>-->
    <template v-if="!$vuetify.breakpoint.mobile">

      <!--        Sort-->
      <v-menu offset-y>
        <template v-slot:activator="{on}">
          <v-btn text rounded v-on="on" class="low-key-button" :disabled="disabled">
            <span class="mr-1">Sort by</span>
            {{ sortObject.displayName }}
            <v-icon right class="">mdi-menu-down</v-icon>
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


      <v-menu offset-y>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on" class="" :disabled="disabled">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <!--            <v-subheader>Export results as:</v-subheader>-->
          <!--            <v-divider></v-divider>-->
          <v-list-item
                  @click="openExportToCsvDialog"
                  :disabled="resultsCount > 100000"
          >
            <v-list-item-icon>
              <v-icon
                      :disabled="resultsCount > 100000"
              >
                mdi-tray-arrow-down
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Export as spreadsheet
              </v-list-item-title>
              <v-list-item-subtitle
                      v-if="resultsCount > 100000"
                      class="grey--text"
              >
                Max 100k results
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
                  @click="setApiDialogUrl(searchApiUrlForDisplay)"
          >
            <v-list-item-icon>
              <v-icon>mdi-api</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              View in API
            </v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item
                  @click="saveSearch"
          >
            <v-list-item-icon>
              <v-icon>mdi-content-save-plus-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Save search
            </v-list-item-title>
          </v-list-item>

          <v-list-item
                  @click="dialogs.createEmailAlert = true"
          >
            <v-list-item-icon>
              <v-icon>mdi-email-plus-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Create alert for search
            </v-list-item-title>
          </v-list-item>


        </v-list>
      </v-menu>

    </template>


    <v-menu v-if="$vuetify.breakpoint.mobile">
      <template v-slot:activator="{on}">
        <v-btn text v-on="on" class="low-key-button" :disabled="disabled || !resultsCount">
          Tools
          <v-icon>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list dense>
        <v-list-item
                @click="toggleFiltersDrawer"
                v-if="$vuetify.breakpoint.mobile"
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
                :href="searchApiUrlForDisplay"
        >
          <v-list-item-icon>
            <v-icon>mdi-api</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              JSON object
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
                    v-if="resultsCount > 100000"
                    class="grey--text"
            >
              Max 100k results
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>


      </v-list>
    </v-menu>


    <!--DIALOGS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-dialog max-width="600" v-model="dialogs.export">
      <v-card :loading="exportIsLoading">
        <v-card-title class="d-flex">
          <div>
            <v-icon left>mdi-tray-arrow-down</v-icon>
            Export spreadsheet
          </div>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialogs.export = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

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
                      label="Your email (never shared)"
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
              We'll prepare your spreadsheet and email it to you in around fifteen minutes. Don't forget to check your
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


    <v-dialog max-width="600" v-model="dialogs.createSavedSearch">
      <serp-toolbar-saved-search @close="dialogs.createSavedSearch = false"/>
    </v-dialog>

    <v-dialog max-width="600" v-model="dialogs.createEmailAlert">
      <serp-toolbar-email-alert @close="dialogs.createEmailAlert = false"/>
    </v-dialog>


    <template v-slot:extension>
      <div class="grey--text">
        <span class="">{{ resultsCount | toPrecision }}</span> results

      </div>

    </template>


  </v-toolbar>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';

import YearRange from "../YearRange.vue"
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {entityConfigs} from "../../entityConfigs";
import EntityIcon from "../EntityIcon.vue";
import axios from "axios";
import SerpToolbarSavedSearch from "@/components/SerpToolbar/SerpToolbarSavedSearch.vue";
import SerpToolbarEmailAlert from "@/components/SerpToolbar/SerpToolbarEmailAlert.vue";

export default {
    name: "SerpToolbar",
    components: {
        EntityIcon,
        YearRange,
        SerpToolbarSavedSearch,
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
                createEmailAlert: false,
                createSavedSearch: false,
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


</style>