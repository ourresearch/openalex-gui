<template>

  <div class="">
    <v-toolbar dense color="grey darken-1" dark flat>

      <v-container class="d-flex align-center">
        <entity-type-selector/>
        <div class="ml-2">
          <span class="font-weight-bold">
            {{ resultsCount | toPrecision }}
          </span>
          results
        </div>

        <v-spacer></v-spacer>

        <v-btn
            icon
            @click="setApiDialogUrl(searchApiUrlForDisplay)"
        >
          <v-icon>mdi-api</v-icon>
        </v-btn>
        <v-menu
            max-height="90vh"
        >
          <template v-slot:activator="{on}">
            <v-btn
                icon
                v-on="on"
            >
              <v-icon>mdi-pin-outline</v-icon>
            </v-btn>
          </template>
          <filter-key-selector
              dark
              @select="addWidget"
          />
        </v-menu>
        <v-btn
            icon
            target="_blank"
            @click="copyToClipboard('https://alpha.openalex.org' + $route.fullPath)"
        >
          <v-icon>mdi-share-variant-outline</v-icon>
        </v-btn>


      </v-container>
    </v-toolbar>
    <v-container class="">
      <v-alert v-if="0" dense text type="warning" class="">
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
      <!--      <serp-applied-filters-->
      <!--          :filters="resultsFilters"-->
      <!--          class="mb-3"-->
      <!--      />-->

      <filter-list
          :filters="resultsFilters"
          @create="createFilter"
          @update="updateFilter"
          @delete="deleteFilter"
          class="mb-3"
      />

      <v-row class="">
        <v-col cols="12" sm="4">
          <v-card flat key="serp-results">
            <serp-toolbar/>
            <serp-results-list class="pb-8"/>
          </v-card>
        </v-col>
        <v-col cols="12" sm="8">
          <pinboard
              :widget-filter-keys="widgetFilterKeys"
              @remove="removeWidget"
          />

        </v-col>

        <!--        <v-col cols="12" sm="3">-->
        <!--          <div v-if="$vuetify.breakpoint.mobile" class="text-h4 mt-12 mb-6">Filter details</div>-->
        <!--          <year-range-->
        <!--                  v-if="entityType === 'works'"-->
        <!--              height="50px"-->
        <!--              big class="mb-3"-->
        <!--              :disabled="!!facetZoom"-->
        <!--              show-filter-link/>-->
        <!--        </v-col>-->
      </v-row>
    </v-container>


    <div id="serp-hidden">
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

import _ from 'lodash';
import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import SerpToolbar from "../components/SerpToolbar/SerpToolbar.vue";
import SerpAppliedFilters from "../components/SerpAppliedFilters.vue";
import FilterList from "@/components/Filters/FilterList.vue";

import {entityConfigs} from "../entityConfigs";
import YearRange from "../components/YearRange";
import {api} from "@/api";
import {pinboard} from "@/pinboard";
import SerpResultsList from "../components/SerpResultsList.vue";
import Pinboard from "../components/Pinboard/Pinboard.vue";


import ApiDialog from "../components/ApiDialog.vue";
import EntityTypeSelector from "@/components/EntityTypeSelector.vue";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    SerpToolbar,
    SerpAppliedFilters,
    FilterList,
    SerpResultsList,
    ApiDialog,
    Pinboard,
    EntityTypeSelector,
    FilterKeySelector,

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
      widgetFilterKeys: [],
      resultsFilters: []
    }
  },
  asyncComputed: {},
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "searchFacetConfigs",
      "inputFiltersAsString",
      "searchApiUrlForDisplay",
      "entityZoomData",
      "searchIsLoading",
      "showFiltersDrawer",
      // "facetZoom",
      "resultsCount",
      "entityType",
      "entityConfig",
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
      "setApiDialogUrl",
    ]),
    ...mapActions([
      "updateTextSearch",
      "setEntityZoom",
    ]),
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("URL copied to clipboard.")
    },
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
    addWidget(filterKey) {
      console.log("serp adWidget", filterKey)
      this.widgetFilterKeys.push(filterKey)
    },
    removeWidget(filterKey) {
      console.log("serp adWidget", filterKey)
      this.widgetFilterKeys = this.widgetFilterKeys.filter(vk => vk !== filterKey)
    },
    createFilter(key, value){
      url.createFilter(this.entityType, key, value)
    },
    updateFilter(key, value){
      // console.log("Serp.updateFilter", key, value)
      url.updateFilter(this.entityType, key, value)
    },
    deleteFilter(key){
      url.deleteFilter(this.entityType, key)
    },
  },

  created() {
  },
  async mounted() {
    const views = pinboard.init(this.entityType)
    console.log("serp pinboard.views", views)

  },
  watch: {
    "$route": {
      immediate: true,
      async handler(to, from) {
        const scrollTop = window.scrollY

        this.facetZoom = to?.query?.group_by

        this.resultsFilters = filtersFromUrlStr(
            this.entityType,
            to?.query?.filter
        )

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


.v-app-bar.mobile {
  padding: 0 !important;
}

.serp-container.mobile {
  padding: 5px !important;
}

</style>