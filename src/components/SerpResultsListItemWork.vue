<template>
  <v-list-item
          :to="result.id | entityZoomLink"
          color="primary"
          exact
      >
        <!--          @click="clickResult(result.id)"-->
        <v-list-item-icon v-if="showIcon && !$vuetify.breakpoint.mobile" class="">
          <v-icon class="">mdi-file-document-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title style="white-space: normal; line-height: 1.5;">
            <div class="" v-html="$prettyTitle(result.display_name)"></div>
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
              <v-btn
                  text
                  small
                  class="px-1"
                  @click.prevent="viewCitingPapers"
              >
                Cited by {{ result.cited_by_count | toPrecision }}
              </v-btn>

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
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";
import {createSimpleFilter} from "@/filterConfigs";

export default {
  name: "Template",
  components: {
    WorkAuthorsString,
  },
  props: {
    result: Object,
    showIcon: Boolean,
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
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    viewCitingPapers(){
      url.createFilter(this.entityType, "cites", this.result.id)
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>