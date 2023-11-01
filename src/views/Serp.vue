<template>
  <div class="serp-page">

    <v-navigation-drawer
        v-model="isSidebarOpen"
        app
        temporary
        height="100vh"
        right
        color="#fafafa"
        width="600"
    >
      <entity-work v-if="sidebarData" :data="sidebarData"/>

    </v-navigation-drawer>


    <v-toolbar flat>
      <v-toolbar-title>
        Explore
        <span class="">
<!--          {{ listResultsCount | millify }}-->
          {{ entityType | pluralize(listResultsCount) }}
        </span>
      </v-toolbar-title>
      <v-spacer/>
      <v-btn icon @click="isShowApiSet = !isShowApiSet">
        <v-icon>mdi-api</v-icon>
      </v-btn>
      <export-button />
    </v-toolbar>

<!--    <filter-chips-list class="pl-3"/>-->

    <serp-api-editor
        v-if="isShowApiSet"
        class="mb-3 mx-3"
        key="api-editor"
    />

<!--    <v-divider class="mb-8"/>-->


<!--    <v-tabs v-model="resultsTab">-->
<!--      <v-tab>List</v-tab>-->
<!--      <v-tab>Group</v-tab>-->
<!--    </v-tabs>-->

<!--    <v-divider/>-->
    <div class="my-1 mx-3 d-flex">
      <action-menu-item action="filter" />
      <action-menu-item action="sort" />
      <action-menu-item action="column" />
      <action-menu-item action="group_by" />

    </div>

    <div>
      <group-by v-if="$route.query.group_by"/>
      <serp-results-list v-else :results-object="resultsObject"/>

    </div>


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
import SerpApiEditor from "../components/SerpApiEditor.vue";
import FilterChipsList from "../components/Filters/FilterChipsList.vue";
import router from "../router";

import ExportButton from "../components/ExportButton.vue";
import SortButton from "../components/SortButton.vue";
import FilterKeySelector from "../components/Filters/FilterKeySelector.vue";
import GroupBySelector from "../components/GroupBy/GroupBySelector.vue";
import {getFacetConfig} from "../facetConfigs";
import Template from "../components/Template.vue";
import GroupBy from "../components/GroupBy/GroupBy.vue";
import {filter} from "core-js/internals/array-iteration";

import ActionMenuItem from "@/components/Action/ActionMenuItem.vue";
import ActionChipsList from "@/components/Action/ActionMenuItem.vue";
import ActionMenuChip from "@/components/Action/ActionMenuChip.vue";
import {actionConfigs, getActionConfig} from "@/actionConfigs";
import SiteNav from "@/components/SiteNav.vue";
import Entity from "@/components/Entity/Entity.vue";
import EntityWork from "@/components/Entity/EntityWork/EntityWork.vue";
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
    Template,
    FilterList,
    SearchBoxNew,
    SerpToolbar,
    SerpResultsList,
    ApiDialog,
    Pinboard,
    EntityTypeSelector,
    FilterString,
    SerpApiEditor,
    FilterChipsList,
    FilterKeySelector,

    ActionChipsList,
    ActionMenuChip,
    ActionMenuItem,

    ExportButton,
    SortButton,
    GroupBySelector,
    GroupBy,

    Entity,
    EntityWork,

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
  asyncComputed: {},
  computed: {
    ...mapGetters([
      "searchIsLoading",
      "entityType",
    ]),
    isGroupBy() {
      return "group_by" in this.$route.query
    },
    sidebarData() {
      const sidebarId = this.$route.query.sidebar
      return this.resultsObject?.results?.find(res => {
        return shortenOpenAlexId(res.id) === sidebarId
      })
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
    "$route.query.group_by": {
      immediate: true,
      handler(to) {
      }
    },

    "$route": {
      immediate: true,
      async handler(to, from) {

        const scrollTop = window.scrollY
        const apiQuery = url.makeApiUrl(this.$route)

        // set default actions if there are none
        Object.values(this.$route.query).length || url.setDefaultActions(this.entityType)


        // handle the column action


        const newQuery = {...this.$route.query}
        // console.log(`Serp $route watcher`, newQuery, this.$route.query)


        // console.log("Serp apiQuery", apiQuery)

        const resp = await api.getUrl(apiQuery)
        this.resultsObject = resp;
        // if (!this.isGroupByView) this.listResultsCount = resp.meta.count


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