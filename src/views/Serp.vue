<template>


  <v-app id="serp-app">
    <div id="serp-app-inside">

      <v-app-bar
          app
          color="white"
          class="pl-0"
          :class="{mobile: $vuetify.breakpoint.mobile}"
          absolute
          flat
          height="75"

      >
        <div class="d-flex flex-fill justify-space-between align-center">
          <div class="d-flex flex-fill" style="max-width: 780px;">
            <router-link :to="{name: 'Serp', params: {entityType: $route.params.entityType}}" class="logo-link pl-0">
              <img
                  src="@/assets/openalex-logo-icon-black-and-white.png"
                  class="logo-icon mr-0 colorizable"
                  :style="logoStyle"
              />
              <span
                  class="logo-text colorizable"
                  v-if="!filterTypeKey"
                  :style="logoStyle"
              >
                OpenAlex
              </span>
            </router-link>
            <!--          {{ logoColorRotation }}-->
            <!--            <search-box class="ml-6 d-md-block d-none mt-1 flex-fill"/>-->
          </div>

          <div class="">
            <v-menu offset-y content-class="no-highlight" min-width="150">
              <template v-slot:activator="{on}">
                <v-btn icon color="" v-on="on">
                  <v-icon class="">mdi-menu</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item to="/">Home</v-list-item>
                <v-list-item href="/about">
                  About
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-app-bar>

      <facets-drawer @filter-type-key="setFilterTypeKey"/>


      <!--      <v-navigation-drawer-->
      <!--          :value="!!facetZoom && !$vuetify.breakpoint.mobile"-->
      <!--          right-->
      <!--          app-->
      <!--          dark-->
      <!--          width="300px"-->
      <!--          style="height: 100vh; overflow: hidden;"-->


      <!--      >-->
      <!--      </v-navigation-drawer>-->


      <v-main>

        <router-view></router-view>
        <div
            class="serp-container pt-0 pl-4"
            :class="{mobile: $vuetify.breakpoint.mobile}"
            style="max-width: 800px;"
        >
          <div
              style="margin-left: -15px"
              class="d-flex align-center"
          >
            <search-box class="px-3 flex-fill"/>
          </div>

          <div
              class="d-flex align-center mt-6"
          >
            <div
                class="ml-2 "
                v-if="resultsCount"
            >
              <span class="font-weight-bold">{{ resultsCount | toPrecision }}</span>
              <span class="ml-1">{{ entityType | pluralize(resultsCount) }}</span>
            </div>
            <v-spacer></v-spacer>
            <serp-toolbar></serp-toolbar>
          </div>

          <div class="search-results" style="margin-top: -10px">
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
          <div class="serp-bottom" v-if="$store.state.results.length">
            <v-pagination
                v-model="page"
                :length="numPages"
                :total-visible="10"
                light
            />
          </div>
        </div>


      </v-main>


      <v-footer
          class="py-10 site-footer"
          style="margin-top: 150px;"
          :style="{paddingRight: 0}"
          dark
          color="#363636"
          v-if="!searchIsLoading"
      >
        <v-container>
          <v-row>
            <v-col cols="12" sm="4">
              <div>
                <router-link to="/">Home</router-link>
              </div>
              <div>
                <a href="/about">
                  About
                </a>
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="text-center">
              <router-link to="/">
                <img class="site-footer-logo" src="@/assets/openalex-logo-icon-reverse.png" alt=""/>
              </router-link>
            </v-col>
            <v-col cols="12" sm="4" class="body-2">
              OurResearch is supported in part by <a
                style="text-decoration: underline;"
                href="https://www.arcadiafund.org.uk/">Arcadia&mdash;a
              charitable fund of Lisbet Rausing and Peter Baldwin</a>.
            </v-col>
          </v-row>
        </v-container>
      </v-footer>


      <v-dialog
          v-model="showFacetZoomDialog"
          scrollable
          dark
          fullscreen
      >
        <facet-zoom/>
      </v-dialog>


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
  </v-app>


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

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";
import Zoom from "../components/Zoom/Zoom";
import FacetsDrawer from "../components/Facet/FacetsDrawer";
import axios from "axios";
import ZoomEntity from "../components/Zoom/ZoomEntity";
import FacetZoom from "../components/Facet/FacetZoom";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityType)}
    if (this.$store.state.textSearch) ret.title = this.$store.state.textSearch
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    ZoomEntity,
    DownloadCsvDialog,
    SerpToolbar,
    ResultWork,
    ResultAuthor,
    ResultVenue,
    ResultInstitution,
    ResultConcept,
    Zoom,
    FacetsDrawer,
    FacetZoom

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
    logoStyle() {
      return "opacity: .7;"
      return `filter: contrast(1000%) invert(100%) sepia(100%) saturate(10000%) brightness(.5) hue-rotate(${this.logoColorRotation}deg);`
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
    logoColorRotation: {
      immediate: true,
      handler(to, from) {
        return
        setTimeout(() => {
          console.log("chaging logoColorRotation")
          const date = new Date()
          const seconds = date.getSeconds()
          const rotation = seconds * 18
          this.logoColorRotation = rotation

        }, 1000)
      }
    },
  }
}
</script>

<style lang="scss">


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