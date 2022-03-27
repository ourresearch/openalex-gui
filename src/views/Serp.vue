<template>
  <div class="serp-page mt-2 pa-0">

    <div class="serp-container">
      <div class="facets-panel-container">
        <facet
            v-for="facet in searchFacetConfigs"
            :key="facet.key"
            :facet-key="facet.key"
        ></facet>
      </div>
      <div class="flex-fill" v-if="$store.state.resultsCount !== null">
        <div class="search-results-meta" style="width: 100%;">
          <!--          <pre>{{ $store.state.resultsFilters }}</pre>-->

          <!--          <div v-for="(v, k) in $store.state.filters">{{ k }}: {{ v }}</div>-->

          <div class="applied-filters pt-3" v-if="$store.state.resultsFilters.length">
            <filter-chip
                v-for="f in $store.state.resultsFilters"
                :key="f.id"
                :filter-key="f.key"
                :filter-value="f.value"
                :filter-display-value="f.displayValue"
                class="mr-2"
            >
            </filter-chip>

          </div>

          <div class="d-flex align-end mb-2">
            <div class="body-1 grey--text">
              <span>{{ $store.state.resultsCount.toLocaleString() }} results </span>
              <span>({{ $store.state.responseTime / 1000 }} seconds)</span>
            </div>
            <v-spacer/>


            <v-menu offset-y>
              <template v-slot:activator="{on}">
                <v-btn text small v-on="on">
                  <v-icon small left>mdi-download-outline</v-icon>
                  export
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
                text
                small
                @click="openCreateAlertDialog"
            >
              <v-icon small left>mdi-bell-outline</v-icon>
              Create alert
            </v-btn>


            <div style="max-width: 130px; margin: 0 20px; padding-bottom: 3px;">
              <v-select
                  v-model="sort"
                  item-text="displayName"
                  item-value="key"
                  :items="$store.getters.sortObjectOptions"
                  label="Sort by"
                  dense
                  hide-details

              ></v-select>
            </div>


          </div>


          <div>
            <div
                v-for="result in $store.state.results"
                class="result-container my-4"
                :key="result.id"
            >
              <result-work v-if="$store.state.entityType === 'works'" :data="result"/>
              <result-author v-if="$store.state.entityType === 'authors'" :data="result"/>
              <result-venue v-if="$store.state.entityType === 'venues'" :data="result"/>
              <result-institution v-if="$store.state.entityType === 'institutions'" :data="result"/>
              <result-concept v-if="$store.state.entityType === 'concepts'" :data="result"/>
            </div>
          </div>
          <div class="serp-bottom">
            <v-pagination
                v-model="page"
                :length="10"
            />
          </div>

        </div>
      </div>
    </div>


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


  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';
import FilterChip from "../components/FilterChip";


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import Facet from "../components/Facet/Facet";
import DownloadCsvDialog from "../components/DownloadCsvDialog";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";
import axios from "axios";

export default {
  name: "Serp",
  metaInfo() {
    return {
      title: this.$store.state.textSearch || `All ${this.entityType}`
    }
  },
  components: {
    Facet,
    DownloadCsvDialog,
    FilterChip,
    ResultWork,
    ResultAuthor,
    ResultVenue,
    ResultInstitution,
    ResultConcept,
  },
  props: {},
  data() {
    return {
      loading: false,
      apiResp: {},
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
      "searchApiUrl",
      "searchFacetConfigs",
      "inputFiltersAsString",
    ]),
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
    sort: {
      get() {
        return this.$store.getters.sortObject
      },
      set(val) {
        this.$store.dispatch("setSort", val)
      }
    },
    entityType() {
      return this.$route.params.entityType
    },
    zoomId() {
      return this.$route.params.id
    },
    facetsWithOptions() {
      return this.searchFacetConfigs.filter(f => !f.noOptions)
    },
    facetsWithoutOptions() {
      return this.searchFacetConfigs.filter(f => f.noOptions)
    },
    exportEmailIsValid() {
      return /.+@.+/.test(this.exportEmail)
    },
    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "updateTextSearch",
      "setEntityZoom",
    ]),
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
    console.log("mount serp")
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {
    "$route": {
      immediate: true,
      handler(to, from) {
        console.log("serp route change", to.params, from)
        if (to.params.id) {
          this.setEntityZoom(to.params.id)
        } else {
          console.log("there's no entity zoom")
          this.$store.dispatch("bootFromUrl")

        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
.serp-container {
  max-width: 1500px;
  display: flex;

  .facets-panel-container {
    min-width: 353px;
    max-width: 353px;
    padding: 34px 40px 0 20px;
  }

}

</style>