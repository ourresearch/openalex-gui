<template>
  <div class="serp-page mt-2 pa-0">
    <div class="serp-container">
      <div class="facets-panel-container">
        <facets-panel/>
      </div>
      <div>
        <div class="search-results-meta" style="width: 100%;">

          <!--          <div v-for="(v, k) in $store.state.filters">{{k}}: {{v}}</div>-->
          <!--          <pre>{{ $store.state.resultsFilters }}</pre>-->

          <!--          <div class="applied-filters pt-3" v-if="$store.state.appliedFilterObjects.length">-->
          <!--            <filter-chip-->
          <!--                v-for="f in $store.state.appliedFilterObjects"-->
          <!--                :key="f.id"-->
          <!--                :filter="f"-->
          <!--                :filter-key="f.key"-->
          <!--                :filter-value="f.value"-->
          <!--                :filter-dispay-name="f.displayName"-->
          <!--                class="mr-2"-->
          <!--            >-->
          <!--              {{ f.key }}: {{ f.value }}-->
          <!--            </filter-chip>-->

          <!--          </div>-->

          <div class="d-flex align-end mb-2">
            <div class="body-1 grey--text">
              <span>{{ $store.state.resultsCount.toLocaleString() }} results </span>
              <span>({{ $store.state.responseTime / 1000 }} seconds)</span>
            </div>
            <v-spacer/>
            <div style="max-width: 130px; margin-right: 30px;">
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


            <v-menu offset-y>
              <template v-slot:activator="{on}">
                <v-btn icon v-on="on">
                  <v-icon color="gr">mdi-cloud-download-outline</v-icon>
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
                    @click="downloadCsvDialogIsOpen = true"
                >
                  <v-icon left>mdi-table</v-icon>
                  CSV
                </v-list-item>
              </v-list>
            </v-menu>


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


    <v-dialog v-model="downloadCsvDialogIsOpen">
      <v-card>
        <v-card-title>
          Download as CSV
        </v-card-title>
        <div class="pa-4">
          <div class="">Preparing your download now...</div>
          <div class="text-h1 font-weight-bold">0%</div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';
import FilterChip from "../components/FilterChip";


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import FacetsPanel from "../components/FacetsPanel";
import DownloadCsvDialog from "../components/DownloadCsvDialog";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";

export default {
  name: "Serp",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    FacetsPanel,
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
      downloadCsvDialogIsOpen: false,
      csvDownloadPercentComplete: 0,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
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
    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
    ]),
    downloadCsv() {
      this.downloadCsvDialogIsOpen = true
      this.csvDownloadPercentComplete = 0


      // make this work:

      // console.log("pollServer")
      // await this.refreshPublisherFileStatus(this.fileType)
      // while (this.myDataFile.status === "parsing") {
      // console.log("this.myDataFile.status", this.myDataFile.status)
      //   await this.refreshPublisherFileStatus(this.fileType)
      //   await sleep(1000)
      // }


    },
  },

  created() {
  },
  async mounted() {
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {}
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