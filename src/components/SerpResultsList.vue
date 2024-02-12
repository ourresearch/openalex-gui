<template>
  <v-card rounded flat class="">
    <div style="height: 65px" class="d-flex align-center">
<!--      <serp-results-count :results-object="resultsObject" class=""/>-->
      <div class="font-weight-bold">List</div>
      <v-spacer/>
      <action class="ml-2" action="sort"/>
    </div>

    <v-list v-if="resultsObject?.results" class="" color="">
      <v-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          class="pl-0"
          :to="result.id | entityZoomLink"
          color="primary"
      >
        <!--          @click="clickResult(result.id)"-->
        <v-list-item-icon v-if="!$vuetify.breakpoint.mobile" class="">
          <v-icon class="">mdi-file-document-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title style="white-space: normal; line-height: 1.5;">
            <div class="">{{ result.display_name }}</div>
          </v-list-item-title>
          <v-list-item-subtitle style="white-space: normal; line-height: 1.5;">
            <div>
              <span v-if="result.publication_year">{{ result.publication_year }}</span>
              <span v-if="result.publication_year && result.type"> · </span>
              <work-authors-string v-if="result.authorships?.length" :authorships="result.authorships"/>
              <span v-if="result.primary_location?.source?.display_name"> · </span>
              <span v-if="result.primary_location?.source?.display_name" class="font-italic">
                  {{ result.primary_location?.source?.display_name }}
                </span>
            </div>
          </v-list-item-subtitle>
          <div>
            <span @click.prevent>
              <v-btn
                  text
                  small
                  class="px-1"
                  :to="url.makeFilterRoute(entityType, 'cited_by', result.id)"
              >
<!--                  @click.prevent="showCitingWorks(result.id)"-->
                Cited by {{ result.cited_by_count | toPrecision }}
              </v-btn>

            </span>
            <!--            <v-btn text small class="ml-2" :href="result?.primary_location?.landing_page_url">-->
            <!--              web-->
            <!--              <v-icon x-small right>mdi-open-in-new</v-icon>-->
            <!--            </v-btn>-->
            <span @click.stop>
              <v-btn
                  v-if="result?.best_oa_location?.pdf_url"
                  :href="result?.best_oa_location?.pdf_url"
                  target="_blank"
                  text
                  small
                  class="ml-2"
              >
                PDF
              </v-btn>

            </span>
          </div>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <div class="serp-bottom" v-if="resultsObject?.results?.length">
      <v-pagination
          class="my-3 elevation-0"
          circle
          v-model="page"
          :length="numPages"
          :total-visible="10"
          light
      />
    </div>
    <v-card v-if="!resultsObject?.meta?.count" flat rounded class="grey--text mt-2 pa-4 color-3">
      There are no results for this search.
    </v-card>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";
import {shortenOpenAlexId} from "@/util";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import Action from "@/components/Action/Action.vue";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import ExportButton from "@/components/ExportButton.vue";
import SerpApiEditor from "@/components/SerpApiEditor.vue";

export default {
  name: "Template",
  components: {
    SerpApiEditor,
    ExportButton,
    Action,
    WorkAuthorsString,
    SerpResultsCount,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
      resultsPerPage: 10, // not editable now, but could be in future
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
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
    page: {
      get() {
        return this.resultsObject?.meta?.page ?? 1
      },
      set(val) {
        const valToUse = (val === 1) ? undefined : val
        url.setPage(valToUse)
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
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),

    showCitingWorks(id) {
      const newFilter = createSimpleFilter(
          this.entityType,
          "cited_by",
          id
      )
      url.setFilters(this.entityType, [newFilter], true)
      return false
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">


.v-list-item--link:hover, .v-list-item:hover {
  //background-color: #eee;
}

</style>