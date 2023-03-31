<template>

  <div>

    <v-container style="margin-left: 0;">
      <v-row class="results-filters-row mb-10">
        <v-col cols="2"></v-col>
        <v-col cols="10" class="pa-0">
          <serp-filters-list/>
        </v-col>
      </v-row>
      <v-row class="serp-toolbar-row">
        <v-col cols="2"></v-col>
        <v-col cols="10">
          <serp-toolbar/>
        </v-col>
      </v-row>
      <v-divider class="mb-6"/>
      <v-row class="results-row">
        <v-col cols="2">
<!--          <facets-drawer/>-->
        </v-col>
        <v-col cols="10">
          <v-row v-if="!singleWorkIdToShow">
            <v-col :cols="(entitySidebarId) ? 7 : 12">
              <div v-if="!resultsCount" class="mt-8 grey--text">
                Sorry, there are no results for this search.
              </div>
              <div
                  v-for="result in $store.state.results"
                  class="result-container my-4"
                  :key="result.id"
              >
                <component :is="resultComponentName" :data="result"/>
              </div>
              <div class="serp-bottom" v-if="$store.state.results.length">
                <v-pagination
                    v-model="page"
                    :length="numPages"
                    :total-visible="10"
                    light
                />
              </div>
            </v-col>
            <v-col :cols="(entitySidebarId) ? 5 : 0">
              <zoom-entity :entity-id="entitySidebarId"/>
            </v-col>
          </v-row>

          <v-row v-if="!!singleWorkIdToShow">
            <zoom-entity :entity-id="singleWorkIdToShow"/>
          </v-row>


        </v-col>
      </v-row>


    </v-container>


    <div  id="serp-app-inside" class="d-flex ">




      <v-snackbar
          bottom
          v-model="$store.state.snackbarIsOpen"
      >
        <v-icon dark left v-if="$store.state.snackbarIcon">{{ $store.state.snackbarIcon }}</v-icon>
        {{ $store.state.snackbarMsg }}

        <template v-slot:action="{ attrs }">
          <v-btn
              icon
              v-bind="attrs"
              @click="$store.commit('closeSnackbar')"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </div>

  </div>


</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';
import FilterChip from "../components/FilterChip";
import millify from "millify";
import _ from 'lodash';


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import DownloadCsvDialog from "../components/DownloadCsvDialog";
import SerpToolbar from "../components/SerpToolbar";
import SerpFiltersList from "../SerpFiltersList";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultPublisher from "../components/ResultPublisher";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";
import Zoom from "../components/Zoom/Zoom";
import FacetsDrawer from "../components/Facet/FacetsDrawer";
import axios from "axios";
import ZoomEntity from "../components/Zoom/ZoomEntity";
import FacetZoom from "../components/Facet/FacetZoom";
import {entityConfigs} from "../entityConfigs";
import YearRange from "../components/YearRange";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityConfig.displayName)}
    if (this.$store.state.textSearch) ret.title = this.$store.state.textSearch
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    ZoomEntity,
    DownloadCsvDialog,
    SerpToolbar,
    SerpFiltersList,
    ResultWork,
    ResultAuthor,
    ResultVenue,
    ResultPublisher,
    ResultInstitution,
    ResultConcept,
    Zoom,
    FacetsDrawer,
    FacetZoom,
    YearRange,

  },
  props: {},
  data() {
    return {
      loading: false,
      filterDrawerIsOpen: true,
      apiResp: {},
      resultsPerPage: 25, // not editable now, but could be in future
      dialogs: {
        export: false,
        createAlert: false,
      },
      exportEmail: "",
      exportIsLoading: false,
      exportIsInProgress: false,
      createAlert: {
        velocityIsLoading: false
      },
      logoColorRotation: 0,
      showYearRange: true,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "searchFacetConfigs",
      "inputFiltersAsString",
      "entityZoomData",
      "searchIsLoading",
      "showFiltersDrawer",
      "facetZoom",
      "resultsCount",
      "entityType",
      "entityConfig",
      "resultsFilters",
    ]),
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
    numPages() {
      return Math.min(
          Math.ceil(this.$store.state.resultsCount / this.resultsPerPage),
          10
      )
    },
    entitySidebarId() {
      if (this.resultsFilters.length === 0) return
      if (this.entityType !== "works") return
      if (this.singleWorkIdToShow) return

      const sidebarFilters = this.resultsFilters.filter(f => f.showInSidebar)
      if (sidebarFilters.length !== 1) return

      return sidebarFilters[0].value
    },
    singleWorkIdToShow() {
      if (this.entityType !== "works") return
      const workId = this.resultsFilters.find(f => {
        return f.isId && f.entityType === "works"
      })?.value
      return workId

    },
    resultComponentName() {
      return "result-" + this.entityConfig.nameSingular

    },

    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
    },

    showFacetZoomDialog: {
      get() {
        return this.$vuetify.breakpoint.mobile && this.facetZoom
      },
      set(newVal) {
        if (!newVal) this.setFacetZoom(null)
      }
    },
    entityType() {
      return this.$route.params.entityType
    },
    facetsWithoutOptions() {
      return this.searchFacetConfigs.filter(f => f.noOptions)
    },

    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
    roundedResultsCount() {
      const asString = millify(
          this.$store.state.resultsCount,
          {precision: 0}
      )
      const asNumber = Number(
          asString
              .replace("K", "000")
              .replace("M", "000000")
      )
      return asNumber.toLocaleString()
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
      "setFacetZoom",
      "toggleFiltersDrawer",
    ]),
    ...mapActions([
      "updateTextSearch",
      "setEntityZoom",
    ]),

    handleClickOutside() {
      console.log("click outside!")
      // this.setFacetZoom(null)
    },
  },

  created() {
  },
  async mounted() {
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {
    "$route": {
      immediate: true,
      async handler(to, from) {
        const scrollTop = window.scrollY

        await this.$store.dispatch("bootFromUrl")
        if (to?.query?.zoom || from?.query?.qoom) {
          window.scroll(0, scrollTop)
        }
      }
    },
    // logoColorRotation: {
    //   immediate: true,
    //   handler(to, from) {
    //     return
    //     setTimeout(() => {
    //       console.log("chaging logoColorRotation")
    //       const date = new Date()
    //       const seconds = date.getSeconds()
    //       const rotation = seconds * 18
    //       this.logoColorRotation = rotation
    //
    //     }, 1000)
    //   }
    // },
  }
}
</script>

<style lang="scss">

.years-range-button {
  width: 40px;
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.v-app-bar.mobile {
  padding: 0 !important;
}

.serp-container.mobile {
  padding: 5px !important;
}

.serp-container {
  //max-width: 1500px;
  //display: flex;

  .facets-panel-container {
    //min-width: 353px;
    //max-width: 353px;
    //width: 350px;
    padding: 0px 40px 0 20px;
  }

  .results-panel-container {
    //max-width: 900px;
  }

}

</style>