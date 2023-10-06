<template>
  <div class="mt-12">

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

      <div class="d-flex">
        <v-spacer/>
        <v-btn icon @click="apiMode = !apiMode">
          <v-icon>mdi-api</v-icon>
        </v-btn>
      </div>
      <serp-api-editor
          v-if="apiMode"
          class="mb-3"
      />
      <filter-chips-list :filters="resultsFilters"/>

      <v-row dense>
        <v-col cols="3" v-if="!$vuetify.breakpoint.mobile">
          <v-card rounded>
            <!--            <filter-selector :applied-filters="resultsFilters" />-->
            <filter-list :filters="resultsFilters"/>
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <v-card rounded>
            <v-toolbar flat>
              <v-btn v-if="isGroupByView" @click="isGroupByView = false" icon>
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-toolbar-title class="pl-0">
                {{ isGroupByView ? 'Groups' : 'Results'}}
              </v-toolbar-title>
              <v-spacer/>
              <v-chip
                  :input-value="isGroupByView"
                  active-class="primary--text"
                  filter
                  outlined
                  @click="isGroupByView = !isGroupByView"
              >
                Group
              </v-chip>
              <sort-button :disabled="isGroupByView" />
              <export-button
                :disabled="resultsCount > 100000"
              />
              <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>

              <!--          <v-chip-group v-model="resultsTab" mandatory active-class="primary&#45;&#45;text">-->
              <!--            <v-chip filter :key="0">List</v-chip>-->
              <!--            <v-chip filter  :key="1">Groups</v-chip>-->
              <!--          </v-chip-group>-->
            </v-toolbar>
            <v-divider />
            <v-tabs class="d-none" v-model="resultsTab">
              <v-tab>List</v-tab>
              <v-tab>Group</v-tab>
            </v-tabs>
            <v-tabs-items v-model="resultsTab">
              <v-tab-item>
<!--                <serp-toolbar id="serp-toolbar"/>-->
                <serp-results-list :results-object="resultsObject" :api-mode="false" class="pb-8"/>
              </v-tab-item>
              <v-tab-item>
                <pinboard :summaries="groupByKeys" :filters="resultsFilters"/>
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
import SerpApiEditor from "../components/SerpApiEditor.vue";
import FilterChipsList from "../components/Filters/FilterChipsList.vue";
import router from "../router";

import ExportButton from "../components/ExportButton.vue";
import SortButton from "../components/SortButton.vue";

export default {
  name: "Serp",
  metaInfo() {
    const ret = {title: _.capitalize(this.selectedEntityTypeConfig.displayName) + " search"}
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
    FilterString,
    SerpApiEditor,
    FilterChipsList,

    ExportButton,
    SortButton,

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

        if (val){ // we want the group view
          this.pushQueryChanges({
            group_by: this.lastGroupByValue,
            sort: undefined,
          })
        }
        else { // we want the list view
          this.lastGroupByValue = this.$route.query.group_by
          this.pushQueryChanges({group_by: undefined})

        }
      }
    },


    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
    },

    entityType() {
      return this.$route.params.entityType
    },
    resultsCount(){
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
    "$route": {
      immediate: true,
      async handler(to, from) {
        const scrollTop = window.scrollY
        const apiQuery = "https://api.openalex.org" + this.$route.fullPath.replace(/%2B/g, "+")
        console.log("Serp apiQuery", apiQuery)

        const resp = await api.getUrl(apiQuery)
        this.resultsObject = resp
        this.$store.state.resultsObject = resp

        // group-by stuff
        if (this.isGroupByView) {
          this.resultsTab = 1
        }
        this.groupByKeys = (this.$route.query.group_by) ? this.$route.query.group_by.split(",") : []
        console.log("Serp resp", resp)


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