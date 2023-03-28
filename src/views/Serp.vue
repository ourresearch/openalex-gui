<template>


    <div id="serp-app-inside" class="d-flex ">



      <facets-drawer
          @filter-type-key="setFilterTypeKey"
          style="width: 230px; "
      />


      <!--      <v-navigation-drawer-->
      <!--          :value="!!facetZoom && !$vuetify.breakpoint.mobile"-->
      <!--          right-->
      <!--          app-->
      <!--          dark-->
      <!--          width="300px"-->
      <!--          style="height: 100vh; overflow: hidden;"-->


      <!--      >-->
      <!--      </v-navigation-drawer>-->



<!--        <router-view></router-view>-->
        <div
            class="serp-container pt-0 pl-4 mr-10 pt-12"
            :class="{mobile: $vuetify.breakpoint.mobile}"
            style="min-height: calc(100vh - 250px); max-width: 600px;"
        >

          <div
              class="search-box-row d-flex align-center"
              style="margin-left: -10px"
          >
            <search-box v-if="$vuetify.breakpoint.mobile" class="px-3 flex-fill"/>
          </div>

          <div class="pt-3">
            <serp-filters-list></serp-filters-list>
          </div>
          <div
              class="serp-toolbar-row d-flex align-center pt-2 pr-2"
              style="min-height: 50hv;"
          >
            <div
                class="mt-2 d-flex"
                v-if="resultsCount >= 0"
            >
              <div
                  v-if="0"
                  class="years-range-button"
                  v-ripple
                  @click="$store.state.showYearRange = !$store.state.showYearRange"
              >
                <year-range
                    height="20px"
                    width="20px"
                    v-if="entityType==='works'"
                    disabled
                >
                </year-range>
                <v-icon v-else>mdi-chevron-up</v-icon>
              </div>
              <span class="font-weight-bold ml-4">{{ resultsCount | toPrecision }}</span>
              <span class="ml-1">{{ selectedEntityTypeConfig.displayName | pluralize(resultsCount) }}</span>
            </div>
            <v-spacer></v-spacer>
            <serp-toolbar></serp-toolbar>
          </div>
          <div class="year-range-panel" >
            <year-range
                class="my-3 mb-6"
                v-if="$store.state.showYearRange && entityType==='works'"
                :big="true"
            ></year-range>
          </div>


          <div class="search-results-row ml-4">
            <div v-if="!resultsCount" class="mt-8 grey--text">
              Sorry, there are no results for this search.
            </div>


            <div
                v-for="result in $store.state.results"
                class="result-container my-4"
                :key="result.id"
            >
              <result-work v-if="$store.state.entityType === 'works'" :data="result"/>
              <result-author v-if="$store.state.entityType === 'authors'" :data="result"/>
              <result-venue v-if="$store.state.entityType === 'sources'" :data="result"/>
              <result-publisher v-if="$store.state.entityType === 'publishers'" :data="result"/>
              <result-institution v-if="$store.state.entityType === 'institutions'" :data="result"/>
              <result-concept v-if="$store.state.entityType === 'concepts'" :data="result"/>
            </div>
          </div>
          <div class="serp-bottom" v-if="$store.state.results.length">
            <v-pagination
                v-model="page"
                :length="numPages"
                :total-visible="10"
                light
            />
          </div>
        </div>

      <div class="entity-sidebar mt-10" style="max-width: 400px; min-width: 300px;">
        <zoom-entity :entity-id="entitySidebarId" />

      </div>







<!--      <v-dialog-->
<!--          v-model="showFacetZoomDialog"-->
<!--          scrollable-->
<!--          dark-->
<!--          fullscreen-->
<!--      >-->
<!--        <facet-zoom/>-->
<!--      </v-dialog>-->


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
      filterTypeKey: null,
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
    entitySidebarId(){
      if (!this.resultsFilters.length > 0) return
      if (this.entityType !== "works") return
      if (this.resultsFilters[0].showInSidebar) {
        return this.resultsFilters[0].value
      }

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
    setFilterTypeKey(filterTypeKey) {
      this.filterTypeKey = filterTypeKey
    },

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