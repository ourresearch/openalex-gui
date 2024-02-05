<template>
  <div class="">

    <v-container style="max-width: 1785px;">
      <!--      <serp-tabs :results-object="resultsObject"/>-->
      <v-card rounded flat class="white">
        <serp-toolbar :results-object="resultsObject"/>
        <filter-list :results-object="resultsObject" class=""/>
        <v-divider/>
        <v-container fluid class="">

          <serp-api-editor v-if="isShowApiSet" class="mb-2"/>

          <v-row>
            <v-col>
             <serp-results-count :results-object="resultsObject" include-time class="grey--text" />
            </v-col>
          </v-row>


          <v-row v-if="$vuetify.breakpoint.mdAndUp">
            <v-col cols="8" v-if="!$route.query.hide_results">
              <serp-results-list :results-object="resultsObject"/>
            </v-col>
            <v-col

                class="flex-grow-1"
                v-if="$vuetify.breakpoint.mdAndUp"
            >
              <analytic-views :results-object="resultsObject" class=""/>
            </v-col>
          </v-row>

          <template v-else>
            <v-row>
              <v-col>
                <v-tabs v-model="resultsTab">
                  <v-tab key="0">Results</v-tab>
                  <v-tab key="1">Summaries</v-tab>
                </v-tabs>
                <v-tabs-items v-model="resultsTab">
                  <v-tab-item key="0">
                    <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject"/>
                  </v-tab-item>
                  <v-tab-item key="1">
                    <analytic-views/>
                  </v-tab-item>
                </v-tabs-items>
              </v-col>
            </v-row>
          </template>


        </v-container>
      </v-card>


    </v-container>
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
import SearchBar from "@/components/SearchBar.vue";
import SerpTabs from "@/components/SerpTabs.vue";

import QrcodeVue from 'qrcode.vue'

const shortUuid = require('short-uuid');


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
    SearchBar,

    QrcodeVue,
    SerpTabs,

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
      resultsTab: 0,
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
    ...mapGetters("user", [
      "userId",
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
        // console.log("Serp $route watcher", to, from)
        if (this.userId){
          this.$store.commit("user/setActiveSearchId", this.$route.query.id)
        }

        // autosave ALL new searches.
        // if (this.userId && !this.$route.query.id) {
        //   await this.$router.replace({
        //     name: "Serp",
        //     query: {
        //       ...this.$route.query,
        //       id: shortUuid.generate()
        //     }
        //   })
        //   return
        // }



        const scrollTop = window.scrollY
        const apiQuery = url.makeApiUrl(this.$route)

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