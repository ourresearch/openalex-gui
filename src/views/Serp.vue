<template>
  <div class="">

    <!--    <v-toolbar dense flat color="transparent">-->
    <!--&lt;!&ndash;      <v-toolbar-items style="margin-left:-7px;" >&ndash;&gt;-->
    <!--&lt;!&ndash;        <entity-type-selector  />&ndash;&gt;-->

    <!--&lt;!&ndash;      </v-toolbar-items>&ndash;&gt;-->
    <!--      <serp-tabs />-->
    <!--    </v-toolbar>-->

    <v-container>
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
        <filter-chips-list key="filter-chips-list"/>

        <v-row dense key="main-serp-row">
          <!--        <v-col cols="4" v-if="!$vuetify.breakpoint.mobile">-->
          <!--          <v-card rounded>-->
          <!--            &lt;!&ndash;            <filter-selector :applied-filters="resultsFilters" />&ndash;&gt;-->
          <!--            <filter-list :filters="resultsFilters"/>-->
          <!--          </v-card>-->
          <!--        </v-col>-->
          <v-col cols="12" sm="12">
            <v-card rounded>
              <v-toolbar flat class=""  :extended="isGroupByView">
                <v-btn icon v-if="isGroupByView" @click="clearGroupBy">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <v-toolbar-title v-if="!isGroupByView">
                  Results
                </v-toolbar-title>
                <span class="body-1" v-if="isGroupByView">
                  results
<!--                  {{ listResultsCount | millify }} {{ entityType | pluralize(listResultsCount) }}-->
                </span>
                <v-spacer/>
                <!--                <span class="body-2">-->
                <!--                  {{ listResultsCount | millify }}-->
                <!--                </span>-->

                <group-by-selector v-if="!isGroupByView"/>

                <export-button
                    style="margin-right:-13px;"
                />

                <template v-slot:extension v-if="groupByConfig">
                  <v-toolbar-title>
                    Group by {{ groupByConfig.displayName }}
                  </v-toolbar-title>
                </template>

              </v-toolbar>
                            <v-divider/>
              <v-toolbar flat v-if="!isGroupByView">
                <span class="grey--text">{{ listResultsCount | millify }} {{ entityType | pluralize(listResultsCount) }}</span>
                <v-spacer />
                <sort-button  />
              </v-toolbar>

              <div>
                <group-by v-if="isGroupByView"/>
                <serp-results-list v-else :results-object="resultsObject"/>

              </div>
            </v-card>

          </v-col>
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