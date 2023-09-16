<template>
  <div class="">
    <v-toolbar dense flat>
      <entity-type-selector  />
    </v-toolbar>

    <v-container style="margin-left: 0;" class="ml-0 pl-2">
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

      <v-row dense>
        <v-col cols="12" sm="4">
          <filter-list
                :filters="resultsFilters"
                @create="createFilter"
                @update="updateFilter"
                @delete="deleteFilter"
                class="mb-3"
            />
        </v-col>
        <v-col cols="12" sm="5">
          <v-card flat key="serp-results">
            <serp-toolbar/>
            <serp-results-list class="pb-8"/>
          </v-card>
        </v-col>
        <v-col cols="12" sm="3">
          <v-card flat>
            <v-toolbar flat>
              <v-toolbar-title>
                Summaries
              </v-toolbar-title>
              <v-spacer/>

              <v-btn icon @click="$emit('click')">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
                  <v-btn
                      icon
                      @click="isCreateWidgetDialogOpen = true"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
<!--                <filter-key-selector-->
<!--                    v-model="isCreateWidgetDialogOpen"-->
<!--                    @close="isCreateWidgetDialogOpen = false"-->
<!--                    hide-unpinnable-->
<!--                    @select="createWidget"-->
<!--                />-->


            </v-toolbar>
            <year-range
                height="50px"
                big
                class="mb-3"
                show-filter-link
                v-if="entityType === 'works'"
            />
            <v-divider/>
            <template
                v-for="filterKey in widgetFilterKeys"
            >
              <pinboard-widget
                  :key="filterKey"
                  :filter-key="filterKey"
                  :filters="resultsFilters"
                  @delete="deleteWidget(filterKey)"
              />
              <v-divider :key="filterKey + 'divider'"></v-divider>
            </template>

          </v-card>

        </v-col>
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

import PinboardWidget from "../components/Pinboard/PinboardWidget.vue";
import pinboardWidget from "../components/Pinboard/PinboardWidget.vue";

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
    PinboardWidget,
    EntityTypeSelector,
    FilterKeySelector,
    YearRange,

  },
  props: {},
  data() {
    return {
      loading: false,
      facetZoom: null,
      filterDrawerIsOpen: true,
      apiResp: {},
      resultsPerPage: 25, // not editable now, but could be in future
      isCreateWidgetDialogOpen: false,
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
    removeWidget(filterKey) {

    },


    createFilter(key, value) {
      url.createFilter(this.entityType, key, value)
    },
    updateFilter(key, value) {
      console.log("Serp.updateFilter", key, value)
      url.updateFilter(this.entityType, key, value)
    },
    deleteFilter(key) {
      url.deleteFilter(this.entityType, key)
    },
    createWidget(filterKey) {
      console.log("serp createWidget", filterKey)
      this.widgetFilterKeys.push(filterKey)
      pinboard.addWidget(this.entityType, filterKey)
    },
    deleteWidget(filterKey) {
      console.log("serp deleteWidget", filterKey)
      this.widgetFilterKeys = this.widgetFilterKeys.filter(k => k !== filterKey)
      pinboard.deleteWidget(this.entityType, filterKey)
    },
  },

  created() {
  },
  async mounted() {
    pinboard.init(this.entityType)
    this.widgetFilterKeys = pinboard.getWidgets(this.entityType)

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