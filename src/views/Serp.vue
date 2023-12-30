<template>
  <div class="serp-page pb-12" style="background: #F7F9FC;">
    <div class="white">
    </div>
    <div>
      <serp-api-editor
          v-if="isShowApiSet"
          key="api-editor"
      />
    </div>

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


    <v-container class="serp-bottom-stuff" style="">
      <filter-list/>


      <div class="d-flex py-1 px-3 mt-10 align-center">
        <div class="font-weight-bold">
<!--          {{ isAnalyze ? "Analyze: " : "List: "}}-->


          <span v-if="resultsObject?.meta.count === 0">
          No results; try modifying your filters.
        </span>
          <span v-else-if="resultsObject?.meta.count < 100">
          {{ resultsObject.meta.count | toPrecision }} results
        </span>
          <span v-else>
          About {{ resultsObject?.meta.count | toPrecision }} results
        </span>
        </div>
        <v-spacer/>
        <template v-if="isAnalyze">
          <Action action="group_by"/>
        </template>
        <template v-else>
          <action :disabled="isAnalyze" action="sort"/>
          <export-button :disabled="isAnalyze"/>

        </template>
        <v-chip class="pa-0 ml-2">
          <v-chip
              @click="isAnalyze = false"
              :dark="!isAnalyze"
          >
            List
          </v-chip>
          <v-chip
              @click="isAnalyze = true"
              :dark="isAnalyze"
          >
            Analyze
          </v-chip>

        </v-chip>


      </div>


      <div>
        <analytic-views v-if="isAnalyze"/>
        <serp-results-list v-else :results-object="resultsObject"/>

      </div>
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
import SerpResultsList from "../components/SerpResultsList.vue";


import ApiDialog from "../components/ApiDialog.vue";

import SerpApiEditor from "../components/SerpApiEditor.vue";
import router from "../router";

import ExportButton from "../components/ExportButton.vue";
import {facetConfigs, getFacetConfig} from "../facetConfigs";
import GroupBy from "../components/GroupBy/GroupBy.vue";

import FilterBar from "@/components/FilterBar/FilterBar.vue";
import FilterList from "@/components/FilterList.vue";
import AnalyticViews from "@/components/AnalyticViews.vue";

import Action from "@/components/Action/Action.vue";
import {actionConfigs, getActionConfig, getActionDefaultsStr} from "@/actionConfigs";
import SiteNav from "@/components/SiteNav.vue";
import EntityWork from "@/components/Entity/EntityWork.vue";
import {shortenOpenAlexId} from "@/util";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.selectedEntityTypeConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
    SiteNav,
    SerpResultsList,
    ApiDialog,
    SerpApiEditor,

    Action,

    ExportButton,
    GroupBy,
    AnalyticViews,

    EntityWork,

    FilterList,
    FilterBar,

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
    isGroupBy() {
      return "group_by" in this.$route.query
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
    resultsTab: {
      get() {
        return this.$route.query.tab ?? 0
      },
      set(to) {
        const query = {
          ...this.$route.query,
          tab: to
        }
        url.pushToRoute(this.$router, {
          name: "Serp",
          query,
        })
      }
    },
    groupByConfig() {
      if (!this.$route.query.group_by) return
      return getFacetConfig(this.entityType, this.$route.query.group_by)
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