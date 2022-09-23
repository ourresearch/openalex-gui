<template>
  <v-card
      flat
      class="mb-8 serp-filters-list"
  >
    <div class="d-flex align-baseline">
      <div
          class="subtitle-1"
      >
        <!--        <v-icon color="grey" class="ml-4" v-if="resultsFilters.length">mdi-filter-outline</v-icon>-->
        <span class=" font-weight-bold">
<!--          {{(resultsCount < 1000) ? "About" : "" }}-->
          {{ resultsCount | millify }}
          {{ entityType | pluralize(results.length) }}

        </span>
        <a
            v-if="resultsFilters.length > 0"
            @click="removeAllInputFilters"
        >
          (clear {{ "filter" | pluralize(resultsFilters.length) }})
        </a>
        <!--              <span>({{ $store.state.responseTime / 1000 }} seconds)</span>-->


      </div>
      <v-spacer></v-spacer>

      <!--      nesting tooltip and menu is confusing...see here for docs:-->
      <!--      https://vuetifyjs.com/en/components/menus/#activator-and-tooltip-->
      <v-menu>
        <template v-slot:activator="{ on: menu, attrs }">
          <v-tooltip bottom>
            <template v-slot:activator="{ on: tooltip }">
              <v-btn
                  icon
                  v-bind="attrs"
                  v-on="{ ...tooltip, ...menu }"
              >
                <v-icon>mdi-download-outline</v-icon>
              </v-btn>
            </template>
            <span>Export these {{ entityType }}</span>
          </v-tooltip>
        </template>
        <v-list>
          <v-subheader class="">Export these {{ entityType }} as:</v-subheader>
          <v-divider></v-divider>
          <v-list-item
              target="_blank"
              :href="searchApiUrl"
          >
            <v-list-item-icon>
              <v-icon left>mdi-code-json</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                API response
              </v-list-item-title>
              <v-list-item-subtitle>
                JSON format
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
              @click="openExportToCsvDialog"
              :disabled="resultsCount > 100000"
          >
            <v-list-item-icon>
              <v-icon
                  left
                  :color="(resultsCount > 100000) ? 'grey' : null"
              >
                mdi-table
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Spreadsheet
              </v-list-item-title>
              <v-list-item-subtitle
                  :class="(resultsCount > 100000) ? 'grey--text' : ''"
              >
                CSV format
              </v-list-item-subtitle>
              <v-list-item-subtitle
                  v-if="resultsCount > 100000"
                  class="grey--text font-weight-bold"
              >
                Max 100k results
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
          icon
          @click="openCreateAlertDialog"
      >
        <v-icon>mdi-bell-outline</v-icon>
      </v-btn>

      <v-select
          v-model="sort"
          item-text="displayName"
          item-value="key"
          :items="$store.getters.sortObjectOptions"
          dense
          background-color="#fff"
          hide-details
          prepend-inner-icon="mdi-sort-descending"
          style="max-width: 180px;"
          class="ml-4 align-center"

      ></v-select>


    </div>

    <!--FILTERS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-card
        v-if="$store.state.resultsFilters.length" class="pt-2 pb-1 px-5 mt-5"
        outlined
    >
      <v-row>
        <v-col cols="9" class="pl-0">
          <table class="serp-filters-list">
            <tr
                v-for="f in $store.state.resultsFilters"
                :key="f.id"
            >
              <td>
                <v-btn
                    icon
                    small
                    class="align-baseline"
                    @click="removeInputFilters([f])"
                >
                  <v-icon small>mdi-close</v-icon>
                </v-btn>

              </td>
              <td class="filter-key  pr-1">
                {{ f.displayName }}:
              </td>
              <td class="filter-value">
                <router-link
                    v-if="f.isEntity"
                    :to="f.value | zoomLink"
                    class="text-decoration-none"
                >
                  <entity-icon :id="f.value" small color="primary"/>
                  {{ f.displayValue }}
                </router-link>
                <span v-else>
                  <flag
                      :squared="false"
                      :iso="f.value"
                      style="height:12px; vertical-align: -2px;"
                      v-if="f.isCountry"
                  />
                  {{ f.displayValue | prettyName }}
                </span>
              </td>
            </tr>
          </table>
        </v-col>
        <v-col cols="3" class="d-flex justify-end">

        </v-col>
      </v-row>

    </v-card>
    <!--    <v-divider class="my-4"></v-divider>-->


    <!--DIALOGS-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->
    <!--*****************************************************************************************-->


    <v-dialog max-width="600" v-model="dialogs.export">
      <v-card :loading="exportIsLoading">
        <v-card-title class="d-flex">
          <div>
          <v-icon left>mdi-download-outline</v-icon>
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
              Your export is in progress! We'll email it to you in under fifteen minutes; don't forget to check your spam folder.
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
              We'll prepare your spreadsheet and email it to you in under fifteen minutes. Don't forget to check your spam folder!
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
  props: {},
  data() {
    return {
      loading: false,
      getFacetConfig,
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
      "entityType",
      "results",
      "resultsCount",
      "inputFiltersAsString",
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
    ...mapMutations([]),
    ...mapActions([
      "removeAllInputFilters",
      "removeInputFilters",
    ]),
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
  watch: {}
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