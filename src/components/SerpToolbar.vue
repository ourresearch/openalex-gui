<template>
  <v-card
      flat
      class="mb-8 serp-filters-list"
  >
    <div class="d-flex align-baseline">
      <div
          class="subtitle-1 grey--text"
      >
        <v-icon color="grey" class="ml-4" v-if="resultsFilters.length">mdi-filter-outline</v-icon>
        <span>
<!--          {{($store.state.resultsCount < 1000) ? "About" : "" }}-->
          {{ $store.state.resultsCount | millify }} results
        </span>
        <!--              <span>({{ $store.state.responseTime / 1000 }} seconds)</span>-->


      </div>
      <v-spacer></v-spacer>
      <v-btn
          icon
          v-if="resultsFilters.length > 0"
          @click="removeAllInputFilters"
      >
        <v-icon>mdi-filter-off-outline</v-icon>
        <!--            <v-icon>mdi-filter-remove-outline</v-icon>-->
      </v-btn>


      <v-menu offset-y>
        <template v-slot:activator="{on}">
          <v-btn icon v-on="on">
            <!--              <v-icon>mdi-download-outline</v-icon>-->
            <v-icon>mdi-table-arrow-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-subheader>Export these results as:</v-subheader>
          <v-list-item
              target="_blank"
              :href="searchApiUrl"
          >
            <v-icon left>mdi-code-json</v-icon>
            JSON
          </v-list-item>
          <v-list-item
              @click="openExportToCsvDialog"
          >
            <v-icon left>mdi-table</v-icon>
            CSV
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
    <!--    <v-divider></v-divider>-->
    <v-card
        v-if="$store.state.resultsFilters.length" class="py-3 px-3 mt-7"
        outlined
    >
      <v-row>
        <v-col cols="9">
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
                  <v-icon>mdi-close</v-icon>
                </v-btn>

              </td>
              <td class="filter-key  pr-1">
                {{ getFacetConfig(f.key, "displayName") }}:
              </td>
              <td class="filter-value">
                <template v-if="getFacetConfig(f.key, 'entityId')">
                  <!--            <v-icon style="vertical-align: unset" small>{{getEntityIcon(f.key)}}</v-icon>-->
                  {{ f.displayValue }}
                </template>
                <template v-else>
                  {{ f.displayValue }}
                </template>
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
        <v-card-title>
          <v-icon left>mdi-download-outline</v-icon>
          Export results as CSV
        </v-card-title>

        <div class="card-content px-6">
          <template v-if="$store.state.resultsCount > 100000">
            <v-alert outlined text type="error" class="mb-0">
              <p class="font-weight-bold">
                Too many results to export
              </p>
              <p>
                Sorry, but you can only export 100,000 results at a time to CSV. Try refining your search, or splitting
                it into two searches and exporting them individually.
              </p>
            </v-alert>
          </template>
          <template v-else>

            <template v-if="exportIsInProgress">
              <v-alert outlined text type="error" class="mb-0">
                <p class="font-weight-bold">
                  This export is still in progress
                </p>
                <p>
                  We're still making this CSV export file for you...it can take up to 15 minutes. When it's complete,
                  we'll email a download link to the address you provided.
                </p>
                <p>
                  <strong>Tip:</strong>
                  Don't forget to check your spam folder for the email!
                </p>
              </v-alert>
            </template>
            <template v-else>
              <div class="">
                It'll take us up to 15 minutes to prepare your CSV export. When we're done, we'll email you a link where
                you can
                download it
              </div>
              <div class="mt-6">
                <strong>Tip:</strong>
                Make sure to check your spam folder for the email!
              </div>
              <div class="mt-8">
                <v-text-field
                    label="Your email"
                    v-model="exportEmail"
                    placeholder="you@example.com"
                    type="email"
                    outlined
                    hide-details
                    prepend-inner-icon="mdi-email-outline"
                    @keypress.enter="exportToCsv"
                    :disabled="exportIsLoading"
                ></v-text-field>
              </div>
              <div class="body-2 mt-2">
                We'll only use this address to send you your requested download link, and we'll never share it with
                anyone.
              </div>
            </template>

          </template>
        </div>

        <v-card-actions class="py-6">
          <v-spacer></v-spacer>
          <v-btn text @click="dialogs.export = false">Close</v-btn>
          <v-btn
              :disabled="!exportEmailIsValid || exportIsLoading"
              text
              v-if="$store.state.resultsCount <= 100000 && !exportIsInProgress"
              color="primary"
              @click="exportToCsv"
          >
            Begin Export
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
          <!--              v-if="$store.state.resultsCount <= 100000 && !exportIsInProgress"-->
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
import axios from "axios";


export default {
  name: "SerpToolbar",
  components: {},
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
      this.exportEmail = ""
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
      const url = `https://api.openalex.org/works?filter=${this.inputFiltersAsString}&format=csv`
      this.exportIsLoading = true
      try {
        const resp = await axios.get(url)
        console.log("exportToCsv submitted", resp.data)
        this.snackbar("Export job submitted.")
      } catch (e) {
        console.log("exportToCsv error", e)
        this.exportIsInProgress = true
      } finally {
        this.exportIsLoading = false
        this.dialogs.export = false
        this.exportEmail = ""
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