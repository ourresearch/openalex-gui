<template>
  <div class="serp-page mt-4 pa-0">


    <div class="serp-container d-flex" style="width: 1100px;">
      <v-col cols="3" class="facets-panel-container">
        <facet
            v-for="facet in searchFacetConfigs"
            :key="facet.key"
            :facet-key="facet.key"
        ></facet>
      </v-col>


      <v-col
          cols="9"
          class="results-panel-container flex-fill mt-6"
          v-if="$store.state.resultsCount !== null"
      >
        <div class="search-results-meta" style="width: 100%;">
          <serp-toolbar  />
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
      </v-col>

      <entity-zoom/>
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

import Facet from "../components/Facet/Facet";
import DownloadCsvDialog from "../components/DownloadCsvDialog";
import SerpToolbar from "../components/SerpToolbar";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";
import EntityZoom from "../components/EntityZoom";
import axios from "axios";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: "Search results"}

    // const ret = {title: _.capitalize(this.entityType)}
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
    EntityZoom,
  },
  props: {},
  data() {
    return {
      loading: false,
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
    console.log("mount serp")
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
    padding: 34px 40px 0 20px;
  }

  .results-panel-container {
    //max-width: 900px;
  }

}

</style>