<template>
  <v-list-item
      :to="result.id | $entityZoomLink"
      color="primary"
      exact
  >
    <!--          @click="clickResult(result.id)"-->
    <!--        <span v-if="showIcon && !$vuetify.breakpoint.mobile" class="">-->
    <!--          <v-icon class="">mdi-file-document-outline</v-icon>-->
    <!--        </span>-->
    
      <v-list-item-title style="white-space: normal; line-height: 1.5;">
        <div class="" v-html="$prettyTitle(result.display_name)"></div>
      </v-list-item-title>
      <v-list-item-subtitle style="white-space: normal; line-height: 1.5;">
        <div v-if="myEntityType === 'works'">
          <span v-if="result.publication_year">{{ result.publication_year }}</span>
          <span v-if="result.publication_year && result.type"> · </span>
          <work-authors-string v-if="result.authorships?.length" :authorships="result.authorships"/>
          <span v-if="result.primary_location?.source?.display_name"> · </span>
          <span v-if="result.primary_location?.source?.display_name" class="font-italic">
                  {{ result.primary_location?.source?.display_name }}
                </span>
        </div>
        <div v-else>
          {{ unworkSubheader }}
        </div>
      </v-list-item-subtitle>
      <div>
        <v-btn
            v-if="result.works_count"
            text
            small
            class="px-1"
            @click.prevent="viewWorks"
        >
          {{ result.works_count | $toPrecision }} works
        </v-btn>
        <v-btn
            v-if="myEntityType === 'works'"
            text
            small
            class="px-1"
            @click.prevent="viewCitingPapers"
        >
          Cited by {{ result.cited_by_count | $toPrecision }}
        </v-btn>

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
    
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";
import {createSimpleFilter} from "@/filterConfigs";
import {entityTypeFromId} from "@/util";
import {getEntityConfig, getLocationString} from "@/entityConfigs";

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

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    myEntityType() {
      return entityTypeFromId(this.result.id)
    },
    unworkSubheader() {
      const factsToShow = {
        works: undefined,
        authors: [
            this.result.last_known_institutions?.map(i => i.display_name)?.join(", "),
          // getLocationString(this.result.last_known_institution),
        ],
        sources: [
          this.result.type,
          this.result.host_organization_name,
          (this.result.is_oa ? 'open access' : 'toll-access')
        ],
        institutions: [
          getLocationString(this.result),
          this.result.type
        ],
      }
      const ret = factsToShow[this.myEntityType].filter(f => !!f).join(" · ")

      return ret
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    viewCitingPapers() {
      url.createFilter(this.entityType, "cites", this.result.id)
    },
    viewWorks() {
      const myWorksFilter = createSimpleFilter(
          "works",
          getEntityConfig(this.myEntityType).filterKey,
          this.result.id,
      )
      url.pushNewFilters([myWorksFilter], "works")
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

</style>
