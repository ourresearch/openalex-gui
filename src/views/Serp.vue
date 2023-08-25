<template>

  <div class="">
    <v-container class="">
      <v-alert dense text type="warning" class="">
        <v-row class="align-center">
          <div class="">
            <span class="font-weight-bold">Alpha version:</span>
            buggy, incomplete, and changing daily.
          </div>
          <v-spacer v-if="!$vuetify.breakpoint.mobile"/>
          <v-btn small text light href="https://openalex.org/help" target="_blank">
            Feedback
          </v-btn>
          <v-btn small text light target="_blank"
                 href="https://docs.google.com/document/d/1G0_HBvaeH30rQTGwxhVwVtdh5rX--7dWb9poBDUGdA0/edit#heading=h.oyun2a4w33cz">
            Learn more
          </v-btn>
        </v-row>
      </v-alert>
      <applied-filters class="mb-3" />
      <v-row class="">
        <v-col v-if="!$vuetify.breakpoint.mobile" sm="3">
          <filters-list />
        </v-col>
        <v-col cols="12" sm="5">
          <v-card flat key="serp-results">
            <serp-toolbar/>
            <serp-results-list class="pb-8"/>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <div v-if="$vuetify.breakpoint.mobile" class="text-h4 mt-12 mb-6">Filter details</div>
          <year-range
              height="50px"
              big class="mb-3"
              :disabled="!!facetZoom"
              show-filter-link/>
        </v-col>
      </v-row>
    </v-container>


    <div id="serp-hidden">
      <facets-list-dialog/>
      <api-dialog/>
      <v-dialog v-model="groupByDialogIsOpen">
        <facet-zoom-new
            v-if="facetZoom"
            :facet-zoom="facetZoom"
            @close="groupByDialogIsOpen = false"
        />
      </v-dialog>


    </div>

  </div>


</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';
import millify from "millify";
import _ from 'lodash';


import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {url} from "@/url";
import DownloadCsvDialog from "../components/DownloadCsvDialog";
import SerpToolbar from "../components/SerpToolbar/SerpToolbar.vue";
import AppliedFilters from "../components/AppliedFilters/AppliedFilters.vue";

import ResultWork from "../components/Result/ResultWork.vue";
import ResultAuthor from "../components/Result/ResultAuthor.vue";
import ResultVenue from "../components/Result/ResultSource.vue";
import ResultPublisher from "../components/Result/ResultPublisher.vue";
import ResultInstitution from "../components/Result/ResultInstitution.vue";
import ResultConcept from "../components/Result/ResultConcept.vue";
import FacetsDrawer from "../components/Facet/FacetsDrawer";
// import ZoomEntity from "../components/ZoomEntity";
import FacetZoom from "../components/Facet/FacetZoom";
import {entityConfigs} from "../entityConfigs";
import YearRange from "../components/YearRange";
import {api} from "@/api";
import SerpResultsList from "../components/SerpResultsList.vue";

import Entity from "../components/Entity/Entity.vue";
import FacetsListDialog from "@/components/Facet/FacetsListDialog.vue";
import FiltersList from "../components/FiltersList/FiltersList.vue";
import FacetZoomNew from "@/components/Facet/FacetZoomNew.vue";
import ApiDialog from "../components/ApiDialog.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    Entity,
    SerpToolbar,
    AppliedFilters,
    SerpResultsList,
    FacetZoomNew,
    YearRange,
    FacetsListDialog,
    FiltersList,
    ApiDialog,

  },
  props: {},
  data() {
    return {
      loading: false,
      facetZoom: null,
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
  asyncComputed: {
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "searchFacetConfigs",
      "inputFiltersAsString",
      "entityZoomData",
      "searchIsLoading",
      "showFiltersDrawer",
      // "facetZoom",
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
    groupByDialogIsOpen: {
      get() {
        return !!this.facetZoom
      },
      set(val) {
        url.setGroupBy(!!val)
      }
    },

    numPages() {
      return Math.min(
          Math.ceil(this.$store.state.resultsCount / this.resultsPerPage),
          10
      )
    },

    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
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
    ...mapMutations([
      "snackbar",
      "toggleFiltersDrawer",
      "openFacetsDialog",
    ]),
    ...mapActions([
      "updateTextSearch",
      "setEntityZoom",
    ]),
    getEntityData() {
      if (!this.entityId) return
      const pathName = this.myEntityType + "/" + this.entityId
      this.data = null
      console.log("zoomentity getting data for", this.entityId)

      api.get(pathName).then(resp => {
        console.log("zoomEntity resp", resp)
        this.data = resp
      })
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

        console.log("serp $route change")
        this.facetZoom = to?.query?.group_by

        await this.$store.dispatch("bootFromUrl")
        if (to?.query?.zoom || from?.query?.qoom) {
          window.scroll(0, scrollTop)
        }
      }
    },

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