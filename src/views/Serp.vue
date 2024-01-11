<template>
  <div class="serp-page pb-12"

  >

    <v-navigation-drawer
        v-model="isSidebarOpen"
        app
        temporary
        height="100vh"
        right
        color="#fafafa"
        width="500"
    >
      <entity-work v-if="sidebarData" :data="sidebarData"/>
    </v-navigation-drawer>



    <v-container  class=" main-serp-container" style="max-width: 1785px;">
      <serp-api-editor
          v-if="isShowApiSet"
          key="api-editor"
          class="mb-3"
      />
      <filter-list :results-object="resultsObject" class="mb-4" />
      <v-card flat rounded class="color-3">
        <v-container fluid>
          <v-row>
            <serp-results-count :results-object="resultsObject"/>

          </v-row>

          <v-row>
            <v-col class="flex-grow-1 d-flex">
              <div>

                <div v-if="resultsObject?.meta?.count">
                  <serp-results-list :results-object="resultsObject"/>
                  <!--                <serp-results-table v-else :results-object="resultsObject"/>-->

                  <div class="serp-bottom">
                    <v-pagination
                        class="my-3 elevation-0"
                        circle
                        v-model="page"
                        :length="numPages"
                        :total-visible="10"
                        light
                    />
                  </div>

                </div>
              </div>

            </v-col>
            <v-col cols="4" xl="6" v-if="$vuetify.breakpoint.mdAndUp">
              <analytic-views/>
            </v-col>
          </v-row>
        </v-container>

      </v-card>
      <v-card flat rounded class="color-3 mt-12" v-if="$vuetify.breakpoint.smAndDown">
        <analytic-views/>
      </v-card>

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
import {filtersAsUrlStr, filtersFromUrlStr} from "@/filterConfigs";

import {entityConfigs} from "../entityConfigs";
import {api} from "@/api";
import SerpResultsTable from "../components/SerpResultsTable.vue";
import SerpResultsList from "@/components/SerpResultsList.vue";


import ApiDialog from "../components/ApiDialog.vue";

import SerpApiEditor from "../components/SerpApiEditor.vue";
import router from "../router";

import ExportButton from "../components/ExportButton.vue";
import {facetConfigs, getFacetConfig} from "../facetConfigs";
import GroupBy from "../components/GroupBy/GroupBy.vue";

import FilterList from "@/components/FilterList.vue";
import AnalyticViews from "@/components/AnalyticViews.vue";

import Action from "@/components/Action/Action.vue";
import {actionConfigs, getActionConfig, getActionDefaultsStr} from "@/actionConfigs";
import SiteNav from "@/components/SiteNav.vue";
import EntityWork from "@/components/Entity/EntityWork.vue";
import {shortenOpenAlexId} from "@/util";
import SerpToolbar from "@/components/SerpToolbar/SerpToolbar.vue";
import SerpResultsCount from "@/components/SerpResultsCount.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.selectedEntityTypeConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    SerpToolbar,
    SiteNav,
    SerpResultsTable,
    SerpResultsCount,
    SerpResultsList,
    ApiDialog,
    SerpApiEditor,

    Action,

    ExportButton,
    GroupBy,
    AnalyticViews,

    EntityWork,

    FilterList,

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

      resultsObject: null,
      apiMode: false,
      // resultsTab: 0,
      lastGroupByValue: null,
      groupByKeys: [],
      groupBySearchString: "",

      savedActions: [],

      listResultsCount: null, // not the group_by one

      selectedActionTab: "filter",


      searchString: "",
      url,
      actionConfigs,
    }
  },
  asyncComputed: {
    async sidebarData() {
      const sidebarId = shortenOpenAlexId(this.$route.query.sidebar)
      if (!sidebarId) return

      const extantResult = this.resultsObject?.results?.find(res => {
        const resultId = shortenOpenAlexId((res.id))
        return resultId === sidebarId
      })
      const ret = (extantResult) ? extantResult : await api.getEntity(sidebarId)
      return ret
    },
  },
  computed: {
    ...mapGetters([
      "searchIsLoading",
      "entityType",
    ]),
    numPages() {
      const maxToShow = this.$vuetify.breakpoint.mobile ?
          4 :
          10

      return Math.min(
          Math.ceil(this.resultsObject.meta.count / this.resultsPerPage),
          maxToShow
      )
    },
    isAnalyze: {
      get() {
        return !!this.$route.query.analyze
      },
      set(to) {
        const analyze = (to) ? to : undefined
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            analyze,
          },
        })
      }
    },
    isShowApiSet: {
      get() {
        return !!this.$route.query.show_api
      },
      set(to) {
        const show_api = (to) ? to : undefined
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            show_api
          },
        })
      }
    },
    isListView: {
      get() {
        return !!this.$route.query.is_list_view
      },
      set(to) {
        const is_list_view = (to) ? to : undefined
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            is_list_view
          },
        })
      }
    },
    isSidebarOpen: {
      get() {
        return !!this.$route.query.sidebar
      },
      set(to) {
        if (to) return
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            sidebar: undefined
          },
        })
      }
    },
    page: {
      get() {
        return this.resultsObject?.meta?.page ?? 1
      },
      set(val) {
        url.setPage(val)
      }
    },
    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
    },

    entityType() {
      return this.$route.params.entityType
    },
    resultsCount() {
      return this.resultsObject?.meta?.count
    },
    filtersLength() {
      return this.$route.query.filter?.length ?? 0
    },

    popularFilterOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes("filter"))
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
    async copyToClipboard(content) {
      await navigator.clipboard.writeText(content);
      this.snackbar("URL copied to clipboard.")
    },
    clearGroupBy() {
      url.pushToRoute(this.$router, {
        name: "Serp",
        query: {
          ...this.$route.query,
          group_by: undefined,
        }
      })
    },
    async pushQueryChanges(query) {

      const pushTo = {
        name: "Serp",
        query: {
          ...this.$route.query,
          ...query,
        }
      }
      console.log("pushQueryChanges", query)
      await router.push(pushTo)
          .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
              throw e
            }
          })

    }
  },

  created() {
  },
  async mounted() {
    // if ("group_by" in this.$route.query) return
    //
    // const query = {...this.$route.query}
    // query.column ??= getActionConfig("column").defaultValues.join(",")
    // query.sort ??= getActionConfig("sort").defaultValues.map(v => v + ':desc').join(",")
    // url.pushToRoute(this.$router, {
    //           name: "Serp",
    //           query
    //         })

  },
  watch: {
    filtersLength: {
      immediate: false,
      handler(to, from) {
        // const msg = (to > from) ? "Filter added" : "Filter removed"
        // this.snackbar(msg)
      }
    },

    "$route": {
      immediate: true,
      async handler(to, from) {

        const scrollTop = window.scrollY
        const apiQuery = url.makeApiUrl(this.$route)

        // set default actions if there are none
        if (!this.$route.query.sort) url.pushQueryParam(
            "sort",
            getActionDefaultsStr("sort", this.$route)
        )
        if (!this.$route.query.column) url.pushQueryParam(
            "column",
            getActionDefaultsStr("column", this.$route)
        )
        if (!this.$route.query.group_by) url.pushQueryParam(
            "group_by",
            getActionDefaultsStr("group_by", this.$route)
        )
        if (this.$vuetify.breakpoint.mobile) url.pushQueryParam("is_list_view", true)

        this.$store.state.isLoading = true
        const resp = await api.getResultsList(apiQuery)
        this.$store.state.isLoading = false
        this.resultsObject = resp;
        // this.count = this.meta.count
        //
        // if (!this.$route.query.group_by) this.listResultsCount = resp.meta.count



        this.$store.state.resultsObject = resp

        this.resultsFilters = filtersFromUrlStr(
            this.entityType,
            to?.query?.filter
        )
        window.scroll(0, 0)

      }
    },

  }
}
</script>

<style lang="scss">
.container {
  //max-width: 1024px !important;
}
.v-pagination__item, .v-pagination__navigation {
  box-shadow: none;
}

.serp-page {
  //background: #F3F7FF;
}


table.serp-results-table {
  border-collapse: collapse;

  tr {
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, .05)
    }
  }

  td {
    border: none;
    margin: 0;
    padding: 5px 10px;

    &.range {
      text-align: right;
      //font-family: Monaco, Menlo, Consolas, Bitstream Vera Sans Mono, monospace;
    }

    &.boolean {
      text-align: center;
    }
  }

}


</style>