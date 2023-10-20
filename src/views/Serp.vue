<template>
  <div class="serp-page">
    <v-toolbar flat>
      <v-toolbar-title>
        Explore
        <span class="">
          {{ listResultsCount | millify }}
          {{  entityType | pluralize(listResultsCount) }}
        </span>
      </v-toolbar-title>
      <v-spacer />
    </v-toolbar>
    <div class="d-flex">
      <filter-menu action="filter" />
      <filter-menu action="group by" />
      <filter-menu action="sort" :disabled="!!$route.query.group_by" />
      <filter-menu action="column" :disabled="!!$route.query.group_by" />


<!--      <v-btn text rounded class="font-weight-regular">-->
<!--        Filter-->
<!--      </v-btn>-->
<!--      <sort-button />-->
<!--      <group-by-selector/>-->
      <export-button />

    </div>

    <v-divider/>

    <v-container style="max-width: 1260px; margin-left: 0;">
      <!--      <filter-string-->
      <!--          :filters="resultsFilters"-->
      <!--          class="mb-3"-->
      <!--      />-->

      <v-slide-y-transition group leave-absolute>

        <serp-api-editor
            v-if="$store.state.isApiEditorShowing"
            class="mb-3"
            key="api-editor"
        />

        <v-row dense key="main-serp-row">
          <div>
            <group-by v-if="isGroupByView"/>
            <serp-results-list v-else :results-object="resultsObject"/>

          </div>
        </v-row>
      </v-slide-y-transition>


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
import FilterMenu from "@/components/FilterMenu.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.selectedEntityTypeConfig.displayName) + " search"}
    if (this.entityZoomData?.display_name) ret.title = this.entityZoomData.display_name
    return ret
  },
  components: {
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

    FilterMenu,

    ExportButton,
    SortButton,
    GroupBySelector,
    GroupBy,

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
      resultsTab: 0,
      lastGroupByValue: null,
      groupByKeys: [],
      groupBySearchString: "",

      listResultsCount: null, // not the group_by one


      // temp
      searchString: "",
      url,
    }
  },
  asyncComputed: {},
  computed: {
    ...mapGetters([
      "searchIsLoading",
      "entityType",
    ]),
    isGroupByView: {
      get() {
        return this.$route.query.group_by !== undefined
      },
      set(val) {
        // view the groupBy tab if we are setting this to true
        this.resultsTab = val ? 1 : 0

        if (val) { // we want the group view
          this.pushQueryChanges({
            group_by: this.lastGroupByValue,
            sort: undefined,
          })
        } else { // we want the list view
          this.lastGroupByValue = this.$route.query.group_by
          this.pushQueryChanges({group_by: undefined})

        }
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

  },
  watch: {
    "$route.query.group_by": {
      immediate: true,
      handler(to) {
        this.resultsTab = to ? 1 : 0
      }
    },

    "$route": {
      immediate: true,
      async handler(to, from) {
        const scrollTop = window.scrollY
        // const apiQuery = "https://api.openalex.org" + this.$route.fullPath.replace(/%2B/g, "+")
        const apiQuery = url.makeApiUrl(this.$route)


        console.log("Serp apiQuery", apiQuery)

        const resp = await api.getUrl(apiQuery)
        this.resultsObject = resp;
        if (!this.isGroupByView) this.listResultsCount = resp.meta.count


        this.$store.state.resultsObject = resp

        this.resultsFilters = filtersFromUrlStr(
            this.entityType,
            to?.query?.filter
        )
        window.scroll(0, 0)

        // await this.$store.dispatch("bootFromUrl")
      }
    },

  }
}
</script>

<style lang="scss" scoped>
.container {
  //max-width: 1024px !important;
}

</style>