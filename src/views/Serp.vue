<template>
  <div class="color-2" style="min-height: 80vh">
    <v-container fluid class="pt-0">
      <serp-toolbar :results-object="resultsObject"/>
      <filter-list :results-object="resultsObject" class="mb-6 mt-3"/>
      <serp-api-editor v-if="url.isViewSet($route, 'api')" class="mb-6"/>

      <v-row v-if="!$vuetify.display.mobile">
        <v-col
          cols="6"
          xl="4"
          v-if="url.isViewSet($route, 'list')"
        >
          <serp-results-list :results-object="resultsObject"/>
        </v-col>
        <v-col
          class="flex-grow-1"
          v-if="url.isViewSet($route, 'report')"
        >
          <group-by-views :results-object="resultsObject"/>
        </v-col>
      </v-row>

      <template v-else>
        <v-row class="mb-12">
          <v-col>
            <v-tabs
              v-model="resultsTab"
              bg-color="transparent"
              color="primary"
              grow
              class="px-3"
            >
              <v-tab value="results" class="text-uppercase">Results</v-tab>
              <v-tab value="stats" class="text-uppercase">Stats</v-tab>
            </v-tabs>

            <v-card rounded flat class="rounded-o">
              <div v-if="resultsTab === 'results'">
                <serp-results-list v-if="resultsObject?.meta?.count" :results-object="resultsObject"/>
              </div>
              <div v-if="resultsTab === 'stats'">
                <group-by-views :results-object="resultsObject" />
              </div>
            </v-card>

          </v-col>
        </v-row>
      </template>
    </v-container>
  </div>
</template>


<script>

import _ from 'lodash';
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {useHead} from '@unhead/vue'

import {url} from "@/url";
import {api} from "@/api";
import router from "../router";
import {entityConfigs} from "../entityConfigs";
import {shortenOpenAlexId} from "@/util";
import {actionConfigs} from "@/actionConfigs";
import {filtersFromUrlStr} from "@/filterConfigs";
import {facetConfigs} from "../facetConfigs";

import SerpResultsList from "@/components/SerpResultsList.vue";
import SerpApiEditor from "../components/SerpApiEditor.vue";
import GroupByViews from "@/components/GroupByViews.vue";
import FilterList from "@/components/FilterList.vue";
import SerpToolbar from "@/components/SerpToolbar/SerpToolbar.vue";

export default {
  name: "SerpPage",
  components: {
    SerpToolbar,
    SerpResultsList,
    SerpApiEditor,
    GroupByViews,
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
      resultsTab: "results",
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
      const sidebarId = shortenOpenAlexId(this.$route.query.sidebar);
      if (!sidebarId) { return; }

      const extantResult = this.resultsObject?.results?.find(res => {
        const resultId = shortenOpenAlexId((res.id));
        return resultId === sidebarId;
      })
      const ret = (extantResult) ? extantResult : await api.getEntity(sidebarId);
      return ret;
    },
  },
  computed: {
    ...mapGetters([
      "searchIsLoading",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
    ]),
    numPages() {
      const maxToShow = this.$vuetify.display.mobile ? 4 : 10;

      return Math.min(
          Math.ceil(this.resultsObject.meta.count / this.resultsPerPage),
          maxToShow
      );
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
    useHead({
      title: _.capitalize(this.selectedEntityTypeConfig.displayName) + " search"
    });
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
      handler() {
        // const msg = (to > from) ? "Filter added" : "Filter removed"
        // this.snackbar(msg)
      }
    },
    "$route.params.entityType": {
      immediate: true,
      handler(to){
        this.$store.state.entityType = to
      }
    },
    "$route": {
      immediate: true,
      async handler(to) {
        // console.log("Serp $route watcher", to, from)
        if (this.$route.query.id && !this.userSavedSearches.find(s => s.id === this.$route.query.id)) {
          console.log("404 search id doesn't exist", this.$route.params.entityType)
          const query = {
            ...this.$route.query,
            id: undefined,
          }
          url.pushToRoute(this.$router, {name: "Serp", query})
          return
        }

        if (this.userId) {
          this.$store.commit("user/setActiveSearchId", this.$route.query.id)
        }

        const apiQuery = url.makeApiUrl(this.$route)

        this.$store.state.isLoading = true
        const resp = await api.getResultsList(apiQuery)
        this.$store.state.isLoading = false
        this.resultsObject = resp;

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
.v-pagination__item, .v-pagination__navigation {
  box-shadow: none;
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