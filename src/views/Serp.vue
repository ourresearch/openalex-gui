<template>
  <div class="">

    <!--    <v-toolbar dense flat color="transparent">-->
    <!--&lt;!&ndash;      <v-toolbar-items style="margin-left:-7px;" >&ndash;&gt;-->
    <!--&lt;!&ndash;        <entity-type-selector  />&ndash;&gt;-->

    <!--&lt;!&ndash;      </v-toolbar-items>&ndash;&gt;-->
    <!--      <serp-tabs />-->
    <!--    </v-toolbar>-->

    <v-container>
      <filter-string
          :filters="resultsFilters"
          class="mb-3"
      />


      <v-row dense>
        <v-col cols="12" sm="3">
          <v-card rounded>
            <filter-list :filters="resultsFilters" />
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card rounded>
            <v-tabs height="64" slider-color="primary lighten-2" slider-size="5" dark background-color="#444" v-model="resultsTab" fixed-tabs>
              <v-tab>List</v-tab>
              <v-tab>Summaries</v-tab>
            </v-tabs>
            <v-tabs-items v-model="resultsTab">
              <v-tab-item>
                <serp-toolbar id="serp-toolbar" />
                <serp-results-list class="pb-8"/>
              </v-tab-item>
              <v-tab-item>
                <pinboard />
              </v-tab-item>
            </v-tabs-items>
          </v-card>
        </v-col>
      </v-row>

    </v-container>


    <div id="serp-hidden">
      <api-dialog/>
    </div>

  </div>


</template>

<script>

import _ from 'lodash';
import {mapGetters, mapMutations, mapActions,} from 'vuex'

import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import SerpToolbar from "../components/SerpToolbar/SerpToolbar.vue";
import FilterList from "@/components/Filters/FilterList.vue";

import {entityConfigs} from "../entityConfigs";
import {api} from "@/api";
import SerpResultsList from "../components/SerpResultsList.vue";
import Pinboard from "../components/Pinboard/Pinboard.vue";


import ApiDialog from "../components/ApiDialog.vue";
import EntityTypeSelector from "@/components/EntityTypeSelector.vue";
import SearchBoxNew from "../components/SearchBoxNew.vue";

import FilterString from "@/components/Filters/FilterString.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.entityConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    FilterList,
    SearchBoxNew,
    SerpToolbar,
    SerpResultsList,
    ApiDialog,
    Pinboard,
    EntityTypeSelector,
    FilterString

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
      resultsFilters: [],
      resultsTab: 0,

      // temp
      searchString: "",
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


    // createFilter(key, value) {
    //   url.createFilter(this.entityType, key, value)
    // },
    // updateFilter(key, value) {
    //   console.log("Serp.updateFilter", key, value)
    //   url.updateFilter(this.entityType, key, value)
    // },
    // deleteFilter(key) {
    //   url.deleteFilter(this.entityType, key)
    // },
  },

  created() {
  },
  async mounted() {

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

<style lang="scss" scoped>
.v-text-field--rounded {
  border-radius: inherit;
}


.v-app-bar.mobile {
  padding: 0 !important;
}

.serp-container.mobile {
  padding: 5px !important;
}

</style>