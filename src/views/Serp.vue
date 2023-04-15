<template>

  <div class="mt-12">

    <div
            v-shortkey="['meta', 'f']"
            @shortkey="openFacetsDialog"
    ></div>
    <div
            v-shortkey="['ctrl', 'f']"
            @shortkey="openFacetsDialog"
    ></div>


    <v-container>
      <v-row>
        <v-col cols="12" sm="8">
          <v-card outlined>
            <serp-filters-list/>
          </v-card>
          <v-card flat v-if="!singleWorkIdToShow">
            <serp-toolbar class="mt-4" :disabled="!!singleWorkIdToShow"/>
            <serp-results-list/>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" v-if="!singleWorkIdToShow">
          <div v-if="$vuetify.breakpoint.mobile" class="text-h4 mt-12 mb-6">Filter details</div>
          <year-range height="50px" big class="mb-3"></year-range>
          <entity
                  v-for="entity in entitySidebarDataList"
                  :key="entity.id"
                  :data="entity"
                  class="mb-4"
          />
        </v-col>
      </v-row>
      <div v-if="singleWorkIdToShow" class="mt-3">
        <entity solo :data="$store.state.results[0]"/>

      </div>
    </v-container>



    <div id="serp-hidden">
      <facets-list-dialog/>

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
import FacetsDrawer from "../components/Facet/FacetsDrawer";
// import ZoomEntity from "../components/ZoomEntity";
import FacetZoom from "../components/Facet/FacetZoom";
import {entityConfigs} from "../entityConfigs";
import YearRange from "../components/YearRange";
import {api} from "@/api";
import SerpResultsList from "../components/Facet/SerpResultsList.vue";

import Entity from "../components/Entity";
import FacetsListDialog from "@/components/Facet/FacetsListDialog.vue";

export default {
    name: "Serp",
    metaInfo() {
        const ret = {title: _.capitalize(this.entityConfig.displayName)}
        if (this.$store.state.textSearch) ret.title = this.$store.state.textSearch
        if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
        return ret
    },
    components: {
        Entity,
        DownloadCsvDialog,
        SerpToolbar,
        SerpFiltersList,
        SerpResultsList,
        ResultWork,
        ResultAuthor,
        ResultVenue,
        ResultPublisher,
        ResultInstitution,
        ResultConcept,
        FacetsDrawer,
        FacetZoom,
        YearRange,
        FacetsListDialog,

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
    asyncComputed: {
        async entitySidebarDataList() {
            return await Promise.all(
                this.entitySidebarFiltersList.map(f => {
                    const pathName = [
                        f.entityId,
                        f.value
                    ].join("/")
                    console.log("entitySidebarData getting data for", pathName)

                    return api.get(pathName)
                })
            )
        },
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
        resultsCols() {
            if (this.$vuetify.breakpoint.mobile) return 12
            return (this.showSidebar) ? 7 : 12
        },
        entityCols() {
            return (this.$vuetify.breakpoint.mobile) ? 12 : 5
        },
        entitySidebarFilter() {
            if (this.resultsFilters.length === 0) return
            if (this.entityType !== "works") return
            if (this.singleWorkIdToShow) return

            const sidebarFilters = this.resultsFilters.filter(f => f.showInSidebar)
            if (sidebarFilters.length !== 1) return

            return sidebarFilters[0]
        },
        entitySidebarFiltersList() {
            if (this.entityType !== "works") return []
            return this.resultsFilters
                .filter(f => f.showInSidebar)
                .filter(f => !f.isNullValue)
        },
        showSidebar() {
            return this.entitySidebarFiltersList.length > 0 && !this.singleWorkIdToShow
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