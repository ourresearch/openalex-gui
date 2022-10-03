<template>


  <v-app>
    <v-app-bar
        app
        color="white"
        class="px-4"
        absolute
        flat

    >
      <div class="d-flex flex-fill justify-space-between align-center">
        <div class="d-flex flex-fill">
          <v-col cols="4" class="logo-section d-none d-md-block">
            <router-link to="/" class="logo-link">
              <img
                  src="@/assets/openalex-logo-icon.png"
                  class="logo-icon"
              />
              <span class="logo-text">
                OpenAlex
              </span>
            </router-link>
          </v-col>
          <v-col cols="12" md="8" class="px-0 d-flex">
            <router-link to="/" class="logo-link pr-4 d-md-none">
              <img
                  src="@/assets/openalex-logo-icon.png"
                  class="logo-icon"
              />
            </router-link>
            <!--            <search-box v-if="$route.name !== 'Home'"/>-->
          </v-col>
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

    <v-navigation-drawer
        app
        width="400"
        v-model="filterDrawerIsOpen"
    >
      <zoom-filter @close="filterDrawerIsOpen = false"/>
    </v-navigation-drawer>


    <v-main>

    <div class="serp-container d-flex px-10"
         v-if="$store.state.resultsCount !== null"
         style="max-width: 900px;"
    >


      <div class="search-results-meta" style="width: 100%;">
        <serp-toolbar
            @open-filter-drawer="filterDrawerIsOpen = true"
            :filter-drawer-is-open="filterDrawerIsOpen"
        />
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
        <div class="serp-bottom" v-if="$store.state.results.length">
          <v-pagination
              v-model="page"
              :length="numPages"
              :total-visible="10"
              light
          />
        </div>
      </div>
    </div>


    </v-main>


    <v-footer
        class="py-10 site-footer"
        style="margin-top: 150px;"
        :style="{paddingRight: 0}"
        dark
        color="#555"
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


    <v-snackbar
        bottom
        v-model="$store.state.snackbarIsOpen">
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
  </v-app>


  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';
import FilterChip from "../components/FilterChip";
import millify from "millify";
import _ from 'lodash';


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import Facet from "../components/Facet/Facet";
import DownloadCsvDialog from "../components/DownloadCsvDialog";
import SerpToolbar from "../components/SerpToolbar";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";
import Zoom from "../components/Zoom/Zoom";
import ZoomFilter from "../components/Zoom/ZoomFilter";
import axios from "axios";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityType)}
    if (this.$store.state.textSearch) ret.title = this.$store.state.textSearch
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    Facet,
    DownloadCsvDialog,
    SerpToolbar,
    ResultWork,
    ResultAuthor,
    ResultVenue,
    ResultInstitution,
    ResultConcept,
    Zoom,
    ZoomFilter,
  },
  props: {},
  data() {
    return {
      loading: false,
      filterDrawerIsOpen: true,
      apiResp: {},
      filterTypeKey: null,
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
      }
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "searchFacetConfigs",
      "inputFiltersAsString",
      "entityZoomData",
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
    ]),
    ...mapActions([
      "updateTextSearch",
      "setEntityZoom",
    ]),
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
    }
  }
}
</script>

<style scoped lang="scss">
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