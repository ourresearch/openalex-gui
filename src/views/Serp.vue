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

<!--      <div class="d-flex">-->
<!--        <v-spacer />-->
<!--        <v-btn icon @click="apiMode = !apiMode"><v-icon>mdi-api</v-icon></v-btn>-->
<!--      </div>-->
<!--      <serp-api-editor-->
<!--        v-if="apiMode"-->
<!--      />-->
      <filter-chips-list :filters="resultsFilters" />

      <v-card rounded>
        <v-tabs   v-model="resultsTab" fixed-tabs>
          <v-tab>List</v-tab>
          <v-tab>Group</v-tab>
        </v-tabs>
        <v-tabs-items v-model="resultsTab">
          <v-tab-item>
<!--                <serp-toolbar id="serp-toolbar" />-->
            <serp-results-list :results-object="resultsObject" :api-mode="false" class="pb-8"/>
          </v-tab-item>
          <v-tab-item>
            <pinboard :filters="resultsFilters" />
          </v-tab-item>
        </v-tabs-items>
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
    resultsTab: {
      get() {
        return this.$route.query.group_by ? 1 : 0
      },
      set(val) {
        const group_by = val ? val : undefined
        this.$router.push({
          name: "Serp",
          query: {
            ...this.$route.query,
            page: 1,
            sort: undefined,
            group_by,
          }
        })
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


    selectedEntityTypeConfig() {
      return entityConfigs[this.entityType]
    },

    entityType() {
      return this.$route.params.entityType
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
        const apiQuery = "https://api.openalex.org" + this.$route.fullPath
        console.log("Serp apiQuery", apiQuery)
        const resp = await api.getUrl(apiQuery)
        this.resultsObject = resp
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