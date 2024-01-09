<template>
  <v-card flat rounded class="">
    <serp-toolbar :results-object="resultsObject" />
    <v-list rounded class="pa-0" color="">
      <v-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          class="pl-0 serp-result-item"
          :to="result.id | entityZoomLink"
          color="primary"
      >
        <!--          @click="clickResult(result.id)"-->
        <v-list-item-icon class="pt-1 pl-3">
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
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";
import {shortenOpenAlexId} from "@/util";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";
import SerpToolbar from "@/components/SerpToolbar/SerpToolbar.vue";

export default {
  name: "Template",
  components: {
    WorkAuthorsString,
    SerpToolbar,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
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
  background-color: var(--v-primary-base) !important;
}

</style>